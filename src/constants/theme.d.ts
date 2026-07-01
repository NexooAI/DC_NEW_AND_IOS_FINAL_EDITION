// Type definitions for theme.js

export interface ThemeColors {
    primary: string;
    secondary: string;
    quaternary: string;
    background: string;
    backgroundSecondary: string;
    textPrimary: string;
    textSecondary: string;
    support_container: string[];
    [key: string]: any;
}

export interface Theme {
    colors: ThemeColors;
    images: any;
    image: any;
    constants: {
        customerName: string;
        [key: string]: any;
    };
    youtubeUrl: string;
    baseUrl: string;
    [key: string]: any;
}

export declare const theme: Theme;
export declare const lightPalette: ThemeColors;
export declare const darkPalette: ThemeColors;
