import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getNextTemplate } from '../engine/planner';
import { getRecommendation } from '../engine/progression';
import { exerciseLibrary, exercisesById } from '../data/exercises';
import { weeklySummary, workoutStreak } from '../engine/analytics';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { BrandMark, MetricGraphic, ProgressRing, WorkoutHeroGraphic, WorkoutVisualKind } from '../components/Visuals';
import { CardioTracker } from '../components/CardioTracker';
import { blockAdjustedWeight } from '../engine/weeklyPlanner';
import { roundToIncrement } from '../utils/math';


const dailyQuotes = [
  'Consistency compounds.',
  'Train with purpose.',
  'Strong is built one session at a time.',
  'Progress is earned quietly.',
  'Quality repetitions create lasting progress.',
  'Show up, then build.',
  'Small improvements still count.',
  'Strength follows consistency.',
  'Today’s work becomes tomorrow’s capacity.',
  'A good session does not need to be a perfect session.',
  'Leave stronger than you arrived.',
  'Discipline outlasts motivation.',
  'Progress rarely announces itself.',
  'Do the work your future self will notice.',
  'The plan works when you work the plan.'
];

const quoteForToday = () => {
  const now = new Date();
  const dateKey = Number(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`);
  return dailyQuotes[dateKey % dailyQuotes.length]!;
};

const compactNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 1 : 2)}k`;
  return `${Math.round(value)}`;
};

const workoutVisualKind = (name?: string, focus?: string): WorkoutVisualKind => {
  const source = `${name ?? ''} ${focus ?? ''}`.toLowerCase();
  if (source.includes('push') || source.includes('press')) return 'push';
  if (source.includes('pull') || source.includes('back')) return 'pull';
  if (source.includes('lower') || source.includes('squat') || source.includes('hinge') || source.includes('glute') || source.includes('leg')) return 'lower';
  if (source.includes('full') || source.includes('total')) return 'full';
  return 'upper';
};

const QuickMetric = ({ kind, label, value, detail }: { kind: 'volume' | 'workouts' | 'calories' | 'streak'; label: string; value: string; detail: string }) => (
  <View style={styles.quickMetric}>
    <View style={styles.quickMetricGlow} />
    <View style={styles.quickTop}>
      <MetricGraphic kind={kind} />
      <Text style={styles.quickLabel}>{label}</Text>
    </View>
    <Text style={styles.quickValue} numberOfLines={1}>{value}</Text>
    <Text style={styles.quickDetail} numberOfLines={2}>{detail}</Text>
    <View style={styles.metricAccent} />
  </View>
);

export const TodayScreen = ({ openTrain, openHistory }: { openTrain: () => void; openHistory: () => void }) => {
  const { state, startWorkout, updatePlannedWorkout, updatePlannedExercise, movePlannedExercise, removePlannedExercise, addPlannedExercise } = useApp();
  const [showPreview, setShowPreview] = useState(false);
  const [editingPreview, setEditingPreview] = useState(false);
  const [showAddExercises, setShowAddExercises] = useState(false);
  const template = getNextTemplate(state);
  const plannedWorkouts = state.weeklyPlan?.workouts ?? [];
  const currentWorkoutIndex = plannedWorkouts.length ? state.nextTemplateIndex % plannedWorkouts.length : 0;
  const blockWeek = state.weeklyPlan?.blockWeek ?? 1;
  const summary = weeklySummary(state);
  const streak = workoutStreak(state);
  const currentWorkoutName = state.activeSession?.name ?? template?.name ?? 'Prime Movers';
  const heroKind = workoutVisualKind(currentWorkoutName, template?.focus);
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
          <View style={styles.quoteRow}><View style={styles.quoteLine} /><Text style={styles.quote}>“{quoteForToday()}”</Text></View>
        </View>
        <Pressable onPress={openHistory} style={styles.historyButton}>
          <Text style={styles.historyIcon}>▦</Text>
          <Text style={styles.historyText}>History</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => setShowPreview(true)} style={({ pressed }) => [styles.workoutPressable, pressed && styles.workoutPressed]}>
        <Card style={styles.workoutCard}>
          <View style={styles.cardAccentLine} />
          <View style={styles.workoutGlowA} />
          <View style={styles.workoutGlowB} />
          <View style={styles.workoutCardHeader}>
            <View style={[styles.flex, styles.workoutCopy]}>
              <Text style={styles.sectionEyebrow}>TODAY'S WORKOUT</Text>
              <Text style={styles.workoutName}>{currentWorkoutName}</Text>
              <Text style={styles.focus}>{template?.focus ?? 'Chest and back strength'}</Text>
              <View style={styles.previewChipInline}>
                <BrandMark compact />
                <View style={styles.previewChipTextWrap}>
                  <Text style={styles.previewCueText}>TAP TO PREVIEW</Text>
                  <Text style={styles.previewHint}>Review the full plan before you lift.</Text>
                </View>
              </View>
            </View>
            <View style={styles.heroGraphicPanel}>
              <WorkoutHeroGraphic kind={heroKind} size={118} />
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}><Text style={styles.metaValue}>{template?.exercises.length ?? 0}</Text><Text style={styles.metaLabel}> exercises</Text></View>
            <View style={styles.metaDivider} />
            <View style={styles.metaChip}><Text style={styles.metaValue}>{template?.estimatedMinutes ?? 60}</Text><Text style={styles.metaLabel}> min</Text></View>
            <View style={styles.metaDivider} />
            <View style={styles.sequenceChip}><Text style={styles.sequenceText}>{state.activeSession ? 'In progress' : 'Preview plan'}</Text></View>
          </View>
        </Card>
      </Pressable>

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
          <QuickMetric kind="volume" label="TOTAL VOLUME" value={compactNumber(summary.currentVolume)} detail={summary.volumeChangePercent ? `${summary.volumeChangePercent > 0 ? 'Up' : 'Down'} ${Math.abs(summary.volumeChangePercent)}% this week` : 'Build your first week'} />
          <QuickMetric kind="workouts" label="WORKOUTS" value={`${summary.workouts}`} detail={`${summary.adherence}% plan adherence`} />
          <QuickMetric kind="calories" label="CALORIES" value={summary.calories ? compactNumber(summary.calories) : '—'} detail="Workout calories" />
          <QuickMetric kind="streak" label="STREAK" value={`${streak} day${streak === 1 ? '' : 's'}`} detail={streak ? 'Keep the momentum' : 'Start today'} />
        </View>
      </View>


      <Modal visible={showPreview} transparent animationType="slide" onRequestClose={() => setShowPreview(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={() => setShowPreview(false)} />
          <View style={styles.previewSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.previewHeader}>
              <View style={styles.flex}>
                <Text style={styles.sectionEyebrow}>WORKOUT PREVIEW</Text>
                <Text style={styles.previewTitle}>{currentWorkoutName}</Text>
                <Text style={styles.previewFocus}>{template?.focus}</Text>
              </View>
              {!state.activeSession ? (
                <Pressable onPress={() => { setEditingPreview((value) => !value); setShowAddExercises(false); }} style={[styles.editButton, editingPreview && styles.editButtonActive]}>
                  <Text style={[styles.editButtonText, editingPreview && styles.editButtonTextActive]}>{editingPreview ? 'Done' : 'Edit'}</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => { setShowPreview(false); setEditingPreview(false); setShowAddExercises(false); }} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.previewList} contentContainerStyle={styles.previewListContent} showsVerticalScrollIndicator={false}>
              {template?.exercises.map((item, index) => {
                const exercise = exercisesById[item.exerciseId];
                const recommendation = getRecommendation(state, item.exerciseId);
                const displayWeight = roundToIncrement(blockAdjustedWeight(recommendation.weight, exercise?.defaultIncrement || 1, blockWeek), exercise?.defaultIncrement || 1);
                const alternatives = exercise?.substitutions.filter((id) => exercisesById[id]) ?? [];
                return (
                  <View key={`${item.exerciseId}-${index}`} style={styles.previewExercise}>
                    <View style={styles.previewExerciseRow}>
                      <View style={styles.previewNumber}><Text style={styles.previewNumberText}>{index + 1}</Text></View>
                      <View style={styles.previewExerciseMain}>
                        <Text style={styles.previewExerciseName}>{exercise?.name ?? item.exerciseId}</Text>
                        <Text style={styles.previewExerciseMeta}>{item.sets} sets · {item.minReps}–{item.maxReps} reps · {Math.round(item.restSeconds / 60)} min rest</Text>
                      </View>
                      <View style={styles.previewWeight}>
                        <Text style={styles.previewWeightLabel}>{recommendation.kind === 'increase' ? 'TRY' : 'LOAD'}</Text>
                        <Text style={styles.previewWeightValue}>{displayWeight} {state.profile.unit}</Text>
                      </View>
                    </View>
                    {editingPreview ? (
                      <View style={styles.previewEditRow}>
                        <Pressable onPress={() => movePlannedExercise(currentWorkoutIndex, index, -1)} style={styles.previewEditAction}><Text style={styles.previewEditText}>↑</Text></Pressable>
                        <Pressable onPress={() => movePlannedExercise(currentWorkoutIndex, index, 1)} style={styles.previewEditAction}><Text style={styles.previewEditText}>↓</Text></Pressable>
                        <Pressable onPress={() => updatePlannedExercise(currentWorkoutIndex, index, { sets: Math.max(1, item.sets - 1) })} style={styles.previewEditAction}><Text style={styles.previewEditText}>− Set</Text></Pressable>
                        <Pressable onPress={() => updatePlannedExercise(currentWorkoutIndex, index, { sets: item.sets + 1 })} style={styles.previewEditAction}><Text style={styles.previewEditText}>+ Set</Text></Pressable>
                        {alternatives.length ? <Pressable onPress={() => updatePlannedExercise(currentWorkoutIndex, index, { exerciseId: alternatives[0]!, note: `Customized from ${exercise?.name ?? 'previous exercise'}.` })} style={styles.previewEditAction}><Text style={styles.previewEditText}>Swap</Text></Pressable> : null}
                        <Pressable onPress={() => removePlannedExercise(currentWorkoutIndex, index)} style={[styles.previewEditAction, styles.previewRemove]}><Text style={[styles.previewEditText, styles.previewRemoveText]}>Remove</Text></Pressable>
                      </View>
                    ) : null}
                  </View>
                );
              })}
              {editingPreview ? (
                <View style={styles.previewEditorFooter}>
                  <Pressable onPress={() => setShowAddExercises((value) => !value)} style={styles.addExerciseButton}><Text style={styles.addExerciseText}>{showAddExercises ? 'Close exercise list' : '+ Add exercise'}</Text></Pressable>
                  {showAddExercises ? (
                    <View style={styles.exerciseLibrary}>
                      {exerciseLibrary.filter((exercise) => !template?.exercises.some((item) => item.exerciseId === exercise.id)).slice(0, 16).map((exercise) => (
                        <Pressable key={exercise.id} onPress={() => { addPlannedExercise(currentWorkoutIndex, exercise.id); setShowAddExercises(false); }} style={styles.libraryItem}>
                          <Text style={styles.libraryName}>{exercise.name}</Text><Text style={styles.libraryMeta}>{exercise.muscleGroup} · {exercise.equipment}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.previewFooter}>
              <Text style={styles.previewFooterText}>{editingPreview ? 'Changes are saved to this planned workout before you begin.' : `${template?.exercises.length ?? 0} exercises · about ${template?.estimatedMinutes ?? 60} minutes`}</Text>
              <PrimaryButton
                title={state.activeSession ? 'Continue workout   →' : 'Start this workout   →'}
                onPress={() => {
                  setShowPreview(false);
                  setEditingPreview(false);
                  setShowAddExercises(false);
                  if (state.activeSession) openTrain();
                  else handleStart();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <CardioTracker />

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
  quoteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 11, maxWidth: 360 },
  quoteLine: { width: 22, height: 2, borderRadius: 1, backgroundColor: colors.accentStrong },
  quote: { color: colors.muted, fontSize: 11, fontStyle: 'italic', lineHeight: 16, flex: 1 },
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
  workoutCard: { backgroundColor: '#08111A', borderColor: colors.borderStrong, padding: 17, gap: 14, overflow: 'hidden', minHeight: 212 },
  cardAccentLine: { position: 'absolute', left: 0, right: 0, top: 0, height: 3, backgroundColor: colors.accentStrong },
  workoutCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  workoutCopy: { paddingRight: 6 },
  sectionEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.18 },
  workoutName: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.7, marginTop: 7 },
  focus: { color: colors.muted, fontSize: 13, marginTop: 4, maxWidth: 175, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', minHeight: 28, marginTop: 'auto' },
  metaChip: { flexDirection: 'row', alignItems: 'baseline' },
  metaValue: { color: colors.text, fontSize: 12, fontWeight: '900' },
  metaLabel: { color: colors.muted, fontSize: 10 },
  metaDivider: { width: 1, height: 14, backgroundColor: colors.border, marginHorizontal: 11 },
  sequenceChip: { marginLeft: 'auto', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: colors.accentDeep, borderWidth: 1, borderColor: colors.borderStrong },
  sequenceText: { color: colors.accent, fontSize: 8, fontWeight: '900' },
  openSection: { gap: 14 },
  workoutGlowA: { position: 'absolute', width: 170, height: 170, borderRadius: 85, right: -36, top: -22, backgroundColor: '#1356AA', opacity: 0.13 },
  workoutGlowB: { position: 'absolute', width: 120, height: 120, borderRadius: 60, right: 30, top: 48, backgroundColor: '#64BEFF', opacity: 0.08 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.25 },
  sectionSubtitle: { color: colors.mutedSoft, fontSize: 10, marginTop: 3 },
  sectionNote: { color: colors.mutedSoft, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingHorizontal: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickMetric: {
    width: '48.5%',
    minHeight: 124,
    backgroundColor: '#08111A',
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
  quickTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickMetricGlow: { position: 'absolute', width: 90, height: 90, borderRadius: 45, right: -12, top: -8, backgroundColor: colors.accentStrong, opacity: 0.08 },
  quickLabel: { color: colors.mutedSoft, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.7, flex: 1 },
  quickValue: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 14, letterSpacing: -0.7 },
  quickDetail: { color: colors.muted, fontSize: 9, fontWeight: '700', marginTop: 5, maxWidth: '94%', lineHeight: 13 },
  metricAccent: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: colors.accentStrong, opacity: 0.7 },

  workoutPressable: { borderRadius: 22 },
  workoutPressed: { opacity: 0.9, transform: [{ scale: 0.992 }] },
  previewCue: { alignItems: 'center', gap: 5 },
  previewCueText: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  previewHint: { color: colors.muted, fontSize: 9, lineHeight: 12, marginTop: 2 },
  previewChipInline: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, padding: 8, paddingRight: 10, borderRadius: 16, backgroundColor: '#07101A', borderWidth: 1, borderColor: '#19304D', alignSelf: 'flex-start' },
  previewChipTextWrap: { flexShrink: 1 },
  heroGraphicPanel: { width: 126, minHeight: 128, alignItems: 'center', justifyContent: 'center', paddingTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: '#000000B8', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  previewSheet: {
    maxHeight: '84%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 17,
    paddingTop: 10,
    paddingBottom: 18,
    shadowColor: colors.black,
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 }
  },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 14 },
  previewHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  previewTitle: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.6, marginTop: 5 },
  previewFocus: { color: colors.muted, fontSize: 12, marginTop: 3 },
  closeButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { color: colors.text, fontSize: 24, lineHeight: 25, fontWeight: '500' },
  previewList: { flexGrow: 0 },
  previewListContent: { gap: 9, paddingBottom: 10 },
  previewExercise: { gap: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 11 },
  previewExerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewNumber: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.accentDeep, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  previewNumberText: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  previewExerciseMain: { flex: 1 },
  previewExerciseName: { color: colors.text, fontSize: 13, fontWeight: '900' },
  previewExerciseMeta: { color: colors.muted, fontSize: 9, marginTop: 3 },
  previewWeight: { alignItems: 'flex-end', minWidth: 62 },
  previewWeightLabel: { color: colors.mutedSoft, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  previewWeightValue: { color: colors.accent, fontSize: 11, fontWeight: '900', marginTop: 3 },

  editButton: { minWidth: 52, height: 38, borderRadius: 13, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  editButtonActive: { backgroundColor: colors.accent, borderColor: colors.accentStrong },
  editButtonText: { color: colors.accent, fontSize: 11, fontWeight: '900' },
  editButtonTextActive: { color: colors.black },
  previewEditRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 9, borderTopWidth: 1, borderTopColor: colors.border },
  previewEditAction: { minHeight: 32, borderRadius: 10, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border },
  previewEditText: { color: colors.text, fontSize: 9, fontWeight: '900' },
  previewRemove: { borderColor: '#5A3038' },
  previewRemoveText: { color: colors.danger },
  previewEditorFooter: { gap: 9, paddingBottom: 4 },
  addExerciseButton: { minHeight: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentDeep, borderWidth: 1, borderColor: colors.borderStrong },
  addExerciseText: { color: colors.accent, fontSize: 11, fontWeight: '900' },
  exerciseLibrary: { gap: 7 },
  libraryItem: { backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10 },
  libraryName: { color: colors.text, fontSize: 11, fontWeight: '900' },
  libraryMeta: { color: colors.muted, fontSize: 8, marginTop: 2 },
  previewFooter: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 10 },
  previewFooterText: { color: colors.muted, fontSize: 10, textAlign: 'center' },
  actionArea: { gap: 9, marginTop: 1 },
  startButton: { minHeight: 56, borderRadius: 17 },
  actionNote: { color: colors.mutedSoft, fontSize: 9, textAlign: 'center', lineHeight: 14 }
});
