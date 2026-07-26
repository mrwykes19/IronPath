import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { TrendBars } from '../components/TrendBars';
import { exercisesById } from '../data/exercises';
import { achievements, getExerciseHistory, muscleVolume, personalRecords, weeklySummary } from '../engine/analytics';
import { calculateVolume } from '../engine/planner';
import { getRecommendation } from '../engine/progression';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { estimatedOneRepMax } from '../utils/math';
import { MuscleGroup } from '../types';

type ProgressTab = 'overview' | 'muscles' | 'records';

type ExerciseProgress = { bestE1rm: number; lastWeight: number; sessions: number; values: number[] };

const MetricTile = ({ label, value, detail }: { label: string; value: string; detail: string }) => (
  <View style={styles.metricTile}><Text style={styles.metricTileLabel}>{label}</Text><Text style={styles.metricTileValue}>{value}</Text><Text style={styles.metricTileDetail}>{detail}</Text></View>
);

export const ProgressScreen = () => {
  const { state } = useApp();
  const [tab, setTab] = useState<ProgressTab>('overview');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | undefined>();
  const completed = state.sessions.filter((session) => session.completedAt);
  const summary = weeklySummary(state);
  const records = personalRecords(state);
  const badges = achievements(state);
  const volumeByMuscle = muscleVolume(state);
  const muscleEntries = Object.entries(volumeByMuscle) as Array<[MuscleGroup, number]>;
  const totalMuscleSets = muscleEntries.reduce((sum, [, sets]) => sum + sets, 0);
  const mostTrainedMuscle = [...muscleEntries].sort((a, b) => b[1] - a[1])[0];

  const exerciseProgress = useMemo(() => {
    const map = new Map<string, ExerciseProgress>();
    completed.forEach((session) => session.exercises.forEach((exercise) => {
      const sets = exercise.sets.filter((set) => set.completed && !set.warmup);
      const best = sets.reduce((value, set) => Math.max(value, estimatedOneRepMax(set.weight, set.reps)), 0);
      if (!best) return;
      const current = map.get(exercise.exerciseId) ?? { bestE1rm: 0, lastWeight: 0, sessions: 0, values: [] };
      map.set(exercise.exerciseId, {
        bestE1rm: Math.max(current.bestE1rm, best),
        lastWeight: sets.at(-1)?.weight ?? current.lastWeight,
        sessions: current.sessions + 1,
        values: [...current.values, best]
      });
    }));
    return [...map.entries()].sort((a, b) => b[1].sessions - a[1].sessions).slice(0, 10);
  }, [completed]);

  const weeklyVolumes = Array.from({ length: 6 }, (_, index) => {
    const start = Date.now() - (6 - index) * 7 * 86400000;
    const end = start + 7 * 86400000;
    return completed.filter((session) => {
      const date = new Date(session.completedAt!).getTime();
      return date >= start && date < end;
    }).reduce((sum, session) => sum + calculateVolume(session), 0);
  });

  if (selectedExerciseId) {
    const exercise = exercisesById[selectedExerciseId];
    const history = getExerciseHistory(state, selectedExerciseId);
    const recommendation = getRecommendation(state, selectedExerciseId);
    const best = history.reduce((value, item) => Math.max(value, item.estimatedMax), 0);
    const heaviest = history.reduce((value, item) => Math.max(value, item.bestSet.weight), 0);
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.detailHeader}>
          <Pressable onPress={() => setSelectedExerciseId(undefined)} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
          <View style={styles.flex}><Text style={styles.titleSmall}>{exercise?.name}</Text><Text style={styles.subtitleSmall}>{exercise?.primaryMuscle} · {exercise?.equipment.replace('-', ' ')}</Text></View>
          <Text style={styles.more}>⋮</Text>
        </View>

        <Card style={styles.heroCard}>
          <Text style={styles.cardEyebrow}>STRENGTH TREND</Text>
          <Text style={styles.bigMetric}>{best ? Math.round(best) : '—'} {state.profile.unit}</Text>
          <Text style={styles.positiveDetail}>{history.length ? `${history.length} logged sessions` : 'Complete this lift to begin tracking'}</Text>
          {history.length ? <TrendBars values={history.slice(-7).map((item) => item.estimatedMax)} labels={history.slice(-7).map((item) => new Date(item.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }))} /> : <Text style={styles.empty}>No strength data yet.</Text>}
        </Card>

        <Card>
          <Text style={styles.cardEyebrow}>LAST 5 SESSIONS</Text>
          {history.slice().reverse().slice(0, 5).map((item) => (
            <View key={item.sessionId} style={styles.sessionLine}><Text style={styles.sessionDate}>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text><Text style={styles.sessionSet}>{item.bestSet.weight} × {item.bestSet.reps}</Text><Text style={styles.sessionRir}>{item.bestSet.rir} RIR</Text></View>
          ))}
          {!history.length ? <Text style={styles.empty}>No sessions yet.</Text> : null}
        </Card>

        <Card>
          <Text style={styles.cardEyebrow}>PERSONAL RECORDS</Text>
          <View style={styles.recordGrid}>
            <View style={styles.recordCell}><Text style={styles.recordIcon}>◇</Text><Text style={styles.recordValue}>{heaviest || '—'} {state.profile.unit}</Text><Text style={styles.recordLabel}>Heaviest set</Text></View>
            <View style={styles.recordCell}><Text style={styles.recordIcon}>↗</Text><Text style={styles.recordValue}>{best ? Math.round(best) : '—'} {state.profile.unit}</Text><Text style={styles.recordLabel}>Best estimated 1RM</Text></View>
          </View>
        </Card>

        <Card style={styles.nextCard}>
          <Text style={styles.cardEyebrow}>NEXT PROJECTED INCREASE</Text>
          <View style={styles.nextRow}><Text style={styles.nextWeight}>{history.at(-1)?.bestSet.weight ?? recommendation.weight} {state.profile.unit} → {recommendation.weight} {state.profile.unit}</Text><Text style={styles.percent}>{recommendation.readinessPercent ?? 30}%</Text></View>
          <View style={styles.track}><View style={[styles.fill, { width: `${recommendation.readinessPercent ?? 30}%` }]} /></View>
          <Text style={styles.detailCopy}>{recommendation.reason}</Text>
        </Card>
      </ScrollView>
    );
  }

  const primaryTrends = exerciseProgress.slice(0, 3);
  const primaryRecommendationId = primaryTrends[0]?.[0] ?? 'bench-press';
  const primaryRecommendation = getRecommendation(state, primaryRecommendationId);
  const primaryData = primaryTrends[0]?.[1];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Gains</Text>
        <View style={styles.filterPill}><Text style={styles.filterText}>All lifts⌄</Text></View>
      </View>

      <View style={styles.tabs}>
        {(['overview', 'muscles', 'records'] as ProgressTab[]).map((item) => <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}><Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text></Pressable>)}
      </View>

      {tab === 'overview' ? (
        <>
          <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>STRENGTH TRENDS</Text><Text style={styles.viewAll}>View all</Text></View>
          <View style={styles.trendGrid}>
            {(primaryTrends.length ? primaryTrends : [['bench-press', { bestE1rm: 0, lastWeight: 0, sessions: 0, values: [0, 0] }] as [string, ExerciseProgress], ['back-squat', { bestE1rm: 0, lastWeight: 0, sessions: 0, values: [0, 0] }] as [string, ExerciseProgress], ['trap-bar-deadlift', { bestE1rm: 0, lastWeight: 0, sessions: 0, values: [0, 0] }] as [string, ExerciseProgress]]).slice(0, 3).map(([exerciseId, data]) => (
              <Pressable key={exerciseId} style={styles.trendCard} onPress={() => setSelectedExerciseId(exerciseId)}>
                <Text numberOfLines={1} style={styles.trendName}>{exercisesById[exerciseId]?.name ?? 'Lift'}</Text>
                <Text style={styles.trendValue}>{data.bestE1rm ? Math.round(data.bestE1rm) : '—'} <Text style={styles.trendUnit}>{state.profile.unit}</Text></Text>
                <Text style={styles.trendGain}>{data.sessions ? `↗ ${data.sessions} sessions` : 'Start tracking'}</Text>
                <View style={styles.miniTrend}><TrendBars values={data.values.slice(-5)} /></View>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>PERSONAL RECORDS</Text><Text style={styles.viewAll}>View all</Text></View>
          <Card>
            <View style={styles.prSummaryRow}>
              <View style={styles.prSeal}><Text style={styles.prSealText}>PR</Text></View>
              <View style={styles.flex}><Text style={styles.prCount}>{records.length}</Text><Text style={styles.prLabel}>Total PRs</Text></View>
              <View style={styles.prBreakdown}><Text style={styles.prBreakdownLine}>This week  <Text style={styles.prBreakdownValue}>{summary.prs}</Text></Text><Text style={styles.prBreakdownLine}>Workouts  <Text style={styles.prBreakdownValue}>{completed.length}</Text></Text><Text style={styles.prBreakdownLine}>Badges  <Text style={styles.prBreakdownValue}>{badges.filter((badge) => badge.unlocked).length}</Text></Text></View>
            </View>
          </Card>

          <Text style={styles.sectionEyebrow}>NEXT INCREASE</Text>
          <Card style={styles.nextCard}>
            <Text style={styles.nextExercise}>{exercisesById[primaryRecommendationId]?.name ?? 'Bench Press'}</Text>
            <View style={styles.nextRow}><Text style={styles.nextWeight}>{primaryData?.lastWeight || primaryRecommendation.weight} {state.profile.unit} → {primaryRecommendation.weight} {state.profile.unit}</Text><Text style={styles.percent}>{primaryRecommendation.readinessPercent ?? 30}%</Text></View>
            <View style={styles.track}><View style={[styles.fill, { width: `${primaryRecommendation.readinessPercent ?? 30}%` }]} /></View>
            <Text style={styles.detailCopy}>{primaryRecommendation.reason}</Text>
          </Card>

          <Text style={styles.sectionEyebrow}>WEEKLY SUMMARY</Text>
          <Card style={styles.heroCard}>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryRow}>
                <MetricTile label="WORKOUTS" value={`${summary.workouts}`} detail="completed" />
                <MetricTile label="VOLUME" value={`${summary.volumeChangePercent >= 0 ? '+' : ''}${summary.volumeChangePercent}%`} detail="vs last week" />
              </View>
              <View style={styles.summaryRow}>
                <MetricTile label="CALORIES" value={summary.calories ? `${summary.calories}` : '—'} detail="burned" />
                <MetricTile label="ADHERENCE" value={`${summary.adherence}%`} detail="of plan" />
              </View>
            </View>
            {weeklyVolumes.some(Boolean) ? <TrendBars values={weeklyVolumes} labels={['-5', '-4', '-3', '-2', '-1', 'Now']} /> : null}
          </Card>

          <Text style={styles.sectionEyebrow}>ALL EXERCISES</Text>
          {exerciseProgress.map(([exerciseId, data]) => {
            const recommendation = getRecommendation(state, exerciseId);
            return (
              <Pressable key={exerciseId} onPress={() => setSelectedExerciseId(exerciseId)}>
                <Card style={styles.exerciseCard}>
                  <View style={styles.exerciseRow}><View style={styles.exerciseIcon}><Text style={styles.exerciseIconText}>↗</Text></View><View style={styles.flex}><Text style={styles.exerciseName}>{exercisesById[exerciseId]?.name}</Text><Text style={styles.detail}>{data.sessions} sessions · {data.lastWeight} {state.profile.unit} latest</Text></View><Text style={styles.e1rm}>{Math.round(data.bestE1rm)}</Text></View>
                  <View style={styles.track}><View style={[styles.fill, { width: `${recommendation.readinessPercent ?? 30}%` }]} /></View>
                </Card>
              </Pressable>
            );
          })}
        </>
      ) : null}

      {tab === 'muscles' ? (
        <>
          <Card style={styles.heroCard}>
            <Text style={styles.sectionEyebrow}>VOLUME BY MUSCLE GROUP</Text>
            <Text style={styles.cardTitle}>This week</Text>
            <View style={styles.muscleSummaryRow}>
              <View style={styles.muscleSummaryTile}><Text style={styles.muscleSummaryLabel}>TOTAL WORKING SETS</Text><Text style={styles.muscleSummaryValue}>{totalMuscleSets}</Text></View>
              <View style={styles.muscleSummaryTile}><Text style={styles.muscleSummaryLabel}>MOST TRAINED</Text><Text style={styles.muscleSummaryValueSmall}>{mostTrainedMuscle?.[0] ?? '—'}</Text><Text style={styles.muscleSummaryDetail}>{mostTrainedMuscle?.[1] ?? 0} sets</Text></View>
            </View>
            {muscleEntries.map(([muscle, sets]) => {
              const target = muscle === 'Legs' ? 18 : muscle === 'Core' ? 8 : 14;
              const percent = Math.min(100, Math.round((sets / target) * 100));
              return <View key={muscle} style={styles.muscleRow}><View style={styles.muscleLabelRow}><Text style={styles.muscleName}>{muscle}</Text><Text style={styles.muscleSets}>{sets} sets · {percent}% of target</Text></View><View style={styles.muscleTrack}><View style={[styles.muscleFill, { width: `${percent}%` }]} /></View></View>;
            })}
          </Card>
          <Card><Text style={styles.cardTitle}>Muscle balance</Text>{muscleEntries.map(([muscle, sets]) => { const status = sets > 18 ? 'High' : sets < 6 ? 'Slightly low' : 'Balanced'; return <View key={muscle} style={styles.balanceRow}><Text style={styles.balanceMuscle}>{muscle}</Text><Text style={[styles.balanceStatus, status === 'High' && styles.statusHigh, status === 'Slightly low' && styles.statusLow]}>{status}</Text></View>; })}</Card>
        </>
      ) : null}

      {tab === 'records' ? (
        <>
          <View style={styles.badgeGrid}>{badges.map((badge) => <Card key={badge.id} style={[styles.badgeCard, badge.unlocked && styles.badgeUnlocked]}><Text style={styles.badgeIcon}>{badge.unlocked ? '◇' : '○'}</Text><Text style={styles.badgeTitle}>{badge.title}</Text><Text style={styles.badgeValue}>{badge.value}</Text><Text style={styles.badgeDetail}>{badge.detail}</Text></Card>)}</View>
          <Text style={styles.sectionEyebrow}>RECORD TIMELINE</Text>
          {records.length ? records.slice().reverse().slice(0, 20).map((record, index) => <Card key={`${record.exerciseId}-${record.date}-${index}`}><View style={styles.recordTimelineRow}><View style={styles.prCircle}><Text style={styles.prCircleText}>PR</Text></View><View style={styles.flex}><Text style={styles.exerciseName}>{exercisesById[record.exerciseId]?.name}</Text><Text style={styles.detail}>{new Date(record.date).toLocaleDateString()} · {record.weight} × {record.reps}</Text></View><Text style={styles.e1rm}>{Math.round(record.estimatedMax)}</Text></View></Card>) : <Card><Text style={styles.empty}>Personal records will appear as you improve.</Text></Card>}
        </>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 18, gap: 12, paddingBottom: 116 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 29, fontWeight: '900', letterSpacing: -0.8 },
  filterPill: { backgroundColor: colors.panelRaised, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: colors.border },
  filterText: { color: colors.text, fontSize: 10, fontWeight: '800' },
  tabs: { flexDirection: 'row', backgroundColor: colors.panelSoft, borderRadius: 14, padding: 3, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  tabActive: { backgroundColor: colors.accent },
  tabText: { color: colors.muted, textTransform: 'capitalize', fontWeight: '900', fontSize: 10 },
  tabTextActive: { color: colors.black },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.05 },
  viewAll: { color: colors.muted, fontSize: 9 },
  trendGrid: { flexDirection: 'row', gap: 7 },
  trendCard: { flex: 1, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 9, minHeight: 132, overflow: 'hidden' },
  trendName: { color: colors.text, fontSize: 9, fontWeight: '900' },
  trendValue: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 5 },
  trendUnit: { color: colors.muted, fontSize: 8 },
  trendGain: { color: colors.accent, fontSize: 8, marginTop: 3 },
  miniTrend: { marginHorizontal: -8, height: 62, overflow: 'hidden' },
  prSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  prSeal: { width: 58, height: 58, borderRadius: 29, borderWidth: 5, borderColor: colors.accentDark, backgroundColor: colors.panelSoft, alignItems: 'center', justifyContent: 'center' },
  prSealText: { color: colors.accent, fontWeight: '900' },
  prCount: { color: colors.text, fontSize: 28, fontWeight: '900' },
  prLabel: { color: colors.muted, fontSize: 10 },
  prBreakdown: { alignItems: 'flex-end', gap: 4 },
  prBreakdownLine: { color: colors.muted, fontSize: 9 },
  prBreakdownValue: { color: colors.text, fontWeight: '900' },
  heroCard: { backgroundColor: colors.accentDeep, borderColor: colors.borderStrong },
  nextCard: { borderColor: colors.borderStrong },
  nextExercise: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  nextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextWeight: { color: colors.text, fontSize: 18, fontWeight: '900' },
  percent: { color: colors.accent, fontWeight: '900' },
  track: { height: 6, backgroundColor: colors.panelRaised, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: 4 },
  detailCopy: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  summaryGrid: { gap: 8 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  metricTile: { flex: 1, minWidth: 0, minHeight: 68, backgroundColor: colors.panelSoft, borderRadius: 12, padding: 9, borderWidth: 1, borderColor: colors.border },
  metricTileLabel: { color: colors.mutedSoft, fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  metricTileValue: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 4 },
  metricTileDetail: { color: colors.muted, fontSize: 8, marginTop: 2 },
  exerciseCard: { padding: 12 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exerciseIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.panelRaised, alignItems: 'center', justifyContent: 'center' },
  exerciseIconText: { color: colors.accent, fontSize: 18, fontWeight: '900' },
  flex: { flex: 1 },
  exerciseName: { color: colors.text, fontSize: 13, fontWeight: '900' },
  detail: { color: colors.muted, fontSize: 9, marginTop: 3 },
  e1rm: { color: colors.accent, fontSize: 14, fontWeight: '900' },
  muscleSummaryRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  muscleSummaryTile: { flex: 1, minHeight: 78, borderRadius: 13, backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: colors.border, padding: 11 },
  muscleSummaryLabel: { color: colors.mutedSoft, fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  muscleSummaryValue: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 7 },
  muscleSummaryValueSmall: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 7 },
  muscleSummaryDetail: { color: colors.accent, fontSize: 9, fontWeight: '800', marginTop: 2 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 3 },
  muscleRow: { gap: 5, marginTop: 4 },
  muscleLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  muscleName: { color: colors.text, fontSize: 11, fontWeight: '900' },
  muscleSets: { color: colors.muted, fontSize: 9 },
  muscleTrack: { height: 7, backgroundColor: colors.panelRaised, borderRadius: 4, overflow: 'hidden' },
  muscleFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 4 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  balanceMuscle: { color: colors.text, fontSize: 11, fontWeight: '800' },
  balanceStatus: { color: colors.success, fontSize: 9, fontWeight: '900' },
  statusHigh: { color: colors.warning },
  statusLow: { color: colors.danger },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeCard: { width: '48.8%', minHeight: 142, opacity: 0.58 },
  badgeUnlocked: { opacity: 1, borderColor: colors.accentDark },
  badgeIcon: { color: colors.accent, fontSize: 27 },
  badgeTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  badgeValue: { color: colors.text, fontSize: 22, fontWeight: '900' },
  badgeDetail: { color: colors.muted, fontSize: 9, lineHeight: 13 },
  recordTimelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3D3220', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.warning },
  prCircleText: { color: colors.warning, fontWeight: '900', fontSize: 9 },
  empty: { color: colors.muted, paddingVertical: 18, textAlign: 'center', fontSize: 11 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.panelRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  backText: { color: colors.text, fontSize: 29, lineHeight: 31 },
  titleSmall: { color: colors.text, fontSize: 21, fontWeight: '900' },
  subtitleSmall: { color: colors.muted, fontSize: 10, textTransform: 'capitalize', marginTop: 2 },
  more: { color: colors.muted, fontSize: 24 },
  cardEyebrow: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  bigMetric: { color: colors.text, fontSize: 25, fontWeight: '900', marginTop: 4 },
  positiveDetail: { color: colors.accent, fontSize: 9, marginTop: 2 },
  sessionLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  sessionDate: { color: colors.muted, fontSize: 9, width: 64 },
  sessionSet: { color: colors.text, fontSize: 12, fontWeight: '900' },
  sessionRir: { color: colors.muted, fontSize: 9 },
  recordGrid: { flexDirection: 'row', gap: 8 },
  recordCell: { flex: 1, backgroundColor: colors.panelSoft, borderRadius: 12, padding: 11, borderWidth: 1, borderColor: colors.border },
  recordIcon: { color: colors.accent, fontSize: 19 },
  recordValue: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 7 },
  recordLabel: { color: colors.muted, fontSize: 9, marginTop: 3 }
});
