// Mocks for Global Native Modules

import 'react-native-gesture-handler/jestSetup';
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

// Mock SafeAreaContext
jest.mock('react-native-safe-area-context', () => ({
    ...mockSafeAreaContext,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }) => children,
}));

// Mock Expo Modules Core
jest.mock('expo-modules-core', () => ({
    EventEmitter: jest.fn(() => ({
        addListener: jest.fn(),
        removeSubscription: jest.fn(),
    })),
    NativeModulesProxy: {},
    ProxyNativeModule: {},
    requireOptionalNativeModule: jest.fn(),
    requireNativeModule: jest.fn(),
    createPermissionHook: jest.fn(() => ({ status: 'granted', canAskAgain: true, granted: true, expires: 'never' })),
    requireNativeViewManager: jest.fn(),
}));

// Mock Expo Asset
jest.mock('expo-asset', () => ({
    Asset: {
        loadAsync: jest.fn(),
        fromModule: jest.fn(() => ({ uri: 'test-uri', localUri: 'test-local-uri', downloadAsync: jest.fn() })),
    },
    useAssets: jest.fn(() => [[], undefined]),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
    addEventListener: jest.fn(),
    fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock Expo Router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    useLocalSearchParams: jest.fn(() => ({})),
    useFocusEffect: jest.fn((callback) => callback()),
    usePathname: jest.fn(() => ''),
}));

// Mock React Navigation (Single, correct mock)
jest.mock('@react-navigation/native', () => {
    return {
        useNavigation: () => ({
            navigate: jest.fn(),
            goBack: jest.fn(),
            addListener: jest.fn(() => jest.fn()),
            setOptions: jest.fn(),
            isFocused: jest.fn(() => true),
            dispatch: jest.fn(),
        }),
        useFocusEffect: jest.fn((callback) => callback()),
        useIsFocused: jest.fn(() => true),
        NavigationContainer: ({ children }) => children,
    };
});

// Mock Expo Font
jest.mock('expo-font', () => ({
    isLoaded: jest.fn(() => true),
    loadAsync: jest.fn(() => Promise.resolve()),
}));

// Mock Vector Icons
jest.mock('@expo/vector-icons', () => {
    const { View } = require('react-native');
    return {
        Ionicons: View,
        MaterialCommunityIcons: View,
        Feather: View,
        FontAwesome: View,
        MaterialIcons: View, // Specifically added for MenuNavigation
    };
});

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => { };
    return Reanimated;
});

// Mock Global Store (Zustand)
jest.mock('@/store/global.store', () => {
    return {
        __esModule: true,
        default: jest.fn(() => ({
            user: { id: 'test-user-id', name: 'Test User' },
            isLoggedIn: true,
            login: jest.fn(),
            logout: jest.fn(),
        })),
    };
});

// Mock API Service
jest.mock('@/services/api', () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
}));

// Mock WebView
jest.mock('react-native-webview', () => {
    const { View } = require('react-native');
    return {
        WebView: View,
        default: View,
    };
});

// Mock YouTube Iframe
jest.mock('react-native-youtube-iframe', () => {
    const { View } = require('react-native');
    const React = require('react');
    const YoutubePlayer = React.forwardRef((props, ref) => {
        return React.createElement(View, props);
    });
    return {
        __esModule: true,
        default: YoutubePlayer,
    };
});

// Mock Linear Gradient
jest.mock('expo-linear-gradient', () => ({
    LinearGradient: require('react-native').View,
}));

// Mock Expo Localization
jest.mock('expo-localization', () => ({
    getLocales: () => [{ languageCode: 'en' }],
    locale: 'en-US',
    locales: [{ languageCode: 'en' }],
}));

// Mock Expo Notifications
jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    removeNotificationSubscription: jest.fn(),
}));

// Mock Logger
jest.mock('@/utils/logger', () => ({
    logger: {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
    }
}));

// Mock Language Hooks & Context
jest.mock('@/hooks/useTranslation', () => ({
    useTranslation: () => ({ t: (key) => key, locale: 'en' }),
}));

jest.mock('@/contexts/LanguageContext', () => ({
    useLanguage: () => ({ isLoading: false, language: 'en', setLanguage: jest.fn() }),
}));

// Mock useOtpAutoFetch
jest.mock('@/hooks/useOtpAutoFetch', () => ({
    useOtpAutoFetch: jest.fn(),
}));

// Mock Expo File System
jest.mock('expo-file-system/legacy', () => ({
    documentDirectory: 'test-directory/',
    writeAsStringAsync: jest.fn(),
    readAsStringAsync: jest.fn(),
    deleteAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
    documentDirectory: 'test-directory/',
    writeAsStringAsync: jest.fn(),
    readAsStringAsync: jest.fn(),
    deleteAsync: jest.fn(),
}));

// Mock Expo Blur (Override)
jest.mock('expo-blur', () => ({
    BlurView: require('react-native').View,
}));

// Mock Expo Image Picker
jest.mock('expo-image-picker', () => ({
    launchImageLibraryAsync: jest.fn(),
    launchCameraAsync: jest.fn(),
    requestMediaLibraryPermissionsAsync: jest.fn(),
    requestCameraPermissionsAsync: jest.fn(),
}));
