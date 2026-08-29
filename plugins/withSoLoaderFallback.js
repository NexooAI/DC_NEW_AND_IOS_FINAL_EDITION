const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withSoLoaderFallback = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android?.package;
      if (!packageName) {
        console.warn('[withSoLoaderFallback] Warning: config.android.package is not defined. Skipping modification.');
        return config;
      }
      const packagePath = packageName.replace(/\./g, '/');
      const platformProjectRoot = config.modRequest.platformProjectRoot;

      let filePath = path.join(platformProjectRoot, 'app/src/main/java', packagePath, 'MainApplication.kt');
      if (!fs.existsSync(filePath)) {
        filePath = path.join(platformProjectRoot, 'app/src/main/java', packagePath, 'MainApplication.java');
      }

      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        const isKotlin = filePath.endsWith('.kt');
        const importStatement = isKotlin
          ? 'import com.facebook.soloader.SoLoader'
          : 'import com.facebook.soloader.SoLoader;';

        // Add SoLoader import if missing
        if (!content.includes('com.facebook.soloader.SoLoader')) {
          content = content.replace(
            /package\s+[a-zA-Z0-9._]+;?/,
            (match) => `${match}\n\n${importStatement}`
          );
        }

        // Add try-catch before loadReactNative(this)
        if (content.includes('loadReactNative(this)') && !content.includes('SoLoader.init(this, false)')) {
          const replacement = `try {
      SoLoader.init(this, false)
    } catch (e: Throwable) {
      try {
        System.loadLibrary("c++_shared")
        SoLoader.init(this, false)
      } catch (fallbackError: UnsatisfiedLinkError) {
        android.util.Log.e("MainApplication", "Failed to load c++_shared", fallbackError)
      }
    }
    loadReactNative(this)`;

          content = content.replace('loadReactNative(this)', replacement);
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`[withSoLoaderFallback] Successfully patched MainApplication at ${filePath}`);
        } else {
          console.log('[withSoLoaderFallback] MainApplication is already patched or loadReactNative(this) not found.');
        }
      } else {
        console.warn(`[withSoLoaderFallback] Warning: MainApplication file not found at ${filePath}`);
      }
      return config;
    }
  ]);
};

module.exports = withSoLoaderFallback;
