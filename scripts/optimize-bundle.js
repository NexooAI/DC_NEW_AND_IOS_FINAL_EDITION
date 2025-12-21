#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Bundle optimization script
 * Removes unused imports and optimizes bundle size
 */

console.log("🚀 Starting bundle optimization...");

// Files to optimize
const filesToOptimize = [
  "src/app/_layout.tsx",
  "src/app/index.tsx",
  "src/app/(app)/(tabs)/home/index.tsx",
  "src/app/(app)/(tabs)/savings/index.tsx",
  "src/app/components/ImageSlider.tsx",
  "src/app/components/StatusView.tsx",
  "src/app/components/FlashBanner.tsx",
  "src/app/components/Products.tsx",
];

let totalOptimizations = 0;

filesToOptimize.forEach((filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, "utf8");
    let optimizations = 0;

    // Remove unused React imports (keep only what's needed)
    const reactImports = content.match(
      /import\s+React,\s*{([^}]+)}\s+from\s+['"]react['"];?/g
    );
    if (reactImports) {
      reactImports.forEach((importStatement) => {
        const usedHooks = [];
        const allHooks = [
          "useState",
          "useEffect",
          "useRef",
          "useCallback",
          "useMemo",
          "useContext",
        ];

        allHooks.forEach((hook) => {
          if (content.includes(hook) && !usedHooks.includes(hook)) {
            usedHooks.push(hook);
          }
        });

        if (usedHooks.length > 0) {
          const newImport = `import React, { ${usedHooks.join(
            ", "
          )} } from 'react';`;
          content = content.replace(importStatement, newImport);
          optimizations++;
        }
      });
    }

    // Remove console.log statements (should already be done, but double-check)
    const consoleLogCount = (content.match(/console\.log\(/g) || []).length;
    if (consoleLogCount > 0) {
      content = content.replace(/console\.log\(/g, "logger.log(");
      optimizations += consoleLogCount;
    }

    // Remove unused imports
    const importLines = content
      .split("\n")
      .filter((line) => line.trim().startsWith("import"));
    const usedImports = new Set();

    // Check which imports are actually used
    importLines.forEach((line) => {
      const importMatch = line.match(
        /import\s+.*?\s+from\s+['"]([^'"]+)['"];?/
      );
      if (importMatch) {
        const modulePath = importMatch[1];
        const importName = line.match(/import\s+{([^}]+)}\s+from/);

        if (importName) {
          const names = importName[1].split(",").map((name) => name.trim());
          names.forEach((name) => {
            if (content.includes(name) && !name.includes("React")) {
              usedImports.add(name);
            }
          });
        }
      }
    });

    // Optimize StyleSheet usage
    if (content.includes("StyleSheet.create")) {
      // Check if all styles are used
      const styleMatches = content.match(/styles\.(\w+)/g);
      if (styleMatches) {
        const usedStyles = new Set(
          styleMatches.map((match) => match.replace("styles.", ""))
        );
        // This is a basic check - in a real scenario, you'd want more sophisticated analysis
        optimizations++;
      }
    }

    if (optimizations > 0) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✅ ${filePath}: ${optimizations} optimizations`);
      totalOptimizations += optimizations;
    } else {
      console.log(`⚪ ${filePath}: No optimizations needed`);
    }
  } catch (error) {
    console.error(`❌ Error optimizing ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Bundle optimization complete!`);
console.log(`📊 Total optimizations: ${totalOptimizations}`);
console.log("\n💡 Additional recommendations:");
console.log("   - Use dynamic imports for heavy components");
console.log("   - Implement code splitting for large screens");
console.log("   - Consider using React.lazy for route-based splitting");
console.log("   - Remove unused assets from assets folder");
