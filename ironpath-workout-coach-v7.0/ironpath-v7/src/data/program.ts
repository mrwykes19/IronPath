import { exercisesById } from './exercises';
import { Goal, ProgramExercise, SplitDayFocus, TrainingSplit, WorkoutTemplate } from '../types';

export const fourDayUpperLower: WorkoutTemplate[] = [
  {
    id: 'upper-a', name: 'Press & Pull', focus: 'Chest and back strength', estimatedMinutes: 62,
    exercises: [
      { exerciseId: 'bench-press', sets: 3, minReps: 6, maxReps: 8, restSeconds: 150 },
      { exerciseId: 'seated-row', sets: 3, minReps: 8, maxReps: 10, restSeconds: 120 },
      { exerciseId: 'incline-db-press', sets: 3, minReps: 8, maxReps: 12, restSeconds: 105 },
      { exerciseId: 'lat-pulldown', sets: 3, minReps: 8, maxReps: 12, restSeconds: 105 },
      { exerciseId: 'lateral-raise', sets: 3, minReps: 12, maxReps: 15, restSeconds: 75 },
      { exerciseId: 'triceps-pressdown', sets: 2, minReps: 10, maxReps: 15, restSeconds: 75 },
      { exerciseId: 'db-curl', sets: 2, minReps: 10, maxReps: 15, restSeconds: 75 }
    ]
  },
  {
    id: 'lower-a', name: 'Squat & Hinge', focus: 'Squat and posterior chain', estimatedMinutes: 65,
    exercises: [
      { exerciseId: 'back-squat', sets: 3, minReps: 5, maxReps: 8, restSeconds: 180 },
      { exerciseId: 'romanian-deadlift', sets: 3, minReps: 6, maxReps: 10, restSeconds: 150 },
      { exerciseId: 'leg-press', sets: 3, minReps: 10, maxReps: 15, restSeconds: 120 },
      { exerciseId: 'leg-curl', sets: 3, minReps: 10, maxReps: 15, restSeconds: 90 },
      { exerciseId: 'calf-raise', sets: 3, minReps: 10, maxReps: 15, restSeconds: 75 },
      { exerciseId: 'cable-crunch', sets: 3, minReps: 10, maxReps: 15, restSeconds: 75 }
    ]
  },
  {
    id: 'upper-b', name: 'Upper Build', focus: 'Shoulders and back', estimatedMinutes: 60,
    exercises: [
      { exerciseId: 'overhead-press', sets: 3, minReps: 6, maxReps: 8, restSeconds: 150 },
      { exerciseId: 'lat-pulldown', sets: 3, minReps: 8, maxReps: 10, restSeconds: 120 },
      { exerciseId: 'machine-chest', sets: 3, minReps: 8, maxReps: 12, restSeconds: 105 },
      { exerciseId: 'chest-supported-row', sets: 3, minReps: 8, maxReps: 12, restSeconds: 105 },
      { exerciseId: 'rear-delt-fly', sets: 3, minReps: 12, maxReps: 15, restSeconds: 75 },
      { exerciseId: 'cable-curl', sets: 2, minReps: 10, maxReps: 15, restSeconds: 75 },
      { exerciseId: 'overhead-triceps', sets: 2, minReps: 10, maxReps: 15, restSeconds: 75 }
    ]
  },
  {
    id: 'lower-b', name: 'Lower Build', focus: 'Deadlift and quad volume', estimatedMinutes: 64,
    exercises: [
      { exerciseId: 'trap-bar-deadlift', sets: 3, minReps: 4, maxReps: 6, restSeconds: 180 },
      { exerciseId: 'hack-squat', sets: 3, minReps: 8, maxReps: 12, restSeconds: 150 },
      { exerciseId: 'leg-extension', sets: 3, minReps: 10, maxReps: 15, restSeconds: 90 },
      { exerciseId: 'leg-curl', sets: 3, minReps: 10, maxReps: 15, restSeconds: 90 },
      { exerciseId: 'calf-raise', sets: 3, minReps: 10, maxReps: 15, restSeconds: 75 },
      { exerciseId: 'cable-crunch', sets: 3, minReps: 10, maxReps: 15, restSeconds: 75 }
    ]
  }
];

const twoDayFullBody: WorkoutTemplate[] = [
  { id: 'full-a', name: 'Total Foundation', focus: 'Full-body strength', estimatedMinutes: 58, exercises: [
    { exerciseId: 'back-squat', sets: 3, minReps: 5, maxReps: 8, restSeconds: 180 },
    { exerciseId: 'bench-press', sets: 3, minReps: 6, maxReps: 8, restSeconds: 150 },
    { exerciseId: 'seated-row', sets: 3, minReps: 8, maxReps: 10, restSeconds: 120 },
    { exerciseId: 'romanian-deadlift', sets: 3, minReps: 6, maxReps: 10, restSeconds: 150 },
    { exerciseId: 'lateral-raise', sets: 2, minReps: 12, maxReps: 15, restSeconds: 75 },
    { exerciseId: 'cable-crunch', sets: 2, minReps: 10, maxReps: 15, restSeconds: 75 }
  ]},
  { id: 'full-b', name: 'Total Progression', focus: 'Full-body muscle and strength', estimatedMinutes: 58, exercises: [
    { exerciseId: 'trap-bar-deadlift', sets: 3, minReps: 4, maxReps: 6, restSeconds: 180 },
    { exerciseId: 'overhead-press', sets: 3, minReps: 6, maxReps: 8, restSeconds: 150 },
    { exerciseId: 'lat-pulldown', sets: 3, minReps: 8, maxReps: 12, restSeconds: 120 },
    { exerciseId: 'leg-press', sets: 3, minReps: 10, maxReps: 15, restSeconds: 120 },
    { exerciseId: 'db-curl', sets: 2, minReps: 10, maxReps: 15, restSeconds: 75 },
    { exerciseId: 'triceps-pressdown', sets: 2, minReps: 10, maxReps: 15, restSeconds: 75 }
  ]}
];

const threeDayFullBody: WorkoutTemplate[] = [
  twoDayFullBody[0]!,
  { id: 'full-b3', name: 'Hinge & Press', focus: 'Posterior chain and upper body', estimatedMinutes: 60, exercises: [
    { exerciseId: 'trap-bar-deadlift', sets: 3, minReps: 4, maxReps: 6, restSeconds: 180 },
    { exerciseId: 'incline-db-press', sets: 3, minReps: 8, maxReps: 12, restSeconds: 105 },
    { exerciseId: 'lat-pulldown', sets: 3, minReps: 8, maxReps: 12, restSeconds: 105 },
    { exerciseId: 'hack-squat', sets: 3, minReps: 8, maxReps: 12, restSeconds: 150 },
    { exerciseId: 'rear-delt-fly', sets: 2, minReps: 12, maxReps: 15, restSeconds: 75 },
    { exerciseId: 'cable-crunch', sets: 2, minReps: 10, maxReps: 15, restSeconds: 75 }
  ]},
  { id: 'full-c', name: 'Total Build', focus: 'Squat, press, and pull volume', estimatedMinutes: 60, exercises: [
    { exerciseId: 'back-squat', sets: 3, minReps: 6, maxReps: 8, restSeconds: 165 },
    { exerciseId: 'overhead-press', sets: 3, minReps: 6, maxReps: 10, restSeconds: 135 },
    { exerciseId: 'chest-supported-row', sets: 3, minReps: 8, maxReps: 12, restSeconds: 105 },
    { exerciseId: 'leg-curl', sets: 3, minReps: 10, maxReps: 15, restSeconds: 90 },
    { exerciseId: 'cable-curl', sets: 2, minReps: 10, maxReps: 15, restSeconds: 75 },
    { exerciseId: 'overhead-triceps', sets: 2, minReps: 10, maxReps: 15, restSeconds: 75 }
  ]}
];

const fiveDayProgram: WorkoutTemplate[] = [
  fourDayUpperLower[0]!,
  fourDayUpperLower[1]!,
  { id: 'push', name: 'Push Build', focus: 'Chest, shoulders, and triceps', estimatedMinutes: 55, exercises: [
    { exerciseId: 'bench-press', sets: 3, minReps: 6, maxReps: 8, restSeconds: 150 },
    { exerciseId: 'incline-db-press', sets: 3, minReps: 8, maxReps: 12, restSeconds: 105 },
    { exerciseId: 'overhead-press', sets: 3, minReps: 6, maxReps: 10, restSeconds: 120 },
    { exerciseId: 'lateral-raise', sets: 3, minReps: 12, maxReps: 15, restSeconds: 75 },
    { exerciseId: 'triceps-pressdown', sets: 3, minReps: 10, maxReps: 15, restSeconds: 75 }
  ]},
  { id: 'pull', name: 'Pull Build', focus: 'Back, rear delts, and biceps', estimatedMinutes: 55, exercises: [
    { exerciseId: 'lat-pulldown', sets: 3, minReps: 8, maxReps: 10, restSeconds: 120 },
    { exerciseId: 'seated-row', sets: 3, minReps: 8, maxReps: 10, restSeconds: 120 },
    { exerciseId: 'chest-supported-row', sets: 3, minReps: 8, maxReps: 12, restSeconds: 105 },
    { exerciseId: 'rear-delt-fly', sets: 3, minReps: 12, maxReps: 15, restSeconds: 75 },
    { exerciseId: 'db-curl', sets: 3, minReps: 10, maxReps: 15, restSeconds: 75 }
  ]},
  fourDayUpperLower[3]!
];

export const getBaseProgramForDays = (trainingDays: number): WorkoutTemplate[] => {
  if (trainingDays <= 2) return twoDayFullBody;
  if (trainingDays === 3) return threeDayFullBody;
  if (trainingDays >= 5) return fiveDayProgram;
  return fourDayUpperLower;
};



const focusTemplates: Record<Exclude<SplitDayFocus, 'rest'>, WorkoutTemplate> = {
  'full-body': twoDayFullBody[0]!,
  upper: fourDayUpperLower[0]!,
  lower: fourDayUpperLower[1]!,
  push: fiveDayProgram[2]!,
  pull: fiveDayProgram[3]!,
  legs: fourDayUpperLower[3]!,
  'chest-arms': {
    id: 'chest-arms', name: 'Chest & Arms', focus: 'Chest, biceps, and triceps', estimatedMinutes: 55, exercises: [
      { exerciseId: 'bench-press', sets: 3, minReps: 6, maxReps: 8, restSeconds: 150 },
      { exerciseId: 'incline-db-press', sets: 3, minReps: 8, maxReps: 12, restSeconds: 105 },
      { exerciseId: 'machine-chest', sets: 3, minReps: 10, maxReps: 12, restSeconds: 90 },
      { exerciseId: 'db-curl', sets: 3, minReps: 10, maxReps: 15, restSeconds: 75 },
      { exerciseId: 'triceps-pressdown', sets: 3, minReps: 10, maxReps: 15, restSeconds: 75 }
    ]
  },
  'back-biceps': {
    id: 'back-biceps', name: 'Back & Biceps', focus: 'Back thickness, width, and biceps', estimatedMinutes: 55, exercises: [
      { exerciseId: 'lat-pulldown', sets: 3, minReps: 8, maxReps: 10, restSeconds: 120 },
      { exerciseId: 'seated-row', sets: 3, minReps: 8, maxReps: 10, restSeconds: 120 },
      { exerciseId: 'chest-supported-row', sets: 3, minReps: 8, maxReps: 12, restSeconds: 105 },
      { exerciseId: 'rear-delt-fly', sets: 3, minReps: 12, maxReps: 15, restSeconds: 75 },
      { exerciseId: 'cable-curl', sets: 3, minReps: 10, maxReps: 15, restSeconds: 75 }
    ]
  },
  'shoulders-core': {
    id: 'shoulders-core', name: 'Shoulders & Core', focus: 'Shoulders, stability, and trunk strength', estimatedMinutes: 48, exercises: [
      { exerciseId: 'overhead-press', sets: 3, minReps: 6, maxReps: 10, restSeconds: 135 },
      { exerciseId: 'lateral-raise', sets: 3, minReps: 12, maxReps: 15, restSeconds: 75 },
      { exerciseId: 'rear-delt-fly', sets: 3, minReps: 12, maxReps: 15, restSeconds: 75 },
      { exerciseId: 'cable-crunch', sets: 4, minReps: 10, maxReps: 15, restSeconds: 75 }
    ]
  }
};

export const splitLabels: Record<TrainingSplit, string> = {
  auto: 'Recommended',
  'full-body': 'Full Body',
  'upper-lower': 'Upper / Lower',
  'push-pull-legs': 'Push / Pull / Legs',
  hybrid: 'Hybrid',
  'body-part': 'Body-Part Split',
  custom: 'Custom Split'
};

export const allowedSplitsForDays = (days: number): TrainingSplit[] => {
  if (days <= 2) return ['auto', 'full-body', 'upper-lower', 'custom'];
  if (days === 3) return ['auto', 'full-body', 'push-pull-legs', 'custom'];
  if (days === 4) return ['auto', 'upper-lower', 'hybrid', 'push-pull-legs', 'custom'];
  return ['auto', 'hybrid', 'push-pull-legs', 'body-part', 'custom'];
};

const cloneTemplate = (template: WorkoutTemplate, idSuffix: string): WorkoutTemplate => ({
  ...template,
  id: `${template.id}-${idSuffix}`,
  exercises: template.exercises.map((exercise) => ({ ...exercise }))
});

export const defaultCustomSplit = (days: number): SplitDayFocus[] => {
  if (days <= 2) return ['upper', 'lower'];
  if (days === 3) return ['push', 'pull', 'legs'];
  if (days === 4) return ['upper', 'lower', 'push', 'pull'];
  return ['upper', 'lower', 'push', 'pull', 'legs'];
};

const customProgram = (days: number, custom?: SplitDayFocus[]) => {
  const selected = (custom?.filter((focus) => focus !== 'rest') ?? defaultCustomSplit(days)).slice(0, days);
  return selected.map((focus, index) => cloneTemplate(focusTemplates[focus as Exclude<SplitDayFocus, 'rest'>] ?? focusTemplates['full-body'], `custom-${index + 1}`));
};

export const getProgramForSplit = (trainingDays: number, split: TrainingSplit = 'auto', custom?: SplitDayFocus[]): WorkoutTemplate[] => {
  if (split === 'auto') return getBaseProgramForDays(trainingDays);
  if (split === 'custom') return customProgram(trainingDays, custom);
  if (split === 'full-body') return threeDayFullBody.slice(0, trainingDays).map((t, i) => cloneTemplate(t, `fb-${i + 1}`));
  if (split === 'upper-lower') return fourDayUpperLower.slice(0, trainingDays).map((t, i) => cloneTemplate(t, `ul-${i + 1}`));
  if (split === 'push-pull-legs') {
    const ppl = [focusTemplates.push, focusTemplates.pull, focusTemplates.legs];
    return Array.from({ length: trainingDays }, (_, i) => cloneTemplate(ppl[i % 3]!, `ppl-${i + 1}`));
  }
  if (split === 'hybrid') return [fourDayUpperLower[0]!, fourDayUpperLower[1]!, focusTemplates.push, focusTemplates.pull, focusTemplates.legs].slice(0, trainingDays).map((t, i) => cloneTemplate(t, `hy-${i + 1}`));
  return [focusTemplates['chest-arms'], focusTemplates['back-biceps'], focusTemplates.legs, focusTemplates['shoulders-core'], focusTemplates['full-body']].slice(0, trainingDays).map((t, i) => cloneTemplate(t, `bp-${i + 1}`));
};

export const goalProgramProfiles: Record<Goal, { name: string; shortLabel: string; description: string; changes: string }> = {
  balanced: {
    name: 'Balanced Builder',
    shortLabel: 'Balanced',
    description: 'A mix of strength and muscle-building work with moderate rest and volume.',
    changes: 'Keeps moderate rep ranges and rest periods within your selected weekly schedule.'
  },
  strength: {
    name: 'Strength Builder',
    shortLabel: 'Strength',
    description: 'Heavier compound work, lower rep targets, and longer recovery between hard sets.',
    changes: 'Future workouts emphasize 4–8 reps on compound lifts, longer rest, and slightly less isolation volume.'
  },
  muscle: {
    name: 'Muscle Builder',
    shortLabel: 'Muscle',
    description: 'More working sets and moderate-to-high rep ranges for hypertrophy.',
    changes: 'Future workouts use more 6–15 rep work, additional accessory volume, and moderate rest periods.'
  },
  'fat-loss': {
    name: 'Lean Strength',
    shortLabel: 'Fat loss',
    description: 'Denser sessions that preserve strength while increasing training pace.',
    changes: 'Future workouts retain compound lifts, use moderate reps, and shorten rest periods to reduce session time.'
  }
};

const adjustExerciseForGoal = (item: ProgramExercise, goal: Goal, exerciseIndex: number): ProgramExercise => {
  if (goal === 'balanced') return { ...item };

  const definition = exercisesById[item.exerciseId];
  const compound = Boolean(definition?.compound);
  const primaryCompound = compound && exerciseIndex === 0;

  if (goal === 'strength') {
    return {
      ...item,
      sets: compound ? Math.max(item.sets, primaryCompound ? 4 : 3) : Math.min(item.sets, 2),
      minReps: compound ? (primaryCompound ? 4 : 5) : 8,
      maxReps: compound ? (primaryCompound ? 6 : 8) : 12,
      restSeconds: compound ? Math.max(item.restSeconds, primaryCompound ? 210 : 165) : Math.max(item.restSeconds, 90)
    };
  }

  if (goal === 'muscle') {
    return {
      ...item,
      sets: compound ? Math.max(item.sets, 4) : Math.max(item.sets, 3),
      minReps: compound ? 6 : 10,
      maxReps: compound ? 10 : 15,
      restSeconds: compound ? Math.min(Math.max(item.restSeconds, 105), 135) : Math.min(Math.max(item.restSeconds, 60), 90)
    };
  }

  return {
    ...item,
    sets: item.sets,
    minReps: compound ? 6 : 10,
    maxReps: compound ? 10 : 15,
    restSeconds: compound ? Math.max(90, item.restSeconds - 30) : Math.max(60, item.restSeconds - 15)
  };
};

export const getProgramForGoal = (goal: Goal, trainingDays = 4, split: TrainingSplit = 'auto', customSplit?: SplitDayFocus[]): WorkoutTemplate[] => {
  const profile = goalProgramProfiles[goal];
  return getProgramForSplit(trainingDays, split, customSplit).map((template) => ({
    ...template,
    focus: `${profile.shortLabel} · ${template.focus}`,
    estimatedMinutes: Math.max(42, template.estimatedMinutes + (goal === 'strength' ? 8 : goal === 'muscle' ? 6 : goal === 'fat-loss' ? -8 : 0)),
    exercises: template.exercises.map((item, index) => adjustExerciseForGoal(item, goal, index))
  }));
};
