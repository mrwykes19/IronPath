import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const ringTrackColor = '#162236';

export const BrandMark = ({ compact = false }: { compact?: boolean }) => (
  <View style={[styles.brandMark, compact && styles.brandMarkCompact]}>
    <Text style={[styles.brandMarkText, compact && styles.brandMarkTextCompact]}>IP</Text>
  </View>
);

export const ProgressRing = ({ value, label, progress = 0, detail }: { value: string; label: string; progress?: number; detail?: string }) => {
  const clamped = Math.max(0, Math.min(100, progress));
  const segmentStyle = {
    borderTopColor: clamped > 0 ? colors.accent : ringTrackColor,
    borderRightColor: clamped >= 25 ? colors.accent : ringTrackColor,
    borderBottomColor: clamped >= 50 ? colors.accent : ringTrackColor,
    borderLeftColor: clamped >= 75 ? colors.accent : ringTrackColor
  };

  return (
    <View style={styles.ringWrap}>
      <View style={styles.ringTrack}>
        <View style={[styles.ringAccent, segmentStyle]} />
        <View style={styles.ringGlow} />
        <Text style={styles.ringValue} numberOfLines={1}>{value}</Text>
        <Text style={styles.ringLabel} numberOfLines={1}>{label}</Text>
        {detail ? <Text style={styles.ringDetail} numberOfLines={1}>{detail}</Text> : null}
      </View>
    </View>
  );
};

export const MiniSparkline = ({ values, height = 54 }: { values: number[]; height?: number }) => {
  const usable = values.length > 1 ? values : [0, values[0] ?? 0];
  const min = Math.min(...usable);
  const max = Math.max(...usable);
  const range = max - min || 1;
  const width = 150;
  const points = usable.map((value, index) => ({
    x: (index / (usable.length - 1)) * width,
    y: height - 8 - ((value - min) / range) * (height - 18)
  }));

  return (
    <View style={[styles.sparkline, { height, width }]}>
      <View style={styles.sparkGrid} />
      {points.slice(0, -1).map((point, index) => {
        const next = points[index + 1]!;
        const dx = next.x - point.x;
        const dy = next.y - point.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View
            key={`${point.x}-${point.y}`}
            style={[
              styles.sparkSegment,
              {
                width: length,
                left: point.x,
                top: point.y,
                transform: [{ rotateZ: `${angle}deg` }]
              }
            ]}
          />
        );
      })}
      {points.map((point, index) => <View key={`dot-${index}`} style={[styles.sparkDot, { left: point.x - 3, top: point.y - 3 }]} />)}
    </View>
  );
};

const styles = StyleSheet.create({
  brandMark: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentStrong,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }
  },
  brandMarkCompact: { width: 48, height: 48, borderRadius: 15 },
  brandMarkText: { color: colors.accent, fontSize: 23, fontWeight: '900', fontStyle: 'italic', letterSpacing: -2 },
  brandMarkTextCompact: { fontSize: 18 },
  ringWrap: { flex: 1, alignItems: 'center', minWidth: 0 },
  ringTrack: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    borderColor: ringTrackColor,
    backgroundColor: '#070C13',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  ringAccent: {
    position: 'absolute',
    left: -1,
    right: -1,
    top: -1,
    bottom: -1,
    borderRadius: 40,
    borderWidth: 5,
    transform: [{ rotateZ: '-45deg' }]
  },
  ringGlow: {
    position: 'absolute',
    left: 9,
    right: 9,
    top: 9,
    bottom: 9,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#16243A'
  },
  ringValue: { color: colors.text, fontSize: 15, fontWeight: '900', maxWidth: 64 },
  ringLabel: { color: colors.muted, fontSize: 7.5, marginTop: 2, maxWidth: 62, textAlign: 'center' },
  ringDetail: { color: colors.accent, fontSize: 7, marginTop: 1, maxWidth: 62 },
  sparkline: { position: 'relative', overflow: 'hidden' },
  sparkGrid: { position: 'absolute', left: 0, right: 0, top: '50%', borderTopWidth: 1, borderTopColor: '#16243A' },
  sparkSegment: { position: 'absolute', height: 2, borderRadius: 2, backgroundColor: colors.accent, transformOrigin: 'left center' as any },
  sparkDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, borderWidth: 1, borderColor: '#DCEBFF' }
});
