import { WorkoutTemplate } from '../types';

export const fourDayUpperLower: WorkoutTemplate[] = [
  {
    id: 'upper-a', name: 'Upper A', focus: 'Chest and back strength', estimatedMinutes: 62,
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
    id: 'lower-a', name: 'Lower A', focus: 'Squat and posterior chain', estimatedMinutes: 65,
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
    id: 'upper-b', name: 'Upper B', focus: 'Shoulders and back', estimatedMinutes: 60,
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
    id: 'lower-b', name: 'Lower B', focus: 'Deadlift and quad volume', estimatedMinutes: 64,
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
