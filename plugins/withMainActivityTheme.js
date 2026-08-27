const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withMainActivityTheme = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android?.package;
      if (!packageName) {
        console.warn('[withMainActivityTheme] Warning: config.android.package is not defined. Skipping modification.');
        return config;
      }
      const packagePath = packageName.replace(/\./g, '/');
      const platformProjectRoot = config.modRequest.platformProjectRoot;

      // Try Kotlin first, then Java
      let filePath = path.join(platformProjectRoot, 'app/src/main/java', packagePath, 'MainActivity.kt');
      if (!fs.existsSync(filePath)) {
        filePath = path.join(platformProjectRoot, 'app/src/main/java', packagePath, 'MainActivity.java');
      }

      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Uncomment setTheme(R.style.AppTheme);
        if (content.includes('// setTheme(R.style.AppTheme);')) {
          content = content.replace('// setTheme(R.style.AppTheme);', 'setTheme(R.style.AppTheme);');
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`[withMainActivityTheme] Successfully uncommented setTheme in ${path.basename(filePath)}`);
        } else {
          console.log('[withMainActivityTheme] setTheme is already uncommented or not found.');
        }
      } else {
        console.warn(`[withMainActivityTheme] Warning: MainActivity file not found at ${filePath}`);
      }
      return config;
    }
  ]);
};

module.exports = withMainActivityTheme;
