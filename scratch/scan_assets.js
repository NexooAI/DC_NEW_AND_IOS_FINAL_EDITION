const fs = require('fs');
const path = require('path');

const codeFiles = [];
function getCode(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    if (f === 'node_modules' || f === '.git' || f === 'dist' || f === '.expo') return;
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) getCode(p);
    else if (/\.(tsx?|jsx?|json|ts|js)$/.test(f)) codeFiles.push(p);
  });
}

getCode('src');
getCode('plugins');
getCode('scripts');
['app.config.ts', 'App.js', 'index.js', 'package.json'].forEach(f => {
  if (fs.existsSync(f)) codeFiles.push(f);
});

const allCode = codeFiles.map(f => {
  try { return fs.readFileSync(f, 'utf8'); } catch (e) { return ''; }
}).join('\n');

const assetFiles = [];
function getAssets(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) getAssets(p);
    else assetFiles.push(p);
  });
}
getAssets('assets');

const unreferenced = [];
const referenced = [];

assetFiles.forEach(a => {
  const base = path.basename(a);
  // Match file name specifically
  const isFound = allCode.includes(base);
  const size = fs.statSync(a).size;
  if (isFound) {
    referenced.push({ path: a, sizeKB: (size / 1024).toFixed(1), rawSize: size });
  } else {
    unreferenced.push({ path: a, sizeKB: (size / 1024).toFixed(1), rawSize: size });
  }
});

console.log('=== REFERENCED ASSETS (' + referenced.length + ') ===');
referenced.sort((a,b) => b.rawSize - a.rawSize);
let totalRef = 0;
referenced.forEach(r => {
  totalRef += r.rawSize;
  console.log(`  ${r.sizeKB.padStart(8)} KB : ${r.path}`);
});
console.log(`Total Referenced: ${(totalRef / (1024*1024)).toFixed(2)} MB\n`);

console.log('=== UNREFERENCED ASSETS (' + unreferenced.length + ') ===');
unreferenced.sort((a,b) => b.rawSize - a.rawSize);
let totalUnref = 0;
unreferenced.forEach(u => {
  totalUnref += u.rawSize;
  console.log(`  ${u.sizeKB.padStart(8)} KB : ${u.path}`);
});
console.log(`Total Unreferenced: ${(totalUnref / (1024*1024)).toFixed(2)} MB\n`);
