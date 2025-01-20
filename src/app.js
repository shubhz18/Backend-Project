import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Middleware setup
app.use(cookieParser()); // Only one instance needed

app.use(cors({
    origin: process.env.CORS_ORIGIN, // Ensure this is set in your .env file
    credentials: true // Allow credentials (cookies) to be sent
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// Import routes
import userRouter from './routes/user.routes.js';

// Use routes
app.use("/api/v1/users", userRouter);

export { app };