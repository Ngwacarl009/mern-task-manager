import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import User from "./models/User.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Socket.IO setup ──────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

// Authenticate socket connections via JWT
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return next(new Error("User not found"));
    socket.user = user;
    next();
  } catch {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.user._id.toString();
  const userName = socket.user.name;

  // Join personal room so server can emit to specific users
  socket.join(`user_${userId}`);

  // Track online presence
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socket.id);

  // Notify all clients of updated online list
  io.emit("online_users", Array.from(onlineUsers.keys()));

  // Typing indicators
  socket.on("typing_start", ({ conversationId }) => {
    socket.to(`conv_${conversationId}`).emit("user_typing", {
      userId,
      userName,
      conversationId,
    });
  });

  socket.on("typing_stop", ({ conversationId }) => {
    socket.to(`conv_${conversationId}`).emit("user_stop_typing", {
      userId,
      conversationId,
    });
  });

  // Join a conversation room
  socket.on("join_conversation", ({ conversationId }) => {
    socket.join(`conv_${conversationId}`);
  });

  socket.on("leave_conversation", ({ conversationId }) => {
    socket.leave(`conv_${conversationId}`);
  });

  socket.on("disconnect", () => {
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socket.id);
      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
      }
    }
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });
});

// Make io available to controllers
app.set("io", io);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => res.json({ message: "Task Manager API is running" }));

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
