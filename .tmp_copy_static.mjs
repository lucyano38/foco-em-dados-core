import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const publicDir = path.join(root, 'public');
const outDir = path.join(root, 'dist');

const copy = (src, dest) => {
  const rel = path.relative(publicDir, src);
  const target = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(src, target);
  console.log(`COPY ${rel}`);
};

const copyHtmlFiles = (dir) => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir, { recursive: true }).forEach((entry) => {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isFile() && full.endsWith('.html')) {
      copy(full, outDir);
    }
  });
};

const main = () => {
  const sitesDir = path.join(publicDir, 'sites');
  copyHtmlFiles(sitesDir);

  const comparar = path.join(publicDir, 'comparar.html');
  if (fs.existsSync(comparar)) {
    copy(comparar, outDir);
  }

  console.log('COPY_STATIC_OK');
};

main();
