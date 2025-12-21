#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");

console.log("🚀 Starting simple production build...\n");

// Step 1: Try to prebuild Android project
console.log("📱 Step 1: Prebuilding Android project...");
try {
  execSync("npx expo prebuild --platform android --clean", {
    stdio: "inherit",
  });
  console.log("✅ Android prebuild complete\n");
} catch (error) {
  console.error("❌ Error prebuilding Android:", error.message);
  console.log("⚠️  Continuing with existing Android project...\n");
}

// Step 2: Build for production
console.log("🏗️  Step 2: Building for production...");
try {
  const platform = process.argv[2] || "android";

  if (platform === "android") {
    console.log("🔧 Building Android APK...");
    try {
      // Try Expo build first
      execSync("npx expo run:android --variant release", { stdio: "inherit" });
    } catch (error) {
      console.log("⚠️  Expo build failed, trying direct Gradle build...");
      // Fallback to direct gradle build
      const androidPath = path.join(__dirname, "..", "android");
      execSync(".\\gradlew.bat assembleRelease -x lint -x test", {
        stdio: "inherit",
        shell: true,
        cwd: androidPath,
      });
    }
  } else if (platform === "ios") {
    execSync("npx expo run:ios --configuration Release", { stdio: "inherit" });
  } else {
    console.log("📱 Building for both platforms...");
    // Android
    try {
      execSync("npx expo run:android --variant release", { stdio: "inherit" });
    } catch (error) {
      console.log("⚠️  Expo build failed, trying direct Gradle build...");
      const androidPath = path.join(__dirname, "..", "android");
      execSync(".\\gradlew.bat assembleRelease -x lint -x test", {
        stdio: "inherit",
        shell: true,
        cwd: androidPath,
      });
    }
    // iOS
    execSync("npx expo run:ios --configuration Release", { stdio: "inherit" });
  }

  console.log("✅ Production build complete\n");
} catch (error) {
  console.error("❌ Error building for production:", error.message);
  process.exit(1);
}

console.log("🎉 Simple production build complete!");
console.log(
  "📱 Your app APK should be available in android/app/build/outputs/apk/release/"
);
