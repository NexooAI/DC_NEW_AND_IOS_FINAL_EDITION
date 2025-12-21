// Type definitions for theme.js

export interface ThemeColors {
    primary: string;
    secondary: string;
    background: string;
    backgroundSecondary: string;
    textPrimary: string;
    textSecondary: string;
    [key: string]: any;
}

export interface Theme {
    colors: ThemeColors;
    images: any;
    constants: {
        customerName: string;
        [key: string]: any;
    };
    [key: string]: any;
}

export declare const theme: Theme;
