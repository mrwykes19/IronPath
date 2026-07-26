import { exercisesById } from '../data/exercises';
import { getProgramForGoal } from '../data/program';
import { blockAdjustedWeight, ensureCurrentWeeklyPlan } from './weeklyPlanner';
import { AppState, LoggedSet, WorkoutSession } from '../types';
import { getRecommendation } from './progression';
import { roundToIncrement } from '../utils/math';

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const getNextTemplate = (state: AppState) => {
  const prepared = ensureCurrentWeeklyPlan(state);
  const plan = prepared.weeklyPlan;
  const program = plan?.workouts.length ? plan.workouts : getProgramForGoal(prepared.profile.goal, prepared.profile.trainingDays);
  return program[state.nextTemplateIndex % program.length] ?? program[0];
};

export const createWorkoutSession = (state: AppState): WorkoutSession => {
  const prepared = ensureCurrentWeeklyPlan(state);
  const template = getNextTemplate(prepared);
  if (!template) throw new Error('No workout template is available.');
  const blockWeek = prepared.weeklyPlan?.blockWeek ?? 1;

  return {
    id: id(),
    templateId: template.id,
    name: template.name,
    startedAt: new Date().toISOString(),
    exercises: template.exercises.map((item) => {
      const baseRecommendation = getRecommendation(prepared, item.exerciseId);
      const definition = exercisesById[item.exerciseId];
      const increment = definition?.defaultIncrement || 1;
      const adjustedWeight = roundToIncrement(blockAdjustedWeight(baseRecommendation.weight, increment, blockWeek), increment);
      const recommendation = {
        ...baseRecommendation,
        weight: adjustedWeight,
        reason: blockWeek === 1
          ? `Volume phase: start lighter, own the higher rep range, and leave clean reps in reserve. ${baseRecommendation.reason}`
          : blockWeek === 2
            ? `Build phase: add a little load while keeping controlled reps. ${baseRecommendation.reason}`
            : blockWeek === 3
              ? `Progress phase: use your current working load and push clean progression. ${baseRecommendation.reason}`
              : `Peak phase: use the heaviest load of this block while staying inside the lower rep target. ${baseRecommendation.reason}`
      };
      const sets: LoggedSet[] = Array.from({ length: item.sets }, () => ({
        id: id(),
        weight: recommendation.weight,
        reps: item.minReps,
        rir: prepared.profile.defaultRir ?? 2,
        completed: false
      }));
      return {
        exerciseId: item.exerciseId,
        targetSets: item.sets,
        minReps: item.minReps,
        maxReps: item.maxReps,
        restSeconds: item.restSeconds,
        recommendation,
        sets,
        machineNote: definition?.equipment === 'machine' ? '' : undefined
      };
    })
  };
};

export const calculateVolume = (session: WorkoutSession) =>
  session.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completed).reduce((sum, set) => sum + set.weight * set.reps, 0),
    0
  );

export const estimateCalories = (session: WorkoutSession, bodyWeightLb?: number) => {
  const end = session.completedAt ? new Date(session.completedAt).getTime() : Date.now();
  const minutes = Math.max(10, (end - new Date(session.startedAt).getTime()) / 60000);
  const kilograms = (bodyWeightLb ?? 180) * 0.453592;
  const met = 5;
  return Math.round((met * 3.5 * kilograms * minutes) / 200);
};
