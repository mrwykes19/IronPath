import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export const TrendBars = ({ values, labels }: { values: number[]; labels?: string[] }) => {
  const [width, setWidth] = useState(320);
  const height = 122;
  const usable = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
  const min = Math.min(...usable);
  const max = Math.max(...usable);
  const range = max - min || 1;
  const plotWidth = Math.max(80, width - 12);
  const points = useMemo(() => usable.map((value, index) => ({
    x: 6 + (index / (usable.length - 1)) * (plotWidth - 12),
    y: 12 + (1 - (value - min) / range) * 74
  })), [usable.join('|'), min, range, plotWidth]);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      <View style={[styles.plot, { height }]}> 
        <View style={[styles.gridLine, { top: 24 }]} />
        <View style={[styles.gridLine, { top: 52 }]} />
        <View style={[styles.gridLine, { top: 80 }]} />
        {points.slice(0, -1).map((point, index) => {
          const next = points[index + 1]!;
          const dx = next.x - point.x;
          const dy = next.y - point.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={`segment-${index}`}
              style={[
                styles.segment,
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
        {points.map((point, index) => <View key={`dot-${index}`} style={[styles.dot, { left: point.x - 3, top: point.y - 3 }]} />)}
        <View style={styles.labelRow}>
          {usable.map((_, index) => <Text numberOfLines={1} key={`label-${index}`} style={styles.label}>{labels?.[index] ?? ''}</Text>)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  plot: { width: '100%', position: 'relative', overflow: 'hidden' },
  gridLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderTopColor: '#16243A' },
  segment: { position: 'absolute', height: 2, borderRadius: 2, backgroundColor: colors.accent, transformOrigin: 'left center' as any },
  dot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, borderWidth: 1, borderColor: '#DCEBFF' },
  labelRow: { position: 'absolute', left: 0, right: 0, bottom: 2, flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.mutedSoft, fontSize: 8, flex: 1, textAlign: 'center' }
});
