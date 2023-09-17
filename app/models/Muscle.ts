import mongoose, { Document } from "mongoose";

export interface MuscleDocument extends Document {
  name: {
    simplified: string;
    english: string;
    latin: string;
  };
  slug: string;
}

const muscleSchema = new mongoose.Schema<MuscleDocument>({
  name: {
    simplified: String,
    english: String,
    latin: String,
  },
  slug: String,
});

export const MuscleModel = mongoose.model<MuscleDocument>(
  "Muscle",
  muscleSchema
);
