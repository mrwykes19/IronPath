import { ExerciseDefinition } from '../types';

export const exerciseLibrary: ExerciseDefinition[] = [
  { id: 'bench-press', name: 'Barbell Bench Press', primaryMuscle: 'Chest', muscleGroup: 'Chest', equipment: 'barbell', compound: true, defaultWeight: 95, defaultIncrement: 5, substitutions: ['db-bench', 'smith-bench', 'machine-chest', 'incline-db-press'] },
  { id: 'smith-bench', name: 'Smith Machine Bench Press', primaryMuscle: 'Chest', muscleGroup: 'Chest', equipment: 'smith-machine', compound: true, defaultWeight: 75, defaultIncrement: 5, substitutions: ['bench-press', 'db-bench', 'machine-chest'] },
  { id: 'db-bench', name: 'Dumbbell Bench Press', primaryMuscle: 'Chest', muscleGroup: 'Chest', equipment: 'dumbbell', compound: true, defaultWeight: 30, defaultIncrement: 5, substitutions: ['bench-press', 'machine-chest'] },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', primaryMuscle: 'Upper chest', muscleGroup: 'Chest', equipment: 'dumbbell', compound: true, defaultWeight: 25, defaultIncrement: 5, substitutions: ['machine-chest', 'db-bench'] },
  { id: 'machine-chest', name: 'Machine Chest Press', primaryMuscle: 'Chest', muscleGroup: 'Chest', equipment: 'machine', compound: true, defaultWeight: 70, defaultIncrement: 10, substitutions: ['bench-press', 'db-bench'] },
  { id: 'overhead-press', name: 'Barbell Overhead Press', primaryMuscle: 'Shoulders', muscleGroup: 'Shoulders', equipment: 'barbell', compound: true, defaultWeight: 55, defaultIncrement: 5, substitutions: ['machine-shoulder', 'db-shoulder'] },
  { id: 'db-shoulder', name: 'Dumbbell Shoulder Press', primaryMuscle: 'Shoulders', muscleGroup: 'Shoulders', equipment: 'dumbbell', compound: true, defaultWeight: 20, defaultIncrement: 5, substitutions: ['overhead-press', 'machine-shoulder'] },
  { id: 'machine-shoulder', name: 'Machine Shoulder Press', primaryMuscle: 'Shoulders', muscleGroup: 'Shoulders', equipment: 'machine', compound: true, defaultWeight: 50, defaultIncrement: 10, substitutions: ['overhead-press', 'db-shoulder'] },
  { id: 'lateral-raise', name: 'Dumbbell Lateral Raise', primaryMuscle: 'Side delts', muscleGroup: 'Shoulders', equipment: 'dumbbell', compound: false, defaultWeight: 10, defaultIncrement: 5, substitutions: ['cable-lateral'] },
  { id: 'cable-lateral', name: 'Cable Lateral Raise', primaryMuscle: 'Side delts', muscleGroup: 'Shoulders', equipment: 'cable', compound: false, defaultWeight: 10, defaultIncrement: 5, substitutions: ['lateral-raise'] },
  { id: 'lat-pulldown', name: 'Lat Pulldown', primaryMuscle: 'Back', muscleGroup: 'Back', equipment: 'cable', compound: true, defaultWeight: 70, defaultIncrement: 10, substitutions: ['pullup', 'seated-row'] },
  { id: 'pullup', name: 'Pull-Up', primaryMuscle: 'Back', muscleGroup: 'Back', equipment: 'bodyweight', compound: true, defaultWeight: 0, defaultIncrement: 5, substitutions: ['lat-pulldown'] },
  { id: 'seated-row', name: 'Seated Cable Row', primaryMuscle: 'Back', muscleGroup: 'Back', equipment: 'cable', compound: true, defaultWeight: 70, defaultIncrement: 10, substitutions: ['chest-supported-row', 'lat-pulldown'] },
  { id: 'chest-supported-row', name: 'Chest-Supported Row', primaryMuscle: 'Back', muscleGroup: 'Back', equipment: 'machine', compound: true, defaultWeight: 50, defaultIncrement: 10, substitutions: ['seated-row'] },
  { id: 'rear-delt-fly', name: 'Rear-Delt Fly', primaryMuscle: 'Rear delts', muscleGroup: 'Shoulders', equipment: 'machine', compound: false, defaultWeight: 40, defaultIncrement: 10, substitutions: ['face-pull'] },
  { id: 'face-pull', name: 'Cable Face Pull', primaryMuscle: 'Rear delts', muscleGroup: 'Shoulders', equipment: 'cable', compound: false, defaultWeight: 30, defaultIncrement: 5, substitutions: ['rear-delt-fly'] },
  { id: 'triceps-pressdown', name: 'Triceps Pressdown', primaryMuscle: 'Triceps', muscleGroup: 'Arms', equipment: 'cable', compound: false, defaultWeight: 30, defaultIncrement: 5, substitutions: ['overhead-triceps'] },
  { id: 'overhead-triceps', name: 'Overhead Cable Extension', primaryMuscle: 'Triceps', muscleGroup: 'Arms', equipment: 'cable', compound: false, defaultWeight: 25, defaultIncrement: 5, substitutions: ['triceps-pressdown'] },
  { id: 'db-curl', name: 'Dumbbell Curl', primaryMuscle: 'Biceps', muscleGroup: 'Arms', equipment: 'dumbbell', compound: false, defaultWeight: 15, defaultIncrement: 5, substitutions: ['cable-curl'] },
  { id: 'cable-curl', name: 'Cable Curl', primaryMuscle: 'Biceps', muscleGroup: 'Arms', equipment: 'cable', compound: false, defaultWeight: 25, defaultIncrement: 5, substitutions: ['db-curl'] },
  { id: 'back-squat', name: 'Barbell Back Squat', primaryMuscle: 'Quads', muscleGroup: 'Legs', equipment: 'barbell', compound: true, defaultWeight: 95, defaultIncrement: 5, substitutions: ['hack-squat', 'leg-press'] },
  { id: 'hack-squat', name: 'Hack Squat', primaryMuscle: 'Quads', muscleGroup: 'Legs', equipment: 'machine', compound: true, defaultWeight: 70, defaultIncrement: 10, substitutions: ['back-squat', 'leg-press'] },
  { id: 'leg-press', name: 'Leg Press', primaryMuscle: 'Quads', muscleGroup: 'Legs', equipment: 'machine', compound: true, defaultWeight: 140, defaultIncrement: 20, substitutions: ['hack-squat', 'back-squat'] },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', primaryMuscle: 'Hamstrings', muscleGroup: 'Legs', equipment: 'barbell', compound: true, defaultWeight: 95, defaultIncrement: 5, substitutions: ['leg-curl'] },
  { id: 'trap-bar-deadlift', name: 'Trap-Bar Deadlift', primaryMuscle: 'Posterior chain', muscleGroup: 'Legs', equipment: 'barbell', compound: true, defaultWeight: 115, defaultIncrement: 10, substitutions: ['romanian-deadlift', 'leg-press'] },
  { id: 'leg-curl', name: 'Seated Leg Curl', primaryMuscle: 'Hamstrings', muscleGroup: 'Legs', equipment: 'machine', compound: false, defaultWeight: 50, defaultIncrement: 10, substitutions: ['romanian-deadlift'] },
  { id: 'leg-extension', name: 'Leg Extension', primaryMuscle: 'Quads', muscleGroup: 'Legs', equipment: 'machine', compound: false, defaultWeight: 50, defaultIncrement: 10, substitutions: ['leg-press'] },
  { id: 'calf-raise', name: 'Machine Calf Raise', primaryMuscle: 'Calves', muscleGroup: 'Legs', equipment: 'machine', compound: false, defaultWeight: 70, defaultIncrement: 10, substitutions: [] },
  { id: 'cable-crunch', name: 'Cable Crunch', primaryMuscle: 'Core', muscleGroup: 'Core', equipment: 'cable', compound: false, defaultWeight: 40, defaultIncrement: 5, substitutions: ['plank'] },
  { id: 'plank', name: 'Plank', primaryMuscle: 'Core', muscleGroup: 'Core', equipment: 'bodyweight', compound: false, defaultWeight: 0, defaultIncrement: 0, substitutions: ['cable-crunch'] }
];

export const exercisesById = Object.fromEntries(exerciseLibrary.map((exercise) => [exercise.id, exercise]));
