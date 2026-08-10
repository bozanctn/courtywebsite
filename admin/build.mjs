// ── Derleme adımı: .jsx → .js (tarayıcıda Babel'i kaldırmak için) ──────────────
// Mimari korunur: ESM/import YOK, dosyalar yine global scope'ta ve aynı sırada yüklenir.
// esbuild yalnızca JSX'i React.createElement'e çevirir (Babel-in-browser'ın yaptığı işi
// önceden yapar). Çıktı: admin/dist/ altında aynı yapıda düz .js dosyaları.
//
// Kullanım:  cd admin && npm install && npm run build
// .jsx kaynaklarını düzenledikten sonra tekrar `npm run build` çalıştır.

import { transformSync } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url)); // admin/
const OUT  = join(ROOT, 'dist');

// index.html'deki yükleme SIRASIYLA birebir aynı (sıra önemli — global scope).
const PLAIN_JS = [
  'js/data.js',
  'js/services.js',
];
const JSX = [
  'js/ui.jsx',
  'js/screens/core.jsx',
  'js/screens/members.jsx',
  'js/screens/team.jsx',
  'js/screens/event.jsx',
  'js/screens/tournament_detail.jsx',
  'js/screens/analyze.jsx',
  'js/screens/comm.jsx',
  'js/screens/club.jsx',
  'js/screens/employees.jsx',
  'js/screens/extras.jsx',
  'js/screens/customers.jsx',
  'js/screens/broadcast.jsx',
  'js/screens/recurring.jsx',
  'js/app.jsx',
  'js/tweaks.jsx',
];

const opts = {
  loader: 'jsx',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  target: 'es2020',
  // minify KAPALI: global (dosyalar-arası) isimleri korumak ve hata ayıklamayı
  // kolaylaştırmak için. Ana kazanç zaten tarayıcıda derlemeyi kaldırmaktan geliyor.
  legalComments: 'none',
};

let count = 0;
const writeOut = (rel, code) => {
  const out = join(OUT, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, code);
  count++;
};

// Düz JS dosyaları aynen kopyalanır (JSX yok)
for (const f of PLAIN_JS) {
  writeOut(f, readFileSync(join(ROOT, f), 'utf8'));
}

// JSX dosyaları .js'e derlenir
for (const f of JSX) {
  const src = readFileSync(join(ROOT, f), 'utf8');
  const { code } = transformSync(src, { ...opts, sourcefile: f });
  writeOut(f.replace(/\.jsx$/, '.js'), code);
}

// Boot betiği (index.html'deki inline text/babel yerine)
writeOut('boot.js',
  "const root = ReactDOM.createRoot(document.getElementById('app'));\n" +
  "root.render(React.createElement(App));\n");

console.log(`Derleme tamam — ${count} dosya → admin/dist/`);
