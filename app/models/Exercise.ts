import mongoose, { Document } from "mongoose";

export interface MuscleGroup {
  primary: string[];
  secondary: string[];
}

export interface ExerciseDocument extends Document {
  name: string;
  description: string;
  personalRecord: {
    weight: number;
    reps: number;
  };
  muscles: MuscleGroup;
}

const exerciseSchema = new mongoose.Schema<ExerciseDocument>({
  name: String,
  description: String,
  personalRecord: {
    weight: { type: Number, default: 0 }, // Default to 0 if no PR is set
    reps: { type: Number, default: 0 }, // Default to 0 if no PR is set
  },
  muscles: {
    primary: [String],
    secondary: [String],
  },
});

export const ExerciseModel = mongoose.model<ExerciseDocument>(
  "Exercise",
  exerciseSchema
);
