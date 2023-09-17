import mongoose, { Document } from "mongoose";

interface DynamicStretch {
  order: number;
  name: string;
  completed: boolean;
}

export interface WorkoutSet {
  reps: number;
  weight: number;
  completedAt: Date;
}

type ExerciseRestTimer = {
  enabled: boolean;
  duration: number;
}

export interface WorkoutExercise {
  exerciseId: mongoose.Types.ObjectId;
  sets: WorkoutSet[];
  restTimer: ExerciseRestTimer;
  initialResistance: {
    name: string;
    weight: number;
  };
  note: string;
}

export interface WorkoutDocument extends Document {
  userId: string;
  startTime: Date;
  endTime: Date;
  dynamicStretches: DynamicStretch[];
  exercises: WorkoutExercise[];
}

const dynamicStretchSchema = new mongoose.Schema<DynamicStretch>({
  order: Number,
  name: String,
  completed: Boolean,
});

const workoutSetSchema = new mongoose.Schema<WorkoutSet>({
  reps: Number,
  weight: Number,
  completedAt: Date,
});

const workoutExerciseSchema = new mongoose.Schema<WorkoutExercise>({
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise" }, // Reference to ExerciseModel
  sets: [workoutSetSchema],
  restTimer: {
    enabled: Boolean,
    duration: Number,
  },
  initialResistance: {
    name: String,
    weight: Number,
  },
  note: String,
});

const workoutSchema = new mongoose.Schema<WorkoutDocument>({
  userId: String,
  startTime: Date,
  endTime: Date,
  exercises: [workoutExerciseSchema],
  dynamicStretches: [dynamicStretchSchema],
});

export const WorkoutModel = mongoose.model<WorkoutDocument>(
  "Workout",
  workoutSchema
);
