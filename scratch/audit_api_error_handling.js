const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function getAllFiles(dir, exts = ['.ts', '.tsx']) {
  let files = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(item))) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getAllFiles(srcDir);
const apiCalls = [];

const apiRegex = /(?:api|apiClient)\.(get|post|put|delete|patch)\s*\(\s*([`'"][^`'"]+[`'"]|[a-zA-Z0-9_$.]+)/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    while ((match = apiRegex.exec(line)) !== null) {
      // Check surrounding lines for try-catch block (look backward up to 25 lines)
      let hasTry = false;
      for (let j = Math.max(0, i - 25); j <= i; j++) {
        if (/try\s*\{/.test(lines[j])) {
          hasTry = true;
          break;
        }
      }
      // Or if it's returning a function / promise that has .catch
      let hasCatch = false;
      for (let j = i; j <= Math.min(lines.length - 1, i + 10); j++) {
        if (/\.catch\(/.test(lines[j]) || /\}\s*catch/.test(lines[j])) {
          hasCatch = true;
          break;
        }
      }

      apiCalls.push({
        file: path.relative(path.join(__dirname, '..'), file),
        line: i + 1,
        method: match[1].toUpperCase(),
        endpoint: match[2].replace(/[`'"]/g, ''),
        code: line.trim(),
        hasTryOrCatch: hasTry || hasCatch
      });
    }
  }
}

console.log(`Total API calls found: ${apiCalls.length}`);

const uniqueEndpoints = [...new Set(apiCalls.map(a => `${a.method} ${a.endpoint}`))];
console.log(`Unique Endpoints: ${uniqueEndpoints.length}`);

const withoutTryCatch = apiCalls.filter(a => !a.hasTryOrCatch);
console.log(`Calls potentially missing local try/catch: ${withoutTryCatch.length}`);
if (withoutTryCatch.length > 0) {
  console.log('\n--- POTENTIALLY UNPROTECTED CALLS ---');
  withoutTryCatch.forEach(c => {
    console.log(`[${c.file}:${c.line}] ${c.method} ${c.endpoint}`);
  });
}

console.log('\n--- UNIQUE ENDPOINTS LIST ---');
uniqueEndpoints.sort().forEach(e => console.log(` - ${e}`));
