import { exercisesById } from '../data/exercises';
import { AppState, WeightRecommendation, WorkoutExerciseLog } from '../types';
import { average, estimatedOneRepMax, projectedReps, roundToIncrement } from '../utils/math';

const completedWorkingSets = (log?: WorkoutExerciseLog) =>
  log?.sets.filter((set) => set.completed && !set.warmup) ?? [];

const sessionLogsForExercise = (state: AppState, exerciseId: string) =>
  state.sessions
    .filter((session) => Boolean(session.completedAt))
    .map((session) => session.exercises.find((exercise) => exercise.exerciseId === exerciseId))
    .filter((exercise): exercise is WorkoutExerciseLog => Boolean(exercise))
    .filter((exercise) => completedWorkingSets(exercise).length > 0)
    .slice(-3);

const isTopRangeSuccess = (log: WorkoutExerciseLog) => {
  const sets = completedWorkingSets(log);
  if (!sets.length || sets.length < log.targetSets) return false;
  return sets.every((set) => set.reps >= log.maxReps) && average(sets.map((set) => set.rir)) >= 1;
};

const missedMinimum = (log: WorkoutExerciseLog) => {
  const sets = completedWorkingSets(log);
  return sets.length > 0 && sets.some((set) => set.reps < log.minReps);
};

export const getRecommendation = (state: AppState, exerciseId: string): WeightRecommendation => {
  const definition = exercisesById[exerciseId];
  if (!definition) return { kind: 'starting', weight: 0, readinessPercent: 20, reason: 'Start with a comfortable training weight.' };

  const history = sessionLogsForExercise(state, exerciseId);
  const latest = history.at(-1);
  const previous = history.at(-2);

  if (!latest) {
    const factor = state.profile.experience === 'beginner' ? 0.8 : state.profile.experience === 'advanced' ? 1.2 : 1;
    const startingWeight = roundToIncrement(definition.defaultWeight * factor, definition.defaultWeight === 0 ? 1 : 5);
    return { kind: 'starting', weight: startingWeight, readinessPercent: 25, reason: 'Suggested starting point. Adjust after the first set if needed.' };
  }

  const sets = completedWorkingSets(latest);
  const latestWeight = sets.at(-1)?.weight ?? definition.defaultWeight;
  const increment = definition.defaultWeight === 0 ? 1 : 5;

  const successes = [previous, latest].filter((item): item is WorkoutExerciseLog => Boolean(item)).filter(isTopRangeSuccess).length;
  const averageRir = average(sets.map((set) => set.rir));
  const twoMisses = Boolean(previous && missedMinimum(previous) && missedMinimum(latest));

  const bestSet = sets.reduce((best, set) => {
    const score = estimatedOneRepMax(set.weight, set.reps);
    return score > best.score ? { score, set } : best;
  }, { score: 0, set: sets[0] });

  if (twoMisses) {
    const reduced = roundToIncrement(latestWeight * 0.9, increment);
    return { kind: 'reduce', weight: reduced, readinessPercent: 15, reason: 'The minimum rep target was missed twice. A small reset should restore clean reps.' };
  }

  if (successes >= 2 || (isTopRangeSuccess(latest) && averageRir >= 2.5)) {
    const increased = roundToIncrement(latestWeight + increment, increment);
    return {
      kind: 'increase',
      weight: increased,
      projectedReps: projectedReps(bestSet.score, increased),
      readinessPercent: 100,
      reason: successes >= 2
        ? 'You reached the top of the rep range in two recent sessions with reps left in reserve.'
        : 'You reached the top of the range with significant reps left in reserve.'
    };
  }

  const repProgress = sets.length ? average(sets.map((set) => Math.min(1, Math.max(0, (set.reps - latest.minReps + 1) / Math.max(1, latest.maxReps - latest.minReps + 1))))) : 0;
  const readinessPercent = Math.round(Math.min(92, Math.max(30, repProgress * 85 + Math.max(0, averageRir - 1) * 5)));
  return { kind: 'maintain', weight: latestWeight, readinessPercent, reason: 'Stay here and add clean repetitions before increasing the load.' };
};
