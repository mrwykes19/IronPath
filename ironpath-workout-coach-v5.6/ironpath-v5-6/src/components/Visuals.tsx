import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { CardioDevice } from '../types';

const ringTrackColor = '#162236';

export const BrandMark = ({ compact = false, large = false }: { compact?: boolean; large?: boolean }) => (
  <View style={[styles.brandMark, compact && styles.brandMarkCompact, large && styles.brandMarkLarge]}>
    <Image source={require('../../assets/ironpath-icon.png')} resizeMode="cover" style={[styles.brandImage, compact && styles.brandImageCompact, large && styles.brandImageLarge]} />
  </View>
);

const Line = ({ width, rotate = '0deg', top, left }: { width: number; rotate?: string; top: number; left: number }) => (
  <View style={[styles.line, { width, top, left, transform: [{ rotateZ: rotate }] }]} />
);

export const ActivityGraphic = ({ device, active = false, size = 38 }: { device: CardioDevice; active?: boolean; size?: number }) => {
  const scale = size / 38;
  const graphic = device === 'bike' ? (
    <>
      <View style={[styles.wheel, { left: 2, bottom: 1 }]} /><View style={[styles.wheel, { right: 2, bottom: 1 }]} />
      <Line width={18} rotate="-18deg" top={17} left={10} /><Line width={14} rotate="42deg" top={13} left={12} /><Line width={11} rotate="-52deg" top={13} left={19} />
      <View style={[styles.head, { top: 3, left: 20 }]} />
    </>
  ) : device === 'rower' ? (
    <><Line width={31} top={24} left={3} /><View style={[styles.seat, { top: 18, left: 12 }]} /><View style={[styles.head, { top: 7, left: 15 }]} /><Line width={15} rotate="18deg" top={12} left={17} /><Line width={12} rotate="-34deg" top={16} left={6} /></>
  ) : device === 'stair-climber' ? (
    <><View style={[styles.step, { width: 9, left: 2, bottom: 2 }]} /><View style={[styles.step, { width: 9, left: 11, bottom: 7 }]} /><View style={[styles.step, { width: 9, left: 20, bottom: 12 }]} /><View style={[styles.head, { top: 3, left: 24 }]} /><Line width={14} rotate="58deg" top={10} left={17} /></>
  ) : device === 'elliptical' ? (
    <><View style={[styles.ellipse, { left: 5, top: 14 }]} /><View style={[styles.head, { top: 3, left: 19 }]} /><Line width={18} rotate="66deg" top={10} left={15} /><Line width={13} rotate="-62deg" top={14} left={8} /><Line width={18} rotate="88deg" top={7} left={25} /></>
  ) : (
    <><Line width={31} top={26} left={3} /><Line width={15} rotate="90deg" top={11} left={27} /><View style={[styles.head, { top: 3, left: 17 }]} /><Line width={15} rotate={device === 'treadmill-run' ? '58deg' : '72deg'} top={10} left={13} /><Line width={13} rotate={device === 'treadmill-run' ? '-48deg' : '-68deg'} top={17} left={9} /><Line width={12} rotate={device === 'treadmill-run' ? '30deg' : '10deg'} top={17} left={20} /></>
  );
  return <View style={[styles.activityWrap, active && styles.activityWrapActive, { width: size, height: size, transform: [{ scale }] }]}>{graphic}</View>;
};

export const PhaseGraphic = ({ phase, active = false }: { phase: number; active?: boolean }) => (
  <View style={[styles.phaseGraphic, active && styles.phaseGraphicActive]}>
    {phase === 1 ? <View style={styles.phaseBars}><View style={[styles.phaseBar, { height: 9 }]} /><View style={[styles.phaseBar, { height: 16 }]} /><View style={[styles.phaseBar, { height: 23 }]} /></View> : null}
    {phase === 2 ? <View style={styles.miniDumbbell}><View style={styles.miniPlate} /><View style={styles.miniBar} /><View style={styles.miniPlate} /></View> : null}
    {phase === 3 ? <View style={styles.trendGraphic}><Line width={11} rotate="-8deg" top={18} left={2} /><Line width={13} rotate="-38deg" top={13} left={11} /><View style={styles.trendDot} /></View> : null}
    {phase === 4 ? <View style={styles.peakGraphic}><View style={styles.peakLeft} /><View style={styles.peakRight} /><View style={styles.peakDot} /></View> : null}
  </View>
);

export const AchievementGraphic = ({ kind, unlocked = true }: { kind: string; unlocked?: boolean }) => (
  <View style={[styles.achievement, !unlocked && styles.achievementLocked]}>
    <Text style={styles.achievementText}>{kind === 'pr' ? 'PR' : kind === 'streak' ? '🔥' : kind === 'workouts' ? '100' : '↓'}</Text>
  </View>
);

export const EmptyStateGraphic = ({ kind = 'workout' }: { kind?: 'workout' | 'history' | 'weight' | 'records' }) => (
  <View style={styles.emptyGraphic}>
    {kind === 'weight' ? <><View style={styles.scaleBody}><View style={styles.scaleDial} /></View></> : kind === 'history' ? <><View style={styles.calendarBody}><View style={styles.calendarTop} /><View style={styles.calendarDot} /></View></> : kind === 'records' ? <AchievementGraphic kind="pr" unlocked={false} /> : <View style={styles.bigDumbbell}><View style={styles.bigPlate} /><View style={styles.bigBar} /><View style={styles.bigPlate} /></View>}
  </View>
);

export const ProgressRing = ({ value, label, progress = 0, detail }: { value: string; label: string; progress?: number; detail?: string }) => {
  const clamped = Math.max(0, Math.min(100, progress));
  const segmentStyle = { borderTopColor: clamped > 0 ? colors.accent : ringTrackColor, borderRightColor: clamped >= 25 ? colors.accent : ringTrackColor, borderBottomColor: clamped >= 50 ? colors.accent : ringTrackColor, borderLeftColor: clamped >= 75 ? colors.accent : ringTrackColor };
  return <View style={styles.ringWrap}><View style={styles.ringTrack}><View style={[styles.ringAccent, segmentStyle]} /><View style={styles.ringGlow} /><Text style={styles.ringValue}>{value}</Text><Text style={styles.ringLabel}>{label}</Text>{detail ? <Text style={styles.ringDetail}>{detail}</Text> : null}</View></View>;
};

export const MiniSparkline = ({ values, height = 54 }: { values: number[]; height?: number }) => {
  const usable = values.length > 1 ? values : [0, values[0] ?? 0]; const min = Math.min(...usable); const max = Math.max(...usable); const range = max - min || 1; const width = 150;
  const points = usable.map((value, index) => ({ x: (index / (usable.length - 1)) * width, y: height - 8 - ((value - min) / range) * (height - 18) }));
  return <View style={[styles.sparkline, { height, width }]}><View style={styles.sparkGrid} />{points.slice(0, -1).map((point, index) => { const next = points[index + 1]!; const dx = next.x - point.x; const dy = next.y - point.y; const length = Math.sqrt(dx * dx + dy * dy); const angle = Math.atan2(dy, dx) * (180 / Math.PI); return <View key={`${point.x}-${point.y}`} style={[styles.sparkSegment, { width: length, left: point.x, top: point.y, transform: [{ rotateZ: `${angle}deg` }] }]} />; })}{points.map((point, index) => <View key={`dot-${index}`} style={[styles.sparkDot, { left: point.x - 3, top: point.y - 3 }]} />)}</View>;
};

const styles = StyleSheet.create({
  brandMark: { width: 58, height: 58, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: '#02050A', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  brandMarkCompact: { width: 48, height: 48, borderRadius: 15 }, brandMarkLarge: { width: 88, height: 88, borderRadius: 24 },
  brandImage: { width: 58, height: 58 }, brandImageCompact: { width: 48, height: 48 }, brandImageLarge: { width: 88, height: 88 },
  activityWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' }, activityWrapActive: { opacity: 1 },
  line: { position: 'absolute', height: 2, borderRadius: 2, backgroundColor: colors.accent }, head: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  wheel: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.accent }, seat: { position: 'absolute', width: 9, height: 3, borderRadius: 2, backgroundColor: colors.accent },
  ellipse: { position: 'absolute', width: 25, height: 11, borderRadius: 10, borderWidth: 2, borderColor: colors.accent }, step: { position: 'absolute', height: 5, borderTopWidth: 2, borderRightWidth: 2, borderColor: colors.accent },
  phaseGraphic: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, phaseGraphicActive: { backgroundColor: colors.accentDeep, borderColor: colors.accent },
  phaseBars: { height: 23, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }, phaseBar: { width: 4, borderRadius: 2, backgroundColor: colors.accent },
  miniDumbbell: { flexDirection: 'row', alignItems: 'center' }, miniPlate: { width: 6, height: 18, borderRadius: 3, backgroundColor: colors.accent }, miniBar: { width: 15, height: 4, backgroundColor: colors.accent },
  trendGraphic: { width: 28, height: 28, position: 'relative' }, trendDot: { position: 'absolute', right: 2, top: 4, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent },
  peakGraphic: { width: 28, height: 24, position: 'relative' }, peakLeft: { position: 'absolute', left: 3, bottom: 3, width: 18, height: 3, backgroundColor: colors.accent, transform: [{ rotateZ: '-48deg' }] }, peakRight: { position: 'absolute', right: 2, bottom: 3, width: 18, height: 3, backgroundColor: colors.accent, transform: [{ rotateZ: '48deg' }] }, peakDot: { position: 'absolute', top: 1, left: 12, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent },
  achievement: { width: 48, height: 48, borderRadius: 15, borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.accentDeep, alignItems: 'center', justifyContent: 'center' }, achievementLocked: { opacity: 0.45, borderColor: colors.border }, achievementText: { color: colors.accent, fontSize: 13, fontWeight: '900' },
  emptyGraphic: { width: 86, height: 86, borderRadius: 25, backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  bigDumbbell: { flexDirection: 'row', alignItems: 'center' }, bigPlate: { width: 13, height: 42, borderRadius: 5, backgroundColor: colors.accent }, bigBar: { width: 37, height: 7, backgroundColor: colors.accent },
  scaleBody: { width: 50, height: 43, borderRadius: 13, borderWidth: 3, borderColor: colors.accent, alignItems: 'center', paddingTop: 7 }, scaleDial: { width: 18, height: 11, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderWidth: 2, borderBottomWidth: 0, borderColor: colors.accent },
  calendarBody: { width: 49, height: 45, borderRadius: 8, borderWidth: 3, borderColor: colors.accent, overflow: 'hidden', alignItems: 'center' }, calendarTop: { width: '100%', height: 10, backgroundColor: colors.accent }, calendarDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 9 },
  ringWrap: { flex: 1, alignItems: 'center', minWidth: 0 }, ringTrack: { width: 78, height: 78, borderRadius: 39, borderWidth: 1, borderColor: ringTrackColor, backgroundColor: '#070C13', alignItems: 'center', justifyContent: 'center', position: 'relative' }, ringAccent: { position: 'absolute', left: -1, right: -1, top: -1, bottom: -1, borderRadius: 40, borderWidth: 5, transform: [{ rotateZ: '-45deg' }] }, ringGlow: { position: 'absolute', left: 9, right: 9, top: 9, bottom: 9, borderRadius: 30, borderWidth: 1, borderColor: '#16243A' }, ringValue: { color: colors.text, fontSize: 15, fontWeight: '900', maxWidth: 64 }, ringLabel: { color: colors.muted, fontSize: 7.5, marginTop: 2, maxWidth: 62, textAlign: 'center' }, ringDetail: { color: colors.accent, fontSize: 7, marginTop: 1, maxWidth: 62 },
  sparkline: { position: 'relative', overflow: 'hidden' }, sparkGrid: { position: 'absolute', left: 0, right: 0, top: '50%', borderTopWidth: 1, borderTopColor: '#16243A' }, sparkSegment: { position: 'absolute', height: 2, borderRadius: 2, backgroundColor: colors.accent, transformOrigin: 'left center' as any }, sparkDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, borderWidth: 1, borderColor: '#DCEBFF' }
});
