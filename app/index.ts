import express from "express";
import mongoose, { Document } from "mongoose";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import cors from 'cors';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

function createMongoDbConnectionString(
  url: string | undefined,
  dbName: string | undefined,
  username: string | undefined,
  password: string | undefined
) {
  return `mongodb://${username}:${password}@${url}/${dbName}`;
}

// Connect to MongoDB
mongoose.connect(
  createMongoDbConnectionString(
    process.env.MONGO_URI,
    process.env.MONGO_DBNAME,
    process.env.MONGO_USERNAME,
    process.env.MONGO_PASSWORD
  ),
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as mongoose.ConnectOptions,
  (res) => {
    console.log("MongoDB CB");
    console.log(res);
  }
);

// Import Models
import { UserModel } from "./models/User";
import { ExerciseModel } from "./models/Exercise";
import { WorkoutExercise, WorkoutModel } from "./models/Workout";
import { MuscleModel } from "./models/Muscle";

import { verifyToken } from "./verify-token";
import { AuthenticatedRequest } from "./AuthenticatedRequest";

// REST API Routes

app.get("/", (req, res) => {
  res.send("Works");
});

app.get("/safe", verifyToken, (req, res) => {
  res.send("Works authed");
});

// Authentication Route
app.post("/auth", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user by username
    const user = await UserModel.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    // Generate a JWT token for the authenticated user
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Authentication failed" });
  }
});

// User Registration
app.post("/users", async (req, res) => {
  const { username, password } = req.body;

  // Check if the user already exists
  const existingUser = await UserModel.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: "Username already exists" });
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Insert the new user into the 'users' collection
  const user = { username, password: hashedPassword };
  try {
    const result = await UserModel.create(user);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Registration failed" });
  }
});

// Update User Password
app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update the user's password in the 'users' collection
  try {
    const result = await UserModel.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "Password updated" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Update failed" });
  }
});

app.get("/profile", verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await UserModel.findById(req.userId);
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "No user found" });
  }
});

// Delete User
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  // Delete the user from the 'users' collection
  try {
    const result = await UserModel.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Deletion failed" });
  }
});

// Create Exercise
app.post("/exercises", async (req, res) => {
  const { name, description } = req.body;

  const exercise = new ExerciseModel({ name, description });

  try {
    const savedExercise = await exercise.save();
    res.status(201).json(savedExercise);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Exercise creation failed" });
  }
});

// List Exercises
app.get("/exercises", async (req, res) => {
  try {
    const exercises = await ExerciseModel.find();
    res.json(exercises);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create or update Workout
app.post("/workouts", async (req, res) => {
  const { id, userId, date, exercises } = req.body; // Include id field for update (should match _id)
  try {
    let workout;

    if (id) {
      // Update existing workout
      workout = await WorkoutModel.findByIdAndUpdate(
        id,
        { userId, date, exercises },
        { new: true }
      );
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
    } else {
      // Create new workout
      workout = new WorkoutModel({ userId, date, exercises });

      // Add the workout to the user's workouts
      await UserModel.findByIdAndUpdate(userId, {
        $push: { workouts: workout._id },
      });
    }

    res.status(201).json(workout);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Workout operation failed" });
  }
});

// Add Exercise to Workout
app.post("/workouts/:id/exercises", async (req, res) => {
  const { id } = req.params;
  const { exerciseId, sets, initialResistance, note, restTimer = { enabled: true, duration: 60 } } = req.body;

  const workout = await WorkoutModel.findById(id);

  if (!workout) {
    return res.status(404).json({ message: "Workout not found" });
  }

  const exercise: WorkoutExercise = {
    exerciseId,
    sets,
    initialResistance, // Add initialResistance to the exercise
    note,
    restTimer,
  };

  workout.exercises.push(exercise);

  try {
    const updatedWorkout = await workout.save();
    res.json(updatedWorkout);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Add exercise to workout failed" });
  }
});

// Delete Workout
app.delete("/workouts/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await WorkoutModel.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Deletion failed" });
  }
});

app.get("/muscles", async (req, res) => {
  try {
    const muscles = await MuscleModel.find({}); // Exclude _id, include only name
    res.json(muscles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching muscles" });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
