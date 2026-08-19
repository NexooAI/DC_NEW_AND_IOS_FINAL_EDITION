const fs = require('fs');
const babel = require('@babel/parser');

const filePath = 'c:/Users/nithy/Videos/DC_New(AND-IOS)/DC_NEW_AND_IOS_FINAL_EDITION/src/app/(app)/(tabs)/home/schemes.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
code = code.replace(/\r\n/g, '\n');

// 1. Add import statement at the top
const importSearch = 'import { useTranslation } from "@/hooks/useTranslation";';
const importReplace = `import { useTranslation } from "@/hooks/useTranslation";
import { useAppVisibility } from "@/hooks/useAppVisibility";`;

if (code.includes(importSearch)) {
  code = code.replace(importSearch, importReplace);
  console.log('✔ Added useAppVisibility import');
} else {
  console.error('❌ Could not find useTranslation import statement');
  process.exit(1);
}

// 2. Instantiate hook inside SchemeList
const hookSearch = 'export default function SchemeList({ isNested = false }: { isNested?: boolean }) {';
const hookReplace = `export default function SchemeList({ isNested = false }: { isNested?: boolean }) {
  const { isVisible } = useAppVisibility();`;

if (code.includes(hookSearch)) {
  code = code.replace(hookSearch, hookReplace);
  console.log('✔ Instantiated useAppVisibility hook');
} else {
  console.error('❌ Could not find SchemeList signature');
  process.exit(1);
}

// Convert line endings back to original format (CRLF)
const finalCode = code.replace(/\n/g, '\r\n');

// Validate file syntax before writing it back
try {
  babel.parse(finalCode, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });
  fs.writeFileSync(filePath, finalCode, 'utf8');
  console.log('🎉 SUCCESS! Programmatically fixed isVisible hook reference error in schemes.tsx!');
} catch (err) {
  console.error('❌ JSX Validation Error after edits:', err.message);
  process.exit(1);
}
