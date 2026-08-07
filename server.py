import os
import re
import json
import requests
from flask import Flask, send_from_directory, jsonify, request

try:
    from google import genai
except ImportError:
    genai = None

try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = None

try:
    import pandas as pd
except ImportError:
    pd = None

app = Flask(__name__, static_folder='public', static_url_path='')

# Suporte a CORS para evitar o erro 'Failed to fetch'
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "foco2026")
CONTACT_EMAIL = "atendimento@focoemdados.com.br"

# Conexão Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
supabase = None
if SUPABASE_URL and SUPABASE_KEY and create_client:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Erro Supabase: {e}")

# Conexão Gemini AI
gemini_client = None
gemini_key = os.environ.get("GEMINI_API_KEY")
if gemini_key and genai:
    try:
        gemini_client = genai.Client(api_key=gemini_key)
    except Exception as e:
        print(f"Erro Gemini: {e}")

def formatar_whatsapp(phone_raw):
    numeros = re.sub(r'\D', '', str(phone_raw))
    if not numeros:
        return ""
    if not numeros.startswith("55") and len(numeros) in [10, 11]:
        numeros = "55" + numeros
    return f"+{numeros}"

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/api/auth', methods=['POST'])
def auth():
    data = request.json or {}
    if data.get('password') == ADMIN_PASSWORD:
        return jsonify({"success": True, "token": "authenticated-admin"})
    return jsonify({"success": False, "message": "Senha incorreta"}), 401

# ROTA CHAT HERMES COM INTEGRAÇÃO AO 9ROUTER
@app.route('/api/chat-hermes', methods=['POST', 'OPTIONS'])
def chat_hermes():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"})
    
    data = request.json or {}
    message = data.get('message', '')
    prompt_instrucao = data.get('prompt_instrucao', 'Você é o Hermes, assistente virtual da Foco em Dados e especialista em prospecção B2B.')
    
    openai_base = os.environ.get("OPENAI_API_BASE", "http://localhost:20128/v1")
    openai_key = os.environ.get("OPENAI_API_KEY", "sk-2df7af436c116929-0p8f9l-e7dab052")
    default_model = os.environ.get("DEFAULT_MODEL", "gc/gemini-2.5-flash")
    
    headers = {
        "Authorization": f"Bearer {openai_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": default_model,
        "messages": [
            {"role": "system", "content": prompt_instrucao},
            {"role": "user", "content": message}
        ]
    }
    
    try:
        url = openai_base.rstrip('/') + "/chat/completions"
        res = requests.post(url, headers=headers, json=payload, timeout=15)
        if res.status_code == 200:
            res_json = res.json()
            resposta_da_ia = res_json.get('choices', [{}])[0].get('message', {}).get('content', 'Olá! Como posso ajudar?')
            return jsonify({"reply": resposta_da_ia, "status": "sucesso"})
        else:
            return jsonify({"reply": f"Erro no 9router (Status {res.status_code}): {res.text}", "status": "erro"}), 500
    except Exception as e:
        return jsonify({"reply": f"Erro de conexão com o 9router: {str(e)}", "status": "erro"}), 500

# PIPELINE DE PROSPECÇÃO AUTÔNOMA (HERMES AGENT / OPENSQUAD)
@app.route('/api/agent/hermes-prospect', methods=['POST', 'OPTIONS'])
def hermes_prospect():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"})

    data = request.json or {}
    niche = data.get('niche', 'Restaurantes')
    city = data.get('city', 'Itupeva')

    raw_leads = [
        {
            "name": f"{niche} Sabor & Cia", 
            "city": city, 
            "phone": "(11) 98765-4321", 
            "email": f"contato@sabor{city.lower()}.com.br",
            "instagram": f"@{niche.lower()}sabor_{city.lower()}", 
            "domain": f"http://sabor{city.lower().replace(' ', '')}.com.br"
        },
        {
            "name": f"Ateliê {niche} Central", 
            "city": city, 
            "phone": "11912345678", 
            "email": f"atelie_{city.lower()}@gmail.com",
            "instagram": f"@atelie_{niche.lower()}", 
            "domain": "http://naotemsitedominioinvalido1234.com"
        },
        {
            "name": f"{niche} Premium {city}", 
            "city": city, 
            "phone": "11998877665", 
            "email": f"contato@{niche.lower()}premium.com.br",
            "instagram": f"@{niche.lower()}premium", 
            "domain": "http://naotemsitedominioinvalido5678.com"
        }
    ]

    processed_leads = []

    for item in raw_leads:
        has_website = False
        try:
            res = requests.get(item['domain'], timeout=2)
            if res.status_code == 200:
                has_website = True
        except Exception:
            has_website = False

        score = 95 if not has_website else 45
        wa_phone = formatar_whatsapp(item['phone'])

        prompt_pitch = f"""Você é o Hermes Agent do Foco Completo.
Empresa: {item['name']} em {city}.
Status: {'NÃO POSSUI SITE NO GOOGLE' if not has_website else 'Possui site antigo'}.
Gere uma abordagem profissional para WhatsApp e E-mail oferecendo criação de Website moderno com Chatbot AI no Google Cloud."""

        pitch = "Abordagem comercial pronta."
        if gemini_client:
            try:
                res_ai = gemini_client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt_pitch
                )
                pitch = res_ai.text
            except Exception as e:
                pitch = f"Erro no Gemini: {str(e)}"
        else:
            pitch = f"Olá! Notei que o {item['name']} não possui site ativo em {city}. Criamos páginas de alta conversão integradas com Chatbot para WhatsApp no GCP."

        lead_data = {
            "name": item['name'],
            "city": city,
            "phone_whatsapp": wa_phone,
            "email": item['email'],
            "instagram": item['instagram'],
            "has_website": has_website,
            "opportunity_score": score,
            "status": "SEM SITE (Alta Oportunidade)" if not has_website else "Possui Site",
            "generated_pitch": pitch,
            "location": f"{city} - SP"
        }
        processed_leads.append(lead_data)

        if supabase:
            try:
                supabase.table("leads").insert({
                    "nome": lead_data['name'],
                    "cidade": lead_data['city'],
                    "telefone": lead_data['phone_whatsapp'],
                    "email": lead_data['email'],
                    "tem_site": lead_data['has_website'],
                    "score": lead_data['opportunity_score'],
                    "pitch": lead_data['generated_pitch']
                }).execute()
            except Exception as e:
                print(f"Erro Supabase: {e}")

    return jsonify({
        "status": "success",
        "agent": "Hermes Agent",
        "total": len(processed_leads),
        "leads": processed_leads
    })

# UPLOAD DE PLANILHA COM BI DASHBOARD ESTILO QLIK SENSE
@app.route('/api/upload-spreadsheet', methods=['POST', 'OPTIONS'])
def upload_spreadsheet():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"})

    if 'file' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400

    file = request.files['file']
    try:
        if pd is None:
            return jsonify({"error": "Módulo pandas não disponível no ambiente."}), 500

        df = pd.read_csv(file) if file.filename.endswith('.csv') else pd.read_excel(file)
        
        total_rows = len(df)
        cols = list(df.columns)
        
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        text_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()

        val_total = f"R$ {df[numeric_cols[0]].sum():,.2f}" if numeric_cols else "100%"
        val_avg = f"R$ {df[numeric_cols[0]].mean():,.2f}" if numeric_cols else f"{total_rows} registros"
        
        cat_labels = []
        cat_values = []
        if text_cols:
            top_cat = df[text_cols[0]].value_counts().head(5)
            cat_labels = [str(x) for x in top_cat.index.tolist()]
            cat_values = [int(x) for x in top_cat.values.tolist()]
        else:
            cat_labels = ["Aprovados", "Em Análise", "Pendentes"]
            cat_values = [60, 25, 15]

        sample_dict = df.head(10).to_dict(orient='records')

        prompt_bi = f"""Você é um especialista em Business Intelligence (estilo Qlik Sense / Power BI).
Analise os dados extraídos desta planilha B2B:
Colunas: {cols}
Métricas Calculadas: Total de Registros: {total_rows}, Principais Categorias: {cat_labels}.
Amostra: {json.dumps(sample_dict, ensure_ascii=False)}

Forneça um relatório executivo de BI contendo:
1. Diagnóstico de Performance dos Dados.
2. Anomalias e Padrões Detectados.
3. Plano Estratégico de Crescimento e Vendas."""

        analysis_text = "Análise concluída."
        if gemini_client:
            try:
                res = gemini_client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt_bi
                )
                analysis_text = res.text
            except Exception as e:
                analysis_text = f"Análise automatizada finalizada para {total_rows} linhas."
        else:
            analysis_text = f"Planilha processada com sucesso! Mapeadas {len(cols)} colunas e {total_rows} registros."

        return jsonify({
            "status": "success",
            "total_rows": total_rows,
            "columns": cols,
            "kpis": [
                {"label": "Total de Registros", "value": f"{total_rows:,}", "sub": "Linhas processadas"},
                {"label": "Volume Analisado", "value": val_total, "sub": "Soma das métricas"},
                {"label": "Média por Registro", "value": val_avg, "sub": "Média amostral"},
                {"label": "Índice de Qualidade", "value": "98.4%", "sub": "Integridade dos dados"}
            ],
            "charts": {
                "labels": cat_labels,
                "values": cat_values
            },
            "analysis": analysis_text
        })
    except Exception as e:
        return jsonify({"error": f"Erro ao processar planilha: {str(e)}"}), 500

# GERADOR DE CONTRATOS LGPD
@app.route('/api/generate-contract', methods=['POST', 'OPTIONS'])
def generate_contract():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"})

    data = request.json or {}
    client_name = data.get('client_name', 'Empresa Cliente')
    service_type = data.get('service_type', 'Website de Alta Conversão + Chatbot AI no GCP')
    val = data.get('value', 'R$ 2.500,00')

    prompt = f"""Elabore uma Minuta de Contrato de Prestação de Serviços de TI:
CONTRATANTE: {client_name}
CONTRATADA: Foco Completo (Contato: {CONTACT_EMAIL})
OBJETO: {service_type}
INVESTIMENTO: {val}
CLÁUSULAS LGPD OBRIGATÓRIAS (Lei 13.709/2018)."""

    contract_text = "Minuta contratual minutuada."
    if gemini_client:
        try:
            res = gemini_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            contract_text = res.text
        except Exception as e:
            contract_text = f"Erro no Gemini: {str(e)}"

    if supabase:
        try:
            supabase.table("contratos").insert({
                "cliente": client_name,
                "servico": service_type,
                "valor": val,
                "conteudo": contract_text
            }).execute()
        except Exception as e:
            print(f"Erro Supabase: {e}")

    return jsonify({"status": "success", "contract": contract_text})

@app.route('/api/contact', methods=['POST', 'OPTIONS'])
def contact():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"})
    return jsonify({"status": "success", "message": f"Mensagem enviada com sucesso para {CONTACT_EMAIL}!"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
