import React from 'react';
import { KeyboardAvoidingView, Platform, ViewStyle } from 'react-native';

interface KeyboardAwareWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  behavior?: 'height' | 'position' | 'padding';
  keyboardVerticalOffset?: number;
}

export const KeyboardAwareWrapper: React.FC<KeyboardAwareWrapperProps> = ({
  children,
  style,
  behavior = Platform.OS === 'ios' ? 'padding' : 'height',
  keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 0,
}) => {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}; 