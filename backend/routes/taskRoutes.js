import express from "express";
import {
  getDashboardStats,
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addComment,
  getUserDashboardStats,
} from "../controllers/taskController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard-stats", protect, adminOnly, getDashboardStats);
router.get("/user-dashboard-stats", protect, getUserDashboardStats);
router.get("/", protect, getAllTasks);
router.get("/:id", protect, getTaskById);
router.post("/", protect, adminOnly, createTask);
router.put("/:id", protect, adminOnly, updateTask);
router.delete("/:id", protect, adminOnly, deleteTask);
router.put("/:id/status", protect, updateTaskStatus);
router.post("/:id/comments", protect, addComment);

export default router;
