export type Goal = 'balanced' | 'strength' | 'muscle' | 'fat-loss';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type UnitSystem = 'lb' | 'kg';
export type BackupRestoreMode = 'merge' | 'replace';
export type WorkoutVariety = 'consistent' | 'moderate' | 'high';
export type TrainingSplit = 'auto' | 'full-body' | 'upper-lower' | 'push-pull-legs' | 'hybrid' | 'body-part' | 'custom';
export type SplitDayFocus = 'full-body' | 'upper' | 'lower' | 'push' | 'pull' | 'legs' | 'chest-arms' | 'back-biceps' | 'shoulders-core' | 'rest';
export type CardioDevice = 'treadmill-run' | 'treadmill-walk' | 'bike' | 'elliptical' | 'rower' | 'stair-climber' | 'other';
export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'smith-machine'
  | 'bodyweight'
  | 'resistance-band'
  | 'kettlebell';

export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';

export interface UserProfile {
  name: string;
  goal: Goal;
  experience: Experience;
  unit: UnitSystem;
  trainingDays: number;
  trainingWeekdays?: number[];
  sessionMinutes: number;
  currentWeight?: number;
  goalWeight?: number;
  upperIncrement: number;
  lowerIncrement: number;
  defaultRir?: number;
  workoutVariety?: WorkoutVariety;
  weeklyCalorieGoal?: number;
  dailyCalorieGoal?: number;
  weeklyCardioDaysGoal?: number;
  weeklyActiveMinutesGoal?: number;
  dailyActiveMinutesGoal?: number;
  trainingSplit?: TrainingSplit;
  customSplit?: SplitDayFocus[];
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  primaryMuscle: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  compound: boolean;
  defaultWeight: number;
  defaultIncrement: number;
  substitutions: string[];
}

export interface ProgramExercise {
  exerciseId: string;
  sets: number;
  minReps: number;
  maxReps: number;
  restSeconds: number;
  note?: string;
}

export interface WeeklyPlan {
  id: string;
  weekKey: string;
  blockWeek: number;
  generatedAt: string;
  approved: boolean;
  variety: WorkoutVariety;
  workouts: WorkoutTemplate[];
  lockedExerciseIds: string[];
  notes?: string;
  blockStartedAt?: string;
  progressionVersion?: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  focus: string;
  estimatedMinutes: number;
  exercises: ProgramExercise[];
}

export interface LoggedSet {
  id: string;
  weight: number;
  reps: number;
  rir: number;
  completed: boolean;
  warmup?: boolean;
}

export type RecommendationKind = 'increase' | 'maintain' | 'reduce' | 'starting';

export interface WeightRecommendation {
  kind: RecommendationKind;
  weight: number;
  projectedReps?: number;
  reason: string;
  readinessPercent?: number;
}

export interface WorkoutExerciseLog {
  exerciseId: string;
  originalExerciseId?: string;
  substitutionReason?: string;
  targetSets: number;
  minReps: number;
  maxReps: number;
  restSeconds: number;
  recommendation: WeightRecommendation;
  sets: LoggedSet[];
  machineNote?: string;
}

export interface DailyReadiness {
  date: string;
  energy: number;
  soreness: number;
  timeAvailable: number;
  notes: string;
}

export interface WorkoutSession {
  id: string;
  templateId: string;
  name: string;
  startedAt: string;
  completedAt?: string;
  exercises: WorkoutExerciseLog[];
  calories?: number;
  calorieSource?: 'estimate' | 'healthkit' | 'manual';
  notes?: string;
  readiness?: DailyReadiness;
  isCustom?: boolean;
}


export interface CardioSession {
  id: string;
  device: CardioDevice;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  distanceMiles?: number;
  notes?: string;
  calories?: number;
  entrySource?: 'timer' | 'manual';
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weight: number;
  source: 'manual' | 'healthkit';
}

export interface AppState {
  profile: UserProfile;
  sessions: WorkoutSession[];
  activeSession?: WorkoutSession;
  weightEntries: BodyWeightEntry[];
  cardioSessions: CardioSession[];
  activeCardio?: CardioSession;
  nextTemplateIndex: number;
  healthKitConnected: boolean;
  dailyReadiness?: DailyReadiness;
  lastBackupAt?: string;
  weeklyPlan?: WeeklyPlan;
}
