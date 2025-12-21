#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting minimal production build...\n");

// Step 1: Check if android directory exists
const androidPath = path.join(__dirname, "..", "android");
if (!fs.existsSync(androidPath)) {
  console.log("📱 Android directory not found. Creating minimal structure...");

  // Create basic android directory structure
  fs.mkdirSync(androidPath, { recursive: true });
  fs.mkdirSync(path.join(androidPath, "app"), { recursive: true });
  fs.mkdirSync(path.join(androidPath, "app", "src"), { recursive: true });
  fs.mkdirSync(path.join(androidPath, "app", "src", "main"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(androidPath, "app", "src", "main", "java"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(androidPath, "app", "src", "main", "res"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(androidPath, "gradle"), { recursive: true });
  fs.mkdirSync(path.join(androidPath, "gradle", "wrapper"), {
    recursive: true,
  });

  console.log("✅ Basic Android structure created");
}

// Step 2: Try to use Expo's build system with a different approach
console.log("🏗️  Step 2: Attempting build...");
try {
  // Try using Expo's build system with a different approach
  console.log("🔧 Trying Expo build with different configuration...");

  // Set environment variables to help with path issues
  process.env.EXPO_USE_HERMES = "true";
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = "localhost";

  execSync(
    "npx expo run:android --variant release --no-build-cache --no-bundler",
    {
      stdio: "inherit",
      env: { ...process.env, EXPO_USE_HERMES: "true" },
    }
  );

  console.log("✅ Build completed successfully!\n");
} catch (error) {
  console.log("⚠️  Expo build failed, trying alternative approach...");

  try {
    // Try using React Native CLI directly
    console.log("🔧 Trying React Native CLI...");
    execSync("npx react-native run-android --variant=release", {
      stdio: "inherit",
    });
    console.log("✅ React Native CLI build completed!\n");
  } catch (rnError) {
    console.log("⚠️  React Native CLI also failed, trying manual approach...");

    // Try to build using gradle directly if android directory exists
    if (fs.existsSync(path.join(androidPath, "gradlew.bat"))) {
      try {
        console.log("🔧 Trying direct Gradle build...");
        execSync(".\\gradlew.bat assembleRelease -x lint -x test", {
          stdio: "inherit",
          shell: true,
          cwd: androidPath,
        });
        console.log("✅ Gradle build completed!\n");
      } catch (gradleError) {
        console.error("❌ All build methods failed:");
        console.error("Expo error:", error.message);
        console.error("React Native CLI error:", rnError.message);
        console.error("Gradle error:", gradleError.message);
        process.exit(1);
      }
    } else {
      console.error("❌ No Android project found and all build methods failed");
      console.error("Error details:", error.message);
      process.exit(1);
    }
  }
}

console.log("🎉 Minimal production build complete!");
console.log(
  "📱 Check the android/app/build/outputs/ directory for the APK file"
);
