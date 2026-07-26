import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { ProgramExercise, WorkoutTemplate } from '../types';


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
  if (value >= 1000) { const scaled = value / 1000; return `${scaled.toFixed(Number.isInteger(scaled) ? 0 : 1)}k`; }
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
    <View style={styles.quickTop}>
      <MetricGraphic kind={kind} />
      <Text style={styles.quickLabel}>{label}</Text>
    </View>
    <Text style={styles.quickValue} numberOfLines={1}>{value}</Text>
    <Text style={styles.quickDetail} numberOfLines={2}>{detail}</Text>
    <View style={styles.metricAccent} />
  </View>
);


const defaultTrainingDayIndexes = (days: number) => days <= 2 ? [0, 3] : days === 3 ? [0, 2, 4] : days === 4 ? [0, 1, 3, 4] : [0, 1, 2, 4, 5];

const startOfWeek = () => {
  const date = new Date();
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  date.setHours(12, 0, 0, 0);
  return date;
};

export const TodayScreen = ({ openTrain, openHistory, openSettings }: { openTrain: () => void; openHistory: () => void; openSettings: () => void }) => {
  const { state, startWorkout, startCustomWorkout, startPlannedWorkout, updatePlannedWorkout, updatePlannedExercise, movePlannedExercise, removePlannedExercise, addPlannedExercise } = useApp();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState<number | undefined>();
  const [editingPreview, setEditingPreview] = useState(false);
  const [showAddExercises, setShowAddExercises] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [showCustomLibrary, setShowCustomLibrary] = useState(true);
  const [customName, setCustomName] = useState('Custom Workout');
  const [customExercises, setCustomExercises] = useState<ProgramExercise[]>([]);
  const template = getNextTemplate(state);
  const plannedWorkouts = state.weeklyPlan?.workouts ?? [];
  const currentWorkoutIndex = plannedWorkouts.length ? state.nextTemplateIndex % plannedWorkouts.length : 0;
  const blockWeek = state.weeklyPlan?.blockWeek ?? 1;
  const summary = weeklySummary(state);
  const streak = workoutStreak(state);
  const currentWorkoutName = state.activeSession?.name ?? template?.name ?? 'Prime Movers';
  const heroKind = workoutVisualKind(currentWorkoutName, template?.focus);
  const workoutGoal = Math.max(1, state.profile.trainingDays);
  const dailyCalorieGoal = Math.max(1, state.profile.dailyCalorieGoal ?? Math.round((state.profile.weeklyCalorieGoal ?? 6000) / Math.max(1, state.profile.trainingDays)));
  const calorieGoal = dailyCalorieGoal * workoutGoal;
  const cardioDaysGoal = Math.max(0, Math.min(7, state.profile.weeklyCardioDaysGoal ?? 3));
  const dailyActiveMinutesGoal = Math.max(1, state.profile.dailyActiveMinutesGoal ?? Math.round((state.profile.weeklyActiveMinutesGoal ?? 240) / Math.max(1, workoutGoal)));
  const activeMinutesGoal = dailyActiveMinutesGoal * workoutGoal;
  const workoutProgress = Math.min(100, Math.round((summary.workouts / workoutGoal) * 100));
  const calorieProgress = Math.round((summary.calories / calorieGoal) * 100);
  const calorieFill = Math.min(100, calorieProgress);
  const calorieColor = calorieProgress >= 100 ? '#F6C84A' : calorieProgress >= 75 ? '#34D17B' : calorieProgress >= 40 ? '#F3A43B' : '#E5535F';
  const cardioDaysProgress = cardioDaysGoal === 0 ? (summary.cardioDays > 0 ? 100 : 0) : Math.min(100, Math.round((summary.cardioDays / cardioDaysGoal) * 100));
  const activeMinutesProgress = Math.min(100, Math.round((summary.activeMinutes / activeMinutesGoal) * 100));
  const weekStart = startOfWeek();
  const workoutDayIndexes = (state.profile.trainingWeekdays?.length === state.profile.trainingDays ? state.profile.trainingWeekdays : defaultTrainingDayIndexes(state.profile.trainingDays)).slice().sort((a, b) => a - b);
  const schedule = workoutDayIndexes.map((dayIndex, workoutIndex) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);
    return { dayIndex, date, workoutIndex, workout: plannedWorkouts[workoutIndex] };
  });
  const selectedScheduledWorkout = selectedScheduleIndex !== undefined ? plannedWorkouts[selectedScheduleIndex] : undefined;

  const handleStart = () => {
    startWorkout();
    openTrain();
  };

  const defaultCustomExercise = (exerciseId: string): ProgramExercise => {
    const exercise = exercisesById[exerciseId]!;
    return {
      exerciseId,
      sets: 3,
      minReps: exercise.compound ? 6 : 10,
      maxReps: exercise.compound ? 10 : 15,
      restSeconds: exercise.compound ? 120 : 75
    };
  };

  const openBlankCustomWorkout = () => {
    setCustomName('Custom Workout');
    setCustomExercises([]);
    setShowCustomLibrary(true);
    setShowCustomBuilder(true);
  };

  const useRecommendedAsCustomBase = () => {
    setCustomName(`${template?.name ?? 'Custom Workout'} — Custom`);
    setCustomExercises((template?.exercises ?? []).map((exercise) => ({ ...exercise })));
    setShowCustomLibrary(false);
    setShowCustomBuilder(true);
  };

  const updateCustomExercise = (index: number, patch: Partial<ProgramExercise>) =>
    setCustomExercises((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));

  const moveCustomExercise = (index: number, direction: -1 | 1) => setCustomExercises((items) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target]!, next[index]!];
    return next;
  });

  const beginCustomWorkout = () => {
    if (!customExercises.length) return;
    const customTemplate: WorkoutTemplate = {
      id: `custom-${Date.now()}`,
      name: customName.trim() || 'Custom Workout',
      focus: 'One-off custom session',
      estimatedMinutes: Math.max(20, Math.round(customExercises.reduce((total, item) => total + item.sets * (item.restSeconds / 60 + 1.1), 0))),
      exercises: customExercises
    };
    startCustomWorkout(customTemplate);
    setShowCustomBuilder(false);
    openTrain();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.topBrandWrap}>
        <Image source={require('../../assets/v62/today_header.png')} resizeMode="contain" style={styles.topBrandImage} />
      </View>
      <View style={styles.headingRow}>
        <View style={styles.flex}>
          <Text style={styles.title}>Ready to train?</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          <View style={styles.quoteRow}><View style={styles.quoteLine} /><Text style={styles.quote}>“{quoteForToday()}”</Text></View>
        </View>
        <Pressable onPress={openHistory} style={styles.historyButton}>
          <Text style={styles.historyIcon}>▦</Text>
          <Text style={styles.historyText}>History</Text>
        </Pressable>
      </View>

      <View style={styles.todayHeroWrap}>
        <Image source={require('../../assets/v63/today_hero.png')} resizeMode="cover" style={styles.todayHeroImage} />
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
          </View>
        </Card>
      </Pressable>

      <View style={styles.openSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>This week</Text>
            <Text style={styles.sectionSubtitle}>Your selected training days</Text>
          </View>
          <Text style={styles.sectionNote}>{(state.profile.trainingSplit ?? 'auto').replace(/-/g, ' ').toUpperCase()}</Text>
        </View>
        <View style={styles.scheduleRow}>
          {schedule.map((item) => {
            const today = new Date().toDateString() === item.date.toDateString();
            return (
              <Pressable key={item.dayIndex} disabled={!item.workout} onPress={() => item.workout && setSelectedScheduleIndex(item.workoutIndex)} style={[styles.scheduleDay, today && styles.scheduleDayToday, item.workout && styles.scheduleDayWorkout]}>
                <Text style={[styles.scheduleDayName, today && styles.scheduleDayNameToday]}>{item.date.toLocaleDateString(undefined, { weekday: 'narrow' })}</Text>
                <Text style={[styles.scheduleDayNumber, today && styles.scheduleDayNumberToday]}>{item.date.getDate()}</Text>
                <View style={[styles.scheduleDot, item.workout && styles.scheduleDotActive]} />
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.scheduleHint}>{plannedWorkouts.length} planned strength sessions · change workout days in Settings</Text>
      </View>

      <View style={styles.openSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Weekly goals</Text>
            <Text style={styles.sectionSubtitle}>Your training pace this week</Text>
          </View>
          <Text style={styles.sectionNote}>THIS WEEK</Text>
        </View>
        <View style={styles.goalGridThree}>
          <View style={styles.goalCellThree}><ProgressRing value={`${summary.workouts}/${workoutGoal}`} label="Total workouts" progress={workoutProgress} /></View>
          <View style={styles.goalCellThree}><ProgressRing value={`${summary.cardioDays}/${cardioDaysGoal}`} label="Cardio days" progress={cardioDaysProgress} /></View>
          <View style={styles.goalCellThree}><ProgressRing value={`${summary.activeMinutes}/${activeMinutesGoal}`} label="Active minutes" progress={activeMinutesProgress} /></View>
        </View>
        <View style={styles.calorieGoalCard}>
          <View style={styles.calorieGoalTop}>
            <View><Text style={styles.calorieGoalLabel}>CALORIES BURNED</Text><Text style={styles.calorieGoalValue}>{compactNumber(summary.calories)} <Text style={styles.calorieGoalTarget}>of {compactNumber(calorieGoal)}</Text></Text></View>
            <Text style={[styles.calorieGoalPercent, { color: calorieColor }]}>{calorieProgress}%</Text>
          </View>
          <View style={styles.calorieTrack}><View style={[styles.calorieFill, { width: `${calorieFill}%`, backgroundColor: calorieColor }]} /></View>
          <Text style={styles.calorieGoalDetail}>{compactNumber(dailyCalorieGoal)} daily goal × {workoutGoal} planned days</Text>
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
          <QuickMetric kind="workouts" label="WORKOUTS" value={`${summary.workouts}`} detail={`${summary.strengthWorkouts} strength · ${summary.cardioWorkouts} cardio`} />
          <QuickMetric kind="calories" label="CALORIES" value={summary.calories ? compactNumber(summary.calories) : '—'} detail="Strength + cardio" />
          <QuickMetric kind="streak" label="STREAK" value={`${streak} day${streak === 1 ? '' : 's'}`} detail={streak ? 'Keep the momentum' : 'Start today'} />
        </View>
      </View>


      <Modal visible={selectedScheduleIndex !== undefined} transparent animationType="slide" onRequestClose={() => setSelectedScheduleIndex(undefined)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={() => setSelectedScheduleIndex(undefined)} />
          <View style={styles.scheduleSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.previewHeader}>
              <View style={styles.flex}>
                <Text style={styles.sectionEyebrow}>WEEKLY SCHEDULE</Text>
                <Text style={styles.previewTitle}>{selectedScheduledWorkout?.name ?? 'Planned workout'}</Text>
                <Text style={styles.previewFocus}>{selectedScheduledWorkout?.focus}</Text>
              </View>
              <Pressable onPress={() => setSelectedScheduleIndex(undefined)} style={styles.closeButton}><Text style={styles.closeButtonText}>×</Text></Pressable>
            </View>
            <ScrollView style={styles.schedulePreviewScroll} contentContainerStyle={styles.schedulePreviewContent}>
              {(selectedScheduledWorkout?.exercises ?? []).map((item, index) => (
                <View key={`${item.exerciseId}-${index}`} style={styles.scheduleExercise}>
                  <View style={styles.scheduleExerciseNumber}><Text style={styles.scheduleExerciseNumberText}>{index + 1}</Text></View>
                  <View style={styles.flex}><Text style={styles.scheduleExerciseName}>{exercisesById[item.exerciseId]?.name ?? item.exerciseId}</Text><Text style={styles.scheduleExerciseMeta}>{item.sets} sets · {item.minReps}–{item.maxReps} reps · {Math.round(item.restSeconds / 60)} min rest</Text></View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.previewFooter}>
              <Text style={styles.previewFooterText}>{selectedScheduledWorkout?.exercises.length ?? 0} exercises · about {selectedScheduledWorkout?.estimatedMinutes ?? 60} minutes</Text>
              <PrimaryButton title="Start this workout   →" onPress={() => { const index = selectedScheduleIndex; setSelectedScheduleIndex(undefined); if (index !== undefined) { startPlannedWorkout(index); openTrain(); } }} />
              <PrimaryButton title="Edit in Training Plan" secondary onPress={() => { setSelectedScheduleIndex(undefined); openSettings(); }} />
            </View>
          </View>
        </View>
      </Modal>

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

      <Modal visible={showCustomBuilder} transparent animationType="slide" onRequestClose={() => setShowCustomBuilder(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={() => setShowCustomBuilder(false)} />
          <View style={styles.customSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.customHeader}>
              <View style={styles.flex}>
                <Text style={styles.sectionEyebrow}>ONE-OFF SESSION</Text>
                <Text style={styles.previewTitle}>Build a custom workout</Text>
                <Text style={styles.previewFocus}>This session will be saved to your history but will not replace or advance the recommended plan.</Text>
              </View>
              <Pressable onPress={() => setShowCustomBuilder(false)} style={styles.closeButton}><Text style={styles.closeButtonText}>×</Text></Pressable>
            </View>

            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder="Workout name"
              placeholderTextColor={colors.mutedSoft}
              style={styles.customNameInput}
            />

            <View style={styles.customPresetRow}>
              <Pressable onPress={openBlankCustomWorkout} style={styles.customPreset}><Text style={styles.customPresetTitle}>Start blank</Text><Text style={styles.customPresetCopy}>Choose every exercise.</Text></Pressable>
              <Pressable onPress={useRecommendedAsCustomBase} style={styles.customPreset}><Text style={styles.customPresetTitle}>Use today as base</Text><Text style={styles.customPresetCopy}>Customize the recommended plan.</Text></Pressable>
            </View>

            <ScrollView style={styles.customScroll} contentContainerStyle={styles.customScrollContent} keyboardShouldPersistTaps="handled">
              <View style={styles.customSectionHeader}>
                <Text style={styles.customSectionTitle}>Selected exercises</Text>
                <Text style={styles.customCount}>{customExercises.length}</Text>
              </View>
              {customExercises.length ? customExercises.map((item, index) => {
                const exercise = exercisesById[item.exerciseId];
                return (
                  <View key={`${item.exerciseId}-${index}`} style={styles.customExerciseCard}>
                    <View style={styles.customExerciseTop}>
                      <View style={styles.customNumber}><Text style={styles.customNumberText}>{index + 1}</Text></View>
                      <View style={styles.flex}>
                        <Text style={styles.customExerciseName}>{exercise?.name}</Text>
                        <Text style={styles.customExerciseMeta}>{exercise?.muscleGroup} · {exercise?.equipment}</Text>
                      </View>
                      <Pressable onPress={() => setCustomExercises((items) => items.filter((_, itemIndex) => itemIndex !== index))} style={styles.customRemove}><Text style={styles.customRemoveText}>Remove</Text></Pressable>
                    </View>
                    <View style={styles.customControls}>
                      <View style={styles.customControlGroup}><Text style={styles.customControlLabel}>SETS</Text><View style={styles.customStepper}><Pressable onPress={() => updateCustomExercise(index, { sets: Math.max(1, item.sets - 1) })}><Text style={styles.customStep}>−</Text></Pressable><Text style={styles.customStepValue}>{item.sets}</Text><Pressable onPress={() => updateCustomExercise(index, { sets: item.sets + 1 })}><Text style={styles.customStep}>+</Text></Pressable></View></View>
                      <View style={styles.customControlGroup}><Text style={styles.customControlLabel}>REPS</Text><Text style={styles.customRange}>{item.minReps}–{item.maxReps}</Text></View>
                      <View style={styles.customMoveGroup}><Pressable onPress={() => moveCustomExercise(index, -1)} style={styles.customMove}><Text style={styles.customMoveText}>↑</Text></Pressable><Pressable onPress={() => moveCustomExercise(index, 1)} style={styles.customMove}><Text style={styles.customMoveText}>↓</Text></Pressable></View>
                    </View>
                  </View>
                );
              }) : <View style={styles.customEmpty}><Text style={styles.customEmptyTitle}>No exercises selected</Text><Text style={styles.customEmptyCopy}>Add exercises below or use today’s plan as a starting point.</Text></View>}

              <Pressable onPress={() => setShowCustomLibrary((value) => !value)} style={styles.addCustomExercise}><Text style={styles.addCustomExerciseText}>{showCustomLibrary ? 'Hide exercise library' : '+ Add exercises'}</Text></Pressable>
              {showCustomLibrary ? (
                <View style={styles.customLibrary}>
                  {exerciseLibrary.map((exercise) => {
                    const selected = customExercises.some((item) => item.exerciseId === exercise.id);
                    return (
                      <Pressable
                        key={exercise.id}
                        disabled={selected}
                        onPress={() => setCustomExercises((items) => [...items, defaultCustomExercise(exercise.id)])}
                        style={[styles.customLibraryItem, selected && styles.customLibraryItemSelected]}
                      >
                        <View style={styles.flex}><Text style={styles.customLibraryName}>{exercise.name}</Text><Text style={styles.customLibraryMeta}>{exercise.muscleGroup} · {exercise.equipment}</Text></View>
                        <Text style={styles.customLibraryAction}>{selected ? 'Added' : '+ Add'}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.customFooter}>
              <Text style={styles.customFooterText}>{customExercises.length ? `${customExercises.length} exercises selected` : 'Add at least one exercise to begin.'}</Text>
              <PrimaryButton title="Start custom workout   →" onPress={beginCustomWorkout} disabled={!customExercises.length} />
            </View>
          </View>
        </View>
      </Modal>

      <CardioTracker />

      <View style={styles.actionArea}>
        <PrimaryButton
          title={state.activeSession ? 'Continue workout   →' : 'Start recommended workout   →'}
          onPress={state.activeSession ? openTrain : handleStart}
          style={styles.startButton}
        />
        {!state.activeSession ? <PrimaryButton title="Build custom workout" onPress={openBlankCustomWorkout} secondary /> : null}
        <Text style={styles.actionNote}>A custom workout is saved to Gains and History without changing your recommended workout sequence.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 17, paddingTop: 20, gap: 22, paddingBottom: 110 },
  topBrandWrap: { width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: -8 },
  topBrandImage: { width: 340, height: 137, maxWidth: '94%', alignSelf: 'center' },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  flex: { flex: 1 },
  brandTitle: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: 1.2 },
  overline: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.35, marginTop: 2 },
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
  todayHeroWrap: { width: '100%', aspectRatio: 2.0877, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: '#06101B' },
  todayHeroImage: { width: '100%', height: '100%' },
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
  goalGridThree: { flexDirection: 'row', gap: 4, paddingHorizontal: 0 },
  goalCellThree: { flex: 1, alignItems: 'center', paddingVertical: 5 },
  calorieGoalCard: { marginTop: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, padding: 14 },
  calorieGoalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calorieGoalLabel: { color: colors.mutedSoft, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  calorieGoalValue: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 3 },
  calorieGoalTarget: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  calorieGoalPercent: { fontSize: 17, fontWeight: '900' },
  calorieTrack: { height: 12, borderRadius: 999, backgroundColor: '#24151A', overflow: 'hidden', marginTop: 11 },
  calorieFill: { height: '100%', borderRadius: 999 },
  calorieGoalDetail: { color: colors.muted, fontSize: 9, marginTop: 8 },
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
  quickMetricGlow: { display: 'none' },
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
  actionNote: { color: colors.mutedSoft, fontSize: 9, textAlign: 'center', lineHeight: 14 },
  customSheet: { maxHeight: '91%', backgroundColor: colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 17, paddingTop: 10, paddingBottom: 16 },
  customHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 5, marginBottom: 12 },
  customNameInput: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: '#08111A', color: colors.text, fontSize: 15, fontWeight: '800', paddingHorizontal: 13, marginBottom: 10 },
  customPresetRow: { flexDirection: 'row', gap: 9, marginBottom: 12 },
  customPreset: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panelRaised, padding: 11 },
  customPresetTitle: { color: colors.accent, fontSize: 11, fontWeight: '900' },
  customPresetCopy: { color: colors.muted, fontSize: 9, lineHeight: 13, marginTop: 3 },
  customScroll: { maxHeight: 510 },
  customScrollContent: { gap: 9, paddingBottom: 16 },
  customSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  customSectionTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  customCount: { color: colors.accent, fontSize: 11, fontWeight: '900', borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.accentDeep, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  customExerciseCard: { borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: '#08111A', padding: 11, gap: 10 },
  customExerciseTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  customNumber: { width: 27, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentDeep, borderWidth: 1, borderColor: colors.borderStrong },
  customNumberText: { color: colors.accent, fontSize: 10, fontWeight: '900' },
  customExerciseName: { color: colors.text, fontSize: 12, fontWeight: '900' },
  customExerciseMeta: { color: colors.muted, fontSize: 9, marginTop: 2, textTransform: 'capitalize' },
  customRemove: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, backgroundColor: '#351A22', borderWidth: 1, borderColor: '#6A2A3A' },
  customRemoveText: { color: colors.danger, fontSize: 8, fontWeight: '900' },
  customControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customControlGroup: { gap: 4 },
  customControlLabel: { color: colors.mutedSoft, fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  customStepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden' },
  customStep: { color: colors.text, fontSize: 17, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.panelRaised },
  customStepValue: { color: colors.text, fontSize: 11, fontWeight: '900', minWidth: 30, textAlign: 'center' },
  customRange: { color: colors.text, fontSize: 12, fontWeight: '900', paddingVertical: 6 },
  customMoveGroup: { marginLeft: 'auto', flexDirection: 'row', gap: 5 },
  customMove: { width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border },
  customMoveText: { color: colors.accent, fontSize: 14, fontWeight: '900' },
  customEmpty: { borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, padding: 18, alignItems: 'center' },
  customEmptyTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  customEmptyCopy: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 4 },
  addCustomExercise: { minHeight: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.accentDeep },
  addCustomExerciseText: { color: colors.accent, fontSize: 11, fontWeight: '900' },
  customLibrary: { gap: 7 },
  customLibraryItem: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panelRaised, paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  customLibraryItemSelected: { opacity: 0.5 },
  customLibraryName: { color: colors.text, fontSize: 11, fontWeight: '900' },
  customLibraryMeta: { color: colors.muted, fontSize: 8, marginTop: 2, textTransform: 'capitalize' },
  customLibraryAction: { color: colors.accent, fontSize: 9, fontWeight: '900' },
  customFooter: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 9 },
  customFooterText: { color: colors.muted, fontSize: 9, textAlign: 'center' },

  scheduleRow: { flexDirection: 'row', gap: 6 },
  scheduleDay: { flex: 1, minHeight: 70, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panelSoft, alignItems: 'center', justifyContent: 'center', gap: 3, opacity: 0.65 },
  scheduleDayWorkout: { opacity: 1, backgroundColor: colors.panelRaised, borderColor: colors.borderStrong },
  scheduleDayToday: { borderColor: colors.accent },
  scheduleDayName: { color: colors.muted, fontSize: 9, fontWeight: '900' },
  scheduleDayNameToday: { color: colors.accent },
  scheduleDayNumber: { color: colors.text, fontSize: 16, fontWeight: '900' },
  scheduleDayNumberToday: { color: colors.accent },
  scheduleDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border },
  scheduleDotActive: { backgroundColor: colors.accent },
  scheduleHint: { color: colors.muted, fontSize: 10, textAlign: 'center' },
  scheduleSheet: { maxHeight: '82%', backgroundColor: colors.panel, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: colors.borderStrong, padding: 16, gap: 12 },
  schedulePreviewScroll: { maxHeight: 390 },
  schedulePreviewContent: { gap: 8, paddingBottom: 8 },
  scheduleExercise: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panelSoft, padding: 10 },
  scheduleExerciseNumber: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.accentDark, alignItems: 'center', justifyContent: 'center' },
  scheduleExerciseNumberText: { color: colors.accent, fontSize: 10, fontWeight: '900' },
  scheduleExerciseName: { color: colors.text, fontSize: 12, fontWeight: '900' },
  scheduleExerciseMeta: { color: colors.muted, fontSize: 9, marginTop: 2 },
});
