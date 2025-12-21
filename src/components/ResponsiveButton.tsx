import React from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
} from "react-native";
import ResponsiveText from "./ResponsiveText";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { theme } from "@/constants/theme";

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

    switch (variant) {
      case "primary":
        return {
          backgroundColor: theme.colors.primary, // Golden color
          textColor: theme.colors.secondary,
        };
      case "secondary":
        return {
          backgroundColor: theme.colors.secondary,
          textColor: theme.colors.primary,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          textColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          textColor: theme.colors.primary,
        };
      case "success":
        return {
          backgroundColor: theme.colors.success,
          textColor: "#fff",
        };
      case "error":
        return {
          backgroundColor: theme.colors.error,
          textColor: "#fff",
        };
      case "warning":
        return {
          backgroundColor: theme.colors.warning,
          textColor: "#fff",
        };
      default:
        return {
          backgroundColor: "#FFD700", // Golden color
          textColor: "#1a2a39",
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
