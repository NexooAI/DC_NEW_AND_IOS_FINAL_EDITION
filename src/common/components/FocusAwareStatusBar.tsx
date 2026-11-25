import React, { useCallback, useState } from "react";
import { Platform, StatusBar, StatusBarProps } from "react-native";
import { useFocusEffect } from "expo-router";

interface FocusAwareStatusBarProps extends StatusBarProps {
  backgroundColor?: string;
  barStyle?: "default" | "light-content" | "dark-content";
  translucent?: boolean;
}

/**
 * Renders StatusBar and applies imperative StatusBar updates only when the
 * enclosing screen/tab is focused, preventing background mounted tabs from
 * overwriting the active screen's StatusBar.
 */
export default function FocusAwareStatusBar({
  backgroundColor,
  barStyle = "dark-content",
  translucent = false,
  ...props
}: FocusAwareStatusBarProps) {
  const [isFocused, setIsFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      StatusBar.setBarStyle(barStyle);
      if (Platform.OS === "android") {
        if (backgroundColor) {
          StatusBar.setBackgroundColor(backgroundColor);
        }
        StatusBar.setTranslucent(translucent);
      }
      return () => {
        setIsFocused(false);
      };
    }, [barStyle, backgroundColor, translucent])
  );

  if (!isFocused) return null;

  return (
    <StatusBar
      barStyle={barStyle}
      backgroundColor={backgroundColor}
      translucent={translucent}
      {...props}
    />
  );
}
