import { exercisesById } from '../data/exercises';
import { AppState, MuscleGroup, WorkoutSession } from '../types';
import { calculateVolume } from './planner';
import { estimatedOneRepMax } from '../utils/math';

const DAY = 86400000;

export const completedSessions = (state: AppState) => state.sessions.filter((session) => Boolean(session.completedAt));

export const sessionsSince = (state: AppState, days: number) => {
  const cutoff = Date.now() - days * DAY;
  return completedSessions(state).filter((session) => new Date(session.completedAt!).getTime() >= cutoff);
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
  const current = sessionsSince(state, 7);
  const previousCutoff = Date.now() - 14 * DAY;
  const previousEnd = Date.now() - 7 * DAY;
  const previous = completedSessions(state).filter((session) => {
    const time = new Date(session.completedAt!).getTime();
    return time >= previousCutoff && time < previousEnd;
  });
  const currentVolume = current.reduce((sum, session) => sum + calculateVolume(session), 0);
  const previousVolume = previous.reduce((sum, session) => sum + calculateVolume(session), 0);
  const currentCalories = current.reduce((sum, session) => sum + (session.calories ?? 0), 0);
  const recentPrs = personalRecords(state).filter((record) => new Date(record.date).getTime() >= Date.now() - 7 * DAY).length;
  const adherence = Math.min(100, Math.round((current.length / Math.max(1, state.profile.trainingDays)) * 100));
  const weightEntries = state.weightEntries.filter((entry) => new Date(entry.date).getTime() >= Date.now() - 14 * DAY).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const weightChange = weightEntries.length > 1 ? weightEntries.at(-1)!.weight - weightEntries[0]!.weight : 0;
  return {
    workouts: current.length,
    currentVolume,
    volumeChangePercent: previousVolume ? Math.round(((currentVolume - previousVolume) / previousVolume) * 100) : currentVolume ? 100 : 0,
    calories: currentCalories,
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
  const days = [...new Set(completedSessions(state).map((session) => new Date(session.completedAt!).toISOString().slice(0, 10)))].sort().reverse();
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

export const achievements = (state: AppState) => {
  const completed = completedSessions(state);
  const prs = personalRecords(state);
  const streak = workoutStreak(state);
  const currentWeight = state.weightEntries.at(-1)?.weight ?? state.profile.currentWeight;
  const startingWeight = state.weightEntries[0]?.weight ?? state.profile.currentWeight;
  const weightChange = currentWeight && startingWeight ? startingWeight - currentWeight : 0;
  return [
    { id: 'pr', title: 'Personal Records', value: `${prs.length}`, detail: prs.length ? 'Progressive overload is working.' : 'Complete workouts to earn your first PR.', unlocked: prs.length > 0 },
    { id: 'streak', title: 'Training Streak', value: `${streak}`, detail: 'Consistent sessions', unlocked: streak >= 4 },
    { id: 'workouts', title: 'Workout Club', value: `${completed.length}`, detail: completed.length >= 100 ? '100 workouts completed' : `${Math.max(0, 100 - completed.length)} to 100 workouts`, unlocked: completed.length >= 10 },
    { id: 'weight', title: 'Weight Milestone', value: `${Math.max(0, weightChange).toFixed(1)} ${state.profile.unit}`, detail: 'Lost since tracking began', unlocked: weightChange >= 5 }
  ];
};
