import { ExpoConfig, ConfigContext } from 'expo/config';
import { themeConfig } from './src/constants/theme.config';

export default ({ config }: ConfigContext): ExpoConfig => {
    // Dynamically choose bundle identifier, project ID, and owner based on build platform target
    const isIos = process.env.EAS_BUILD_PLATFORM === 'ios' ||
        process.env.EXPO_PLATFORM === 'ios' ||
        process.env.PLATFORM === 'ios' ||
        (process.argv && process.argv.some(arg => {
            const lower = arg.toLowerCase();
            return lower === 'ios' || lower === '--platform=ios' || lower === '-p=ios';
        }));

    const bundleIdentifier = isIos ? "com.dcjewellers.dcjewellers" : "com.nexooai.srithangathamarai";
    const projectId = isIos ? "07310377-0452-4d15-8e38-d42462be6fd8" : "912daab2-d11c-42ff-9072-62ddfb4489c0";
    const owner = isIos ? "dcjewellers" : "mnvgroups07";

    const version = isIos ? "1.0.0" : "1.0.1";

    return {
        ...config,
        name: themeConfig.customerName,
        slug: themeConfig.slug,
        version: version,
        orientation: "portrait",
        userInterfaceStyle: "automatic",
        scheme: "acme",
        jsEngine: "hermes",

        icon: "./assets/images/playstore-icon.png",

        splash: {
            image: "./assets/images/playstore-icon.png",
            resizeMode: "contain",
            backgroundColor: themeConfig.primaryColor,
        },

        androidStatusBar: {
            backgroundColor: themeConfig.primaryColor,
            barStyle: "light-content",
            translucent: false,
        },

        android: {
            package: bundleIdentifier,
            googleServicesFile: "./google-services.json",
            versionCode: 2,

            splash: {
                image: "./assets/images/playstore-icon.png",
                resizeMode: "contain",
                backgroundColor: themeConfig.primaryColor,
            },

            // ✔ Google Maps API (IMPORTANT — must stay)
            config: {
                googleMaps: {
                    apiKey: "AIzaSyAkuOcNddEvozQR4D4yPdTrbwXCiPsuEFc",
                },
            },
            intentFilters: [
                {
                    action: "VIEW",
                    data: [
                        {
                            scheme: "upi",
                        },
                    ],
                },
            ],
        },

        ios: {
            supportsTablet: true,
            splash: {
                image: "./assets/images/logo_trans.png",
                resizeMode: "contain",
                backgroundColor: "#0e1e38",
                tabletImage: "./assets/images/logo_trans.png",
            },
            icon: "./assets/images/playstore-icon.png",
            bundleIdentifier: bundleIdentifier,
            googleServicesFile: "./GoogleService-Info.plist",
            buildNumber: "1",
            jsEngine: "hermes",
            config: {
                googleMapsApiKey: "AIzaSyAkuOcNddEvozQR4D4yPdTrbwXCiPsuEFc",
            },
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
                // Privacy usage descriptions - Required by Apple App Store
                NSPhotoLibraryUsageDescription: "This app needs access to your photo library so you can select and upload your profile picture, receipts, jewellery images, or documents for order verification and customer support. For example, you can upload a photo of a receipt to verify a purchase or share an image of jewellery for a support inquiry.",
                NSCameraUsageDescription: "This app needs access to your camera so you can take photos of receipts, jewellery, or documents for order verification, profile pictures, and customer support. For example, you can take a photo of your receipt to verify a transaction.",
                NSPhotoLibraryAddUsageDescription: "This app needs permission to save images to your photo library so you can keep copies of receipts, order confirmations, or jewellery images for your records.",
                NSFaceIDUsageDescription: "This app uses Face ID / Touch ID to securely authenticate you without entering your MPIN.",
                "NSAppTransportSecurity": {
                    "NSAllowsArbitraryLoads": true,
                    "NSAllowsArbitraryLoadsInWebContent": true,
                    "NSExceptionDomains": {
                        "smartgateway.hdfcuat.bank.in": {
                            "NSExceptionAllowsInsecureHTTPLoads": true,
                            "NSIncludesSubdomains": true
                        },
                        "hdfcbank.com": {
                            "NSExceptionAllowsInsecureHTTPLoads": true,
                            "NSIncludesSubdomains": true
                        },
                        "mastercard.com": {
                            "NSExceptionAllowsInsecureHTTPLoads": true,
                            "NSIncludesSubdomains": true
                        },
                        "visa.com": {
                            "NSExceptionAllowsInsecureHTTPLoads": true,
                            "NSIncludesSubdomains": true
                        },
                        "securecode.com": {
                            "NSExceptionAllowsInsecureHTTPLoads": true,
                            "NSIncludesSubdomains": true
                        }
                    }
                },
                LSApplicationQueriesSchemes: [
                    "phonepe",
                    "tez",
                    "paytm",
                    "bhim",
                    "upi",
                    "gpay"
                ]
            }
        },

        plugins: [
            "expo-font",
            "expo-asset",
            "expo-router",
            "expo-secure-store",
            "expo-localization",

            // ✔ MUST COME FIRST (SDK 54 requirement)
            [
                "expo-build-properties",
                {
                    android: {
                        compileSdkVersion: 36,
                        targetSdkVersion: 36,
                        enableProguardInReleaseBuilds: true,
                        enableShrinkResources: true,
                        // REMOVE ALL OLD MEDIA PERMISSIONS
                        blockedPermissions: [
                            "android.permission.READ_MEDIA_IMAGES",
                            "android.permission.READ_MEDIA_VIDEO",
                            "android.permission.READ_MEDIA_AUDIO",
                            "android.permission.READ_EXTERNAL_STORAGE",
                            "android.permission.WRITE_EXTERNAL_STORAGE",
                        ],
                    },
                },
            ],

            // ✔ SDK 54 uses Native Photo Picker (NO ANDROID PERMISSIONS NEEDED)
            [
                "expo-image-picker",
                {
                    photosPermission:
                        "Allow $(PRODUCT_NAME) to access photos for your profile picture.",
                    cameraPermission:
                        "Allow $(PRODUCT_NAME) to use the camera to take photos.",
                },
            ],

            [
                "expo-notifications",
                {
                    icon: "./assets/images/icon.png",
                    color: themeConfig.primaryColor,
                    sounds: ["./assets/sound/notification.wav"],
                },
            ],

            "expo-web-browser",
            "./plugins/withModularHeaders",
            "./plugins/withSmsRetriever",
            "./plugins/with-proguard.js",
            "./plugins/withAndroidQueries.js",
            "@react-native-firebase/app",
            "@react-native-firebase/crashlytics",
        ],

        extra: {
            eas: {
                projectId: projectId,
            },
        },

        assetBundlePatterns: ["**/*"],

        updates: {
            enabled: true,
            fallbackToCacheTimeout: 0,
        },

        newArchEnabled: true,
        owner,
    };
};
