import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, BackupRestoreMode, BodyWeightEntry, CardioDevice, DailyReadiness, LoggedSet, ProgramExercise, UserProfile, WorkoutSession, WorkoutTemplate, WorkoutVariety } from '../types';
import { calculateVolume, createWorkoutSession, estimateCalories } from '../engine/planner';
import { getProgramForGoal } from '../data/program';
import { clearState, loadState, saveState } from '../services/storage';
import { exercisesById } from '../data/exercises';
import { getRecommendation } from '../engine/progression';
import { ensureCurrentWeeklyPlan, generateWeeklyPlan } from '../engine/weeklyPlanner';

const initialState: AppState = {
  profile: {
    name: 'Athlete',
    goal: 'balanced',
    experience: 'intermediate',
    unit: 'lb',
    trainingDays: 4,
    sessionMinutes: 60,
    currentWeight: 185,
    goalWeight: 175,
    upperIncrement: 5,
    lowerIncrement: 10,
    defaultRir: 2,
    workoutVariety: 'moderate'
  },
  sessions: [],
  weightEntries: [],
  cardioSessions: [],
  nextTemplateIndex: 0,
  healthKitConnected: false,
  dailyReadiness: {
    date: new Date().toISOString(),
    energy: 4,
    soreness: 2,
    timeAvailable: 3,
    notes: ''
  }
};

interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  startWorkout: () => void;
  updateSet: (exerciseIndex: number, setIndex: number, patch: Partial<LoggedSet>) => void;
  updateMachineNote: (exerciseIndex: number, note: string) => void;
  updateWorkoutNotes: (notes: string) => void;
  updateReadiness: (patch: Partial<DailyReadiness>) => void;
  swapExercise: (exerciseIndex: number, newExerciseId: string, reason?: string) => void;
  finishWorkout: (manualCalories?: number) => { volume: number; calories: number } | undefined;
  cancelWorkout: () => void;
  addWeight: (weight: number, source?: BodyWeightEntry['source']) => void;
  startCardio: (device: CardioDevice) => void;
  finishCardio: (distanceMiles?: number, notes?: string) => void;
  cancelCardio: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setHealthKitConnected: (connected: boolean) => void;
  markBackupCreated: (exportedAt: string) => void;
  restoreBackup: (backupState: AppState, mode: BackupRestoreMode) => void;
  generatePlan: (variety?: WorkoutVariety) => void;
  advanceTrainingPhase: () => void;
  repeatTrainingPhase: () => void;
  regenerateTrainingPhase: () => void;
  updatePlannedWorkout: (workoutIndex: number, patch: Partial<WorkoutTemplate>) => void;
  updatePlannedExercise: (workoutIndex: number, exerciseIndex: number, patch: Partial<ProgramExercise>) => void;
  movePlannedExercise: (workoutIndex: number, exerciseIndex: number, direction: -1 | 1) => void;
  removePlannedExercise: (workoutIndex: number, exerciseIndex: number) => void;
  addPlannedExercise: (workoutIndex: number, exerciseId: string) => void;
  toggleExerciseLock: (exerciseId: string) => void;
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);


const workoutNamesById: Record<string, string> = {
  'upper-a': 'Press & Pull',
  'lower-a': 'Squat & Hinge',
  'upper-b': 'Upper Build',
  'lower-b': 'Lower Build',
  'full-a': 'Total Foundation',
  'full-b': 'Total Progression',
  'full-b3': 'Hinge & Press',
  'full-c': 'Total Build',
  push: 'Push Build',
  pull: 'Pull Build'
};

const updatedWorkoutName = (id: string, name: string) => {
  const baseId = Object.keys(workoutNamesById).find((key) => id === key || id.startsWith(`${key}-w`) || id.startsWith(`${key}-b`));
  if (!baseId) return name.replace(/\s*·\s*Week\s*\d+$/i, '');
  const looksGenerated = /^(Upper|Lower|Full Body)\s*[ABC]?(?:\s*·\s*Week\s*\d+)?$/i.test(name)
    || /^(Push|Pull)(?:\s*·\s*Week\s*\d+)?$/i.test(name)
    || /\s*·\s*Week\s*\d+$/i.test(name);
  return looksGenerated ? workoutNamesById[baseId]! : name;
};

const refreshStoredWorkoutNames = (stored: AppState): AppState => ({
  ...stored,
  activeSession: stored.activeSession ? { ...stored.activeSession, name: updatedWorkoutName(stored.activeSession.templateId, stored.activeSession.name) } : undefined,
  weeklyPlan: stored.weeklyPlan ? {
    ...stored.weeklyPlan,
    workouts: stored.weeklyPlan.workouts.map((workout) => ({ ...workout, name: updatedWorkoutName(workout.id, workout.name) }))
  } : undefined
});

const mergeStoredState = (rawStored: AppState): AppState => {
  const stored = refreshStoredWorkoutNames(rawStored);
  return ({
  ...initialState,
  ...stored,
  cardioSessions: stored.cardioSessions ?? [],
  profile: { ...initialState.profile, ...stored.profile },
  dailyReadiness: { ...initialState.dailyReadiness!, ...(stored.dailyReadiness ?? {}) },
  weeklyPlan: stored.weeklyPlan
  });
};

const dedupeById = <T extends { id: string }>(items: T[]) => Array.from(new Map(items.map((item) => [item.id, item])).values());

const mergeBackupState = (current: AppState, imported: AppState): AppState => ({
  ...current,
  profile: { ...current.profile, ...imported.profile },
  sessions: dedupeById([...current.sessions, ...imported.sessions]).sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()),
  weightEntries: dedupeById([...current.weightEntries, ...imported.weightEntries]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  cardioSessions: dedupeById([...(current.cardioSessions ?? []), ...(imported.cardioSessions ?? [])]).sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()),
  activeCardio: current.activeCardio ?? imported.activeCardio,
  activeSession: current.activeSession ?? imported.activeSession,
  nextTemplateIndex: current.sessions.length > 0 ? current.nextTemplateIndex : imported.nextTemplateIndex,
  healthKitConnected: current.healthKitConnected,
  dailyReadiness: current.dailyReadiness ?? imported.dailyReadiness,
  lastBackupAt: imported.lastBackupAt ?? current.lastBackupAt
});

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadState().then((stored) => {
      const merged = stored ? mergeStoredState(stored) : initialState;
      setState(ensureCurrentWeeklyPlan(merged));
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) void saveState(state);
  }, [hydrated, state]);

  const value = useMemo<AppContextValue>(() => ({
    state,
    hydrated,
    startWorkout: () => setState((current) => {
      if (current.activeSession) return current;
      const prepared = ensureCurrentWeeklyPlan(current);
      return {
        ...prepared,
        activeSession: {
          ...createWorkoutSession(prepared),
          readiness: prepared.dailyReadiness,
          notes: prepared.dailyReadiness?.notes ?? ''
        }
      };
    }),
    updateSet: (exerciseIndex, setIndex, patch) => setState((current) => {
      if (!current.activeSession) return current;
      const activeSession: WorkoutSession = {
        ...current.activeSession,
        exercises: current.activeSession.exercises.map((exercise, currentExerciseIndex) => currentExerciseIndex !== exerciseIndex ? exercise : ({
          ...exercise,
          sets: exercise.sets.map((set, currentSetIndex) => currentSetIndex !== setIndex ? set : ({ ...set, ...patch }))
        }))
      };
      return { ...current, activeSession };
    }),
    updateMachineNote: (exerciseIndex, note) => setState((current) => {
      if (!current.activeSession) return current;
      return {
        ...current,
        activeSession: {
          ...current.activeSession,
          exercises: current.activeSession.exercises.map((exercise, index) => index === exerciseIndex ? { ...exercise, machineNote: note } : exercise)
        }
      };
    }),
    updateWorkoutNotes: (notes) => setState((current) => current.activeSession ? ({ ...current, activeSession: { ...current.activeSession, notes } }) : current),
    updateReadiness: (patch) => setState((current) => ({
      ...current,
      dailyReadiness: {
        date: new Date().toISOString(),
        energy: current.dailyReadiness?.energy ?? 4,
        soreness: current.dailyReadiness?.soreness ?? 2,
        timeAvailable: current.dailyReadiness?.timeAvailable ?? 3,
        notes: current.dailyReadiness?.notes ?? '',
        ...patch
      }
    })),
    swapExercise: (exerciseIndex, newExerciseId, reason) => setState((current) => {
      if (!current.activeSession) return current;
      const definition = exercisesById[newExerciseId];
      if (!definition) return current;
      const existing = current.activeSession.exercises[exerciseIndex];
      if (!existing) return current;
      const recommendation = getRecommendation(current, newExerciseId);
      const replacement = {
        ...existing,
        exerciseId: newExerciseId,
        originalExerciseId: existing.originalExerciseId ?? existing.exerciseId,
        substitutionReason: reason,
        recommendation,
        machineNote: definition.equipment === 'machine' || definition.equipment === 'smith-machine' ? '' : undefined,
        sets: existing.sets.map((set) => ({ ...set, weight: recommendation.weight, reps: existing.minReps, rir: current.profile.defaultRir ?? 2, completed: false }))
      };
      return {
        ...current,
        activeSession: {
          ...current.activeSession,
          exercises: current.activeSession.exercises.map((exercise, index) => index === exerciseIndex ? replacement : exercise)
        }
      };
    }),
    finishWorkout: (manualCalories) => {
      if (!state.activeSession) return undefined;
      const completedAt = new Date().toISOString();
      const draft = { ...state.activeSession, completedAt };
      const estimated = estimateCalories(draft, state.profile.currentWeight);
      const completed: WorkoutSession = {
        ...draft,
        calories: manualCalories && manualCalories > 0 ? manualCalories : estimated,
        calorieSource: manualCalories && manualCalories > 0 ? 'manual' : 'estimate'
      };
      const volume = calculateVolume(completed);
      setState((current) => ({
        ...current,
        sessions: [...current.sessions, completed],
        activeSession: undefined,
        nextTemplateIndex: (current.nextTemplateIndex + 1) % getProgramForGoal(current.profile.goal, current.profile.trainingDays).length,
        dailyReadiness: { ...current.dailyReadiness!, date: new Date().toISOString(), notes: '' }
      }));
      return { volume, calories: completed.calories ?? estimated };
    },
    cancelWorkout: () => setState((current) => ({ ...current, activeSession: undefined })),
    addWeight: (weight, source = 'manual') => setState((current) => ({
      ...current,
      profile: { ...current.profile, currentWeight: weight },
      weightEntries: [...current.weightEntries, { id: `${Date.now()}`, date: new Date().toISOString(), weight, source }]
    })),
    startCardio: (device) => setState((current) => current.activeCardio ? current : ({
      ...current,
      activeCardio: { id: `cardio-${Date.now()}`, device, startedAt: new Date().toISOString() }
    })),
    finishCardio: (distanceMiles, notes) => setState((current) => {
      if (!current.activeCardio) return current;
      const completedAt = new Date().toISOString();
      const durationSeconds = Math.max(1, Math.round((new Date(completedAt).getTime() - new Date(current.activeCardio.startedAt).getTime()) / 1000));
      const completed = { ...current.activeCardio, completedAt, durationSeconds, distanceMiles: distanceMiles && distanceMiles > 0 ? distanceMiles : undefined, notes: notes?.trim() || undefined };
      return { ...current, cardioSessions: [...(current.cardioSessions ?? []), completed], activeCardio: undefined };
    }),
    cancelCardio: () => setState((current) => ({ ...current, activeCardio: undefined })),
    updateProfile: (patch) => setState((current) => {
      const next = { ...current, profile: { ...current.profile, ...patch } };
      const programChanged = patch.goal !== undefined || patch.trainingDays !== undefined;
      return programChanged
        ? { ...next, weeklyPlan: generateWeeklyPlan({ ...next, weeklyPlan: undefined }, new Date(), next.profile.workoutVariety, 1, new Date().toISOString()), nextTemplateIndex: 0 }
        : next;
    }),
    setHealthKitConnected: (healthKitConnected) => setState((current) => ({ ...current, healthKitConnected })),
    markBackupCreated: (lastBackupAt) => setState((current) => ({ ...current, lastBackupAt })),
    restoreBackup: (backupState, mode) => setState((current) => {
      if (mode === 'merge') return ensureCurrentWeeklyPlan(mergeBackupState(current, mergeStoredState(backupState)));
      const restored = mergeStoredState(backupState);
      return ensureCurrentWeeklyPlan({ ...restored, healthKitConnected: current.healthKitConnected });
    }),
    generatePlan: (variety) => setState((current) => ({ ...current, profile: { ...current.profile, workoutVariety: variety ?? current.profile.workoutVariety ?? 'moderate' }, weeklyPlan: generateWeeklyPlan(current, new Date(), variety) })),
    advanceTrainingPhase: () => setState((current) => {
      const plan = current.weeklyPlan ?? generateWeeklyPlan(current);
      const nextPhase = plan.blockWeek >= 4 ? 1 : plan.blockWeek + 1;
      const now = new Date();
      return {
        ...current,
        nextTemplateIndex: 0,
        weeklyPlan: generateWeeklyPlan(
          current,
          now,
          current.profile.workoutVariety,
          nextPhase,
          nextPhase === 1 ? now.toISOString() : plan.blockStartedAt
        )
      };
    }),
    repeatTrainingPhase: () => setState((current) => {
      const plan = current.weeklyPlan ?? generateWeeklyPlan(current);
      const now = new Date();
      return { ...current, nextTemplateIndex: 0, weeklyPlan: generateWeeklyPlan(current, now, current.profile.workoutVariety, plan.blockWeek, plan.blockStartedAt) };
    }),
    regenerateTrainingPhase: () => setState((current) => {
      const plan = current.weeklyPlan ?? generateWeeklyPlan(current);
      const now = new Date();
      return { ...current, nextTemplateIndex: 0, weeklyPlan: generateWeeklyPlan({ ...current, weeklyPlan: plan }, now, current.profile.workoutVariety, plan.blockWeek, plan.blockStartedAt) };
    }),
    updatePlannedWorkout: (workoutIndex, patch) => setState((current) => current.weeklyPlan ? ({ ...current, weeklyPlan: { ...current.weeklyPlan, workouts: current.weeklyPlan.workouts.map((workout, index) => index === workoutIndex ? { ...workout, ...patch } : workout) } }) : current),
    updatePlannedExercise: (workoutIndex, exerciseIndex, patch) => setState((current) => current.weeklyPlan ? ({ ...current, weeklyPlan: { ...current.weeklyPlan, workouts: current.weeklyPlan.workouts.map((workout, index) => index !== workoutIndex ? workout : ({ ...workout, exercises: workout.exercises.map((exercise, eIndex) => eIndex === exerciseIndex ? { ...exercise, ...patch } : exercise) })) } }) : current),
    movePlannedExercise: (workoutIndex, exerciseIndex, direction) => setState((current) => {
      if (!current.weeklyPlan) return current;
      const workouts = current.weeklyPlan.workouts.map((workout, index) => {
        if (index !== workoutIndex) return workout;
        const exercises = [...workout.exercises];
        const target = exerciseIndex + direction;
        if (target < 0 || target >= exercises.length) return workout;
        [exercises[exerciseIndex], exercises[target]] = [exercises[target]!, exercises[exerciseIndex]!];
        return { ...workout, exercises };
      });
      return { ...current, weeklyPlan: { ...current.weeklyPlan, workouts } };
    }),
    removePlannedExercise: (workoutIndex, exerciseIndex) => setState((current) => current.weeklyPlan ? ({ ...current, weeklyPlan: { ...current.weeklyPlan, workouts: current.weeklyPlan.workouts.map((workout, index) => index === workoutIndex ? { ...workout, exercises: workout.exercises.filter((_, eIndex) => eIndex !== exerciseIndex) } : workout) } }) : current),
    addPlannedExercise: (workoutIndex, exerciseId) => setState((current) => {
      if (!current.weeklyPlan || !exercisesById[exerciseId]) return current;
      const newExercise: ProgramExercise = { exerciseId, sets: 3, minReps: exercisesById[exerciseId]!.compound ? 6 : 10, maxReps: exercisesById[exerciseId]!.compound ? 10 : 15, restSeconds: exercisesById[exerciseId]!.compound ? 120 : 75 };
      return { ...current, weeklyPlan: { ...current.weeklyPlan, workouts: current.weeklyPlan.workouts.map((workout, index) => index === workoutIndex ? { ...workout, exercises: [...workout.exercises, newExercise] } : workout) } };
    }),
    toggleExerciseLock: (exerciseId) => setState((current) => {
      const plan = current.weeklyPlan ?? generateWeeklyPlan(current);
      const locked = plan.lockedExerciseIds.includes(exerciseId) ? plan.lockedExerciseIds.filter((id) => id !== exerciseId) : [...plan.lockedExerciseIds, exerciseId];
      return { ...current, weeklyPlan: { ...plan, lockedExerciseIds: locked } };
    }),
    resetAllData: async () => {
      await clearState();
      setState(initialState);
    }
  }), [hydrated, state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider.');
  return context;
};
