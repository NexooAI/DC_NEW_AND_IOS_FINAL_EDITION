const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to inject `use_modular_headers!` at the very top of the Podfile.
 * This resolves Swift pod compatibility issues with static libraries.
 */
const withModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (fs.existsSync(podfilePath)) {
        let contents = fs.readFileSync(podfilePath, 'utf-8');
        
        if (!contents.includes('use_modular_headers!')) {
          // Prepend use_modular_headers! at the very beginning of the Podfile
          contents = `use_modular_headers!\n\n${contents}`;
          fs.writeFileSync(podfilePath, contents, 'utf-8');
        }
      }
      return config;
    },
  ]);
};

module.exports = withModularHeaders;
