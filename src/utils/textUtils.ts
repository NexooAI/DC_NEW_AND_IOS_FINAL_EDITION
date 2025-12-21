/**
 * Utility functions for handling multilingual text objects
 */

/**
 * Safely extracts text from multilingual objects or returns the text as-is
 * @param textObj - Can be a string or multilingual object with en/ta keys
 * @param currentLanguage - Current language preference ('en' or 'ta')
 * @returns Safe string for rendering
 */
export const getSafeText = (
    textObj: any,
    currentLanguage: string = 'en'
): string => {
    // Handle null/undefined
    if (!textObj) return '';

    // Handle strings
    if (typeof textObj === 'string') return textObj;

    // Handle numbers
    if (typeof textObj === 'number') return textObj.toString();

    // Handle objects with en/ta keys
    if (typeof textObj === 'object' && textObj !== null) {
        // Check if it's a multilingual object
        if ('en' in textObj || 'ta' in textObj) {
            return currentLanguage === 'ta'
                ? (textObj.ta || textObj.en || '')
                : (textObj.en || textObj.ta || '');
        }

        // Handle arrays
        if (Array.isArray(textObj)) {
            return textObj.join(', ');
        }

        // Handle other objects - convert to string safely
        try {
            return JSON.stringify(textObj);
        } catch {
            return '[Object]';
        }
    }

    // Fallback for any other type
    return String(textObj);
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
    return getSafeText(value, currentLanguage);
};

/**
 * Hook to get safe text with current language
 * @param value - Any value to convert to safe text
 * @returns Safe string for rendering
 */
export const useSafeText = (value: any): string => {
    // This would need to be used with a context or hook that provides current language
    // For now, default to English
    return getSafeText(value, 'en');
};
