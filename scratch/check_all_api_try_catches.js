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
const results = [];

for (const file of files) {
  if (file.includes('__tests__') || file.includes('API_LOADER_GUIDE.md')) continue;
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(?:api|apiClient)\.(get|post|put|delete|patch)\s*\(/.test(line)) {
      // Find enclosing function and check for try/catch
      let hasTryBefore = false;
      let openBraces = 0;
      
      // Look back up to 80 lines for the enclosing try block
      for (let j = Math.max(0, i - 80); j < i; j++) {
        if (/try\s*\{/.test(lines[j])) {
          hasTryBefore = true;
        }
      }

      // Check if it's an arrow function returning api call e.g. () => api.get(...)
      const isArrowReturn = /=>\s*(?:api|apiClient)\./.test(line) || /return\s*(?:api|apiClient)\./.test(line);

      // Look ahead for catch
      let hasCatchAfter = false;
      for (let j = i; j < Math.min(lines.length, i + 80); j++) {
        if (/\}\s*catch\s*\(/.test(lines[j]) || /\.catch\s*\(/.test(lines[j])) {
          hasCatchAfter = true;
        }
      }

      const isProtected = (hasTryBefore && hasCatchAfter) || isArrowReturn || /\.catch\s*\(/.test(line);

      results.push({
        file: path.relative(path.join(__dirname, '..'), file),
        line: i + 1,
        code: line.trim(),
        isProtected,
        isArrowReturn,
      });
    }
  }
}

console.log(`Total API invocations inspected: ${results.length}`);
const unprotected = results.filter(r => !r.isProtected);
console.log(`Unprotected API calls: ${unprotected.length}`);
unprotected.forEach(u => {
  console.log(`❌ [${u.file}:${u.line}] ${u.code}`);
});
