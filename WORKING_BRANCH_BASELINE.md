# WORKING BRANCH TECHNICAL BASELINE AUDIT

**Branch**: `Final_20072026_both`  
**Git Commit**: `069d7ed` (feat: implement API loader service, add new screens, and upgrade Android SDK version to 36)  
**Workspace Path**: `c:\Users\nithy\Videos\DC_New(AND-IOS)\DC_NEW_AND_IOS_FINAL_EDITION`  
**Audit Timestamp**: `2026-09-01T09:49:00+05:30`

---

## A. Environment

| Component | Exact Detected Version / Path |
| :--- | :--- |
| **Node.js** | `v20.19.6` |
| **npm** | `10.8.2` |
| **Operating System** | `Windows 11 / Windows NT 10.0.26100` |
| **Active JDK** | `Temurin OpenJDK 17.0.12+7 (64-Bit)` (`C:\Users\nithy\Downloads\jdk-17.0.12+7\bin`) |
| **JAVA_HOME Environment Variable** | `C:\Program Files\java\jdk-17` |
| **ANDROID_HOME** | `C:\Users\nithy\AppData\Local\Android\Sdk` |
| **ANDROID_SDK_ROOT** | `C:\Users\nithy\AppData\Local\Android\Sdk` |
| **Installed Android Platforms** | `android-27`, `android-28`, `android-29`, `android-30`, `android-31`, `android-32`, `android-33`, `android-34`, `android-35`, `android-36`, `android-36.1` |
| **Installed Build Tools** | `28.0.3`, `29.0.2`, `30.0.2`, `30.0.3`, `33.0.0`, `33.0.1`, `33.0.2`, `34.0.0`, `34.0.0-rc3`, `35.0.0`, `36.0.0` |
| **Installed NDKs** | `27.0.12077973`, `27.1.12297006`, `28.2.13676358` |
| **Installed CMake** | `3.22.1` |

---

## B. Expo / React Native Versions

| Package | `package.json` Spec | `package-lock.json` Resolved | `node_modules` Installed |
| :--- | :--- | :--- | :--- |
| `expo` | `~54.0.36` | `54.0.36` | `54.0.37` |
| `react` | `19.1.0` | `19.1.0` | `19.1.0` |
| `react-dom` | `19.1.0` | `19.1.0` | `19.1.0` |
| `react-native` | `0.81.5` | `0.81.5` | `0.81.5` |
| `expo-router` | `~6.0.23` | `6.0.24` | `6.0.24` |
| `react-native-reanimated` | `4.1.2` | `4.1.2` | `3.16.7` *(with patch applied in node_modules)* |
| `react-native-worklets-core` | `^1.6.2` | `1.6.3` | N/A |
| `react-native-worklets` | `0.5.1` | `0.5.1` | N/A |
| `@react-navigation/drawer` | `^7.1.1` | `7.10.3` | `7.10.3` |
| `react-native-drawer-layout` | *(transitive)* | `4.2.8` | `4.2.4` |
| `@react-navigation/native` | `7.x` | `7.2.5` | `7.2.5` |
| `@react-navigation/bottom-tabs`| `7.x` | `7.16.2` | `7.16.2` |
| `@react-navigation/native-stack`| `7.x` | `7.16.0` | `7.16.0` |
| `@react-navigation/stack` | `^7.1.1` | `7.9.3` | `7.9.3` |
| `nativewind` | `4.0.36` | `4.0.36` | `4.0.36` |
| `react-native-css-interop` | `0.0.29` | `0.0.29` | `0.0.29` *(and transitive `0.0.36`)* |
| `tailwindcss` | `^3.4.0` | `3.4.19` | `3.4.19` |
| `react-native-gesture-handler` | `~2.28.0` | `2.28.0` | `2.28.0` |
| `react-native-safe-area-context`| `~5.6.0` | `5.6.2` | `5.6.2` |
| `react-native-screens` | `~4.16.0` | `4.16.0` | `4.16.0` |
| `typescript` | `~5.9.2` | `5.9.3` | `5.9.3` |

---

## C. Dependency Tree

### Full `dependencies` from `package.json`
```json
{
  "@expo/vector-icons": "^15.0.2",
  "@gorhom/bottom-sheet": "^5.2.6",
  "@react-native-async-storage/async-storage": "2.2.0",
  "@react-native-community/datetimepicker": "8.4.4",
  "@react-native-community/netinfo": "11.4.1",
  "@react-native-community/slider": "5.0.1",
  "@react-native-firebase/app": "^24.1.1",
  "@react-native-firebase/crashlytics": "^24.1.1",
  "@react-native-picker/picker": "2.11.1",
  "@react-navigation/bottom-tabs": "7.x",
  "@react-navigation/drawer": "^7.1.1",
  "@react-navigation/native": "7.x",
  "@react-navigation/native-stack": "7.x",
  "axios": "^1.7.9",
  "expo": "~54.0.36",
  "expo-application": "^7.0.7",
  "expo-asset": "~12.0.13",
  "expo-blur": "~15.0.7",
  "expo-build-properties": "~1.0.9",
  "expo-clipboard": "~8.0.7",
  "expo-constants": "~18.0.9",
  "expo-crypto": "~15.0.9",
  "expo-dev-client": "~6.0.21",
  "expo-device": "~8.0.9",
  "expo-file-system": "~19.0.23",
  "expo-font": "~14.0.12",
  "expo-haptics": "~15.0.7",
  "expo-image-picker": "~17.0.11",
  "expo-linear-gradient": "~15.0.7",
  "expo-linking": "~8.0.11",
  "expo-local-authentication": "~17.0.7",
  "expo-localization": "~17.0.9",
  "expo-location": "~19.0.7",
  "expo-notifications": "~0.32.17",
  "expo-print": "~15.0.7",
  "expo-router": "~6.0.23",
  "expo-secure-store": "~15.0.7",
  "expo-sharing": "~14.0.7",
  "expo-splash-screen": "~31.0.13",
  "expo-store-review": "~9.0.9",
  "expo-system-ui": "~6.0.9",
  "expo-web-browser": "~15.0.11",
  "i18n-js": "^4.5.1",
  "nativewind": "4.0.36",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-native": "0.81.5",
  "react-native-animatable": "^1.4.0",
  "react-native-chart-kit": "^6.12.0",
  "react-native-css-interop": "0.0.29",
  "react-native-element-dropdown": "^2.12.4",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-maps": "1.20.1",
  "react-native-picker-select": "^9.3.1",
  "react-native-reanimated": "4.1.2",
  "react-native-root-siblings": "^5.0.1",
  "react-native-root-toast": "^4.0.1",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "react-native-size-matters": "^0.4.2",
  "react-native-sms-retriever": "^1.1.1",
  "react-native-svg": "15.12.1",
  "react-native-vector-icons": "^10.2.0",
  "react-native-web": "^0.21.0",
  "react-native-webview": "13.15.0",
  "react-native-worklets": "0.5.1",
  "react-native-worklets-core": "^1.6.2",
  "react-native-youtube-iframe": "^2.3.0",
  "socket.io-client": "^4.8.1",
  "tailwindcss": "^3.4.0",
  "zustand": "^5.0.3"
}
```

### Full `devDependencies` from `package.json`
```json
{
  "@babel/core": "^7.26.0",
  "@babel/plugin-transform-react-jsx": "^7.27.1",
  "@react-native-community/cli": "latest",
  "@react-navigation/native": "^7.0.14",
  "@react-navigation/stack": "^7.1.1",
  "@testing-library/react-native": "^13.3.3",
  "@types/expo": "^33.0.3",
  "@types/i18n-js": "^3.8.9",
  "@types/jest": "29.5.14",
  "@types/jwt-decode": "^3.1.0",
  "@types/react": "~19.1.10",
  "@types/react-native-linear-gradient": "^2.3.1",
  "@types/react-native-vector-icons": "^6.4.18",
  "@types/react-navigation": "^3.4.0",
  "@types/react-test-renderer": "^19.1.0",
  "babel-plugin-module-resolver": "^5.0.2",
  "babel-plugin-transform-remove-console": "^6.9.4",
  "babel-preset-expo": "~54.0.10",
  "jest": "~29.7.0",
  "jest-expo": "~54.0.17",
  "react-test-renderer": "^19.1.0",
  "typescript": "~5.9.2"
}
```

---

## D. Babel Configuration

**File**: `babel.config.js`
```javascript
module.exports = function (api) {
  api.cache(true);

  const plugins = [
    // 1️⃣ Worklets Core plugin — should be at the top
    "react-native-worklets-core/plugin",

    // 2️⃣ CSS interop setup for NativeWind
    require("react-native-css-interop/dist/babel-plugin").default,

    // 3️⃣ JSX transform for NativeWind + CSS interop
    [
      "@babel/plugin-transform-react-jsx",
      {
        runtime: "automatic",
        importSource: "react-native-css-interop",
      },
    ],

    // 4️⃣ Module aliasing (optional but useful)
    [
      "module-resolver",
      {
        root: ["./src"],
        alias: {
          "@": "./src",
          "@assets": "./assets",
        },
      },
    ],

    // 5️⃣ Reanimated plugin — must be the LAST one
    [
      "react-native-reanimated/plugin",
      {
        relativeSourceLocation: true,
      },
    ],
  ];

  // Remove console logs in production environment
  if (process.env.NODE_ENV === "production") {
    plugins.push("transform-remove-console");
  }

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          jsxRuntime: "automatic",
        },
      ],
    ],
    plugins,
  };
};
```

---

## E. Metro Configuration

**File**: `metro.config.js`
```javascript
// Polyfill for Array.prototype.toReversed (required by Metro in newer Expo versions on Node < 20)
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function () {
    return this.slice().reverse();
  };
}

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add any custom configurations
config.resolver.sourceExts.push("mjs");

// Disable web support - native-only app
config.resolver.platforms = ["ios", "android", "native"];

// Configure path aliases
config.resolver.alias = {
  "@": path.resolve(__dirname, "src"),
};

// Exclude web-specific modules
config.resolver.blockList = [
  /node_modules\/react-native-web\/.*/,
  /node_modules\/react-dom\/.*/,
];

module.exports = withNativeWind(config, { input: "./src/global.css" });
```

---

## F. Expo Configuration

**File**: `app.config.ts`
* **Name**: `"DC Jewellers"` (from `themeConfig.customerName`)
* **Slug**: `"dc-jewellers-gold-and-diamonds"`
* **Version**: `"2.0.2"`
* **Orientation**: `"portrait"`
* **Scheme**: `"dcjewellers"`
* **JS Engine**: `"hermes"`
* **New Architecture Enabled (`newArchEnabled`)**: `true`
* **Owner**: `"dcjewellers"`
* **Android Package**: `"com.nexooai.dcjewellery"`
* **Android VersionCode**: `12`
* **iOS Bundle Identifier**: `"com.dcjewellers.dcjewellers"`
* **iOS BuildNumber**: `"2"`
* **Plugins Configured**:
  1. `expo-font`
  2. `expo-asset`
  3. `expo-router`
  4. `expo-secure-store`
  5. `expo-localization`
  6. `expo-build-properties` (`compileSdkVersion: 36`, `targetSdkVersion: 36`, `enableProguardInReleaseBuilds: true`, `enableShrinkResources: true`, `blockedPermissions: [...]`)
  7. `expo-image-picker`
  8. `expo-notifications`
  9. `expo-web-browser`
  10. `./plugins/withModularHeaders`
  11. `./plugins/withSmsRetriever`
  12. `./plugins/with-proguard.js`
  13. `./plugins/withAndroidQueries.js`
  14. `@react-native-firebase/app`
  15. `@react-native-firebase/crashlytics`

---

## G. Android Native Configuration

| File | Key Setting / Property | Value |
| :--- | :--- | :--- |
| `android/gradle/wrapper/gradle-wrapper.properties` | `distributionUrl` | `gradle-8.14.3-bin.zip` |
| `android/gradle.properties` | `org.gradle.jvmargs` | `-Xmx4g -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8` |
| `android/gradle.properties` | `newArchEnabled` | `false` |
| `android/gradle.properties` | `hermesEnabled` | `true` |
| `android/gradle.properties` | `edgeToEdgeEnabled` | `true` |
| `android/gradle.properties` | `android.compileSdkVersion` | `35` |
| `android/gradle.properties` | `android.targetSdkVersion` | `35` |
| `android/gradle.properties` | `android.enableR8.fullMode` | `false` |
| `android/gradle.properties` | `reactNativeArchitectures` | `armeabi-v7a,arm64-v8a,x86,x86_64` |
| `android/build.gradle` | `firebase-crashlytics-gradle` | `3.0.7` |
| `android/build.gradle` | `google-services` | `4.4.1` |
| `android/app/build.gradle` | `namespace` | `com.nexooai.srithangathamarai` |
| `android/app/build.gradle` | `applicationId` | `com.nexooai.srithangathamarai` |
| `android/app/build.gradle` | `versionCode` | `10` |
| `android/app/build.gradle` | `versionName` | `1.0.9` |
| `android/app/src/main/java/.../MainActivity.kt` | Root Component / SplashScreen | Extends `ReactActivity`, `SplashScreenManager.registerOnActivity(this)` |
| `android/app/src/main/java/.../MainApplication.kt` | Application / Host | Extends `Application`, implements `ReactApplication`, wraps `ReactNativeHostWrapper` |

---

## H. Reanimated Configuration

1. **Babel Plugin Placement**:
   - `react-native-reanimated/plugin` is configured as the **LAST** plugin in `babel.config.js` with `{ relativeSourceLocation: true }`.
2. **Worklets Core Plugin**:
   - `react-native-worklets-core/plugin` is placed as the **FIRST** plugin.
3. **Known Critical React 19 / CSS-Interop Gotcha**:
   - React 19 functional components wrapped by NativeWind/CSS-interop (like `TextImpl`) require `createAnimatedComponent` in `react-native-reanimated` (3.16.x) to support functional components without strict class/forwardRef invariant assertions.

---

## I. Drawer / Navigation Configuration

1. **Root Layout (`src/app/_layout.tsx`)**:
   - Stack contains: `<Stack.Screen name="intro" />`, `<Stack.Screen name="login" />`, `<Stack.Screen name="[...missing]" />`.
   - Root is wrapped with `<RootSiblingParent>`, `<GestureHandlerRootView style={{ flex: 1 }}>`, `<LanguageProvider1>`, and `<GlobalLoadingProvider>`.
2. **App Drawer Layout (`src/app/(app)/_layout.tsx`)**:
   - Uses `import { Drawer } from "expo-router/drawer";`
   - Wrapped with `<SafeAreaProvider>` and `<SafeAreaView edges={Platform.OS === "ios" ? ["top", "left", "right"] : ["left", "right"]}>`.
   - Custom content rendered via `CustomDrawerContent` (`src/common/components/navigation/DrawerContent.tsx`).
   - Drawer Screens: `dashboard`, `(tabs)`, `lucky_draw`, `gold_advance`, `bill_payment`, `old_gold`.
3. **Tab Layout (`src/app/(app)/(tabs)/_layout.tsx`)**:
   - Tab Screens: `home/index`, `savings/index`, `transactions/index`, `notifications`, `profile/index`.

---

## J. NativeWind / CSS Interop Configuration

1. **NativeWind Metro Wrapper**:
   - `withNativeWind(config, { input: "./src/global.css" })` in `metro.config.js`.
2. **Babel Plugins & Presets**:
   - `preset`: `["babel-preset-expo", { jsxImportSource: "nativewind", jsxRuntime: "automatic" }]`
   - `plugin`: `require("react-native-css-interop/dist/babel-plugin").default`
   - `plugin`: `["@babel/plugin-transform-react-jsx", { runtime: "automatic", importSource: "react-native-css-interop" }]`
3. **CSS Global Stylesheet**:
   - `src/global.css` with Tailwind directives `@tailwind base; @tailwind components; @tailwind utilities;`.

---

## K. Build Configuration

1. **`eas.json` Profiles**:
   - `development`: `"android": { "buildType": "apk", "gradleCommand": ":app:assembleDebug" }`
   - `preview`: `"android": { "buildType": "apk", "gradleCommand": ":app:assembleRelease" }`
   - `production`: `"android": { "buildType": "app-bundle", "gradleCommand": ":app:bundleRelease" }`
2. **Local Android Gradle Output**:
   - Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
   - Release APK: `android/app/build/outputs/apk/release/app-release.apk`
   - Release AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

## L. Known-Good Commands

1. **Validation & Type Check**:
   ```bash
   npx expo-doctor
   npx tsc --noEmit --skipLibCheck
   ```
2. **Starting Metro Development Server**:
   ```bash
   npx expo start --clear
   ```
3. **Prebuilding Android Project**:
   ```bash
   npx expo prebuild --platform android --clean
   ```
4. **Building Local Android Release APK (via Gradle)**:
   ```powershell
   $env:JAVA_HOME = "C:\Users\nithy\Downloads\jdk-17.0.12+7"
   $env:Path = "C:\Users\nithy\Downloads\jdk-17.0.12+7\bin;" + $env:Path
   cd android
   .\gradlew assembleRelease --no-daemon
   ```
5. **Running via Expo CLI**:
   ```bash
   npx expo run:android
   npx expo run:android --variant release
   ```

---

## M. Important Files

| File Path | Role |
| :--- | :--- |
| `package.json` | Root project dependencies and scripts |
| `package-lock.json` | Exact lockfile resolutions |
| `babel.config.js` | Worklets, CSS-interop, JSX transform, Reanimated plugin pipeline |
| `metro.config.js` | Metro bundler config, NativeWind integration, path aliases |
| `app.config.ts` | Dynamic Expo SDK 54 configuration & native build properties |
| `eas.json` | EAS cloud/local build profiles |
| `android/gradle.properties` | JVM memory, Hermes, architecture, edge-to-edge flags |
| `android/app/build.gradle` | Android app packaging, shrinkResources, proguard rules |
| `src/app/_layout.tsx` | Root Stack, GestureHandler, Loading & Locale providers |
| `src/app/(app)/_layout.tsx` | Expo Router Drawer layout & SafeArea bounds |
| `src/common/components/navigation/DrawerContent.tsx` | Custom Drawer header, user profile, menu items & insets |

---

## N. Exact Versions That MUST NOT Change

| Dependency | Fixed Working Version | Why It Must Not Change |
| :--- | :--- | :--- |
| `react` | `19.1.0` | Required by React Native 0.81.x in Expo SDK 54 |
| `react-native` | `0.81.5` | Base framework version of Expo SDK 54 |
| `expo` | `~54.0.36` / `54.0.37` | Expo SDK 54 core |
| `expo-router` | `~6.0.23` / `6.0.24` | Navigation routing engine |
| `nativewind` | `4.0.36` | Tailwind integration tied to css-interop 0.0.29 |
| `react-native-css-interop` | `0.0.29` | JSX interop transform |
| `react-native-safe-area-context` | `5.6.2` | Inset management across iOS notch and Android status bar |
| `react-native-gesture-handler` | `~2.28.0` | Touch & drawer gesture engine |
| `gradle` | `8.14.3` | Gradle wrapper distribution |
| `jdk` | `17.0.12` | Required JDK 17 for React Native 0.81 Android builds |

---

## O. Potentially Sensitive / Problematic Configuration

1. **`patch-package` Dependency Location**:
   - If `patch-package` is only in `devDependencies`, EAS cloud builds running `npm ci` with postinstall will fail with `exit code 127 (patch-package: not found)`. Keep `patch-package` in `dependencies`.
2. **Reanimated vs React 19 `TextImpl`**:
   - `react-native-reanimated` 3.16.x has a strict check in `createAnimatedComponent` that throws when NativeWind's functional `TextImpl` is passed. The patch in `patches/react-native-reanimated+3.16.7.patch` resolves this.
3. **Android App ID vs Prebuild Configuration**:
   - In `android/app/build.gradle` the namespace is `com.nexooai.srithangathamarai`, while in `app.config.ts` the Android package is `com.nexooai.dcjewellery`. Running `npx expo prebuild --clean` regenerates `android/` with the active `app.config.ts` bundle identifier.

---

## P. Complete Baseline Checklist

- [x] Node.js `v20.19.6` and JDK 17 verified.
- [x] Lockfile integrity checked (`package-lock.json` clean, no yarn/pnpm lock conflicts).
- [x] `npx expo-doctor` 18/18 checks passing.
- [x] `babel.config.js` plugin ordering verified (Worklets core top, Reanimated bottom).
- [x] `metro.config.js` NativeWind and alias resolver verified.
- [x] `app.config.ts` SDK 54 plugins and permissions verified.
- [x] `android/` Gradle 8.14.3, Hermes enabled, edge-to-edge configured.
- [x] Drawer layout and navigation safe area insets verified.
