import { exercisesById } from '../data/exercises';
import { getProgramForGoal } from '../data/program';
import { currentWeekKey, generateWeeklyPlan } from './weeklyPlanner';
import { AppState, LoggedSet, WorkoutSession } from '../types';
import { getRecommendation } from './progression';

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const getNextTemplate = (state: AppState) => {
  const plan = state.weeklyPlan?.weekKey === currentWeekKey() ? state.weeklyPlan : generateWeeklyPlan(state);
  const program = plan.workouts.length ? plan.workouts : getProgramForGoal(state.profile.goal, state.profile.trainingDays);
  return program[state.nextTemplateIndex % program.length] ?? program[0];
};

export const createWorkoutSession = (state: AppState): WorkoutSession => {
  const template = getNextTemplate(state);
  if (!template) throw new Error('No workout template is available.');

  return {
    id: id(),
    templateId: template.id,
    name: template.name,
    startedAt: new Date().toISOString(),
    exercises: template.exercises.map((item) => {
      const recommendation = getRecommendation(state, item.exerciseId);
      const sets: LoggedSet[] = Array.from({ length: item.sets }, () => ({
        id: id(),
        weight: recommendation.weight,
        reps: item.minReps,
        rir: state.profile.defaultRir ?? 2,
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
        machineNote: exercisesById[item.exerciseId]?.equipment === 'machine' ? '' : undefined
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
