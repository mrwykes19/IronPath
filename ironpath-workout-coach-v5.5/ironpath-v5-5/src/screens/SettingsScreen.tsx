import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../components/Card';
import { goalProgramProfiles } from '../data/program';
import { exerciseLibrary, exercisesById } from '../data/exercises';
import { PrimaryButton } from '../components/PrimaryButton';
import { exportBackupFile, selectBackupFile } from '../services/backup';
import { BackupSummary, IronPathBackupDocument } from '../services/backup.types';
import { connectHealthKit } from '../services/healthkit';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { BackupRestoreMode, Experience, Goal, WorkoutVariety } from '../types';
import { getTrainingPhaseProfile, previewTrainingPhase, trainingPhaseProfiles } from '../engine/weeklyPlanner';

const notify = (title: string, message: string) => Platform.OS === 'web' ? globalThis.alert?.(`${title}\n\n${message}`) : Alert.alert(title, message);

const formatDateTime = (iso?: string) => {
  if (!iso) return 'No backup created yet';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Backup date unavailable';
  return date.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

interface PendingImport {
  backup: IronPathBackupDocument;
  summary: BackupSummary;
  filename: string;
}

export const SettingsScreen = () => {
  const { state, updateProfile, setHealthKitConnected, markBackupCreated, restoreBackup, resetAllData, generatePlan, advanceTrainingPhase, repeatTrainingPhase, regenerateTrainingPhase, updatePlannedWorkout, updatePlannedExercise, movePlannedExercise, removePlannedExercise, addPlannedExercise, toggleExerciseLock } = useApp();
  const [goalWeight, setGoalWeight] = useState(state.profile.goalWeight?.toString() ?? '');
  const [backupBusy, setBackupBusy] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport>();
  const [expandedWorkout, setExpandedWorkout] = useState<number | undefined>();
  const [addExerciseFor, setAddExerciseFor] = useState<number | undefined>();
  const [selectedPhase, setSelectedPhase] = useState(state.weeklyPlan?.blockWeek ?? 1);
  const [expandedPhaseWorkout, setExpandedPhaseWorkout] = useState<number | undefined>();

  useEffect(() => {
    if (!state.weeklyPlan) generatePlan(state.profile.workoutVariety ?? 'moderate');
  }, [state.weeklyPlan]);

  useEffect(() => {
    setSelectedPhase(state.weeklyPlan?.blockWeek ?? 1);
  }, [state.weeklyPlan?.blockWeek]);

  const phasePreview = useMemo(() => previewTrainingPhase(state, selectedPhase), [state, selectedPhase]);
  const phaseProfile = getTrainingPhaseProfile(selectedPhase);
  const currentPhase = state.weeklyPlan?.blockWeek ?? 1;
  const phaseStartedAt = new Date(state.weeklyPlan?.generatedAt ?? Date.now()).getTime();
  const phaseSessions = state.sessions.filter((session) => Boolean(session.completedAt) && new Date(session.completedAt!).getTime() >= phaseStartedAt);
  const phaseCardio = (state.cardioSessions ?? []).filter((session) => Boolean(session.completedAt) && new Date(session.completedAt!).getTime() >= phaseStartedAt);
  const completedSets = phaseSessions.reduce((total, session) => total + session.exercises.reduce((exerciseTotal, exercise) => exerciseTotal + exercise.sets.filter((set) => set.completed).length, 0), 0);
  const plannedSessions = Math.max(1, state.profile.trainingDays);
  const phaseAdherence = Math.min(100, Math.round((phaseSessions.length / plannedSessions) * 100));
  const cardioMiles = phaseCardio.reduce((total, session) => total + (session.distanceMiles ?? 0), 0);
  const readinessValues = phaseSessions.map((session) => session.readiness?.energy).filter((value): value is number => typeof value === 'number');
  const averageEnergy = readinessValues.length ? readinessValues.reduce((sum, value) => sum + value, 0) / readinessValues.length : 0;

  const applyGoal = (goal: Goal) => {
    if (goal === state.profile.goal) return;
    const profile = goalProgramProfiles[goal];
    const message = `${profile.changes} Completed workouts will not change${state.activeSession ? ', and your current workout will stay as it is' : ''}. Apply this goal to future workouts?`;
    const commit = () => {
      updateProfile({ goal });
      notify('Primary goal updated', `${profile.name} will be used for future workouts.`);
    };

    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(message)) commit();
      return;
    }

    Alert.alert(`Switch to ${profile.shortLabel}?`, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Apply to future workouts', onPress: commit }
    ]);
  };

  const connect = async () => {
    const result = await connectHealthKit();
    setHealthKitConnected(result.ok);
    notify(result.ok ? 'Apple Health connected' : 'Apple Health unavailable', result.message);
  };

  const exportData = async () => {
    setBackupBusy(true);
    try {
      const result = await exportBackupFile(state);
      if (!result.ok) {
        if (!result.cancelled) notify('Backup not created', result.message);
        return;
      }
      markBackupCreated(result.exportedAt);
      notify('Backup created', result.method === 'share'
        ? `${result.filename} is ready in the share sheet. Save it to Files or iCloud Drive.`
        : `${result.filename} was downloaded. Keep it somewhere safe.`);
    } finally {
      setBackupBusy(false);
    }
  };

  const chooseImport = async () => {
    setBackupBusy(true);
    try {
      const result = await selectBackupFile();
      if (!result.ok) {
        if (!result.cancelled) notify('Backup not opened', result.message);
        return;
      }
      setPendingImport({ backup: result.backup, summary: result.summary, filename: result.filename });
    } finally {
      setBackupBusy(false);
    }
  };

  const performRestore = (mode: BackupRestoreMode) => {
    if (!pendingImport) return;
    restoreBackup(pendingImport.backup.data, mode);
    const action = mode === 'merge' ? 'merged with' : 'replaced';
    notify('Backup restored', `${pendingImport.summary.workoutCount} workouts and ${pendingImport.summary.weightEntryCount} weight entries were ${action} the data on this device.`);
    setPendingImport(undefined);
  };

  const confirmRestore = (mode: BackupRestoreMode) => {
    if (mode === 'merge') {
      performRestore(mode);
      return;
    }

    const message = 'Replace will remove the workouts, weigh-ins, settings, and any unfinished workout currently stored on this device.';
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(message)) performRestore(mode);
      return;
    }
    Alert.alert('Replace current data?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Replace', style: 'destructive', onPress: () => performRestore(mode) }
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={styles.eyebrow}>IRONPATH</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Tune the program, protect your history, and control how IronPath works.</Text>
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.programRow}><View style={styles.programIcon}><Text style={styles.programIconText}>IP</Text></View><View style={styles.flex}><Text style={styles.cardEyebrow}>ACTIVE PROGRAM</Text><Text style={styles.programName}>{goalProgramProfiles[state.profile.goal].name}</Text><Text style={styles.copy}>{goalProgramProfiles[state.profile.goal].description}</Text></View></View>
        <View style={styles.programStats}><View><Text style={styles.programStat}>{state.profile.trainingDays}</Text><Text style={styles.programLabel}>Days/week</Text></View><View><Text style={styles.programStat}>{state.profile.sessionMinutes}</Text><Text style={styles.programLabel}>Minutes</Text></View><View><Text style={styles.programStat}>{state.profile.defaultRir ?? 2}</Text><Text style={styles.programLabel}>Default RIR</Text></View></View>
      </Card>

      <Card>
        <View style={styles.goalHeading}>
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>Primary goal</Text>
            <Text style={styles.copy}>This now changes the sets, rep targets, rest periods, and estimated duration of future workouts.</Text>
          </View>
          <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>ACTIVE</Text></View>
        </View>
        <View style={styles.goalOptions}>
          {(['balanced', 'strength', 'muscle', 'fat-loss'] as Goal[]).map((goal) => {
            const profile = goalProgramProfiles[goal];
            const active = state.profile.goal === goal;
            return (
              <Pressable key={goal} onPress={() => applyGoal(goal)} style={[styles.goalOption, active && styles.goalOptionActive]}>
                <View style={styles.goalOptionTop}>
                  <Text style={[styles.goalOptionTitle, active && styles.goalOptionTitleActive]}>{profile.shortLabel}</Text>
                  {active ? <Text style={styles.goalCheck}>✓</Text> : null}
                </View>
                <Text style={[styles.goalOptionCopy, active && styles.goalOptionCopyActive]}>{profile.description}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.goalImpact}>
          <Text style={styles.goalImpactLabel}>CURRENT PROGRAM EFFECT</Text>
          <Text style={styles.goalImpactText}>{goalProgramProfiles[state.profile.goal].changes}</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Experience</Text>
        <View style={styles.options}>
          {(['beginner', 'intermediate', 'advanced'] as Experience[]).map((experience) => (
            <Pressable key={experience} onPress={() => updateProfile({ experience })} style={[styles.option, state.profile.experience === experience && styles.optionActive]}>
              <Text style={[styles.optionText, state.profile.experience === experience && styles.optionTextActive]}>{experience}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Training preferences</Text>
        <Text style={styles.copy}>These settings control the starting point and the size of recommended increases.</Text>
        <Text style={styles.label}>Workouts per week</Text>
        <View style={styles.trainingDayRow}>
          {[2, 3, 4, 5].map((days) => (
            <Pressable key={days} onPress={() => updateProfile({ trainingDays: days })} style={[styles.trainingDayButton, state.profile.trainingDays === days && styles.trainingDayActive]}>
              <Text style={[styles.trainingDayValue, state.profile.trainingDays === days && styles.trainingDayValueActive]}>{days}</Text>
              <Text style={[styles.trainingDayLabel, state.profile.trainingDays === days && styles.trainingDayLabelActive]}>days</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.planHint}>{state.profile.trainingDays === 2 ? 'Two full-body sessions each week.' : state.profile.trainingDays === 3 ? 'Three full-body sessions each week.' : state.profile.trainingDays === 4 ? 'Upper / Lower four-day split.' : 'Five-day Upper, Lower, Push, Pull, Lower split.'}</Text>
        <View style={styles.fieldRow}>
          <View style={styles.field}><Text style={styles.label}>Upper-body jump</Text><TextInput value={state.profile.upperIncrement.toString()} onChangeText={(value) => updateProfile({ upperIncrement: Number(value) || 5 })} keyboardType="decimal-pad" style={styles.input} /></View>
          <View style={styles.field}><Text style={styles.label}>Lower-body jump</Text><TextInput value={state.profile.lowerIncrement.toString()} onChangeText={(value) => updateProfile({ lowerIncrement: Number(value) || 10 })} keyboardType="decimal-pad" style={styles.input} /></View>
        </View>
        <Text style={styles.label}>Default reps in reserve</Text>
        <View style={styles.rirRow}>{[0, 1, 2, 3, 4].map((rir) => <Pressable key={rir} onPress={() => updateProfile({ defaultRir: rir })} style={[styles.rirButton, state.profile.defaultRir === rir && styles.rirActive]}><Text style={[styles.rirText, state.profile.defaultRir === rir && styles.rirTextActive]}>{rir}</Text></Pressable>)}</View>
      </Card>


      <Card style={styles.evolutionCard}>
        <View style={styles.goalHeading}>
          <View style={styles.flex}>
            <Text style={styles.cardEyebrow}>TRAINING EVOLUTION</Text>
            <Text style={styles.cardTitle}>My Training Plan</Text>
            <Text style={styles.copy}>IronPath keeps productive lifts long enough to measure progress and rotates exercises when variety, recovery, or a plateau makes a change useful.</Text>
          </View>
        </View>

        <View style={styles.phaseBrowser}>
          <View style={styles.phaseHeaderRow}>
            <View style={styles.flex}>
              <Text style={styles.label}>Four-phase block</Text>
              <Text style={styles.copy}>Preview every phase before you reach it. The active phase is marked below.</Text>
            </View>
            <View style={styles.phaseCountBadge}><Text style={styles.phaseCountText}>{currentPhase}/4</Text></View>
          </View>

          <View style={styles.phaseTabs}>
            {trainingPhaseProfiles.map((phase) => {
              const selected = selectedPhase === phase.phase;
              const current = currentPhase === phase.phase;
              return (
                <Pressable key={phase.phase} onPress={() => { setSelectedPhase(phase.phase); setExpandedPhaseWorkout(undefined); }} style={[styles.phaseTab, selected && styles.phaseTabSelected]}>
                  <Text style={[styles.phaseTabNumber, selected && styles.phaseTabNumberSelected]}>{phase.phase}</Text>
                  <Text style={[styles.phaseTabLabel, selected && styles.phaseTabLabelSelected]}>{phase.shortName}</Text>
                  {current ? <View style={styles.currentDot} /> : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.phaseDetail}>
            <View style={styles.phaseDetailTop}>
              <View style={styles.flex}>
                <Text style={styles.phaseName}>{phaseProfile.name}</Text>
                <Text style={styles.phasePurpose}>{phaseProfile.purpose}</Text>
              </View>
              {selectedPhase === currentPhase ? <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>CURRENT</Text></View> : <View style={styles.previewBadge}><Text style={styles.previewBadgeText}>PREVIEW</Text></View>}
            </View>
            <Text style={styles.loadNote}>{phaseProfile.loadNote}</Text>

            <View style={styles.phaseWorkoutList}>
              {phasePreview.workouts.map((workout, workoutIndex) => {
                const expanded = expandedPhaseWorkout === workoutIndex;
                return (
                  <View key={`${workout.id}-${workoutIndex}`} style={styles.phaseWorkout}>
                    <Pressable onPress={() => setExpandedPhaseWorkout(expanded ? undefined : workoutIndex)} style={styles.phaseWorkoutTop}>
                      <View style={styles.phaseWorkoutNumber}><Text style={styles.phaseWorkoutNumberText}>{workoutIndex + 1}</Text></View>
                      <View style={styles.flex}><Text style={styles.phaseWorkoutName}>{workout.name}</Text><Text style={styles.phaseWorkoutMeta}>{workout.exercises.length} exercises · about {workout.estimatedMinutes} min</Text></View>
                      <Text style={styles.chevron}>{expanded ? '⌃' : '⌄'}</Text>
                    </Pressable>
                    {expanded ? <View style={styles.phaseExerciseList}>{workout.exercises.map((item, index) => <View key={`${item.exerciseId}-${index}`} style={styles.phaseExerciseRow}><Text style={styles.phaseExerciseIndex}>{index + 1}</Text><View style={styles.flex}><Text style={styles.phaseExerciseName}>{exercisesById[item.exerciseId]?.name ?? item.exerciseId}</Text><Text style={styles.phaseExerciseMeta}>{item.sets} sets · {item.minReps}–{item.maxReps} reps · {Math.round(item.restSeconds / 60)} min rest</Text></View>{item.note ? <Text style={styles.rotationMark}>↻</Text> : null}</View>)}</View> : null}
                  </View>
                );
              })}
            </View>
            {selectedPhase !== currentPhase ? <Text style={styles.futureNote}>Future phases may adjust after IronPath reviews your performance, readiness, and recovery.</Text> : null}
          </View>
        </View>

        <View style={styles.phaseReview}>
          <View style={styles.phaseReviewHeader}>
            <View style={styles.flex}><Text style={styles.label}>Current-phase review</Text><Text style={styles.copy}>A live summary used to decide whether to advance, repeat, or regenerate.</Text></View>
          </View>
          <View style={styles.reviewGrid}>
            <View style={styles.reviewMetric}><Text style={styles.reviewValue}>{phaseSessions.length}/{plannedSessions}</Text><Text style={styles.reviewLabel}>Workouts</Text></View>
            <View style={styles.reviewMetric}><Text style={styles.reviewValue}>{phaseAdherence}%</Text><Text style={styles.reviewLabel}>Adherence</Text></View>
            <View style={styles.reviewMetric}><Text style={styles.reviewValue}>{completedSets}</Text><Text style={styles.reviewLabel}>Completed sets</Text></View>
            <View style={styles.reviewMetric}><Text style={styles.reviewValue}>{cardioMiles ? cardioMiles.toFixed(1) : '0'}</Text><Text style={styles.reviewLabel}>Cardio miles</Text></View>
          </View>
          <Text style={styles.reviewInsight}>{averageEnergy ? `Average training energy is ${averageEnergy.toFixed(1)}/5. ` : ''}{phaseAdherence >= 75 ? 'You are on pace to advance when the phase ends.' : 'Complete more planned work before advancing, or repeat the phase if recovery has been inconsistent.'}</Text>
          <View style={styles.phaseActions}>
            <PrimaryButton title={currentPhase === 4 ? 'Start next block' : 'Advance phase'} onPress={advanceTrainingPhase} style={styles.phaseActionPrimary} />
            <PrimaryButton title="Repeat phase" onPress={repeatTrainingPhase} secondary style={styles.phaseActionSecondary} />
          </View>
          <PrimaryButton title="Regenerate current phase" onPress={regenerateTrainingPhase} secondary />
        </View>

        <Text style={styles.label}>Workout variety</Text>
        <View style={styles.varietyRow}>
          {(['consistent', 'moderate', 'high'] as WorkoutVariety[]).map((variety) => {
            const active = (state.profile.workoutVariety ?? 'moderate') === variety;
            return <Pressable key={variety} onPress={() => { updateProfile({ workoutVariety: variety }); generatePlan(variety); }} style={[styles.varietyButton, active && styles.varietyActive]}><Text style={[styles.varietyText, active && styles.varietyTextActive]}>{variety}</Text></Pressable>;
          })}
        </View>
        <Text style={styles.planHint}>{(state.profile.workoutVariety ?? 'moderate') === 'consistent' ? 'Core and accessory exercises stay mostly stable throughout the block.' : (state.profile.workoutVariety ?? 'moderate') === 'high' ? 'More exercise variations rotate while movement patterns remain balanced.' : 'Major lifts stay stable; accessories rotate and plateaued lifts may change.'}</Text>

        <View style={styles.weekActions}>
          <PrimaryButton title="Refresh training plan" onPress={() => generatePlan()} style={styles.flexButton} />
        </View>

        <View style={styles.weekList}>
          {(state.weeklyPlan?.workouts ?? []).map((workout, workoutIndex) => {
            const expanded = expandedWorkout === workoutIndex;
            return (
              <View key={`${workout.id}-${workoutIndex}`} style={styles.weekWorkout}>
                <Pressable onPress={() => setExpandedWorkout(expanded ? undefined : workoutIndex)} style={styles.weekWorkoutTop}>
                  <View style={styles.dayNumber}><Text style={styles.dayNumberText}>{workoutIndex + 1}</Text></View>
                  <View style={styles.flex}><Text style={styles.weekWorkoutName}>{workout.name}</Text><Text style={styles.weekWorkoutMeta}>{workout.exercises.length} exercises · about {workout.estimatedMinutes} min</Text></View>
                  <Text style={styles.chevron}>{expanded ? '⌃' : '⌄'}</Text>
                </Pressable>
                {expanded ? (
                  <View style={styles.editorBody}>
                    <TextInput value={workout.name} onChangeText={(name) => updatePlannedWorkout(workoutIndex, { name })} style={styles.input} />
                    {workout.exercises.map((item, exerciseIndex) => {
                      const definition = exercisesById[item.exerciseId];
                      const locked = state.weeklyPlan?.lockedExerciseIds.includes(item.exerciseId);
                      const alternatives = definition?.substitutions.filter((id) => exercisesById[id]) ?? [];
                      return (
                        <View key={`${item.exerciseId}-${exerciseIndex}`} style={styles.exerciseEditor}>
                          <View style={styles.exerciseEditorTop}>
                            <View style={styles.flex}><Text style={styles.exerciseEditorName}>{definition?.name ?? item.exerciseId}</Text><Text style={styles.exerciseEditorMeta}>{item.sets} sets · {item.minReps}–{item.maxReps} reps · {Math.round(item.restSeconds / 60)} min rest</Text></View>
                            <Pressable onPress={() => toggleExerciseLock(item.exerciseId)} style={[styles.lockButton, locked && styles.lockButtonActive]}><Text style={styles.lockText}>{locked ? 'Locked' : 'Lock'}</Text></Pressable>
                          </View>
                          {item.note ? <Text style={styles.rotationNote}>{item.note}</Text> : null}
                          <View style={styles.editActions}>
                            <Pressable onPress={() => updatePlannedExercise(workoutIndex, exerciseIndex, { sets: Math.max(1, item.sets - 1) })} style={styles.miniButton}><Text style={styles.miniButtonText}>− Set</Text></Pressable>
                            <Pressable onPress={() => updatePlannedExercise(workoutIndex, exerciseIndex, { sets: item.sets + 1 })} style={styles.miniButton}><Text style={styles.miniButtonText}>+ Set</Text></Pressable>
                            {alternatives.length ? <Pressable onPress={() => { const next = alternatives[(alternatives.indexOf(item.exerciseId) + 1 + exerciseIndex) % alternatives.length] ?? alternatives[0]; if (next) updatePlannedExercise(workoutIndex, exerciseIndex, { exerciseId: next, note: `Customized from ${definition?.name ?? 'previous exercise'}.` }); }} style={styles.miniButton}><Text style={styles.miniButtonText}>Swap</Text></Pressable> : null}
                            <Pressable onPress={() => movePlannedExercise(workoutIndex, exerciseIndex, -1)} style={styles.miniButton}><Text style={styles.miniButtonText}>↑</Text></Pressable>
                            <Pressable onPress={() => movePlannedExercise(workoutIndex, exerciseIndex, 1)} style={styles.miniButton}><Text style={styles.miniButtonText}>↓</Text></Pressable>
                            <Pressable onPress={() => removePlannedExercise(workoutIndex, exerciseIndex)} style={[styles.miniButton, styles.removeButton]}><Text style={styles.removeText}>Remove</Text></Pressable>
                          </View>
                        </View>
                      );
                    })}
                    <Pressable onPress={() => setAddExerciseFor(addExerciseFor === workoutIndex ? undefined : workoutIndex)} style={styles.addExerciseButton}><Text style={styles.addExerciseText}>+ Add exercise</Text></Pressable>
                    {addExerciseFor === workoutIndex ? <View style={styles.exercisePicker}>{exerciseLibrary.slice(0, 18).map((exercise) => <Pressable key={exercise.id} onPress={() => { addPlannedExercise(workoutIndex, exercise.id); setAddExerciseFor(undefined); }} style={styles.exercisePick}><Text style={styles.exercisePickText}>{exercise.name}</Text></Pressable>)}</View> : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
        <Text style={styles.copy}>Completed workouts are never rewritten. Your current active workout also stays unchanged. Locked exercises remain in future generated plans.</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Goal weight</Text>
        <TextInput value={goalWeight} onChangeText={setGoalWeight} keyboardType="decimal-pad" style={styles.input} placeholder={`Goal weight in ${state.profile.unit}`} placeholderTextColor={colors.muted} />
        <PrimaryButton title="Save goal weight" onPress={() => updateProfile({ goalWeight: Number(goalWeight) || undefined })} />
      </Card>

      <Card>
        <View style={styles.connectionRow}>
          <View style={styles.flex}><Text style={styles.cardTitle}>Apple Health</Text><Text style={styles.copy}>{state.healthKitConnected ? 'Connected for body weight and authorized health data.' : 'Available later in the native iPhone build. The web version remains fully usable without it.'}</Text></View>
          <View style={[styles.dot, state.healthKitConnected && styles.dotConnected]} />
        </View>
        <PrimaryButton title={state.healthKitConnected ? 'Review Apple Health permissions' : 'Connect Apple Health'} onPress={() => void connect()} secondary />
      </Card>

      <Card style={styles.backupCard}>
        <View style={styles.sectionHeadingRow}>
          <View style={styles.backupIcon}><Text style={styles.backupIconText}>⇅</Text></View>
          <View style={styles.flex}>
            <Text style={styles.cardEyebrow}>DATA & BACKUP</Text>
            <Text style={styles.cardTitle}>Protect your IronPath history</Text>
          </View>
        </View>
        <Text style={styles.copy}>Export a private backup to Files or iCloud Drive. Import it later after changing phones, clearing Safari data, or moving to a different IronPath link.</Text>

        <View style={styles.backupStatus}>
          <View><Text style={styles.statusLabel}>LAST BACKUP</Text><Text style={styles.statusValue}>{formatDateTime(state.lastBackupAt)}</Text></View>
          <View style={styles.localBadge}><View style={styles.localDot} /><Text style={styles.localBadgeText}>Local-first</Text></View>
        </View>

        <View style={styles.backupButtons}>
          <PrimaryButton title={backupBusy ? 'Working…' : 'Export backup'} onPress={() => void exportData()} disabled={backupBusy} style={styles.backupButton} />
          <PrimaryButton title="Import backup" onPress={() => void chooseImport()} disabled={backupBusy} secondary style={styles.backupButton} />
        </View>
        <Text style={styles.backupHint}>The backup is a readable JSON file containing your workouts, weight entries, settings, notes, and progression history. It is not uploaded to IronPath.</Text>
      </Card>

      {pendingImport ? (
        <Card style={styles.importCard}>
          <View style={styles.importTop}>
            <View style={styles.importCheck}><Text style={styles.importCheckText}>✓</Text></View>
            <View style={styles.flex}>
              <Text style={styles.cardEyebrow}>BACKUP VERIFIED</Text>
              <Text style={styles.cardTitle}>{pendingImport.filename}</Text>
              <Text style={styles.copy}>Created {formatDateTime(pendingImport.summary.exportedAt)} with IronPath {pendingImport.summary.appVersion}</Text>
            </View>
          </View>
          <View style={styles.importMetrics}>
            <View style={styles.importMetric}><Text style={styles.importMetricValue}>{pendingImport.summary.workoutCount}</Text><Text style={styles.importMetricLabel}>Workouts</Text></View>
            <View style={styles.importMetric}><Text style={styles.importMetricValue}>{pendingImport.summary.weightEntryCount}</Text><Text style={styles.importMetricLabel}>Weigh-ins</Text></View>
            <View style={styles.importMetric}><Text style={styles.importMetricValue}>{pendingImport.summary.hasActiveWorkout ? 'Yes' : 'No'}</Text><Text style={styles.importMetricLabel}>Active workout</Text></View>
          </View>
          <Text style={styles.copy}><Text style={styles.strong}>Merge</Text> combines workout and weight history while applying the backup’s profile settings. <Text style={styles.strong}>Replace</Text> makes this device match the backup.</Text>
          <PrimaryButton title="Merge with current data" onPress={() => confirmRestore('merge')} />
          <PrimaryButton title="Replace all current data" onPress={() => confirmRestore('replace')} secondary />
          <Pressable onPress={() => setPendingImport(undefined)} style={styles.cancelImport}><Text style={styles.cancelImportText}>Cancel import</Text></Pressable>
        </Card>
      ) : null}


      <Card>
        <Text style={styles.cardTitle}>Reset local data</Text>
        <Text style={styles.copy}>This permanently removes the workouts, weigh-ins, and settings stored for this IronPath link on this device. Export a backup first.</Text>
        <PrimaryButton title="Reset all local data" onPress={() => void resetAllData()} secondary />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 18, gap: 12, paddingBottom: 116 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 31, fontWeight: '900', marginTop: 3 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  heroCard: { backgroundColor: colors.accentDeep, borderColor: colors.borderStrong },
  programRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  programIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  programIconText: { color: colors.accent, fontWeight: '900', fontSize: 20, fontStyle: 'italic' },
  flex: { flex: 1 },
  cardEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  programName: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 2 },
  programStats: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.panelSoft, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border },
  programStat: { color: colors.text, fontSize: 18, fontWeight: '900' },
  programLabel: { color: colors.muted, fontSize: 9, marginTop: 2 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  strong: { color: colors.text, fontWeight: '900' },
  backupCard: { backgroundColor: '#0A1526', borderColor: colors.borderStrong },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backupIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.accentDark, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  backupIconText: { color: colors.accent, fontWeight: '900', fontSize: 22 },
  backupStatus: { backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  statusLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  statusValue: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 3 },
  localBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.panelRaised, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  localDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  localBadgeText: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  backupButtons: { flexDirection: 'row', gap: 10 },
  backupButton: { flex: 1 },
  backupHint: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  importCard: { backgroundColor: '#0D1B30', borderColor: colors.accent },
  importTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  importCheck: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  importCheckText: { color: colors.black, fontSize: 21, fontWeight: '900' },
  importMetrics: { flexDirection: 'row', gap: 8 },
  importMetric: { flex: 1, backgroundColor: colors.panelSoft, borderRadius: 13, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, alignItems: 'center' },
  importMetricValue: { color: colors.text, fontSize: 18, fontWeight: '900' },
  importMetricLabel: { color: colors.muted, fontSize: 9, marginTop: 2 },
  cancelImport: { minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  cancelImportText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderRadius: 13, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10 },
  optionActive: { backgroundColor: colors.accent, borderColor: colors.accentStrong },
  optionText: { color: colors.muted, fontWeight: '800', textTransform: 'capitalize' },
  optionTextActive: { color: colors.black },
  goalHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  liveBadge: { backgroundColor: colors.accentDark, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  liveBadgeText: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  goalOptions: { gap: 8 },
  goalOption: { backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 12, gap: 5 },
  goalOptionActive: { backgroundColor: colors.accentDeep, borderColor: colors.accent },
  goalOptionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalOptionTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  goalOptionTitleActive: { color: colors.accent },
  goalCheck: { color: colors.accent, fontSize: 16, fontWeight: '900' },
  goalOptionCopy: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  goalOptionCopyActive: { color: colors.text },
  goalImpact: { backgroundColor: colors.panelRaised, borderRadius: 13, borderWidth: 1, borderColor: colors.border, padding: 11, gap: 4 },
  goalImpactLabel: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  goalImpactText: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 6 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  input: { minHeight: 48, borderRadius: 14, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 13, fontSize: 16, fontWeight: '700' },
  rirRow: { flexDirection: 'row', gap: 8 },
  rirButton: { flex: 1, height: 42, borderRadius: 13, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  rirActive: { backgroundColor: colors.accent, borderColor: colors.accentStrong },
  rirText: { color: colors.muted, fontWeight: '900' },
  rirTextActive: { color: colors.black },
  connectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 13, height: 13, borderRadius: 7, backgroundColor: colors.danger },
  dotConnected: { backgroundColor: colors.success },
  trainingDayRow: { flexDirection: 'row', gap: 8 },
  trainingDayButton: { flex: 1, minHeight: 58, borderRadius: 13, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  trainingDayActive: { backgroundColor: colors.accentDeep, borderColor: colors.accent },
  trainingDayValue: { color: colors.text, fontSize: 18, fontWeight: '900' },
  trainingDayValueActive: { color: colors.accent },
  trainingDayLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', marginTop: 2 },
  trainingDayLabelActive: { color: colors.text },
  planHint: { color: colors.accent, fontSize: 10, fontWeight: '800' },
  evolutionCard: { backgroundColor: colors.panelSoft, borderColor: colors.borderStrong },
  weekBadge: { backgroundColor: colors.accentDark, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  weekBadgeText: { color: colors.accent, fontSize: 9, fontWeight: '900' },
  varietyRow: { flexDirection: 'row', gap: 8 },
  varietyButton: { flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panelRaised, alignItems: 'center', justifyContent: 'center' },
  varietyActive: { backgroundColor: colors.accent, borderColor: colors.accentStrong },
  varietyText: { color: colors.muted, fontWeight: '900', textTransform: 'capitalize', fontSize: 11 },
  varietyTextActive: { color: colors.black },
  weekActions: { flexDirection: 'row' },
  flexButton: { flex: 1 },
  weekList: { gap: 8 },
  weekWorkout: { borderWidth: 1, borderColor: colors.border, borderRadius: 15, backgroundColor: colors.panel, overflow: 'hidden' },
  weekWorkoutTop: { minHeight: 64, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayNumber: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.accentDark, alignItems: 'center', justifyContent: 'center' },
  dayNumberText: { color: colors.accent, fontWeight: '900' },
  weekWorkoutName: { color: colors.text, fontSize: 14, fontWeight: '900' },
  weekWorkoutMeta: { color: colors.muted, fontSize: 10, marginTop: 2 },
  chevron: { color: colors.accent, fontSize: 18, fontWeight: '900' },
  editorBody: { padding: 11, borderTopWidth: 1, borderTopColor: colors.border, gap: 9 },
  exerciseEditor: { backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 10, gap: 7 },
  exerciseEditorTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exerciseEditorName: { color: colors.text, fontSize: 12, fontWeight: '900' },
  exerciseEditorMeta: { color: colors.muted, fontSize: 9, marginTop: 2 },
  lockButton: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 9, paddingVertical: 6 },
  lockButtonActive: { backgroundColor: colors.accentDark, borderColor: colors.accent },
  lockText: { color: colors.accent, fontSize: 9, fontWeight: '900' },
  rotationNote: { color: colors.accent, fontSize: 9, lineHeight: 14 },
  editActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniButton: { backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7 },
  miniButtonText: { color: colors.text, fontSize: 9, fontWeight: '800' },
  removeButton: { borderColor: '#5A2D36' },
  removeText: { color: colors.danger, fontSize: 9, fontWeight: '800' },
  addExerciseButton: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  addExerciseText: { color: colors.accent, fontWeight: '900', fontSize: 11 },
  exercisePicker: { gap: 5, maxHeight: 260 },
  exercisePick: { paddingVertical: 9, paddingHorizontal: 10, backgroundColor: colors.panelRaised, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  exercisePickText: { color: colors.text, fontSize: 10, fontWeight: '700' },
  phaseBrowser: { gap: 11, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 12 },
  phaseHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  phaseCountBadge: { minWidth: 42, height: 32, borderRadius: 12, backgroundColor: colors.accentDark, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  phaseCountText: { color: colors.accent, fontSize: 11, fontWeight: '900' },
  phaseTabs: { flexDirection: 'row', gap: 6 },
  phaseTab: { flex: 1, minHeight: 54, borderRadius: 12, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  phaseTabSelected: { backgroundColor: colors.accentDeep, borderColor: colors.accent },
  phaseTabNumber: { color: colors.muted, fontSize: 9, fontWeight: '900' },
  phaseTabNumberSelected: { color: colors.accent },
  phaseTabLabel: { color: colors.text, fontSize: 9, fontWeight: '900', marginTop: 2 },
  phaseTabLabelSelected: { color: colors.accent },
  currentDot: { position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  phaseDetail: { gap: 10, backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 11 },
  phaseDetailTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  phaseName: { color: colors.text, fontSize: 17, fontWeight: '900' },
  phasePurpose: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  currentBadge: { borderRadius: 999, backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 5 },
  currentBadgeText: { color: colors.black, fontSize: 7, fontWeight: '900', letterSpacing: 0.6 },
  previewBadge: { borderRadius: 999, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 5 },
  previewBadgeText: { color: colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.6 },
  loadNote: { color: colors.accent, fontSize: 9, fontWeight: '800', lineHeight: 14 },
  phaseWorkoutList: { gap: 6 },
  phaseWorkout: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.panel, overflow: 'hidden' },
  phaseWorkoutTop: { minHeight: 53, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  phaseWorkoutNumber: { width: 28, height: 28, borderRadius: 10, backgroundColor: colors.accentDark, alignItems: 'center', justifyContent: 'center' },
  phaseWorkoutNumberText: { color: colors.accent, fontSize: 10, fontWeight: '900' },
  phaseWorkoutName: { color: colors.text, fontSize: 12, fontWeight: '900' },
  phaseWorkoutMeta: { color: colors.muted, fontSize: 8, marginTop: 2 },
  phaseExerciseList: { padding: 9, borderTopWidth: 1, borderTopColor: colors.border, gap: 7 },
  phaseExerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phaseExerciseIndex: { width: 18, color: colors.muted, fontSize: 8, fontWeight: '900', textAlign: 'center' },
  phaseExerciseName: { color: colors.text, fontSize: 10, fontWeight: '800' },
  phaseExerciseMeta: { color: colors.muted, fontSize: 8, marginTop: 1 },
  rotationMark: { color: colors.accent, fontSize: 14, fontWeight: '900' },
  futureNote: { color: colors.muted, fontSize: 8, lineHeight: 13, fontStyle: 'italic' },
  phaseReview: { gap: 10, backgroundColor: colors.accentDeep, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 16, padding: 12 },
  phaseReviewHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  reviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  reviewMetric: { width: '48.5%', minHeight: 66, borderRadius: 12, backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  reviewValue: { color: colors.text, fontSize: 18, fontWeight: '900' },
  reviewLabel: { color: colors.muted, fontSize: 8, marginTop: 2 },
  reviewInsight: { color: colors.text, fontSize: 10, lineHeight: 15 },
  phaseActions: { flexDirection: 'row', gap: 8 },
  phaseActionPrimary: { flex: 1 },
  phaseActionSecondary: { flex: 1 },
});
