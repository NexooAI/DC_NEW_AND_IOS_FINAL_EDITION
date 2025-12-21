const { logger } = require('../utils/logger'); // This might need fix if logger is ESM-only but usually low risk
const { theme } = require('./theme');

// Color mapping from hardcoded values to centralized colors
const COLOR_MAPPING = {
  // Common colors
  '#ffffff': 'COLORS.background.primary',
  '#fff': 'COLORS.background.primary',
  '#000000': 'COLORS.text.secondary',
  'transparent': 'COLORS.common.transparent',

  // Text colors
  '#666': 'COLORS.text.mediumGrey',
  '#333': 'COLORS.text.darkGrey',
  '#888': 'COLORS.text.lightGrey',
  '#777': 'COLORS.text.lightGrey',
  '#595959': 'COLORS.text.muted',
  '#262626': 'COLORS.text.mutedDark',
  '#bfbfbf': 'COLORS.text.mutedLight',
  '#555555': 'COLORS.text.mutedMedium',

  // Background colors
  '#f3f4f6': 'COLORS.background.tertiary',
  '#f5f5f5': 'COLORS.background.quaternary',
  '#f7f7f7': 'COLORS.background.quinary',
  '#FFF8DC': 'COLORS.background.card',
  '#F5DEB3': 'COLORS.background.cardMedium',

  // Border colors
  '#e5e5e5': 'COLORS.border.light',
  '#f0f0f0': 'COLORS.border.white',
  '#cccccc': 'COLORS.border.primary',

  // Status colors
  '#4CAF50': 'COLORS.status.success',
  '#4caf50': 'COLORS.status.success',
  '#2E7D32': 'COLORS.status.active',
  '#D32F2F': 'COLORS.status.inactive',
  '#FF9800': 'COLORS.status.warning',
  '#FFC857': 'COLORS.status.warning',
  '#00cc44': 'COLORS.status.success',
  '#ff4444': 'COLORS.status.error',

  // Primary brand colors
  '#850111': 'COLORS.primary',
  '#ffc90c': 'COLORS.secondary',
  '#ffd700': 'COLORS.gold',
  '#DAA520': 'COLORS.goldLight',
  '#B8860B': 'COLORS.goldDark',
  '#8B4513': 'COLORS.goldDarker',

  // Red and burgundy colors
  '#7b0006': 'COLORS.redBurgundy',
  '#B31313': 'COLORS.redBurgundyLight',
  '#8B0000': 'COLORS.redBurgundyDark',
  '#5a000b': 'COLORS.redDarker',
  '#2e0406': 'COLORS.text.dark',

  // Blue colors
  '#1a1a2e': 'COLORS.blue.dark',
  '#16213e': 'COLORS.blue.darker',
  '#0f3460': 'COLORS.blue.darkest',
  '#60a5fa': 'COLORS.blue.primary',

  // Green colors
  '#4ade80': 'COLORS.green.primary',
  '#96fc88': 'COLORS.green.light',

  // Brown colors
  '#2C1810': 'COLORS.text.darkBrown',

  // Shadow colors
};

// Function to get the centralized color for a hardcoded value
function getCentralizedColor(hexColor) {
  return COLOR_MAPPING[hexColor] || hexColor;
}

// Function to generate migration suggestions
function generateMigrationSuggestions() {
  console.log('🎨 Color Migration Guide'); // Use console instead of logger to avoid circular deps if logger is problematic
  console.log('========================\n');

  console.log('📋 Import Statement:');
  console.log('import COLORS from \'../constants/colors\';\n');

  console.log('🔄 Color Replacements:');
  Object.entries(COLOR_MAPPING).forEach(([hardcoded, centralized]) => {
    console.log(`${hardcoded} → ${centralized}`);
  });

  console.log('\n📝 Usage Examples:');
  console.log('// Before:');
  console.log('backgroundColor: "#ffffff"');
  console.log('color: "#000000"');
  console.log('borderColor: "#cccccc"');

  console.log('\n// After:');
  console.log('backgroundColor: COLORS.background.primary');
  console.log('color: COLORS.text.secondary');
  console.log('borderColor: COLORS.border.primary');

  console.log('\n🔍 Search and Replace Patterns:');
  console.log('1. Search for: backgroundColor: "#ffffff"');
  console.log('   Replace with: backgroundColor: COLORS.background.primary');

  console.log('2. Search for: color: "#000000"');
  console.log('   Replace with: color: COLORS.text.secondary');

  console.log('3. Search for: borderColor: "#cccccc"');
  console.log('   Replace with: borderColor: COLORS.border.primary');

  console.log('\n💡 Tips:');
  console.log('- Use VS Code search and replace with regex');
  console.log('- Test each replacement to ensure it works');
  console.log('- Update one component at a time');
  console.log('- Use the ColorExample component to test colors');
}

// Function to validate color usage
function validateColorUsage(componentCode) {
  const hardcodedColors = componentCode.match(/#[0-9a-fA-F]{3,6}/g) || [];
  const suggestions = [];

  hardcodedColors.forEach(color => {
    if (COLOR_MAPPING[color]) {
      suggestions.push(`${color} → ${COLOR_MAPPING[color]}`);
    }
  });

  return suggestions;
}

module.exports = {
  COLOR_MAPPING,
  getCentralizedColor,
  generateMigrationSuggestions,
  validateColorUsage,
};

if (require.main === module) {
  generateMigrationSuggestions();
}
