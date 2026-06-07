import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  const bgColor = isPrimary ? colors.accent :
    isOutline ? 'transparent' :
    isGhost ? 'transparent' :
    colors.backgroundSecondary;

  const txtColor = isPrimary ? colors.textInverse :
    isOutline ? colors.accent :
    isGhost ? colors.textSecondary :
    colors.textPrimary;

  const borderStyle = isOutline ? {
    borderWidth: 1.5,
    borderColor: colors.accent,
  } : {};

  const paddingV = size === 'sm' ? 10 : size === 'lg' ? 16 : 14;
  const paddingH = size === 'sm' ? 16 : size === 'lg' ? 32 : 24;
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 17 : 16;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor, paddingVertical: paddingV, paddingHorizontal: paddingH },
        isPrimary && shadows.button,
        borderStyle,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={txtColor} size="small" />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon} </Text>}
          <Text style={[styles.text, { color: txtColor, fontSize }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
  icon: {
    fontSize: 16,
  },
});
