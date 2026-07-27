import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export const Metric = ({ label, value, detail }: { label: string; value: string; detail?: string }) => (
  <View style={styles.metric}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
    {detail ? <Text style={styles.detail}>{detail}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  metric: { flex: 1, minWidth: 110, gap: 3 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { color: colors.text, fontSize: 23, fontWeight: '800' },
  detail: { color: colors.muted, fontSize: 12 }
});
