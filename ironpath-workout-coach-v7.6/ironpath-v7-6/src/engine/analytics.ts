import { exercisesById } from '../data/exercises';
import { AppState, MuscleGroup, WorkoutSession } from '../types';
import { calculateVolume } from './planner';
import { estimatedOneRepMax } from '../utils/math';

const DAY = 86400000;

export const completedSessions = (state: AppState) => state.sessions.filter((session) => Boolean(session.completedAt));

export const completedCardioSessions = (state: AppState) => (state.cardioSessions ?? []).filter((session) => Boolean(session.completedAt));

export const sessionsSince = (state: AppState, days: number) => {
  const cutoff = Date.now() - days * DAY;
  return completedSessions(state).filter((session) => new Date(session.completedAt!).getTime() >= cutoff);
};

export const cardioSessionsSince = (state: AppState, days: number) => {
  const cutoff = Date.now() - days * DAY;
  return completedCardioSessions(state).filter((session) => new Date(session.completedAt!).getTime() >= cutoff);
};

export const sessionDurationMinutes = (session: WorkoutSession) => {
  const end = session.completedAt ? new Date(session.completedAt).getTime() : Date.now();
  return Math.max(0, Math.round((end - new Date(session.startedAt).getTime()) / 60000));
};

export const getExerciseHistory = (state: AppState, exerciseId: string) => completedSessions(state)
  .flatMap((session) => {
    const exercise = session.exercises.find((item) => item.exerciseId === exerciseId);
    if (!exercise) return [];
    const sets = exercise.sets.filter((set) => set.completed && !set.warmup);
    if (!sets.length) return [];
    const bestSet = sets.reduce((best, set) => estimatedOneRepMax(set.weight, set.reps) > estimatedOneRepMax(best.weight, best.reps) ? set : best, sets[0]!);
    return [{
      sessionId: session.id,
      date: session.completedAt!,
      sessionName: session.name,
      bestSet,
      estimatedMax: estimatedOneRepMax(bestSet.weight, bestSet.reps),
      volume: sets.reduce((sum, set) => sum + set.weight * set.reps, 0)
    }];
  })
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export const personalRecords = (state: AppState) => {
  const records: Array<{ exerciseId: string; date: string; weight: number; reps: number; estimatedMax: number }> = [];
  const bestByExercise = new Map<string, number>();
  completedSessions(state).forEach((session) => {
    session.exercises.forEach((exercise) => {
      exercise.sets.filter((set) => set.completed && !set.warmup).forEach((set) => {
        const score = estimatedOneRepMax(set.weight, set.reps);
        if (score > (bestByExercise.get(exercise.exerciseId) ?? 0)) {
          bestByExercise.set(exercise.exerciseId, score);
          records.push({ exerciseId: exercise.exerciseId, date: session.completedAt!, weight: set.weight, reps: set.reps, estimatedMax: score });
        }
      });
    });
  });
  return records;
};

export const weeklySummary = (state: AppState) => {
  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setHours(0, 0, 0, 0);
  currentStart.setDate(currentStart.getDate() - currentStart.getDay());
  const currentEnd = new Date(currentStart.getTime() + 7 * DAY);
  const previousStart = new Date(currentStart.getTime() - 7 * DAY);
  const inRange = (date: string | undefined, from: Date, to: Date) => {
    if (!date) return false;
    const time = new Date(date).getTime();
    return time >= from.getTime() && time < to.getTime();
  };
  const currentStrength = completedSessions(state).filter((session) => inRange(session.completedAt, currentStart, currentEnd));
  const currentCardio = completedCardioSessions(state).filter((session) => inRange(session.completedAt, currentStart, currentEnd));
  const previousStrength = completedSessions(state).filter((session) => inRange(session.completedAt, previousStart, currentStart));
  const currentVolume = currentStrength.reduce((sum, session) => sum + calculateVolume(session), 0);
  const previousVolume = previousStrength.reduce((sum, session) => sum + calculateVolume(session), 0);
  const strengthCalories = currentStrength.reduce((sum, session) => sum + (session.calories ?? 0), 0);
  const cardioCalories = currentCardio.reduce((sum, session) => sum + (session.calories ?? 0), 0);
  const strengthMinutes = currentStrength.reduce((sum, session) => sum + sessionDurationMinutes(session), 0);
  const cardioMinutes = currentCardio.reduce((sum, session) => sum + Math.round((session.durationSeconds ?? 0) / 60), 0);
  const cardioDays = new Set(currentCardio.map((session) => new Date(session.completedAt!).toLocaleDateString('en-CA'))).size;
  const activeMinutes = strengthMinutes + cardioMinutes;
  const recentPrs = personalRecords(state).filter((record) => inRange(record.date, currentStart, currentEnd)).length;
  const adherence = Math.min(100, Math.round((currentStrength.length / Math.max(1, state.profile.trainingDays)) * 100));
  const weightEntries = state.weightEntries.filter((entry) => new Date(entry.date).getTime() >= Date.now() - 14 * DAY).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const weightChange = weightEntries.length > 1 ? weightEntries.at(-1)!.weight - weightEntries[0]!.weight : 0;
  return {
    workouts: currentStrength.length,
    strengthWorkouts: currentStrength.length,
    cardioWorkouts: currentCardio.length,
    currentVolume,
    volumeChangePercent: previousVolume ? Math.round(((currentVolume - previousVolume) / previousVolume) * 100) : currentVolume ? 100 : 0,
    calories: strengthCalories + cardioCalories,
    strengthCalories,
    cardioCalories,
    activeMinutes,
    strengthMinutes,
    cardioMinutes,
    cardioDays,
    prs: recentPrs,
    adherence,
    weightChange
  };
};

export const muscleVolume = (state: AppState, days = 7): Record<MuscleGroup, number> => {
  const result: Record<MuscleGroup, number> = { Chest: 0, Back: 0, Legs: 0, Shoulders: 0, Arms: 0, Core: 0 };
  sessionsSince(state, days).forEach((session) => session.exercises.forEach((exercise) => {
    const definition = exercisesById[exercise.exerciseId];
    if (!definition) return;
    result[definition.muscleGroup] += exercise.sets.filter((set) => set.completed && !set.warmup).length;
  }));
  return result;
};

export const workoutStreak = (state: AppState) => {
  const strengthDays = completedSessions(state).map((session) => new Date(session.completedAt!).toISOString().slice(0, 10));
  const cardioDays = completedCardioSessions(state).map((session) => new Date(session.completedAt!).toISOString().slice(0, 10));
  const days = [...new Set([...strengthDays, ...cardioDays])].sort().reverse();
  if (!days.length) return 0;
  let streak = 1;
  for (let index = 1; index < days.length; index += 1) {
    const newer = new Date(days[index - 1]!).getTime();
    const older = new Date(days[index]!).getTime();
    const gap = Math.round((newer - older) / DAY);
    if (gap <= 2) streak += 1;
    else break;
  }
  return streak;
};
