#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Find all TypeScript and JavaScript files in src directory
const files = glob.sync("src/**/*.{ts,tsx,js,jsx}", {
  ignore: ["src/**/*.d.ts", "node_modules/**"],
});

let totalReplacements = 0;

files.forEach((file) => {
  try {
    let content = fs.readFileSync(file, "utf8");
    let replacements = 0;

    // Replace console.log with logger.log
    content = content.replace(/console\.log\(/g, "logger.log(");
    replacements +=
      (content.match(/logger\.log\(/g) || []).length -
      (content.match(/console\.log\(/g) || []).length;

    // Replace console.error with logger.error
    content = content.replace(/console\.error\(/g, "logger.error(");
    replacements +=
      (content.match(/logger\.error\(/g) || []).length -
      (content.match(/console\.error\(/g) || []).length;

    // Replace console.warn with logger.warn
    content = content.replace(/console\.warn\(/g, "logger.warn(");
    replacements +=
      (content.match(/logger\.warn\(/g) || []).length -
      (content.match(/console\.warn\(/g) || []).length;

    // Replace console.info with logger.info
    content = content.replace(/console\.info\(/g, "logger.info(");
    replacements +=
      (content.match(/logger\.info\(/g) || []).length -
      (content.match(/console\.info\(/g) || []).length;

    // Replace console.debug with logger.debug
    content = content.replace(/console\.debug\(/g, "logger.debug(");
    replacements +=
      (content.match(/logger\.debug\(/g) || []).length -
      (content.match(/console\.debug\(/g) || []).length;

    // Add logger import if not already present and we made replacements
    if (replacements > 0) {
      // Check if logger is already imported
      if (
        !content.includes("import { logger }") &&
        !content.includes("import logger")
      ) {
        // Find the last import statement
        const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm;
        const imports = content.match(importRegex);

        if (imports && imports.length > 0) {
          const lastImport = imports[imports.length - 1];
          const lastImportIndex = content.lastIndexOf(lastImport);
          const insertIndex = lastImportIndex + lastImport.length;

          content =
            content.slice(0, insertIndex) +
            "\nimport { logger } from '@/utils/logger';" +
            content.slice(insertIndex);
        } else {
          // If no imports found, add at the top
          content = "import { logger } from '@/utils/logger';\n" + content;
        }
      }

      fs.writeFileSync(file, content, "utf8");
      console.log(`✅ ${file}: ${replacements} replacements`);
      totalReplacements += replacements;
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n🎉 Total replacements: ${totalReplacements}`);
console.log("✅ Console.log replacement complete!");
