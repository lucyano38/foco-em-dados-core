import requests
import json
import time

SITE_API_URL = "https://focoemdados.com.br/api/chat-hermes"
WEBHOOK_OPENCODE = "https://focoemdados.com.br/api/opencode/webhook"

print("==========================================")
print("🤖 HERMES AGENT ATIVO NO TABLET")
print("==========================================")
print("Conectado ao site: https://focoemdados.com.br")
print("Aguardando interações e sincronizando orçamentos...\n")

def processar_solicitacao(mensagem_cliente, telefone=""):
    payload = {
        "message": mensagem_cliente,
        "phone": telefone,
        "source": "Tablet_Android"
    }
    try:
        response = requests.post(SITE_API_URL, json=payload, timeout=5)
        if response.status_code == 200:
            dados = response.json()
            print(f"✅ Resposta enviada ao site: {dados.get('reply')[:80]}...")
            return dados.get('reply')
        else:
            print(f"⚠️ Status HTTP: {response.status_code}")
    except Exception as e:
        print(f"❌ Erro de conexão com o site: {e}")

if __name__ == "__main__":
    # Teste de conexão inicial com a nuvem
    print("🔄 Testando ponte com o servidor GCP...")
    processar_solicitacao("Olá Hermes, agente do tablet conectado com sucesso!")
