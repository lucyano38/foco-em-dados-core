import requests

def monitorar_site():
    url = "https://focoemdados.com.br"
    try:
        response = requests.get(url, timeout=15)
        if response.status_code != 200:
            print(f"ALERTA: Site retornou status {response.status_code}")
            return False
        return True
    except Exception as e:
        print(f"ALERTA: Site inacessível. Erro: {str(e)}")
        return False

if __name__ == "__main__":
    if not monitorar_site():
        # Aqui o Agente seria acionado para realizar reparo
        print("Necessário intervenção de reparo.")
