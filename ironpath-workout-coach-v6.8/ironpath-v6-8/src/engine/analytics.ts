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
  const currentStrength = sessionsSince(state, 7);
  const currentCardio = cardioSessionsSince(state, 7);
  const previousCutoff = Date.now() - 14 * DAY;
  const previousEnd = Date.now() - 7 * DAY;
  const previousStrength = completedSessions(state).filter((session) => {
    const time = new Date(session.completedAt!).getTime();
    return time >= previousCutoff && time < previousEnd;
  });
  const currentVolume = currentStrength.reduce((sum, session) => sum + calculateVolume(session), 0);
  const previousVolume = previousStrength.reduce((sum, session) => sum + calculateVolume(session), 0);
  const strengthCalories = currentStrength.reduce((sum, session) => sum + (session.calories ?? 0), 0);
  const cardioCalories = currentCardio.reduce((sum, session) => sum + (session.calories ?? 0), 0);
  const strengthMinutes = currentStrength.reduce((sum, session) => sum + sessionDurationMinutes(session), 0);
  const cardioMinutes = currentCardio.reduce((sum, session) => sum + Math.round((session.durationSeconds ?? 0) / 60), 0);
  const cardioDays = new Set(currentCardio.map((session) => new Date(session.completedAt!).toISOString().slice(0, 10))).size;
  const activeMinutes = strengthMinutes + cardioMinutes;
  const recentPrs = personalRecords(state).filter((record) => new Date(record.date).getTime() >= Date.now() - 7 * DAY).length;
  const adherence = Math.min(100, Math.round((currentStrength.length / Math.max(1, state.profile.trainingDays)) * 100));
  const weightEntries = state.weightEntries.filter((entry) => new Date(entry.date).getTime() >= Date.now() - 14 * DAY).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const weightChange = weightEntries.length > 1 ? weightEntries.at(-1)!.weight - weightEntries[0]!.weight : 0;
  return {
    workouts: currentStrength.length + currentCardio.length,
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

export const achievements = (state: AppState) => {
  const completed = completedSessions(state);
  const completedCardio = completedCardioSessions(state);
  const prs = personalRecords(state);
  const streak = workoutStreak(state);
  const totalWorkouts = completed.length + completedCardio.length;
  const totalCalories = [...completed, ...completedCardio].reduce((sum, session) => sum + (session.calories ?? 0), 0);
  const week = weeklySummary(state);
  const dailyGoal = state.profile.dailyCalorieGoal ?? Math.round((state.profile.weeklyCalorieGoal ?? 6000) / Math.max(1, state.profile.trainingDays));
  const weeklyCalorieGoal = dailyGoal * Math.max(1, state.profile.trainingDays);
  const goalCrusher = week.workouts >= state.profile.trainingDays && week.cardioDays >= (state.profile.weeklyCardioDaysGoal ?? 3) && week.activeMinutes >= (state.profile.weeklyActiveMinutesGoal ?? 240) && week.calories >= weeklyCalorieGoal;
  const badge = (id: string, title: string, current: number, target: number, detail: string) => ({ id, title, value: `${Math.min(current, target)}/${target}`, current, target, detail, unlocked: current >= target });
  return [
    badge('first-workout', 'First Workout', totalWorkouts, 1, 'Complete your first strength or custom workout.'),
    badge('cardio-starter', 'Cardio Starter', completedCardio.length, 1, 'Complete your first cardio session.'),
    badge('three-day-streak', '3-Day Streak', streak, 3, 'Train on three consecutive active days.'),
    badge('first-week', 'First Week', week.workouts, state.profile.trainingDays, 'Complete your planned number of sessions in a week.'),
    badge('thousand-calories', '1000 Calories', totalCalories, 1000, 'Burn 1,000 total tracked workout calories.'),
    badge('seven-day-streak', '7-Day Streak', streak, 7, 'Build a seven-day activity streak.'),
    badge('ten-workouts', '10 Workouts', totalWorkouts, 10, 'Complete ten total strength or cardio sessions.'),
    badge('new-max', 'New Max', prs.length, 2, 'Set a new strength best after your initial record.'),
    { id: 'goal-crusher', title: 'Goal Crusher', value: goalCrusher ? 'Complete' : 'In progress', current: goalCrusher ? 1 : 0, target: 1, detail: 'Complete every weekly goal in the same week.', unlocked: goalCrusher },
    badge('thirty-day-streak', '30-Day Streak', streak, 30, 'Reach a thirty-day activity streak.')
  ];
};
