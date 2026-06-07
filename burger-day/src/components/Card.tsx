import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'warm' | 'outlined';
  padding?: keyof typeof spacing | number;
}

export default function Card({
  children,
  style,
  variant = 'default',
  padding = 'lg',
}: CardProps) {
  const bgColor =
    variant === 'warm' ? colors.cardWarm :
    variant === 'outlined' ? 'transparent' :
    colors.card;

  const borderStyle = variant === 'outlined' ? {
    borderWidth: 1.5,
    borderColor: colors.border,
  } : {};

  const pad = typeof padding === 'number' ? padding : spacing[padding];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bgColor, padding: pad },
        variant !== 'outlined' && shadows.card,
        borderStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
  },
});
