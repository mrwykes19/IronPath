import { exercisesById } from '../data/exercises';
import { getProgramForGoal } from '../data/program';
import { AppState, ProgramExercise, WeeklyPlan, WorkoutTemplate, WorkoutVariety } from '../types';
import { estimatedOneRepMax } from '../utils/math';

const DAY_MS = 86400000;
const BLOCK_LENGTH_WEEKS = 4;
const PROGRESSION_VERSION = 2;

const planKey = (date = new Date()) => `plan-${date.toISOString().slice(0, 10)}`;

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

const periodizeExercise = (item: ProgramExercise, blockWeek: number): ProgramExercise => {
  if (blockWeek === 1) {
    return {
      ...item,
      minReps: Math.min(20, item.minReps + 2),
      maxReps: Math.min(20, item.maxReps + 3),
      restSeconds: Math.max(60, item.restSeconds - 15)
    };
  }
  if (blockWeek === 2) {
    return {
      ...item,
      minReps: Math.min(20, item.minReps + 1),
      maxReps: Math.min(20, item.maxReps + 2)
    };
  }
  if (blockWeek === 4) {
    return {
      ...item,
      minReps: Math.max(3, item.minReps - 1),
      maxReps: Math.max(5, item.maxReps - 2),
      restSeconds: item.restSeconds + 15
    };
  }
  return { ...item };
};

const evolveWorkout = (state: AppState, template: WorkoutTemplate, blockWeek: number, variety: WorkoutVariety, locked: Set<string>): WorkoutTemplate => {
  const exercises = template.exercises.map((baseItem, index) => {
    const periodized = periodizeExercise(baseItem, blockWeek);
    const exerciseId = chooseRotation(state, periodized, index, blockWeek, variety, locked);
    return {
      ...periodized,
      exerciseId,
      note: exerciseId !== baseItem.exerciseId
        ? `Rotated from ${exercisesById[baseItem.exerciseId]?.name ?? 'the prior variation'} to keep the training stimulus productive.`
        : periodized.note
    };
  });

  return {
    ...template,
    id: `${template.id}-b${blockWeek}`,
    exercises
  };
};

const validProgressionPlan = (plan?: WeeklyPlan) => Boolean(plan && plan.progressionVersion === PROGRESSION_VERSION && plan.blockStartedAt);

const nextBlockWeek = (current: number, elapsedWeeks: number) => ((current - 1 + elapsedWeeks) % BLOCK_LENGTH_WEEKS) + 1;

export const generateWeeklyPlan = (
  state: AppState,
  date = new Date(),
  varietyOverride?: WorkoutVariety,
  blockWeekOverride?: number,
  blockStartedAtOverride?: string
): WeeklyPlan => {
  const variety = varietyOverride ?? state.profile.workoutVariety ?? 'moderate';
  const existing = state.weeklyPlan;
  const blockWeek = blockWeekOverride ?? (validProgressionPlan(existing) ? existing!.blockWeek : 1);
  const blockStartedAt = blockStartedAtOverride ?? (validProgressionPlan(existing) ? existing!.blockStartedAt! : date.toISOString());
  const locked = new Set(existing?.lockedExerciseIds ?? []);
  const base = getProgramForGoal(state.profile.goal, state.profile.trainingDays, state.profile.trainingSplit ?? 'auto', state.profile.customSplit);

  return {
    id: `plan-${Date.now()}`,
    weekKey: planKey(date),
    blockWeek,
    generatedAt: date.toISOString(),
    blockStartedAt,
    progressionVersion: PROGRESSION_VERSION,
    approved: true,
    variety,
    workouts: base.map((template) => evolveWorkout(state, template, blockWeek, variety, locked)),
    lockedExerciseIds: [...locked]
  };
};

export const ensureCurrentWeeklyPlan = (state: AppState, date = new Date()): AppState => {
  const existing = state.weeklyPlan;

  // Older versions used the calendar week number. Reset those plans so every user begins the new progression at phase 1.
  if (!validProgressionPlan(existing)) {
    return { ...state, weeklyPlan: generateWeeklyPlan({ ...state, weeklyPlan: undefined }, date, state.profile.workoutVariety, 1, date.toISOString()) };
  }

  const generatedAt = new Date(existing!.generatedAt).getTime();
  const elapsedWeeks = Math.floor((date.getTime() - generatedAt) / (7 * DAY_MS));
  if (elapsedWeeks < 1) return state;

  const blockWeek = nextBlockWeek(existing!.blockWeek, elapsedWeeks);
  return {
    ...state,
    weeklyPlan: generateWeeklyPlan(state, date, state.profile.workoutVariety, blockWeek, existing!.blockStartedAt)
  };
};

export const blockAdjustedWeight = (baseWeight: number, increment: number, blockWeek: number) => {
  const step = Math.max(1, increment || 1);
  if (blockWeek === 1) return Math.max(0, baseWeight - step * 2);
  if (blockWeek === 2) return Math.max(0, baseWeight - step);
  if (blockWeek === 4) return baseWeight + step;
  return baseWeight;
};

export const trainingPhaseProfiles = [
  {
    phase: 1,
    name: 'Volume Base',
    shortName: 'Base',
    purpose: 'Build quality volume with lighter loads, higher repetitions, and controlled technique.',
    loadNote: 'About two equipment increments below your normal recommendation.'
  },
  {
    phase: 2,
    name: 'Build',
    shortName: 'Build',
    purpose: 'Add load while keeping enough repetitions to reinforce technique and work capacity.',
    loadNote: 'About one equipment increment below your normal recommendation.'
  },
  {
    phase: 3,
    name: 'Progress',
    shortName: 'Progress',
    purpose: 'Use your normal working ranges and progress from actual performance.',
    loadNote: 'Your current recommended training weights.'
  },
  {
    phase: 4,
    name: 'Peak',
    shortName: 'Peak',
    purpose: 'Use heavier loads, lower repetitions, and longer rest while controlling total fatigue.',
    loadNote: 'About one equipment increment above your normal recommendation when performance supports it.'
  }
] as const;

export const getTrainingPhaseProfile = (phase: number) => trainingPhaseProfiles[Math.max(0, Math.min(3, phase - 1))]!;

export const previewTrainingPhase = (state: AppState, phase: number, date = new Date()) =>
  generateWeeklyPlan(state, date, state.profile.workoutVariety, Math.max(1, Math.min(4, phase)), state.weeklyPlan?.blockStartedAt ?? date.toISOString());
