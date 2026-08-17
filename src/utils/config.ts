// utils/config.ts

// Esta constante deve ser o endereço do seu túnel ativo (ex.: Cloudflare/9router)
const TUNNEL_URL = import.meta.env.VITE_TUNNEL_URL || "https://seu-subdominio.9router.com";
const PROD_URL = import.meta.env.VITE_APP_URL || "https://focoemdados.com.br";

export const getLinkComparacao = (id: string, usarTunnel: boolean = false) => {
  const base = usarTunnel ? TUNNEL_URL : PROD_URL;
  return `${base}/comparador?id=${id}`;
};