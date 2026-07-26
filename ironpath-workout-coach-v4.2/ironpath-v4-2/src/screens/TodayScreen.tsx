import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getNextTemplate } from '../engine/planner';
import { weeklySummary, workoutStreak } from '../engine/analytics';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { BrandMark, ProgressRing } from '../components/Visuals';

const compactNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 1 : 2)}k`;
  return `${Math.round(value)}`;
};

const QuickMetric = ({ icon, label, value, detail }: { icon: string; label: string; value: string; detail: string }) => (
  <View style={styles.quickMetric}>
    <View style={styles.quickTop}>
      <View style={styles.metricIcon}><Text style={styles.metricIconText}>{icon}</Text></View>
      <Text style={styles.quickLabel}>{label}</Text>
    </View>
    <Text style={styles.quickValue} numberOfLines={1}>{value}</Text>
    <Text style={styles.quickDetail} numberOfLines={1}>{detail}</Text>
    <View style={styles.metricAccent} />
  </View>
);

export const TodayScreen = ({ openTrain, openHistory }: { openTrain: () => void; openHistory: () => void }) => {
  const { state, startWorkout } = useApp();
  const template = getNextTemplate(state);
  const summary = weeklySummary(state);
  const streak = workoutStreak(state);
  const currentWorkoutName = state.activeSession?.name ?? template?.name ?? 'Upper A';
  const workoutProgress = Math.min(100, Math.round((summary.workouts / Math.max(1, state.profile.trainingDays)) * 100));
  const volumeGoal = Math.max(15000, Math.ceil(summary.currentVolume / 5000) * 5000 || 15000);
  const volumeProgress = Math.min(100, Math.round((summary.currentVolume / volumeGoal) * 100));
  const activeDays = Math.min(streak, 7);
  const activeDaysProgress = Math.min(100, Math.round((activeDays / 7) * 100));

  const handleStart = () => {
    startWorkout();
    openTrain();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headingRow}>
        <View style={styles.flex}>
          <Text style={styles.overline}>IRONPATH · TODAY</Text>
          <Text style={styles.title}>Ready to train?</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>
        <Pressable onPress={openHistory} style={styles.historyButton}>
          <Text style={styles.historyIcon}>▦</Text>
          <Text style={styles.historyText}>History</Text>
        </Pressable>
      </View>

      <Card style={styles.workoutCard}>
        <View style={styles.cardAccentLine} />
        <View style={styles.workoutCardHeader}>
          <View style={styles.flex}>
            <Text style={styles.sectionEyebrow}>TODAY'S WORKOUT</Text>
            <Text style={styles.workoutName}>{currentWorkoutName}</Text>
            <Text style={styles.focus}>{template?.focus ?? 'Chest and back strength'}</Text>
          </View>
          <BrandMark compact />
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaChip}><Text style={styles.metaValue}>{template?.exercises.length ?? 0}</Text><Text style={styles.metaLabel}> exercises</Text></View>
          <View style={styles.metaDivider} />
          <View style={styles.metaChip}><Text style={styles.metaValue}>{template?.estimatedMinutes ?? 60}</Text><Text style={styles.metaLabel}> min</Text></View>
          <View style={styles.metaDivider} />
          <View style={styles.sequenceChip}><Text style={styles.sequenceText}>{state.activeSession ? 'In progress' : 'Next in sequence'}</Text></View>
        </View>
      </Card>

      <View style={styles.openSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Weekly goals</Text>
            <Text style={styles.sectionSubtitle}>Your training pace this week</Text>
          </View>
          <Text style={styles.sectionNote}>THIS WEEK</Text>
        </View>
        <View style={styles.goalRow}>
          <ProgressRing value={`${summary.workouts}/${state.profile.trainingDays}`} label="Workouts" progress={workoutProgress} />
          <ProgressRing value={compactNumber(summary.currentVolume)} label={`Volume ${state.profile.unit}`} progress={volumeProgress} />
          <ProgressRing value={`${activeDays}/7`} label="Active days" progress={activeDaysProgress} />
        </View>
      </View>

      <View style={styles.openSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Quick metrics</Text>
            <Text style={styles.sectionSubtitle}>A compact view of your week</Text>
          </View>
          <Text style={styles.sectionNote}>AT A GLANCE</Text>
        </View>
        <View style={styles.quickGrid}>
          <QuickMetric icon="↗" label="TOTAL VOLUME" value={compactNumber(summary.currentVolume)} detail={summary.volumeChangePercent ? `${summary.volumeChangePercent > 0 ? 'Up' : 'Down'} ${Math.abs(summary.volumeChangePercent)}% this week` : 'Build your first week'} />
          <QuickMetric icon="◆" label="WORKOUTS" value={`${summary.workouts}`} detail={`${summary.adherence}% plan adherence`} />
          <QuickMetric icon="◌" label="CALORIES" value={summary.calories ? compactNumber(summary.calories) : '—'} detail="Workout calories" />
          <QuickMetric icon="⚡" label="STREAK" value={`${streak} day${streak === 1 ? '' : 's'}`} detail={streak ? 'Keep the momentum' : 'Start today'} />
        </View>
      </View>

      <View style={styles.actionArea}>
        <PrimaryButton
          title={state.activeSession ? 'Continue workout   →' : 'Start workout   →'}
          onPress={state.activeSession ? openTrain : handleStart}
          style={styles.startButton}
        />
        <Text style={styles.actionNote}>Your program stays in sequence until the workout is completed.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 17, paddingTop: 20, gap: 22, paddingBottom: 110 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  flex: { flex: 1 },
  overline: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.35 },
  title: { color: colors.text, fontSize: 31, fontWeight: '900', letterSpacing: -1, marginTop: 5 },
  date: { color: colors.muted, fontSize: 12, marginTop: 4 },
  historyButton: {
    minWidth: 60,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panelRaised,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 1,
    shadowColor: colors.black,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }
  },
  historyIcon: { color: colors.accent, fontSize: 17 },
  historyText: { color: colors.text, fontSize: 8, fontWeight: '900' },
  workoutCard: { backgroundColor: colors.panel, borderColor: colors.borderStrong, padding: 17, gap: 14, overflow: 'hidden' },
  cardAccentLine: { position: 'absolute', left: 0, right: 0, top: 0, height: 3, backgroundColor: colors.accentStrong },
  workoutCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  sectionEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.18 },
  workoutName: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.55, marginTop: 7 },
  focus: { color: colors.muted, fontSize: 13, marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', minHeight: 28 },
  metaChip: { flexDirection: 'row', alignItems: 'baseline' },
  metaValue: { color: colors.text, fontSize: 12, fontWeight: '900' },
  metaLabel: { color: colors.muted, fontSize: 10 },
  metaDivider: { width: 1, height: 14, backgroundColor: colors.border, marginHorizontal: 11 },
  sequenceChip: { marginLeft: 'auto', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: colors.accentDeep, borderWidth: 1, borderColor: colors.borderStrong },
  sequenceText: { color: colors.accent, fontSize: 8, fontWeight: '900' },
  openSection: { gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.25 },
  sectionSubtitle: { color: colors.mutedSoft, fontSize: 10, marginTop: 3 },
  sectionNote: { color: colors.mutedSoft, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingHorizontal: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickMetric: {
    width: '48.5%',
    minHeight: 106,
    backgroundColor: colors.panel,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }
  },
  quickTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricIcon: { width: 24, height: 24, borderRadius: 8, backgroundColor: colors.accentDeep, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong },
  metricIconText: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  quickLabel: { color: colors.mutedSoft, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.55, flex: 1 },
  quickValue: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 13, letterSpacing: -0.55 },
  quickDetail: { color: colors.muted, fontSize: 9, fontWeight: '700', marginTop: 5 },
  metricAccent: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: colors.accentStrong, opacity: 0.7 },
  actionArea: { gap: 9, marginTop: 1 },
  startButton: { minHeight: 56, borderRadius: 17 },
  actionNote: { color: colors.mutedSoft, fontSize: 9, textAlign: 'center', lineHeight: 14 }
});
