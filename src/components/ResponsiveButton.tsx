import { useAppTheme } from "@/store/global.store";
import React from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
} from "react-native";
import ResponsiveText from "./ResponsiveText";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

interface ResponsiveButtonProps extends TouchableOpacityProps {
  title: string;
  variant?:
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "success"
  | "error"
  | "warning";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
}

const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  title,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  textColor,
  backgroundColor,
  borderColor,
  style,
  ...props
}) => {
  const theme = useAppTheme();
  const {
    getResponsivePadding,
    getResponsiveFontSize,
    deviceScale,
    isTinyScreen,
    isSmallScreen,
    isTablet,
  } = useResponsiveLayout();

  // Get button colors based on variant
  const getButtonColors = () => {
    if (backgroundColor && textColor) {
      return { backgroundColor, textColor };
    }

    const buttonTheme = theme.button;

    switch (variant) {
      case "primary":
        return {
          backgroundColor: buttonTheme.primary.background,
          textColor: buttonTheme.primary.text,
        };
      case "secondary":
        return {
          backgroundColor: buttonTheme.secondary.background,
          textColor: buttonTheme.secondary.text,
        };
      case "outline":
        return {
          backgroundColor: buttonTheme.outline.background,
          textColor: buttonTheme.outline.text,
          borderColor: buttonTheme.outline.border,
        };
      case "ghost":
        return {
          backgroundColor: buttonTheme.ghost.background,
          textColor: buttonTheme.ghost.text,
        };
      case "success":
        return {
          backgroundColor: buttonTheme.success.background,
          textColor: buttonTheme.success.text,
        };
      case "error":
        return {
          backgroundColor: buttonTheme.error.background,
          textColor: buttonTheme.error.text,
        };
      case "warning":
        return {
          backgroundColor: buttonTheme.warning.background,
          textColor: buttonTheme.warning.text,
        };
      default:
        return {
          backgroundColor: buttonTheme.secondary.background,
          textColor: buttonTheme.secondary.text,
        };
    }
  };

  // Get button size styles - Balanced for better control
  const getSizeStyles = () => {
    const basePadding = {
      sm: { vertical: 8, horizontal: 12 },
      md: { vertical: 10, horizontal: 16 },
      lg: { vertical: 12, horizontal: 20 },
    };

    const padding = basePadding[size];

    return {
      paddingVertical: getResponsivePadding(
        padding.vertical - 2,
        padding.vertical,
        padding.vertical + 2
      ),
      paddingHorizontal: getResponsivePadding(
        padding.horizontal - 2,
        padding.horizontal,
        padding.horizontal + 2
      ),
      minHeight: deviceScale(size === "sm" ? 36 : size === "md" ? 42 : 48),
      borderRadius: deviceScale(size === "sm" ? 8 : size === "md" ? 10 : 12),
    };
  };

  const colors = getButtonColors();
  const sizeStyles = getSizeStyles();

  const buttonStyle: ViewStyle = {
    ...sizeStyles,
    backgroundColor: colors.backgroundColor,
    borderWidth: variant === "outline" ? 1 : 0,
    borderColor: borderColor || colors.borderColor || colors.backgroundColor,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    ...(fullWidth ? { width: "100%" } : {}),
    ...(disabled ? { opacity: 0.6 } : {}),
    ...(loading ? { opacity: 0.8 } : {}),
  };

  // Use larger text sizes for buttons to ensure readability
  const textSize = size === "sm" ? "md" : size === "md" ? "lg" : "xl";

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      <ResponsiveText
        variant="button"
        size={textSize}
        weight="bold"
        color={textColor || colors.textColor}
        align="center"
        allowWrap={true}
        maxLines={2}
        truncateMode="double"
        style={{
          fontSize: textSize === "md" ? 12 : textSize === "lg" ? 14 : 16,
          textAlign: "center",
          flexShrink: 1,
        }}
      >
        {loading ? "Loading..." : title}
      </ResponsiveText>
    </TouchableOpacity>
  );
};

export default ResponsiveButton;
