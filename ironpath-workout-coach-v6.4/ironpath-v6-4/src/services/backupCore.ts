import {
  AppState,
  BodyWeightEntry,
  DailyReadiness,
  LoggedSet,
  UserProfile,
  WorkoutExerciseLog,
  WorkoutSession
} from '../types';
import {
  BackupSummary,
  IronPathBackupDocument,
  IRONPATH_APP_VERSION,
  IRONPATH_BACKUP_FORMAT,
  IRONPATH_BACKUP_VERSION
} from './backup.types';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

const isUserProfile = (value: unknown): value is UserProfile => {
  if (!isRecord(value)) return false;
  return isString(value.name)
    && ['balanced', 'strength', 'muscle', 'fat-loss'].includes(String(value.goal))
    && ['beginner', 'intermediate', 'advanced'].includes(String(value.experience))
    && ['lb', 'kg'].includes(String(value.unit))
    && isNumber(value.trainingDays)
    && isNumber(value.sessionMinutes)
    && isNumber(value.upperIncrement)
    && isNumber(value.lowerIncrement)
    && (value.currentWeight === undefined || isNumber(value.currentWeight))
    && (value.goalWeight === undefined || isNumber(value.goalWeight))
    && (value.defaultRir === undefined || isNumber(value.defaultRir));
};

const isLoggedSet = (value: unknown): value is LoggedSet => {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isNumber(value.weight)
    && isNumber(value.reps)
    && isNumber(value.rir)
    && isBoolean(value.completed)
    && (value.warmup === undefined || isBoolean(value.warmup));
};

const isWorkoutExercise = (value: unknown): value is WorkoutExerciseLog => {
  if (!isRecord(value)) return false;
  return isString(value.exerciseId)
    && isNumber(value.targetSets)
    && isNumber(value.minReps)
    && isNumber(value.maxReps)
    && isNumber(value.restSeconds)
    && Array.isArray(value.sets)
    && value.sets.every(isLoggedSet)
    && isRecord(value.recommendation)
    && isString(value.recommendation.kind)
    && isNumber(value.recommendation.weight)
    && isString(value.recommendation.reason);
};

const isDailyReadiness = (value: unknown): value is DailyReadiness => {
  if (!isRecord(value)) return false;
  return isString(value.date)
    && isNumber(value.energy)
    && isNumber(value.soreness)
    && isNumber(value.timeAvailable)
    && isString(value.notes);
};

const isWorkoutSession = (value: unknown): value is WorkoutSession => {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.templateId)
    && isString(value.name)
    && isString(value.startedAt)
    && (value.completedAt === undefined || isString(value.completedAt))
    && Array.isArray(value.exercises)
    && value.exercises.every(isWorkoutExercise)
    && (value.calories === undefined || isNumber(value.calories))
    && (value.notes === undefined || isString(value.notes))
    && (value.readiness === undefined || isDailyReadiness(value.readiness));
};

const isWeightEntry = (value: unknown): value is BodyWeightEntry => {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.date)
    && isNumber(value.weight)
    && ['manual', 'healthkit'].includes(String(value.source));
};

const isAppState = (value: unknown): value is AppState => {
  if (!isRecord(value)) return false;
  return isUserProfile(value.profile)
    && Array.isArray(value.sessions)
    && value.sessions.every(isWorkoutSession)
    && (value.activeSession === undefined || isWorkoutSession(value.activeSession))
    && Array.isArray(value.weightEntries)
    && value.weightEntries.every(isWeightEntry)
    && isNumber(value.nextTemplateIndex)
    && isBoolean(value.healthKitConnected)
    && (value.dailyReadiness === undefined || isDailyReadiness(value.dailyReadiness))
    && (value.lastBackupAt === undefined || isString(value.lastBackupAt));
};

export const createBackupDocument = (state: AppState, exportedAt = new Date().toISOString()): IronPathBackupDocument => ({
  format: IRONPATH_BACKUP_FORMAT,
  backupVersion: IRONPATH_BACKUP_VERSION,
  appVersion: IRONPATH_APP_VERSION,
  exportedAt,
  data: { ...state, lastBackupAt: exportedAt }
});

export const getBackupFilename = (exportedAt: string) => {
  const date = exportedAt.slice(0, 10);
  return `IronPath-Backup-${date}.json`;
};

export const summarizeBackup = (backup: IronPathBackupDocument): BackupSummary => ({
  workoutCount: backup.data.sessions.length,
  weightEntryCount: backup.data.weightEntries.length,
  hasActiveWorkout: Boolean(backup.data.activeSession),
  exportedAt: backup.exportedAt,
  appVersion: backup.appVersion
});

export const parseBackupText = (raw: string): { backup: IronPathBackupDocument; summary: BackupSummary } => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('This file is not valid JSON. Select an IronPath backup file.');
  }

  if (!isRecord(parsed)) throw new Error('This file is not a valid IronPath backup.');
  if (parsed.format !== IRONPATH_BACKUP_FORMAT) throw new Error('This file was not created by IronPath.');
  if (parsed.backupVersion !== IRONPATH_BACKUP_VERSION) throw new Error('This backup version is not supported by this version of IronPath.');
  if (!isString(parsed.appVersion) || !isString(parsed.exportedAt) || !isAppState(parsed.data)) {
    throw new Error('The backup is incomplete or damaged and cannot be restored safely.');
  }

  const backup = parsed as unknown as IronPathBackupDocument;
  return { backup, summary: summarizeBackup(backup) };
};
