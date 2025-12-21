import React from "react";
import { Text, TextProps } from "react-native";

interface SafeTextProps extends TextProps {
  children: any;
  currentLanguage?: string;
}

/**
 * SafeText component that safely renders any value as text
 * Prevents "Objects are not valid as a React child" errors
 */
const SafeText: React.FC<SafeTextProps> = ({
  children,
  currentLanguage = "en",
  ...props
}) => {
  const getSafeText = (value: any): string => {
    if (!value) return "";

    // Handle strings
    if (typeof value === "string") return value;

    // Handle numbers
    if (typeof value === "number") return value.toString();

    // Handle objects with en/ta keys
    if (typeof value === "object" && value !== null) {
      if ("en" in value || "ta" in value) {
        return currentLanguage === "ta"
          ? value.ta || value.en || ""
          : value.en || value.ta || "";
      }

      // Handle arrays
      if (Array.isArray(value)) {
        return value.join(", ");
      }

      // Handle other objects - convert to string safely
      try {
        return JSON.stringify(value);
      } catch {
        return "[Object]";
      }
    }

    // Fallback for any other type
    return String(value);
  };

  return <Text {...props}>{getSafeText(children)}</Text>;
};

export default SafeText;
