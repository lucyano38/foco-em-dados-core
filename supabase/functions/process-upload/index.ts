import { createClient } from "npm:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitMap = new Map<string, number[]>();

const REQUIRED_COLUMNS = [
  "Data", "Produto", "Vendas", "Estoque", "Cliente", "Quantidade", "Valor",
];
const MIN_REQUIRED_MATCH = 3;

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          result.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  }

  const headers = parseLine(lines[0]).map((h) => h.trim());
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length === 0) continue;
    rows.push(parseLine(lines[i]));
  }
  return { headers, rows };
}

function parseXLSX(
  data: ArrayBuffer
): { headers: string[]; rows: string[][] } {
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
  if (jsonData.length === 0) return { headers: [], rows: [] };
  const headers = (jsonData[0] || []).map((h: string) => String(h).trim());
  const rows: string[][] = [];
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (
      !row ||
      row.every(
        (c: any) =>
          c === undefined || c === null || String(c).trim() === ""
      )
    )
      continue;
    rows.push(row.map((c: any) => String(c ?? "")));
  }
  return { headers, rows };
}

function validateColumns(
  headers: string[]
): {
  valid: boolean;
  detectedColumns: { column: string; category: string }[];
} {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  const categoryMap: Record<string, string[]> = {
    vendas: [
      "venda",
      "faturamento",
      "receita",
      "total",
      "valor",
      "preço",
      "preco",
      "quantidade",
      "qtd",
    ],
    financeiro: [
      "custo",
      "margem",
      "lucro",
      "despesa",
      "comissao",
      "comissão",
      "inadimplencia",
      "inadimplência",
    ],
    cliente: [
      "cliente",
      "cpf",
      "cnpj",
      "nome",
      "telefone",
      "email",
      "cidade",
      "estado",
      "uf",
    ],
    produto: ["produto", "sku", "categoria", "marca", "tamanho", "cor", "grade"],
    data: [
      "data",
      "dia",
      "mes",
      "mês",
      "ano",
      "periodo",
      "período",
      "competencia",
      "competência",
    ],
  };

  const detectedColumns = headers.map((h) => {
    const hl = h.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some((k) => hl.includes(k)))
        return { column: h, category };
    }
    return { column: h, category: "outros" };
  });

  const matchCount = lowerHeaders.filter((h) =>
    REQUIRED_COLUMNS.some(
      (rc) => rc.toLowerCase() === h || h.includes(rc.toLowerCase())
    )
  ).length;

  return { valid: matchCount >= MIN_REQUIRED_MATCH, detectedColumns };
}

function isNumeric(val: string): boolean {
  if (val.trim() === "") return false;
  const cleaned = val.replace(/\./g, "").replace(",", ".");
  return !isNaN(Number(cleaned)) && cleaned.length > 0;
}

function parseNumber(val: string): number {
  const cleaned = val.trim().replace(/\./g, "").replace(",", ".");
  return Number(cleaned);
}

function formatDate(val: string): string {
  const s = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return s;
}

function normalizeRow(
  row: Record<string, string>,
  headers: string[],
  dateColumns: string[],
  numericColumns: string[]
): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const key of headers) {
    let val = (row[key] ?? "").trim();
    if (
      dateColumns.some((dc) => key.toLowerCase().includes(dc.toLowerCase()))
    ) {
      val = formatDate(val);
    }
    if (
      numericColumns.some((nc) => key.toLowerCase().includes(nc.toLowerCase())) &&
      isNumeric(val)
    ) {
      normalized[key] = parseNumber(val);
    } else {
      normalized[key] = val;
    }
  }
  return normalized;
}

function isEmptyRow(row: Record<string, any>): boolean {
  return Object.values(row).every(
    (v) => v === "" || v === null || v === undefined
  );
}

function computeMetadata(rows: Record<string, any>[], headers: string[]) {
  const numericKeys = headers.filter((h) => {
    const firstVal = rows.find(
      (r) => r[h] !== "" && !isNaN(Number(r[h]))
    );
    return firstVal !== undefined;
  });

  const revenueKey = headers.find(
    (h) =>
      /valor|receita|faturamento|total|venda/i.test(h) && numericKeys.includes(h)
  );
  const qtyKey = headers.find(
    (h) => /quantidade|qtd/i.test(h) && numericKeys.includes(h)
  );

  let totalRevenue = 0;
  let totalOrders = 0;
  const productSales: Record<string, number> = {};

  const productKey = headers.find((h) => /produto|sku|nome|item/i.test(h));

  for (const row of rows) {
    if (revenueKey && typeof row[revenueKey] === "number") {
      totalRevenue += row[revenueKey];
      totalOrders++;
    } else if (qtyKey && typeof row[qtyKey] === "number") {
      totalRevenue += row[qtyKey];
      totalOrders++;
    }

    if (productKey && row[productKey]) {
      const prod = String(row[productKey]);
      const val =
        revenueKey && typeof row[revenueKey] === "number"
          ? row[revenueKey]
          : 1;
      productSales[prod] = (productSales[prod] || 0) + val;
    }
  }

  const topProduct =
    Object.entries(productSales).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return { totalRevenue, totalOrders, avgTicket, topProduct };
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  let uploadId = "";
  let userId = "";

  try {
    const body = await req.json();
    uploadId = (body.upload_id || "").trim();
    if (!uploadId) throw new Error("upload_id é obrigatório");

    console.log(`[process-upload] Starting upload_id=${uploadId}`);

    // 1. Update status to processing
    const { error: updateErr } = await supabase
      .from("data_uploads")
      .update({ status: "processing", processed_at: new Date().toISOString() })
      .eq("id", uploadId);
    if (updateErr)
      throw new Error("Erro ao atualizar status: " + updateErr.message);

    // 2. Fetch upload record
    const { data: uploadRec, error: fetchErr } = await supabase
      .from("data_uploads")
      .select("id, user_id, storage_path, mime_type, original_name")
      .eq("id", uploadId)
      .single();
    if (fetchErr || !uploadRec)
      throw new Error(
        "Upload não encontrado: " + (fetchErr?.message || "N/A")
      );
    userId = uploadRec.user_id || "";

    console.log(
      `[process-upload] user_id=${userId}, storage_path=${uploadRec.storage_path}`
    );

    // 3. Rate limiting
    if (userId && !checkRateLimit(userId)) {
      await supabase
        .from("data_uploads")
        .update({ status: "failed", error_message: "Limite de 5 processamentos por minuto." })
        .eq("id", uploadId);
      return new Response(
        JSON.stringify({
          error: "Limite de processamento excedido. Máximo de 5 por minuto.",
          code: "RATE_LIMIT_EXCEEDED",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Download file from Storage
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const { data: fileData, error: dlError } = await supabase.storage
        .from("uploads")
        .download(uploadRec.storage_path, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (dlError || !fileData)
        throw new Error("Erro ao baixar arquivo: " + (dlError?.message || "N/A"));

      // 5. Parse file (CSV or XLSX)
      const mimeType = uploadRec.mime_type || "";
      const fileName = uploadRec.original_name || "";
      const isExcel =
        /excel|spreadsheet/i.test(mimeType) || /\.xlsx?$/i.test(fileName);

      let rawHeaders: string[];
      let rawRows: string[][];

      if (isExcel) {
        const buffer = await fileData.arrayBuffer();
        const parsed = parseXLSX(buffer);
        rawHeaders = parsed.headers;
        rawRows = parsed.rows;
      } else {
        const text = await fileData.text();
        const parsed = parseCSV(text);
        rawHeaders = parsed.headers;
        rawRows = parsed.rows;
      }

      console.log(
        `[process-upload] Parsed ${rawRows.length} rows, ${rawHeaders.length} columns`
      );

      if (rawHeaders.length === 0)
        throw new Error("Arquivo vazio ou sem cabeçalhos detectados");

      // 6. Validate columns
      const { valid, detectedColumns } = validateColumns(rawHeaders);
      if (!valid) {
        await supabase
          .from("data_uploads")
          .update({
            status: "failed",
            error_message:
              "Colunas obrigatórias não encontradas. Necessário ao menos 3 de: Data, Produto, Vendas, Estoque, Cliente, Quantidade, Valor",
          })
          .eq("id", uploadId);
        return new Response(
          JSON.stringify({
            error: "Colunas obrigatórias insuficientes",
            code: "INVALID_COLUMNS",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // 7. Convert to records and normalize
      const dateColumnKeywords = [
        "data", "dia", "mes", "mês", "ano", "periodo", "período",
        "competencia", "competência",
      ];
      const numericColumnKeywords = [
        "valor", "preço", "preco", "quantidade", "qtd", "venda", "receita",
        "faturamento", "total", "custo", "margem", "lucro", "estoque",
        "comissao", "comissão",
      ];

      const rawRecords: Record<string, string>[] = rawRows.map((row) => {
        const obj: Record<string, string> = {};
        rawHeaders.forEach((h, i) => {
          obj[h] = (row[i] ?? "").trim();
        });
        return obj;
      });

      const normalizedRows = rawRecords
        .map((row) =>
          normalizeRow(row, rawHeaders, dateColumnKeywords, numericColumnKeywords)
        )
        .filter((row) => !isEmptyRow(row));

      console.log(
        `[process-upload] After normalization: ${normalizedRows.length} rows`
      );

      // 8. Plan limit check via RPC
      if (userId) {
        const { data: allowed, error: limitErr } = await supabase.rpc(
          "check_plan_limit",
          {
            p_user_id: userId,
            p_feature: "upload",
            p_quantity: normalizedRows.length,
          }
        );
        if (limitErr) throw new Error("Erro ao verificar limite: " + limitErr.message);
        if (allowed === false) {
          await supabase
            .from("data_uploads")
            .update({
              status: "failed",
              error_message: "Limite do plano excedido para este mês.",
            })
            .eq("id", uploadId);
          return new Response(
            JSON.stringify({
              error: "Limite do plano excedido para este mês.",
              code: "PLAN_LIMIT_EXCEEDED",
            }),
            { status: 402, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      // 9. Compute metadata
      const metadata = computeMetadata(normalizedRows, rawHeaders);

      // 10. Save processed data (up to 5000 rows)
      const rowsToStore = normalizedRows.slice(0, 5000);
      const processedData = {
        rows: rowsToStore,
        rowCount: normalizedRows.length,
        columnCount: rawHeaders.length,
        detectedColumns,
        totalRevenue: metadata.totalRevenue,
        avgTicket: metadata.avgTicket,
        topProduct: metadata.topProduct,
      };

      // 11. Record usage
      if (userId) {
        await supabase.from("usage_logs").insert({
          user_id: userId,
          feature: "upload",
          quantity: normalizedRows.length,
          period: new Date().toISOString().split("T")[0],
        });
      }

      // 12. Generate insights via Gemini
      let insightResult: Record<string, any> | null = null;
      const geminiKey = Deno.env.get("GEMINI_API_KEY");
      if (geminiKey && geminiKey !== "placeholder") {
        try {
          const sampleData = normalizedRows.slice(0, 20);
          const prompt = `Você é um analista de dados especialista em varejo e e-commerce.
Analise os seguintes dados de vendas e retorne UM JSON válido (sem markdown, sem \`\`\`) com esta estrutura:
{
  "summary": "Resumo em 2-3 frases",
  "kpis": { "total_revenue": number, "total_orders": number, "avg_ticket": number, "top_product": string },
  "alerts": [{ "type": "warning|danger|opportunity", "title": string, "description": string }],
  "forecast": { "next_30_days_revenue": number, "confidence": number, "trend": "up|down|stable" }
}
Dados (primeiras 20 linhas): ${JSON.stringify(sampleData)}
Total de linhas: ${normalizedRows.length}
Colunas: ${JSON.stringify(rawHeaders)}`;

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
              }),
            }
          );

          const geminiJson = await geminiRes.json();
          const geminiText =
            geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            insightResult = JSON.parse(jsonMatch[0]);
          }
          console.log("[process-upload] Gemini insight generated");
        } catch (geminiErr) {
          console.error("[process-upload] Gemini error (non-fatal):", geminiErr);
        }
      }

      // 13. Final update
      const updatePayload: Record<string, any> = {
        status: "completed",
        row_count: normalizedRows.length,
        column_count: rawHeaders.length,
        detected_columns: detectedColumns,
        processed_data: processedData,
        processed_at: new Date().toISOString(),
      };

      if (insightResult) {
        updatePayload.insight_summary = insightResult.summary || null;
        updatePayload.insight_kpis = insightResult.kpis || null;
        updatePayload.insight_alerts = insightResult.alerts || null;
        updatePayload.insight_forecast = insightResult.forecast || null;
      }

      const { error: finalUpdateErr } = await supabase
        .from("data_uploads")
        .update(updatePayload)
        .eq("id", uploadId);

      if (finalUpdateErr) {
        console.error("[process-upload] Final update error:", finalUpdateErr);
      }

      // 14. Create notification
      if (userId) {
        await supabase
          .from("notifications")
          .insert({
            user_id: userId,
            type: "insight",
            title: "Dashboard pronto!",
            message: `Seu dashboard foi gerado com ${normalizedRows.length} linhas de dados.`,
            data: { upload_id: uploadId, row_count: normalizedRows.length },
          })
          .catch((nErr) =>
            console.error("[process-upload] Notification error:", nErr)
          );
      }

      const elapsed = Date.now() - startTime;
      console.log(`[process-upload] Completed in ${elapsed}ms`);

      return new Response(
        JSON.stringify({
          status: "completed",
          upload_id: uploadId,
          rowCount: normalizedRows.length,
          columnCount: rawHeaders.length,
          totalRevenue: metadata.totalRevenue,
          avgTicket: metadata.avgTicket,
          topProduct: metadata.topProduct,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err: any) {
    console.error("[process-upload] Error:", err.message);

    if (uploadId) {
      await supabase
        .from("data_uploads")
        .update({ status: "failed", error_message: err.message })
        .eq("id", uploadId)
        .catch((e) =>
          console.error("[process-upload] Failed to update error status:", e)
        );
    }

    return new Response(
      JSON.stringify({ error: err.message, code: "PROCESSING_ERROR" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
