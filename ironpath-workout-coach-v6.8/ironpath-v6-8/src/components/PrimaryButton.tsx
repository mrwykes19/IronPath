import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

export const PrimaryButton = ({ title, onPress, disabled, secondary, style }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean; style?: ViewStyle }) => (
  <Pressable focusable={false} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.base, secondary ? styles.secondary : styles.primary, disabled && styles.disabled, pressed && !disabled && styles.pressed, style]}>
    <Text style={[styles.text, secondary && styles.secondaryText]}>{title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  base: { borderRadius: 15, minHeight: 52, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  primary: {
    backgroundColor: colors.accentStrong,
    borderWidth: 1,
    borderColor: colors.accent,
    shadowColor: colors.accentStrong,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5
  },
  secondary: { backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.42 },
  pressed: { transform: [{ scale: 0.986 }] },
  text: { color: colors.white, fontWeight: '900', fontSize: 14, letterSpacing: 0.15 },
  secondaryText: { color: colors.text }
});
