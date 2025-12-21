/**
 * Global text safety utilities to prevent "Objects are not valid as a React child" errors
 */

/**
 * Safely converts any value to a string for rendering
 */
import React from 'react';

/**
 * Safely converts any value to a string for rendering
 * @param value - Any value to convert to string
 * @param currentLanguage - Current language preference ('en' or 'ta')
 * @returns Safe string for rendering
 */
export const safeText = (value: any, currentLanguage: string = 'en'): string => {
    if (!value) return '';

    // Handle strings
    if (typeof value === 'string') return value;

    // Handle numbers
    if (typeof value === 'number') return value.toString();

    // Handle objects with en/ta keys
    if (typeof value === 'object' && value !== null) {
        if ('en' in value || 'ta' in value) {
            return currentLanguage === 'ta'
                ? (value.ta || value.en || '')
                : (value.en || value.ta || '');
        }

        // Handle arrays
        if (Array.isArray(value)) {
            return value.join(', ');
        }

        // Handle other objects - convert to string safely
        try {
            return JSON.stringify(value);
        } catch {
            return '[Object]';
        }
    }

    // Fallback for any other type
    return String(value);
};

/**
 * Safely renders any value as text in JSX
 * @param value - Any value to render
 * @param currentLanguage - Current language preference
 * @returns Safe string for JSX rendering
 */
export const SafeText = ({
    value,
    currentLanguage = 'en'
}: {
    value: any;
    currentLanguage?: string;
}) => {
    return safeText(value, currentLanguage);
};

/**
 * Higher-order component that wraps any component to safely render text
 * @param Component - React component to wrap
 * @returns Wrapped component with safe text rendering
 */
export function withSafeText<P extends object>(Component: React.ComponentType<P>) {
    return (props: P & { children?: any; currentLanguage?: string }) => {
        const { children, currentLanguage, ...restProps } = props;

        if (children !== undefined) {
            return <Component {...(restProps as P)}>{safeText(children, currentLanguage)}</Component>;
        }

        return <Component {...(restProps as P)} />;
    };
}
