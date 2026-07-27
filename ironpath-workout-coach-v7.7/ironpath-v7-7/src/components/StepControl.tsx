import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export const StepControl = ({ value, onChange, step = 1, min = 0, max = 999, suffix = '', compact = false }: { value: number; onChange: (value: number) => void; step?: number; min?: number; max?: number; suffix?: string; compact?: boolean }) => (
  <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
    <Pressable style={[styles.button, compact && styles.buttonCompact]} onPress={() => onChange(Math.max(min, value - step))}><Text style={[styles.symbol, compact && styles.symbolCompact]}>−</Text></Pressable>
    <Text style={[styles.value, compact && styles.valueCompact]}>{value}{suffix}</Text>
    <Pressable style={[styles.button, compact && styles.buttonCompact]} onPress={() => onChange(Math.min(max, value + step))}><Text style={[styles.symbol, compact && styles.symbolCompact]}>+</Text></Pressable>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.panelSoft
  },
  wrapperCompact: { borderRadius: 12 },
  button: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelRaised },
  buttonCompact: { width: 32, height: 34 },
  symbol: { color: colors.text, fontSize: 21, fontWeight: '700' },
  symbolCompact: { fontSize: 18 },
  value: { minWidth: 52, textAlign: 'center', color: colors.text, fontWeight: '800', paddingHorizontal: 6 },
  valueCompact: { minWidth: 40, fontSize: 13, paddingHorizontal: 4 }
});
