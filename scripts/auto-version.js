#!/usr/bin/env node

/**
 * Automatic Version Management Script
 *
 * This script automatically increments version numbers and updates all relevant files
 * before production builds. It supports semantic versioning and handles both
 * app.config.js and Android build.gradle files.
 *
 * Usage:
 *   node scripts/auto-version.js patch    # 1.0.2 -> 1.0.3
 *   node scripts/auto-version.js minor    # 1.0.2 -> 1.1.0
 *   node scripts/auto-version.js major    # 1.0.2 -> 2.0.0
 *   node scripts/auto-version.js auto     # Auto-detect based on git changes
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// File paths
const APP_CONFIG_PATH = path.join(__dirname, "../app.config.js");
const ANDROID_BUILD_GRADLE_PATH = path.join(
  __dirname,
  "../android/app/build.gradle"
);
const PACKAGE_JSON_PATH = path.join(__dirname, "../package.json");

// Version increment types
const VERSION_TYPES = {
  patch: "patch", // Bug fixes
  minor: "minor", // New features
  major: "major", // Breaking changes
  auto: "auto", // Auto-detect
};

/**
 * Parse version string to object
 */
function parseVersion(version) {
  const parts = version.split(".").map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
    toString: () => `${parts[0]}.${parts[1]}.${parts[2]}`,
  };
}

/**
 * Increment version based on type
 */
function incrementVersion(version, type) {
  const v = parseVersion(version);

  switch (type) {
    case "major":
      v.major += 1;
      v.minor = 0;
      v.patch = 0;
      break;
    case "minor":
      v.minor += 1;
      v.patch = 0;
      break;
    case "patch":
      v.patch += 1;
      break;
    default:
      throw new Error(`Invalid version type: ${type}`);
  }

  return v.toString();
}

/**
 * Auto-detect version type based on git changes
 */
function autoDetectVersionType() {
  try {
    // Get git diff for the last commit
    const diff = execSync("git diff --name-only HEAD~1 HEAD", {
      encoding: "utf8",
    });
    const files = diff
      .trim()
      .split("\n")
      .filter((f) => f);

    // Check for breaking changes
    const breakingFiles = files.filter(
      (f) =>
        f.includes("package.json") ||
        f.includes("app.config.js") ||
        f.includes("android/app/build.gradle")
    );

    if (breakingFiles.length > 0) {
      console.log(
        "🔍 Auto-detected: MAJOR version (breaking changes detected)"
      );
      return "major";
    }

    // Check for new features
    const featureFiles = files.filter(
      (f) =>
        f.includes("src/app/") ||
        f.includes("src/components/") ||
        f.includes("src/hooks/")
    );

    if (featureFiles.length > 0) {
      console.log("🔍 Auto-detected: MINOR version (new features detected)");
      return "minor";
    }

    // Default to patch
    console.log("🔍 Auto-detected: PATCH version (bug fixes)");
    return "patch";
  } catch (error) {
    console.log("⚠️  Could not auto-detect version type, defaulting to PATCH");
    return "patch";
  }
}

/**
 * Update app.config.js
 */
function updateAppConfig(newVersion) {
  try {
    let content = fs.readFileSync(APP_CONFIG_PATH, "utf8");

    // Update version
    content = content.replace(
      /version:\s*["'][^"']*["']/,
      `version: "${newVersion}"`
    );

    // Update versionCode (increment by 1)
    const versionCodeMatch = content.match(/versionCode:\s*(\d+)/);
    if (versionCodeMatch) {
      const currentVersionCode = parseInt(versionCodeMatch[1]);
      const newVersionCode = currentVersionCode + 1;
      content = content.replace(
        /versionCode:\s*\d+/,
        `versionCode: ${newVersionCode}`
      );
      console.log(
        `📱 Updated versionCode: ${currentVersionCode} -> ${newVersionCode}`
      );
    }

    fs.writeFileSync(APP_CONFIG_PATH, content);
    console.log(`✅ Updated app.config.js: version -> ${newVersion}`);
  } catch (error) {
    console.error("❌ Error updating app.config.js:", error.message);
  }
}

/**
 * Update Android build.gradle
 */
function updateAndroidBuildGradle(newVersion) {
  try {
    let content = fs.readFileSync(ANDROID_BUILD_GRADLE_PATH, "utf8");

    // Update versionName
    content = content.replace(
      /versionName\s+["'][^"']*["']/,
      `versionName "${newVersion}"`
    );

    // Update versionCode (increment by 1)
    const versionCodeMatch = content.match(/versionCode\s+(\d+)/);
    if (versionCodeMatch) {
      const currentVersionCode = parseInt(versionCodeMatch[1]);
      const newVersionCode = currentVersionCode + 1;
      content = content.replace(
        /versionCode\s+\d+/,
        `versionCode ${newVersionCode}`
      );
      console.log(
        `🤖 Updated Android versionCode: ${currentVersionCode} -> ${newVersionCode}`
      );
    }

    fs.writeFileSync(ANDROID_BUILD_GRADLE_PATH, content);
    console.log(
      `✅ Updated Android build.gradle: versionName -> ${newVersion}`
    );
  } catch (error) {
    console.error("❌ Error updating Android build.gradle:", error.message);
  }
}

/**
 * Update package.json
 */
function updatePackageJson(newVersion) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
    packageJson.version = newVersion;
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2));
    console.log(`✅ Updated package.json: version -> ${newVersion}`);
  } catch (error) {
    console.error("❌ Error updating package.json:", error.message);
  }
}

/**
 * Get current version from app.config.js
 */
function getCurrentVersion() {
  try {
    const content = fs.readFileSync(APP_CONFIG_PATH, "utf8");
    const match = content.match(/version:\s*["']([^"']*)["']/);
    return match ? match[1] : "1.0.0";
  } catch (error) {
    console.error("❌ Error reading current version:", error.message);
    return "1.0.0";
  }
}

/**
 * Main function
 */
function main() {
  const versionType = process.argv[2] || "auto";

  if (!Object.values(VERSION_TYPES).includes(versionType)) {
    console.error("❌ Invalid version type. Use: patch, minor, major, or auto");
    process.exit(1);
  }

  console.log("🚀 Starting automatic version management...\n");

  // Get current version
  const currentVersion = getCurrentVersion();
  console.log(`📋 Current version: ${currentVersion}`);

  // Determine version type
  const finalVersionType =
    versionType === "auto" ? autoDetectVersionType() : versionType;
  console.log(`🎯 Version type: ${finalVersionType.toUpperCase()}\n`);

  // Calculate new version
  const newVersion = incrementVersion(currentVersion, finalVersionType);
  console.log(`🆕 New version: ${newVersion}\n`);

  // Update all files
  updateAppConfig(newVersion);
  updateAndroidBuildGradle(newVersion);
  updatePackageJson(newVersion);

  console.log("\n🎉 Version update complete!");
  console.log(`📱 App version: ${currentVersion} -> ${newVersion}`);
  console.log(`🤖 Android versionCode: incremented`);
  console.log(`📦 Package version: updated`);

  console.log("\n🚀 Ready for production build!");
  console.log("Run: npm run build:production");
}

// Run the script
main();
