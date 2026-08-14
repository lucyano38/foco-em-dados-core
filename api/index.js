// ============================================================
// Entry Vercel Serverless — expõe o Express do server.ts nos /api/*
// O bundle (dist/server.cjs) é produzido por `npm run build`
// e traçado automaticamente pelo @vercel/node (file tracing).
// ============================================================
let appPromise = null;

module.exports = async (req, res) => {
  if (!appPromise) {
    appPromise = require("../dist/server.cjs").getApp();
  }
  const app = await appPromise;
  app(req, res);
};