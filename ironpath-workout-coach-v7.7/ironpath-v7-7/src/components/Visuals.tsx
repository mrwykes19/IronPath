import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { CardioDevice } from '../types';

const ringTrackColor = '#162236';

const workoutCharacterAssets = {
  upper: require('../../assets/characters/curl.png'),
  lower: require('../../assets/characters/squat.png'),
  full: require('../../assets/characters/plank.png'),
  push: require('../../assets/characters/bench.png'),
  pull: require('../../assets/characters/curl.png')
};

const cardioAssets = {
  'treadmill-run': require('../../assets/v64/cardio/run.png'),
  'treadmill-walk': require('../../assets/v64/cardio/walk.png'),
  bike: require('../../assets/v64/cardio/bike.png'),
  elliptical: require('../../assets/v64/cardio/elliptical.png'),
  rower: require('../../assets/v64/cardio/rower.png'),
  'stair-climber': require('../../assets/v64/cardio/stairs.png')
} as const;
const phaseAssets = {
  1: require('../../assets/v62/phase_base.png'),
  2: require('../../assets/v62/phase_build.png'),
  3: require('../../assets/v62/phase_progress.png'),
  4: require('../../assets/v62/phase_peak.png')
} as const;
const noWorkoutAsset = require('../../assets/v73/no_workout_train.png');
const weightAsset = require('../../assets/v64/weight.png');

export const BrandMark = ({ compact = false, large = false }: { compact?: boolean; large?: boolean }) => (
  <View style={[styles.brandMark, compact && styles.brandMarkCompact, large && styles.brandMarkLarge]}>
    <Image source={require('../../assets/ironpath-icon.png')} resizeMode="cover" style={[styles.brandImage, compact && styles.brandImageCompact, large && styles.brandImageLarge]} />
  </View>
);

export const ActivityGraphic = ({ device, active = false, size = 38 }: { device: CardioDevice; active?: boolean; size?: number }) => (
  <View style={[styles.activityImageWrap, active && styles.activityWrapActive, { width: size, height: size }]}>
    <Image source={cardioAssets[device]} resizeMode="contain" style={styles.activityImage} />
  </View>
);

export type WorkoutVisualKind = 'upper' | 'lower' | 'full' | 'push' | 'pull';

export const WorkoutHeroGraphic = ({ kind = 'upper', size = 118 }: { kind?: WorkoutVisualKind; size?: number }) => {
  const source = workoutCharacterAssets[kind];
  return (
    <View style={[styles.heroCharacterWrap, { width: size, height: size }]}>
      <View style={styles.heroCharacterGlow} />
      <Image source={source} resizeMode="contain" style={styles.heroCharacterImage} />
    </View>
  );
};

const metricAssets = {
  volume: require('../../assets/v64/metrics/volume.png'),
  workouts: require('../../assets/v64/metrics/workouts.png'),
  calories: require('../../assets/v64/metrics/calories.png'),
  streak: require('../../assets/v64/metrics/streak.png')
} as const;

export const MetricGraphic = ({ kind, active = true }: { kind: 'volume' | 'workouts' | 'calories' | 'streak'; active?: boolean }) => (
  <View style={[styles.metricGlyph, !active && styles.metricGlyphMuted]}>
    <Image source={metricAssets[kind]} resizeMode="contain" style={styles.metricAssetImage} />
  </View>
);

export const PhaseGraphic = ({ phase, active = false }: { phase: number; active?: boolean }) => (
  <View style={[styles.phaseGraphicCard, active && styles.phaseGraphicCardActive]}>
    <Image source={phaseAssets[phase as 1 | 2 | 3 | 4]} resizeMode="cover" style={styles.phaseGraphicImage} />
  </View>
);

export const AchievementGraphic = ({ kind, unlocked = true }: { kind: string; unlocked?: boolean }) => (
  <View style={[styles.achievement, !unlocked && styles.achievementLocked]}>
    <Text style={styles.achievementText}>{kind === 'pr' ? 'PR' : kind === 'streak' ? '🔥' : kind === 'workouts' ? '100' : '↓'}</Text>
  </View>
);

export const EmptyStateGraphic = ({ kind = 'workout' }: { kind?: 'workout' | 'history' | 'weight' | 'records' }) => (
  <View style={[styles.emptyGraphic, kind === 'workout' && styles.emptyGraphicWorkout]}>
    {kind === 'workout' ? (
      <Image source={noWorkoutAsset} resizeMode="contain" style={styles.noWorkoutImage} />
    ) : kind === 'weight' ? <Image source={weightAsset} resizeMode="contain" style={styles.weightEmptyImage} /> : kind === 'history' ? <><View style={styles.calendarBody}><View style={styles.calendarTop} /><View style={styles.calendarDot} /></View></> : kind === 'records' ? <AchievementGraphic kind="pr" unlocked={false} /> : <View style={styles.bigDumbbell}><View style={styles.bigPlate} /><View style={styles.bigBar} /><View style={styles.bigPlate} /></View>}
  </View>
);

export const ProgressRing = ({ value, label, progress = 0, detail }: { value: string; label: string; progress?: number; detail?: string }) => {
  const clamped = Math.max(0, Math.min(100, progress));
  const segmentStyle = { borderTopColor: clamped > 0 ? colors.accent : ringTrackColor, borderRightColor: clamped >= 25 ? colors.accent : ringTrackColor, borderBottomColor: clamped >= 50 ? colors.accent : ringTrackColor, borderLeftColor: clamped >= 75 ? colors.accent : ringTrackColor };
  return <View style={styles.ringWrap}><View style={styles.ringTrack}><View style={[styles.ringAccent, segmentStyle]} /><View style={styles.ringGlow} /><Text style={styles.ringValue}>{value}</Text><Text style={styles.ringLabel}>{label}</Text>{detail ? <Text style={styles.ringDetail}>{detail}</Text> : null}</View></View>;
};

export const MiniSparkline = ({ values, height = 54 }: { values: number[]; height?: number }) => {
  const usable = values.length > 1 ? values : [0, values[0] ?? 0];
  const min = Math.min(...usable);
  const max = Math.max(...usable);
  const range = max - min || 1;
  const width = 150;
  const points = usable.map((value, index) => ({ x: (index / (usable.length - 1)) * width, y: height - 8 - ((value - min) / range) * (height - 18) }));
  return <View style={[styles.sparkline, { height, width }]}><View style={styles.sparkGrid} />{points.slice(0, -1).map((point, index) => { const next = points[index + 1]!; const dx = next.x - point.x; const dy = next.y - point.y; const length = Math.sqrt(dx * dx + dy * dy); const angle = Math.atan2(dy, dx) * (180 / Math.PI); return <View key={`${point.x}-${point.y}`} style={[styles.sparkSegment, { width: length, left: point.x, top: point.y, transform: [{ rotateZ: `${angle}deg` }] }]} />; })}{points.map((point, index) => <View key={`dot-${index}`} style={[styles.sparkDot, { left: point.x - 3, top: point.y - 3 }]} />)}</View>;
};

const styles = StyleSheet.create({
  brandMark: { width: 58, height: 58, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: '#02050A', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  brandMarkCompact: { width: 48, height: 48, borderRadius: 15 },
  brandMarkLarge: { width: 88, height: 88, borderRadius: 24 },
  brandImage: { width: 58, height: 58 },
  brandImageCompact: { width: 48, height: 48 },
  brandImageLarge: { width: 88, height: 88 },

  line: { position: 'absolute', borderRadius: 2 },
  head: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },

  activityImageWrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  activityImage: { width: '100%', height: '100%' },
  heroCharacterWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroCharacterGlow: { position: 'absolute', width: '84%', height: '84%', borderRadius: 999, backgroundColor: colors.accent, opacity: 0.08 },
  heroCharacterImage: { width: '112%', height: '112%' },
  activityWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  activityWrapActive: { opacity: 1 },
  wheel: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.accent },
  seat: { position: 'absolute', width: 9, height: 3, borderRadius: 2, backgroundColor: colors.accent },
  ellipse: { position: 'absolute', width: 25, height: 11, borderRadius: 10, borderWidth: 2, borderColor: colors.accent },
  step: { position: 'absolute', height: 5, borderTopWidth: 2, borderRightWidth: 2, borderColor: colors.accent },

  heroGraphicWrap: { position: 'relative', overflow: 'hidden' },
  heroGlow: { position: 'absolute' },
  heroGridLine: { position: 'absolute', height: 1, backgroundColor: '#173052', opacity: 0.8 },
  heroPlate: { position: 'absolute', width: 18, height: 40, borderRadius: 6, borderWidth: 2, borderColor: colors.accent, backgroundColor: '#091221', alignItems: 'center', justifyContent: 'center' },
  heroPlateInner: { width: 8, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#79C2FF' },
  heroBar: { position: 'absolute', height: 6, borderRadius: 4, backgroundColor: '#74BBFF' },
  heroBadge: { position: 'absolute', right: 6, bottom: 5, minWidth: 30, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#20497A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  heroBadgeText: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },

  metricAssetImage: { width: '84%', height: '84%', alignSelf: 'center', marginTop: '8%' },
  metricGlyph: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#081321', borderWidth: 1, borderColor: colors.borderStrong, position: 'relative' },
  metricGlyphMuted: { opacity: 0.65 },
  glyphDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  calendarMini: { position: 'absolute', width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: colors.accent },
  calendarMiniTop: { position: 'absolute', width: 18, height: 5, borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: colors.accent },
  calendarMiniDot: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent },
  flameOuter: { position: 'absolute', left: 14, top: 9, width: 14, height: 22, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 10, borderBottomRightRadius: 4, backgroundColor: colors.accent, transform: [{ rotateZ: '18deg' }] },
  flameInner: { position: 'absolute', left: 19, top: 16, width: 7, height: 12, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderBottomLeftRadius: 5, borderBottomRightRadius: 2, backgroundColor: colors.bg, transform: [{ rotateZ: '18deg' }] },

  phaseGraphicCard: { width: 68, height: 74, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: '#06101C' },
  phaseGraphicCardActive: { borderColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.25, shadowRadius: 10 },
  phaseGraphicImage: { width: '100%', height: '100%' },

  achievement: { width: 48, height: 48, borderRadius: 15, borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.accentDeep, alignItems: 'center', justifyContent: 'center' },
  achievementLocked: { opacity: 0.45, borderColor: colors.border },
  achievementText: { color: colors.accent, fontSize: 13, fontWeight: '900' },
  emptyGraphic: { width: 86, height: 86, borderRadius: 25, backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  emptyGraphicWorkout: { width: '100%', maxWidth: 360, height: 520, borderRadius: 28, backgroundColor: 'transparent', borderWidth: 0, alignSelf: 'stretch' },
  weightEmptyImage: { width: '100%', height: '100%' },
  noWorkoutImage: { width: '100%', height: '100%' },
  bigDumbbell: { flexDirection: 'row', alignItems: 'center' },
  bigPlate: { width: 13, height: 42, borderRadius: 5, backgroundColor: colors.accent },
  bigBar: { width: 37, height: 7, backgroundColor: colors.accent },
  scaleBody: { width: 50, height: 43, borderRadius: 13, borderWidth: 3, borderColor: colors.accent, alignItems: 'center', paddingTop: 7 },
  scaleDial: { width: 18, height: 11, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderWidth: 2, borderBottomWidth: 0, borderColor: colors.accent },
  calendarBody: { width: 49, height: 45, borderRadius: 8, borderWidth: 3, borderColor: colors.accent, overflow: 'hidden', alignItems: 'center' },
  calendarTop: { width: '100%', height: 10, backgroundColor: colors.accent },
  calendarDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 9 },

  ringWrap: { flex: 1, alignItems: 'center', minWidth: 0 },
  ringTrack: { width: 78, height: 78, borderRadius: 39, borderWidth: 1, borderColor: ringTrackColor, backgroundColor: '#070C13', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ringAccent: { position: 'absolute', left: -1, right: -1, top: -1, bottom: -1, borderRadius: 40, borderWidth: 5, transform: [{ rotateZ: '-45deg' }] },
  ringGlow: { position: 'absolute', left: 9, right: 9, top: 9, bottom: 9, borderRadius: 30, borderWidth: 1, borderColor: '#16243A' },
  ringValue: { color: colors.text, fontSize: 15, fontWeight: '900', maxWidth: 64 },
  ringLabel: { color: colors.muted, fontSize: 7.5, marginTop: 2, maxWidth: 62, textAlign: 'center' },
  ringDetail: { color: colors.accent, fontSize: 7, marginTop: 1, maxWidth: 62 },

  sparkline: { position: 'relative', overflow: 'hidden' },
  sparkGrid: { position: 'absolute', left: 0, right: 0, top: '50%', borderTopWidth: 1, borderTopColor: '#16243A' },
  sparkSegment: { position: 'absolute', height: 2, borderRadius: 2, backgroundColor: colors.accent, transformOrigin: 'left center' as any },
  sparkDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, borderWidth: 1, borderColor: '#DCEBFF' }
});
