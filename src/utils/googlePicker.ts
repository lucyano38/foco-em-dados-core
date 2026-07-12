import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase-config';

// Placeholders para o Google Cloud Console (Substitua por suas credenciais oficiais do GCP)
export const DEVELOPER_KEY = "AIzaSyA-Ne3HUM9ktNvflgxvwlb4LBJ8pYotrCM";
export const CLIENT_ID = "YOUR_CLIENT_ID_HERE";

export interface GooglePickerConfig {
  developerKey: string;
  clientId: string;
  onFileSelected: (fileId: string, fileName: string, token: string) => void;
  onError?: (error: any) => void;
}

/**
 * Carrega dinamicamente as APIs de Script do Google (GAPI e GIS) se não estiverem presentes.
 */
export const loadGoogleApiScripts = (): Promise<void> => {
  return new Promise((resolve) => {
    let gapiLoaded = false;
    let gisLoaded = false;

    const checkResolve = () => {
      if (gapiLoaded && gisLoaded) {
        resolve();
      }
    };

    if (window.gapi && window.google?.accounts) {
      resolve();
      return;
    }

    // Carrega GAPI
    if (!document.getElementById("gapi-script")) {
      const scriptGapi = document.createElement("script");
      scriptGapi.id = "gapi-script";
      scriptGapi.src = "https://apis.google.com/js/api.js";
      scriptGapi.onload = () => {
        window.gapi.load("picker", () => {
          gapiLoaded = true;
          checkResolve();
        });
      };
      document.body.appendChild(scriptGapi);
    } else {
      gapiLoaded = true;
    }

    // Carrega GIS (Google Identity Services)
    if (!document.getElementById("gis-script")) {
      const scriptGis = document.createElement("script");
      scriptGis.id = "gis-script";
      scriptGis.src = "https://accounts.google.com/gsi/client";
      scriptGis.onload = () => {
        gisLoaded = true;
        checkResolve();
      };
      document.body.appendChild(scriptGis);
    } else {
      gisLoaded = true;
    }

    // Se ambos já estão no HTML mas demorando para disparar onload
    setTimeout(() => {
      resolve();
    }, 1500);
  });
};

/**
 * Solicita o token de acesso do Google usando o Firebase Auth GoogleAuthProvider Popup
 * com os escopos apropriados para o Drive e Planilhas.
 */
export const getGoogleAccessToken = async (): Promise<string | null> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
    provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return credential?.accessToken || null;
  } catch (error) {
    console.error("Erro ao obter token de acesso do Google:", error);
    throw error;
  }
};

/**
 * Abre o Google Picker para seleção de planilhas e arquivos CSV.
 */
export const openGooglePicker = (token: string, config: GooglePickerConfig) => {
  if (!window.google || !window.google.picker) {
    throw new Error("A Google Picker API ainda não foi carregada no navegador.");
  }

  const pickerOrigin =
    window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
      ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
      : window.location.origin;

  const view = new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS)
    .setMimeTypes("application/vnd.google-apps.spreadsheet,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  const picker = new window.google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(token)
    .setDeveloperKey(config.developerKey || DEVELOPER_KEY)
    .setCallback((data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs[0];
        config.onFileSelected(doc.id, doc.name, token);
      }
    })
    .setOrigin(pickerOrigin)
    .build();

  picker.setVisible(true);
};

/**
 * Lê os dados de uma planilha do Google Sheets usando o ID e o Token fornecidos.
 * Retorna os dados convertidos em formato de lista de objetos (JSON).
 */
export const fetchGoogleSheetsData = async (fileId: string, token: string): Promise<any[]> => {
  // 1. Busca os metadados da planilha para identificar o nome da primeira aba
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!metaRes.ok) {
    const errData = await metaRes.json();
    throw new Error(errData.error?.message || "Erro ao conectar com a API de Planilhas.");
  }

  const metaData = await metaRes.json();
  const firstSheetName = metaData.sheets?.[0]?.properties?.title || "Sheet1";

  // 2. Lê os valores da primeira aba usando range amplo A1:Z1000
  const range = `${firstSheetName}!A1:Z1000`;
  const valRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}/values/${range}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!valRes.ok) {
    const errData = await valRes.json();
    throw new Error(errData.error?.message || "Erro ao buscar células da planilha.");
  }

  const valData = await valRes.json();
  const rows = valData.values;

  if (!rows || rows.length === 0) {
    return [];
  }

  // 3. Converte a matriz de linhas para um array de objetos estruturados
  const headers = rows[0];
  const dadosMapeados = rows.slice(1).map((row: any[], rowIndex: number) => {
    const obj: any = {
      id: `gdrive-${fileId}-${rowIndex}-${Date.now()}`
    };
    headers.forEach((header: string, colIndex: number) => {
      let val = row[colIndex];
      if (val !== undefined && val !== null) {
        const valStr = String(val).trim();
        const cleaned = valStr.replace(/[\sR\$\€\£\%\a-zA-Z]/g, '').replace(',', '.').trim();
        if (!isNaN(Number(cleaned)) && cleaned !== '') {
          obj[header] = Number(cleaned);
        } else {
          obj[header] = valStr;
        }
      } else {
        obj[header] = '';
      }
    });
    return obj;
  });

  return dadosMapeados;
};
