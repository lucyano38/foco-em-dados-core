# CONTEXT.md - Foco em Dados Core
> Estado técnico consolidado em 2026-08-24

## Repo
- branch: main
- ultimo commit: 89cff3c chore: ajusta cron dos indicadores para diario e ignora .vercel
- working tree: limpo
- build: ok (`npm run build` gera `dist/` + `dist/server.cjs`)
- lint: falha em tipos TS (`tsc --noEmit`) porem nao bloqueia build

## Stack
- react 19 + vite 6 + tailwind 4 + express 4 + typescript 5.8
- supabase, stripe, firebase/admin, chart.js, recharts, exceljs, xlsx
- deploy alvo: vercel com outputDirectory `dist`

## Vercel
- cron: `/api/indicadores/atualizar` em `0 0 * * *`
- rewrites: `/api/(.*) -> /api/index.js` e catch-all SPA `/(.*) -> /index.html`
- headers: security headers rigorosos + cache longo para `/public` e `/assets`

## Assets publicos relevantes
- `public/media/video1.mp4`, `video2.mp4`, `video3.mp4`, `video4.mp4`
- `public/comparar.html`
- `.tmp_copy_static.mjs` copia sites/comparar para `dist/` no prebuild

## Env/Hermes
- modelo padrao: `stepfun/step-3.7-flash:free`
- `HERMES_MAX_CONTEXT_TOKENS=60000`
- `HERMES_AUTO_TRIM=true`
- alias `hermes-checkpoint` definido em `~/.bashrc`
- memory dir: `.skills/memory/`

## Prefs estaveis
- marca "Foco em Dados" apenas
- SiteChat separado do WhatsApp
- deploy/build no Termux/Android com `.tmp_esbuild_build.mjs`
- nao fazer push automatico; usuario sobe quando quiser
