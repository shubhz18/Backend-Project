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
import videoRouter from "./routes/video.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import commentRouter from "./routes/comment.routes.js"

// Use routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/comments", commentRouter)

export { app };