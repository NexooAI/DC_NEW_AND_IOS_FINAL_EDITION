#!/usr/bin/env node

/**
 * Migration Script: Convert Components to Responsive Design
 *
 * This script helps migrate components from direct Dimensions.get("window") usage
 * to the enhanced useResponsiveLayout hook system.
 *
 * Usage: node scripts/migrate-to-responsive.js
 */

const fs = require("fs");
const path = require("path");

// Components that need migration (priority order)
const COMPONENTS_TO_MIGRATE = [
  "src/app/components/AppHeader.tsx",
  "src/common/components/navigation/CustomBottomBar.tsx",
  "src/app/components/Products.tsx",
  "src/app/components/ImageSlider.tsx",
  "src/app/components/FlashBanner.tsx",
  "src/app/components/FlashOffer.tsx",
  "src/app/components/SupportContactCard.tsx",
  "src/app/components/StatusView.tsx",
  "src/app/components/EnhancedLoader.tsx",
  "src/app/components/VideoPlayer.tsx",
  "src/app/components/YouTubeVideo.tsx",
];

// Migration patterns
const MIGRATION_PATTERNS = [
  {
    name: "Import Dimensions removal",
    pattern: /import\s*{[^}]*Dimensions[^}]*}\s*from\s*['"]react-native['"];?/g,
    replacement: (match) => {
      const imports = match.match(
        /import\s*{([^}]*)}\s*from\s*['"]react-native['"];?/
      )[1];
      const newImports = imports
        .split(",")
        .map((imp) => imp.trim())
        .filter((imp) => imp !== "Dimensions")
        .join(", ");

      if (newImports.trim()) {
        return `import { ${newImports} } from 'react-native';`;
      }
      return "";
    },
  },
  {
    name: "Add useResponsiveLayout import",
    pattern:
      /import\s*{[^}]*}\s*from\s*['"]@\/hooks\/useResponsiveLayout['"];?/g,
    replacement:
      "import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';",
  },
  {
    name: "Remove Dimensions.get calls",
    pattern: /const\s*{\s*width\s*}\s*=\s*Dimensions\.get\(['"]window['"]\);?/g,
    replacement: "",
  },
  {
    name: "Remove Dimensions.get calls with height",
    pattern:
      /const\s*{\s*width,\s*height\s*}\s*=\s*Dimensions\.get\(['"]window['"]\);?/g,
    replacement: "",
  },
  {
    name: "Remove Dimensions.get calls with screenWidth",
    pattern:
      /const\s*{\s*width:\s*screenWidth\s*}\s*=\s*Dimensions\.get\(['"]window['"]\);?/g,
    replacement: "",
  },
  {
    name: "Add useResponsiveLayout hook",
    pattern: /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{/g,
    replacement: (match, componentName) => {
      return `${match}
  const { 
    screenWidth, 
    screenHeight,
    deviceScale, 
    getResponsiveFontSize, 
    getResponsivePadding,
    spacing,
    fontSize,
    padding,
    getCardWidth,
    getGridColumns,
    getListItemHeight
  } = useResponsiveLayout();`;
    },
  },
];

// Helper function to read file
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`❌ Error reading file: ${filePath}`);
    return null;
  }
}

// Helper function to write file
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  } catch (error) {
    console.error(`❌ Error writing file: ${filePath}`);
    return false;
  }
}

// Main migration function
function migrateComponent(filePath) {
  console.log(`\n🔄 Migrating: ${filePath}`);

  const content = readFile(filePath);
  if (!content) return false;

  let migratedContent = content;
  let changesMade = 0;

  // Apply migration patterns
  MIGRATION_PATTERNS.forEach((pattern) => {
    const matches = migratedContent.match(pattern.pattern);
    if (matches) {
      const newContent = migratedContent.replace(
        pattern.pattern,
        pattern.replacement
      );
      if (newContent !== migratedContent) {
        migratedContent = newContent;
        changesMade += matches.length;
        console.log(`  ✅ Applied: ${pattern.name}`);
      }
    }
  });

  // Check if Dimensions.get is still used
  const remainingDimensionsUsage = migratedContent.match(/Dimensions\.get/g);
  if (remainingDimensionsUsage) {
    console.log(
      `  ⚠️  Warning: ${remainingDimensionsUsage.length} Dimensions.get calls remain`
    );
  }

  // Write migrated content
  if (changesMade > 0) {
    if (writeFile(filePath, migratedContent)) {
      console.log(`  ✅ Successfully migrated with ${changesMade} changes`);
      return true;
    }
  } else {
    console.log(`  ℹ️  No changes needed`);
  }

  return false;
}

// Main execution
function main() {
  console.log("🚀 Starting Responsive Design Migration...\n");

  let migratedCount = 0;
  let totalCount = COMPONENTS_TO_MIGRATE.length;

  COMPONENTS_TO_MIGRATE.forEach((componentPath) => {
    if (migrateComponent(componentPath)) {
      migratedCount++;
    }
  });

  console.log(`\n📊 Migration Summary:`);
  console.log(`  Total components: ${totalCount}`);
  console.log(`  Successfully migrated: ${migratedCount}`);
  console.log(`  Failed: ${totalCount - migratedCount}`);

  if (migratedCount > 0) {
    console.log(`\n🎉 Migration completed! Next steps:`);
    console.log(`  1. Review migrated components for any manual adjustments`);
    console.log(`  2. Test components on different device sizes`);
    console.log(`  3. Use ResponsiveDesignTester component to verify behavior`);
    console.log(`  4. Update any remaining hardcoded dimensions manually`);
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  main();
}

module.exports = { migrateComponent, MIGRATION_PATTERNS };
