import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { responsiveFontSize, TEXT_STYLES } from "../utils/responsiveFontSize";

interface ResponsiveTextProps extends TextProps {
  children: React.ReactNode;
  variant?: "title" | "subtitle" | "body" | "caption" | "button" | "label";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  weight?: "normal" | "medium" | "semibold" | "bold";
  color?: string;
  align?: "left" | "center" | "right";
  allowWrap?: boolean;
  maxLines?: number;
  truncateMode?: "none" | "single" | "double" | "triple";
  inRow?: boolean; // For text in flexDirection: "row" layouts
}

const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  variant = "body",
  size,
  weight = "normal",
  color,
  align = "left",
  allowWrap = true,
  maxLines,
  truncateMode = "none",
  inRow = false,
  style,
  ...props
}) => {
  const {
    getResponsiveFontSize,
    fontSize,
    isTinyScreen,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isTablet,
  } = useResponsiveLayout();

  // Get responsive font size based on variant and size
  const getFontSize = () => {
    if (size) {
      // Use predefined sizes if specified
      return fontSize[size];
    }

    // Use variant-based sizing with responsive font size utility
    switch (variant) {
      case "title":
        return responsiveFontSize(20, { minSize: 16, maxSize: 28 });
      case "subtitle":
        return responsiveFontSize(18, { minSize: 14, maxSize: 24 });
      case "body":
        return responsiveFontSize(16, { minSize: 12, maxSize: 20 });
      case "caption":
        return responsiveFontSize(14, { minSize: 10, maxSize: 18 });
      case "button":
        return responsiveFontSize(14, { minSize: 12, maxSize: 16 });
      case "label":
        return responsiveFontSize(14, { minSize: 12, maxSize: 18 });
      default:
        return responsiveFontSize(16, { minSize: 12, maxSize: 20 });
    }
  };

  // Get responsive line height
  const getLineHeight = () => {
    const baseFontSize = getFontSize();
    return baseFontSize * 1.4; // 1.4x line height for better readability
  };

  // Get responsive font weight
  const getFontWeight = ():
    | "normal"
    | "bold"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900" => {
    switch (weight) {
      case "normal":
        return "400";
      case "medium":
        return "500";
      case "semibold":
        return "600";
      case "bold":
        return "700";
      default:
        return "400";
    }
  };

  // Get responsive color
  const getTextColor = () => {
    if (color) return color;

    switch (variant) {
      case "title":
        return "#1a237e";
      case "subtitle":
        return "#333";
      case "body":
        return "#666";
      case "caption":
        return "#888";
      case "button":
        return "#fff";
      case "label":
        return "#555";
      default:
        return "#333";
    }
  };

  // Get truncation settings based on truncateMode
  const getTruncationSettings = () => {
    switch (truncateMode) {
      case "single":
        return { numberOfLines: 1, ellipsizeMode: "tail" as const };
      case "double":
        return { numberOfLines: 2, ellipsizeMode: "tail" as const };
      case "triple":
        return { numberOfLines: 3, ellipsizeMode: "tail" as const };
      case "none":
      default:
        if (allowWrap) {
          return maxLines ? { numberOfLines: maxLines } : {};
        } else {
          return { numberOfLines: maxLines || 1 };
        }
    }
  };

  // Get flex settings for row layouts
  const getFlexSettings = () => {
    if (inRow) {
      return {
        flexShrink: 1,
        flex: 0,
      };
    }
    return {};
  };

  const responsiveStyle = {
    fontSize: getFontSize(),
    lineHeight: getLineHeight(),
    fontWeight: getFontWeight(),
    color: getTextColor(),
    textAlign: align,
    ...getTruncationSettings(),
    ...getFlexSettings(),
  };

  return (
    <Text style={[responsiveStyle, style]} {...props}>
      {children}
    </Text>
  );
};

export default ResponsiveText;
