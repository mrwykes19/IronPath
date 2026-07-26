import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, BackupRestoreMode, BodyWeightEntry, DailyReadiness, LoggedSet, UserProfile, WorkoutSession } from '../types';
import { calculateVolume, createWorkoutSession, estimateCalories } from '../engine/planner';
import { clearState, loadState, saveState } from '../services/storage';
import { exercisesById } from '../data/exercises';
import { getRecommendation } from '../engine/progression';

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
    defaultRir: 2
  },
  sessions: [],
  weightEntries: [],
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
  updateProfile: (patch: Partial<UserProfile>) => void;
  setHealthKitConnected: (connected: boolean) => void;
  markBackupCreated: (exportedAt: string) => void;
  restoreBackup: (backupState: AppState, mode: BackupRestoreMode) => void;
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const mergeStoredState = (stored: AppState): AppState => ({
  ...initialState,
  ...stored,
  profile: { ...initialState.profile, ...stored.profile },
  dailyReadiness: { ...initialState.dailyReadiness!, ...(stored.dailyReadiness ?? {}) }
});

const dedupeById = <T extends { id: string }>(items: T[]) => Array.from(new Map(items.map((item) => [item.id, item])).values());

const mergeBackupState = (current: AppState, imported: AppState): AppState => ({
  ...current,
  profile: { ...current.profile, ...imported.profile },
  sessions: dedupeById([...current.sessions, ...imported.sessions]).sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()),
  weightEntries: dedupeById([...current.weightEntries, ...imported.weightEntries]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
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
      if (stored) setState(mergeStoredState(stored));
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) void saveState(state);
  }, [hydrated, state]);

  const value = useMemo<AppContextValue>(() => ({
    state,
    hydrated,
    startWorkout: () => setState((current) => current.activeSession ? current : {
      ...current,
      activeSession: {
        ...createWorkoutSession(current),
        readiness: current.dailyReadiness,
        notes: current.dailyReadiness?.notes ?? ''
      }
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
        nextTemplateIndex: (current.nextTemplateIndex + 1) % 4,
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
    updateProfile: (patch) => setState((current) => ({ ...current, profile: { ...current.profile, ...patch } })),
    setHealthKitConnected: (healthKitConnected) => setState((current) => ({ ...current, healthKitConnected })),
    markBackupCreated: (lastBackupAt) => setState((current) => ({ ...current, lastBackupAt })),
    restoreBackup: (backupState, mode) => setState((current) => {
      if (mode === 'merge') return mergeBackupState(current, mergeStoredState(backupState));
      const restored = mergeStoredState(backupState);
      return { ...restored, healthKitConnected: current.healthKitConnected };
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
