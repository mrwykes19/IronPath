import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { StepControl } from '../components/StepControl';
import { exercisesById } from '../data/exercises';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { formatDuration } from '../utils/math';
import { EmptyStateGraphic } from '../components/Visuals';

export const WorkoutScreen = ({ goToday }: { goToday: () => void }) => {
  const { state, startWorkout, updateSet, updateMachineNote, updateWorkoutNotes, updateReadiness, swapExercise, finishWorkout, cancelWorkout } = useApp();
  const [restSeconds, setRestSeconds] = useState(0);
  const [manualCalories, setManualCalories] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [showSwap, setShowSwap] = useState(false);
  const [showReadiness, setShowReadiness] = useState(false);
  const [swapReason, setSwapReason] = useState('Equipment taken');

  useEffect(() => {
    if (!state.activeSession) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - new Date(state.activeSession!.startedAt).getTime()) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [state.activeSession]);

  useEffect(() => {
    if (restSeconds <= 0) return;
    const interval = setInterval(() => setRestSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(interval);
  }, [restSeconds]);

  const completedSets = useMemo(() => state.activeSession?.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed).length ?? 0, [state.activeSession]);
  const totalSets = useMemo(() => state.activeSession?.exercises.flatMap((exercise) => exercise.sets).length ?? 0, [state.activeSession]);
  const readiness = state.dailyReadiness!;
  const readinessScore = Math.round(((readiness.energy + (6 - readiness.soreness) + readiness.timeAvailable) / 15) * 100);
  const readinessMessage = readinessScore >= 75 ? 'Keep intensity' : readinessScore >= 55 ? 'Leave one extra rep in reserve' : 'Consider a lighter session';

  if (!state.activeSession) {
    return (
      <View style={styles.emptyState}>
        <EmptyStateGraphic kind="workout" />
        <Text style={styles.emptyText}>Start the next planned session and IronPath will load your recommended weights.</Text>
        <PrimaryButton title="Start next workout" onPress={startWorkout} />
        <PrimaryButton title="View today's plan" onPress={goToday} secondary />
      </View>
    );
  }

  const session = state.activeSession;
  const exerciseLog = session.exercises[Math.min(exerciseIndex, session.exercises.length - 1)]!;
  const exercise = exercisesById[exerciseLog.exerciseId];
  const selectedSet = exerciseLog.sets[Math.min(setIndex, exerciseLog.sets.length - 1)]!;
  const alternatives = exercise ? Array.from(new Map([
    ...exercise.substitutions.map((id) => exercisesById[id]),
    ...Object.values(exercisesById).filter((item) => item.id !== exercise.id && (item.muscleGroup === exercise.muscleGroup || item.primaryMuscle === exercise.primaryMuscle))
  ].filter((item): item is NonNullable<typeof item> => Boolean(item)).map((item) => [item.id, item])).values()).slice(0, 12) : [];

  const confirmCancel = () => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('Discard this workout?')) cancelWorkout();
      return;
    }
    Alert.alert('Discard workout?', 'The sets entered in this session will be removed.', [
      { text: 'Keep workout', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: cancelWorkout }
    ]);
  };

  const completeWorkout = () => {
    const result = finishWorkout(Number(manualCalories) || undefined);
    if (!result) return;
    const message = `Workout saved. ${Math.round(result.volume).toLocaleString()} ${state.profile.unit} of volume and ${result.calories} calories recorded.`;
    Platform.OS === 'web' ? globalThis.alert?.(message) : Alert.alert('Workout complete', message);
    goToday();
  };

  const markSelectedDone = () => {
    const completed = !selectedSet.completed;
    updateSet(exerciseIndex, setIndex, { completed });
    if (!completed) return;
    setRestSeconds(exerciseLog.restSeconds);
    const nextIncomplete = exerciseLog.sets.findIndex((set, index) => index > setIndex && !set.completed);
    if (nextIncomplete >= 0) setSetIndex(nextIncomplete);
    else if (exerciseIndex < session.exercises.length - 1) {
      setExerciseIndex(exerciseIndex + 1);
      setSetIndex(0);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.topBar}>
        <Pressable onPress={goToday} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
        <View style={styles.headerCenter}><Text style={styles.workoutTitle}>{session.name}</Text><Text style={styles.progressText}>{exerciseIndex + 1} of {session.exercises.length} · {completedSets}/{totalSets} sets</Text></View>
        <View style={styles.elapsedBox}><Text style={styles.elapsed}>{formatDuration(elapsed)}</Text></View>
      </View>

      <Card style={styles.readinessCard}>
        <Pressable onPress={() => setShowReadiness((value) => !value)} style={styles.readinessTop}>
          <View style={styles.readinessIcon}><Text style={styles.readinessIconText}>⚡</Text></View>
          <View style={styles.flex}>
            <Text style={styles.cardEyebrow}>SESSION READINESS</Text>
            <Text style={styles.readinessTitle}>{readinessMessage}</Text>
          </View>
          <View style={styles.readinessScoreBox}><Text style={styles.readinessScoreText}>{readinessScore}%</Text></View>
          <Text style={styles.readinessChevron}>{showReadiness ? '⌃' : '⌄'}</Text>
        </Pressable>
        {showReadiness ? (
          <View style={styles.readinessDetails}>
            {[
              { label: 'Energy', value: readiness.energy, key: 'energy' as const },
              { label: 'Soreness', value: readiness.soreness, key: 'soreness' as const },
              { label: 'Time', value: readiness.timeAvailable, key: 'timeAvailable' as const }
            ].map((item) => (
              <View key={item.key} style={styles.readinessScale}>
                <Text style={styles.readinessScaleLabel}>{item.label}</Text>
                <View style={styles.readinessNumbers}>
                  {[1, 2, 3, 4, 5].map((number) => (
                    <Pressable key={number} onPress={() => updateReadiness(item.key === 'energy' ? { energy: number } : item.key === 'soreness' ? { soreness: number } : { timeAvailable: number })} style={[styles.readinessNumber, item.value === number && styles.readinessNumberActive]}>
                      <Text style={[styles.readinessNumberText, item.value === number && styles.readinessNumberTextActive]}>{number}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
            <TextInput value={readiness.notes} onChangeText={(notes) => updateReadiness({ notes })} placeholder="Soreness, poor sleep, or anything to account for…" placeholderTextColor={colors.muted} style={styles.readinessNotes} />
          </View>
        ) : null}
      </Card>

      {showSwap ? (
        <Card style={styles.swapSheet}>
          <View style={styles.swapHeader}><View style={styles.flex}><Text style={styles.cardEyebrow}>SWAP EXERCISE</Text><Text style={styles.swapTitle}>{exercise?.name}</Text></View><Pressable onPress={() => setShowSwap(false)} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
          <Text style={styles.smallLabel}>Why are you swapping?</Text>
          <View style={styles.reasonOptions}>{['Equipment taken', 'Shoulder discomfort', 'Fatigue', 'Other'].map((reason) => <Pressable key={reason} onPress={() => setSwapReason(reason)} style={[styles.reasonChip, swapReason === reason && styles.reasonChipActive]}><Text style={[styles.reasonChipText, swapReason === reason && styles.reasonChipTextActive]}>{reason}</Text></Pressable>)}</View>
          <Text style={styles.smallLabel}>Best alternatives</Text>
          {alternatives.map((alternative, index) => (
            <Pressable key={alternative.id} onPress={() => { swapExercise(exerciseIndex, alternative.id, swapReason); setShowSwap(false); setSetIndex(0); }} style={styles.alternativeRow}>
              <View style={styles.altIcon}><Text style={styles.altIconText}>◆</Text></View>
              <View style={styles.flex}><Text style={styles.altName}>{alternative.name}</Text><Text style={styles.altMeta}>{alternative.primaryMuscle} · {alternative.equipment.replace('-', ' ')}</Text><Text style={styles.altReason}>{swapReason}</Text></View>
              <Text style={styles.similarity}>{Math.max(78, 94 - index * 5)}%</Text>
            </Pressable>
          ))}
          {!alternatives.length ? <Text style={styles.emptyText}>No ranked alternatives are configured for this exercise.</Text> : null}
        </Card>
      ) : (
        <>
          <Card style={styles.exerciseHero}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseGlyph}><Text style={styles.exerciseGlyphText}>{exercise?.name?.slice(0, 2).toUpperCase() ?? 'EX'}</Text></View>
              <View style={styles.flex}><Text style={styles.exerciseName}>{exercise?.name}</Text><Text style={styles.exerciseMuscles}>{exercise?.primaryMuscle} · {exercise?.equipment.replace('-', ' ')}</Text><Text style={styles.target}>{exerciseLog.targetSets} sets · {exerciseLog.minReps}–{exerciseLog.maxReps} reps</Text></View>
              <Pressable onPress={() => setShowSwap(true)} style={styles.swapIcon}><Text style={styles.swapIconText}>⇄</Text></Pressable>
            </View>

            <View style={styles.setTabs}>
              {exerciseLog.sets.map((set, index) => <Pressable key={set.id} onPress={() => setSetIndex(index)} style={[styles.setTab, setIndex === index && styles.setTabActive, set.completed && styles.setTabDone]}><Text style={[styles.setTabText, setIndex === index && styles.setTabTextActive]}>{set.completed ? '✓' : `SET ${index + 1}`}</Text></Pressable>)}
            </View>

            <View style={styles.controlRow}>
              <View style={styles.controlBlock}><Text style={styles.controlLabel}>WEIGHT ({state.profile.unit.toUpperCase()})</Text><StepControl compact value={selectedSet.weight} onChange={(weight) => updateSet(exerciseIndex, setIndex, { weight })} step={exercise?.defaultWeight === 0 ? 1 : 5} /></View>
              <View style={styles.controlBlock}><Text style={styles.controlLabel}>REPS</Text><StepControl compact value={selectedSet.reps} onChange={(reps) => updateSet(exerciseIndex, setIndex, { reps })} min={0} max={30} /></View>
              <View style={styles.controlBlock}><Text style={styles.controlLabel}>RIR</Text><StepControl compact value={selectedSet.rir} onChange={(rir) => updateSet(exerciseIndex, setIndex, { rir })} min={0} max={5} /></View>
            </View>
            <Text style={styles.previousText}>Recommended: {exerciseLog.recommendation.weight} {state.profile.unit} · {exerciseLog.recommendation.reason}</Text>
          </Card>

          <Card style={styles.timerCard}>
            <View><Text style={styles.cardEyebrow}>REST TIMER</Text><Text style={styles.timerHint}>{restSeconds ? 'Recover for the next set' : 'Starts after a completed set'}</Text></View>
            <View style={styles.timerRing}><Text style={styles.timerValue}>{formatDuration(restSeconds || exerciseLog.restSeconds)}</Text></View>
            <Pressable onPress={() => setRestSeconds(0)} style={styles.skipButton}><Text style={styles.skipText}>{restSeconds ? 'Skip' : 'Ready'}</Text></Pressable>
          </Card>

          <Card style={styles.rirCard}>
            <Text style={styles.infoIcon}>ⓘ</Text>
            <Text style={styles.rirText}><Text style={styles.rirStrong}>RIR (Reps In Reserve)</Text> is how many good reps you could do before failure. Leaving 1–3 RIR helps build strength while preserving recovery.</Text>
          </Card>

          <PrimaryButton title={selectedSet.completed ? 'Undo set' : 'Done  ✓'} onPress={markSelectedDone} />

          <View style={styles.exerciseNav}>
            <Pressable disabled={exerciseIndex === 0} onPress={() => { setExerciseIndex(Math.max(0, exerciseIndex - 1)); setSetIndex(0); }} style={[styles.navButton, exerciseIndex === 0 && styles.navDisabled]}><Text style={styles.navButtonText}>‹ Previous</Text></Pressable>
            <Pressable disabled={exerciseIndex === session.exercises.length - 1} onPress={() => { setExerciseIndex(Math.min(session.exercises.length - 1, exerciseIndex + 1)); setSetIndex(0); }} style={[styles.navButton, exerciseIndex === session.exercises.length - 1 && styles.navDisabled]}><Text style={styles.navButtonText}>Next ›</Text></Pressable>
          </View>
        </>
      )}

      <Card>
        <Text style={styles.cardTitle}>Workout notes</Text>
        <TextInput value={session.notes ?? ''} onChangeText={updateWorkoutNotes} multiline placeholder="Pain, form cues, equipment notes, or anything to remember…" placeholderTextColor={colors.muted} style={styles.notesInput} />
        <TextInput value={exerciseLog.machineNote ?? ''} onChangeText={(note) => updateMachineNote(exerciseIndex, note)} placeholder="Machine setup: seat, handle, pin position…" placeholderTextColor={colors.muted} style={styles.machineInput} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Finish workout</Text>
        <Text style={styles.finishCopy}>Enter calories shown by Apple Fitness or your watch, or leave blank for an estimate.</Text>
        <TextInput value={manualCalories} onChangeText={setManualCalories} keyboardType="decimal-pad" placeholder="Optional calories" placeholderTextColor={colors.muted} style={styles.machineInput} />
        <PrimaryButton title="Complete and save workout" onPress={completeWorkout} disabled={completedSets === 0} />
        <PrimaryButton title="Discard workout" onPress={confirmCancel} secondary />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 12, paddingBottom: 116 },
  emptyState: { flex: 1, minHeight: 600, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 13 },
  emptyIcon: { color: colors.accent, fontSize: 40 },
  emptyTitle: { color: colors.text, fontSize: 24, fontWeight: '900' },
  emptyText: { color: colors.muted, textAlign: 'center', fontSize: 11, lineHeight: 17 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  back: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 28, lineHeight: 30 },
  headerCenter: { flex: 1, alignItems: 'center' },
  workoutTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  progressText: { color: colors.muted, fontSize: 9, marginTop: 2 },
  elapsedBox: { width: 58, height: 38, borderRadius: 12, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  elapsed: { color: colors.text, fontSize: 10, fontWeight: '900', fontVariant: ['tabular-nums'] },
  flex: { flex: 1 },

  readinessCard: { padding: 11, gap: 10, backgroundColor: colors.panelSoft },
  readinessTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  readinessIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.accentDark, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  readinessIconText: { fontSize: 15 },
  readinessTitle: { color: colors.text, fontSize: 11, fontWeight: '900', marginTop: 2 },
  readinessScoreBox: { minWidth: 48, height: 31, borderRadius: 10, backgroundColor: colors.accentDark, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  readinessScoreText: { color: colors.accent, fontSize: 10, fontWeight: '900' },
  readinessChevron: { color: colors.muted, fontSize: 14 },
  readinessDetails: { gap: 9, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  readinessScale: { gap: 5 },
  readinessScaleLabel: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  readinessNumbers: { flexDirection: 'row', gap: 6 },
  readinessNumber: { flex: 1, minHeight: 31, borderRadius: 9, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  readinessNumberActive: { backgroundColor: colors.accent, borderColor: colors.accentStrong },
  readinessNumberText: { color: colors.muted, fontSize: 10, fontWeight: '900' },
  readinessNumberTextActive: { color: colors.black },
  readinessNotes: { minHeight: 42, borderRadius: 11, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 10, fontSize: 10 },
  exerciseHero: { backgroundColor: colors.accentDeep, borderColor: colors.borderStrong, padding: 14 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exerciseGlyph: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  exerciseGlyphText: { color: colors.accent, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 },
  exerciseName: { color: colors.text, fontSize: 17, fontWeight: '900' },
  exerciseMuscles: { color: colors.muted, fontSize: 9, marginTop: 3, textTransform: 'capitalize' },
  target: { color: colors.accent, fontSize: 9, marginTop: 5, fontWeight: '800' },
  swapIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  swapIconText: { color: colors.accent, fontSize: 19, fontWeight: '900' },
  setTabs: { flexDirection: 'row', gap: 6, marginTop: 2 },
  setTab: { flex: 1, minHeight: 34, borderRadius: 10, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  setTabActive: { backgroundColor: colors.accent, borderColor: colors.accentStrong },
  setTabDone: { borderColor: colors.accent },
  setTabText: { color: colors.muted, fontSize: 8, fontWeight: '900' },
  setTabTextActive: { color: colors.black },
  controlRow: { flexDirection: 'row', gap: 6, marginTop: 3 },
  controlBlock: { flex: 1, gap: 5 },
  controlLabel: { color: colors.mutedSoft, fontSize: 7, fontWeight: '900', textAlign: 'center' },
  previousText: { color: colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'center' },
  timerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardEyebrow: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  timerHint: { color: colors.muted, fontSize: 9, marginTop: 3 },
  timerRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 6, borderColor: colors.accent, backgroundColor: colors.panelSoft, alignItems: 'center', justifyContent: 'center' },
  timerValue: { color: colors.text, fontSize: 17, fontWeight: '900', fontVariant: ['tabular-nums'] },
  skipButton: { minWidth: 50, minHeight: 34, borderRadius: 10, backgroundColor: colors.panelRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  skipText: { color: colors.text, fontSize: 9, fontWeight: '900' },
  rirCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: colors.panelSoft },
  infoIcon: { color: colors.accent, fontSize: 17 },
  rirText: { color: colors.muted, fontSize: 10, lineHeight: 15, flex: 1 },
  rirStrong: { color: colors.text, fontWeight: '900' },
  exerciseNav: { flexDirection: 'row', gap: 8 },
  navButton: { flex: 1, minHeight: 42, borderRadius: 12, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  navDisabled: { opacity: 0.35 },
  navButtonText: { color: colors.text, fontSize: 10, fontWeight: '900' },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  notesInput: { minHeight: 82, borderRadius: 13, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: 11, textAlignVertical: 'top', fontSize: 11 },
  machineInput: { minHeight: 45, borderRadius: 13, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 11, fontSize: 11 },
  finishCopy: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  swapSheet: { borderColor: colors.accentDark },
  swapHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swapTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 2 },
  close: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.panelRaised, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.text, fontSize: 22 },
  smallLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', marginTop: 3 },
  reasonOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  reasonChip: { borderRadius: 999, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 9, paddingVertical: 7 },
  reasonChipActive: { backgroundColor: colors.accent, borderColor: colors.accentStrong },
  reasonChipText: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  reasonChipTextActive: { color: colors.black },
  alternativeRow: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10, borderRadius: 13, backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: colors.border },
  altIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.panelRaised, alignItems: 'center', justifyContent: 'center' },
  altIconText: { color: colors.accent, fontSize: 13 },
  altName: { color: colors.text, fontSize: 12, fontWeight: '900' },
  altMeta: { color: colors.muted, fontSize: 8, marginTop: 2, textTransform: 'capitalize' },
  altReason: { color: colors.accent, fontSize: 8, marginTop: 3 },
  similarity: { color: colors.accent, fontSize: 10, fontWeight: '900' }
});
