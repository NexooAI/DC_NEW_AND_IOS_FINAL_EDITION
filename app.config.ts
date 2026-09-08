import { ExpoConfig, ConfigContext } from 'expo/config';
import { themeConfig } from './src/constants/theme.config';

export default ({ config }: ConfigContext): ExpoConfig => {
    const isIos = process.env.EAS_BUILD_PLATFORM === 'ios' || process.env.PLATFORM === 'ios';

    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyAkuOcNddEvozQR4D4yPdTrbwXCiPsuEFc";
    const bundleIdentifier = themeConfig.bundleIdentifier || "com.nexooai.srithangathamarai";
    const projectId = themeConfig.projectId || "912daab2-d11c-42ff-9072-62ddfb4489c0";
    const owner = themeConfig.owner || "mnvgroups07";
    const version = isIos ? ((themeConfig as any).iosVersion || "1.0.0") : ((themeConfig as any).androidVersion || "1.0.0");

    return {
        ...config,
        name: themeConfig.customerName,
        slug: themeConfig.slug,
        version: version,
        orientation: "portrait",
        userInterfaceStyle: "automatic",
        scheme: "acme",
        jsEngine: "hermes",

        icon: themeConfig.icon || "./assets/images/icon.png",

        splash: {
            image: themeConfig.splashLogo || "./assets/images/splashscreen_logo.png",
            resizeMode: "contain",
            backgroundColor: (themeConfig as any).splashBackgroundColor || themeConfig.primaryColor,
        },

        androidStatusBar: {
            backgroundColor: themeConfig.primaryColor,
            barStyle: "light-content",
            translucent: false,
        },

        android: {
            package: bundleIdentifier,
            googleServicesFile: "./google-services.json",
            versionCode: (themeConfig as any).versionCode || 1,
            adaptiveIcon: {
                foregroundImage: themeConfig.adaptiveIcon || "./assets/images/adaptive-icon.png",
                backgroundColor: (themeConfig as any).adaptiveIconBackgroundColor || themeConfig.primaryColor,
            },
            splash: {
                image: themeConfig.splashLogo || "./assets/images/splashscreen_logo.png",
                resizeMode: "contain",
                backgroundColor: (themeConfig as any).splashBackgroundColor || themeConfig.primaryColor,
            },

            // ✔ Google Maps API
            config: {
                googleMaps: {
                    apiKey: mapsApiKey,
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
                image: themeConfig.splashLogo || "./assets/images/splashscreen_logo.png",
                resizeMode: "contain",
                backgroundColor: (themeConfig as any).splashBackgroundColor || themeConfig.primaryColor,
                tabletImage: themeConfig.splashLogo || "./assets/images/splashscreen_logo.png",
            },
            icon: themeConfig.icon || "./assets/images/icon.png",
            bundleIdentifier: bundleIdentifier,
            googleServicesFile: "./GoogleService-Info.plist",
            buildNumber: (themeConfig as any).buildNumber || "1",
            jsEngine: "hermes",
            config: {
                googleMapsApiKey: mapsApiKey,
            },
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
                NSPhotoLibraryUsageDescription: "This app needs access to your photo library so you can select and upload your profile picture, receipts, jewellery images, or documents for order verification and customer support.",
                NSCameraUsageDescription: "This app needs access to your camera so you can take photos of receipts, jewellery, or documents for order verification, profile pictures, and customer support.",
                NSPhotoLibraryAddUsageDescription: "This app needs permission to save images to your photo library so you can keep copies of receipts, order confirmations, or jewellery images for your records.",
                NSFaceIDUsageDescription: "This app uses Face ID / Touch ID to securely authenticate you without entering your MPIN.",
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

            [
                "expo-build-properties",
                {
                    android: {
                        compileSdkVersion: 36,
                        targetSdkVersion: 36,
                        enableProguardInReleaseBuilds: true,
                        enableShrinkResources: true,
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
            url: `https://u.expo.dev/${projectId}`,
            enabled: true,
            fallbackToCacheTimeout: 0,
        },

        runtimeVersion: {
            policy: "appVersion",
        },

        newArchEnabled: true,
        owner,
    };
};
