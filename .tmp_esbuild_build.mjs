import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outfile = path.resolve(__dirname, 'dist/server.cjs');

build({
  entryPoints: [path.resolve(__dirname, 'server.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  packages: 'external',
  sourcemap: true,
  outfile,
}).then(() => {
  process.stdout.write(`OUT ${outfile}\nOK\n`);
}).catch((err) => {
  process.stderr.write(`ERR ${err?.message || err}\n`);
  process.exitCode = 1;
});
