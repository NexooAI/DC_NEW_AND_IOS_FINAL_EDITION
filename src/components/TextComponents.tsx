import React from "react";
import { View, StyleSheet } from "react-native";
import ResponsiveText from "./ResponsiveText";
import { responsiveFontSize, TEXT_STYLES } from "../utils/responsiveFontSize";

// Common text component patterns for different use cases

// Title component with proper truncation
export const TitleText: React.FC<{
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  color?: string;
  align?: "left" | "center" | "right";
  truncate?: boolean;
  style?: any;
}> = ({
  children,
  level = 1,
  color = "#1a237e",
  align = "left",
  truncate = false,
  style,
}) => {
  const getVariant = () => {
    switch (level) {
      case 1:
        return "title";
      case 2:
        return "subtitle";
      case 3:
        return "subtitle";
      case 4:
        return "body";
      case 5:
        return "body";
      case 6:
        return "caption";
      default:
        return "title";
    }
  };

  const getSize = () => {
    switch (level) {
      case 1:
        return "xxl";
      case 2:
        return "xl";
      case 3:
        return "lg";
      case 4:
        return "md";
      case 5:
        return "sm";
      case 6:
        return "xs";
      default:
        return "lg";
    }
  };

  return (
    <ResponsiveText
      variant={getVariant()}
      size={getSize()}
      weight="bold"
      color={color}
      align={align}
      truncateMode={truncate ? "double" : "none"}
      style={style}
    >
      {children}
    </ResponsiveText>
  );
};

// Body text component with proper wrapping
export const BodyText: React.FC<{
  children: React.ReactNode;
  size?: "small" | "medium" | "large";
  color?: string;
  align?: "left" | "center" | "right";
  style?: any;
}> = ({ children, size = "medium", color = "#333", align = "left", style }) => {
  const getSize = () => {
    switch (size) {
      case "small":
        return "sm";
      case "medium":
        return "md";
      case "large":
        return "lg";
      default:
        return "md";
    }
  };

  return (
    <ResponsiveText
      variant="body"
      size={getSize()}
      color={color}
      align={align}
      allowWrap={true}
      style={style}
    >
      {children}
    </ResponsiveText>
  );
};

// Button text component
export const ButtonText: React.FC<{
  children: React.ReactNode;
  size?: "small" | "medium" | "large";
  color?: string;
  style?: any;
}> = ({ children, size = "medium", color = "#fff", style }) => {
  const getSize = () => {
    switch (size) {
      case "small":
        return "sm";
      case "medium":
        return "md";
      case "large":
        return "lg";
      default:
        return "md";
    }
  };

  return (
    <ResponsiveText
      variant="button"
      size={getSize()}
      weight="bold"
      color={color}
      align="center"
      truncateMode="single"
      style={style}
    >
      {children}
    </ResponsiveText>
  );
};

// Caption text component
export const CaptionText: React.FC<{
  children: React.ReactNode;
  color?: string;
  align?: "left" | "center" | "right";
  truncate?: boolean;
  style?: any;
}> = ({
  children,
  color = "#666",
  align = "left",
  truncate = false,
  style,
}) => {
  return (
    <ResponsiveText
      variant="caption"
      size="sm"
      color={color}
      align={align}
      truncateMode={truncate ? "single" : "none"}
      style={style}
    >
      {children}
    </ResponsiveText>
  );
};

// Text in row layout component
export const RowText: React.FC<{
  children: React.ReactNode;
  variant?: "title" | "subtitle" | "body" | "caption" | "button" | "label";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  color?: string;
  align?: "left" | "center" | "right";
  truncate?: boolean;
  style?: any;
}> = ({
  children,
  variant = "body",
  size = "md",
  color = "#333",
  align = "left",
  truncate = false,
  style,
}) => {
  return (
    <ResponsiveText
      variant={variant}
      size={size}
      color={color}
      align={align}
      truncateMode={truncate ? "single" : "none"}
      inRow={true}
      style={style}
    >
      {children}
    </ResponsiveText>
  );
};

// Container for text in row layouts
export const RowTextContainer: React.FC<{
  children: React.ReactNode;
  style?: any;
}> = ({ children, style }) => {
  return <View style={[styles.rowContainer, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
});

export default {
  TitleText,
  BodyText,
  ButtonText,
  CaptionText,
  RowText,
  RowTextContainer,
};
