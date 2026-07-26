import { exercisesById } from '../data/exercises';
import { getProgramForGoal } from '../data/program';
import { AppState, ProgramExercise, WeeklyPlan, WorkoutTemplate, WorkoutVariety } from '../types';
import { estimatedOneRepMax } from '../utils/math';

const weekKey = (date = new Date()) => {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((copy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${copy.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

const blockWeekFor = (date = new Date()) => {
  const key = weekKey(date);
  const n = Number(key.split('W')[1]) || 1;
  return ((n - 1) % 4) + 1;
};

const recentExerciseScores = (state: AppState, exerciseId: string) => state.sessions
  .flatMap((session) => session.exercises.filter((exercise) => exercise.exerciseId === exerciseId).map((exercise) => ({ session, exercise })))
  .filter(({ session }) => Boolean(session.completedAt))
  .slice(-4)
  .map(({ exercise }) => Math.max(0, ...exercise.sets.filter((set) => set.completed).map((set) => estimatedOneRepMax(set.weight, set.reps))));

export const exercisePlateaued = (state: AppState, exerciseId: string) => {
  const scores = recentExerciseScores(state, exerciseId);
  if (scores.length < 4) return false;
  const first = scores[0] || 0;
  const bestLater = Math.max(...scores.slice(1));
  return first > 0 && bestLater <= first * 1.005;
};

const chooseRotation = (state: AppState, item: ProgramExercise, exerciseIndex: number, blockWeek: number, variety: WorkoutVariety, locked: Set<string>) => {
  if (variety === 'consistent' || blockWeek === 1 || locked.has(item.exerciseId)) return item.exerciseId;
  const definition = exercisesById[item.exerciseId];
  if (!definition?.substitutions.length) return item.exerciseId;
  const shouldRotate = variety === 'high' || !definition.compound || exercisePlateaued(state, item.exerciseId);
  if (!shouldRotate) return item.exerciseId;
  const candidates = definition.substitutions.filter((id) => exercisesById[id]);
  if (!candidates.length) return item.exerciseId;
  const offset = (blockWeek + exerciseIndex - 2) % candidates.length;
  return candidates[offset] ?? item.exerciseId;
};

const evolveWorkout = (state: AppState, template: WorkoutTemplate, blockWeek: number, variety: WorkoutVariety, locked: Set<string>): WorkoutTemplate => {
  const exercises = template.exercises.map((item, index) => {
    const exerciseId = chooseRotation(state, item, index, blockWeek, variety, locked);
    const deload = blockWeek === 4 && (state.dailyReadiness?.soreness ?? 0) >= 4;
    return {
      ...item,
      exerciseId,
      sets: deload ? Math.max(2, item.sets - 1) : item.sets,
      note: exerciseId !== item.exerciseId ? `Rotated from ${exercisesById[item.exerciseId]?.name ?? 'prior variation'} for week ${blockWeek}.` : item.note
    };
  });
  return {
    ...template,
    id: `${template.id}-w${blockWeek}`,
    name: `${template.name} · Week ${blockWeek}`,
    focus: blockWeek === 4 ? `${template.focus} · consolidation` : template.focus,
    exercises
  };
};

export const generateWeeklyPlan = (state: AppState, date = new Date(), varietyOverride?: WorkoutVariety): WeeklyPlan => {
  const variety = varietyOverride ?? state.profile.workoutVariety ?? 'moderate';
  const blockWeek = blockWeekFor(date);
  const locked = new Set(state.weeklyPlan?.lockedExerciseIds ?? []);
  const base = getProgramForGoal(state.profile.goal, state.profile.trainingDays);
  return {
    id: `plan-${Date.now()}`,
    weekKey: weekKey(date),
    blockWeek,
    generatedAt: new Date().toISOString(),
    approved: true,
    variety,
    workouts: base.map((template) => evolveWorkout(state, template, blockWeek, variety, locked)),
    lockedExerciseIds: [...locked]
  };
};

export const currentWeekKey = () => weekKey(new Date());
