import mongoose, { Document } from "mongoose";

export interface UserDocument extends Document {
  username: string;
  password: string;
  workouts: mongoose.Types.ObjectId[]; // Reference to Workout documents
}

const userSchema = new mongoose.Schema<UserDocument>({
  username: String,
  password: String,
  workouts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Workout" }],
});

export const UserModel = mongoose.model<UserDocument>("User", userSchema);
