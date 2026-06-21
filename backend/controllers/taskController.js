import Task from "../models/Task.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// Helper: create a notification (silently — never throws)
const notify = async (data) => {
  try {
    // Don't notify yourself
    if (data.recipient.toString() === data.sender.toString()) return;
    await Notification.create(data);
  } catch (e) {
    console.error("Notification error:", e.message);
  }
};

// ─── Admin dashboard stats ───────────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const [total, pending, inProgress, completed] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: "Pending" }),
      Task.countDocuments({ status: "In Progress" }),
      Task.countDocuments({ status: "Completed" }),
    ]);

    const recentTasks = await Task.find()
      .populate("assignedTo", "name email profileImageUrl")
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1 })
      .limit(10);

    const [priorityData, statusData] = await Promise.all([
      Task.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Task.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    // Build live activity feed from statusHistory across all tasks
    const activityFeed = await Task.aggregate([
      { $unwind: "$statusHistory" },
      { $sort: { "statusHistory.createdAt": -1 } },
      { $limit: 30 },
      {
        $lookup: {
          from: "users",
          localField: "statusHistory.changedBy",
          foreignField: "_id",
          as: "actor",
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          "statusHistory.status": 1,
          "statusHistory.note": 1,
          "statusHistory.createdAt": 1,
          actor: { $arrayElemAt: ["$actor", 0] },
        },
      },
    ]);

    res.json({
      statistics: {
        totalTasks: total,
        pendingTasks: pending,
        inProgressTasks: inProgress,
        completedTasks: completed,
      },
      charts: { priorityData, statusData },
      recentTasks,
      activityFeed,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get all tasks ───────────────────────────────────────────────────────────
export const getAllTasks = async (req, res) => {
  try {
    const { status } = req.query;
    const isAdmin = req.user.role === "admin";
    let filter = isAdmin ? {} : { assignedTo: req.user._id };
    if (status && status !== "All") filter.status = status;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email profileImageUrl")
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1 });

    const baseFilter = isAdmin ? {} : { assignedTo: req.user._id };
    const [all, pend, prog, done] = await Promise.all([
      Task.countDocuments(baseFilter),
      Task.countDocuments({ ...baseFilter, status: "Pending" }),
      Task.countDocuments({ ...baseFilter, status: "In Progress" }),
      Task.countDocuments({ ...baseFilter, status: "Completed" }),
    ]);

    res.json({
      tasks,
      statusCounts: {
        all,
        pendingTasks: pend,
        inProgressTasks: prog,
        completedTasks: done,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get task by ID ──────────────────────────────────────────────────────────
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email profileImageUrl")
      .populate("createdBy", "name email")
      .populate("statusHistory.changedBy", "name profileImageUrl")
      .populate("comments.author", "name profileImageUrl");

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Create task (admin only) ────────────────────────────────────────────────
export const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, assignedTo, attachments, todoChecklist } =
      req.body;

    if (!Array.isArray(assignedTo))
      return res.status(400).json({ message: "assignedTo must be an array of user IDs" });

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      createdBy: req.user._id,
      attachments: attachments || [],
      todoChecklist: todoChecklist || [],
      statusHistory: [{ status: "Pending", changedBy: req.user._id, note: "Task created" }],
    });

    // Notify every assigned member
    for (const memberId of assignedTo) {
      await notify({
        recipient: memberId,
        sender: req.user._id,
        task: task._id,
        type: "task_assigned",
        message: `You have been assigned a new task: "${title}"`,
      });
    }

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Update task (admin only) ────────────────────────────────────────────────
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const prevStatus = task.status;

    task.title = req.body.title || task.title;
    task.description = req.body.description ?? task.description;
    task.priority = req.body.priority || task.priority;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.assignedTo = req.body.assignedTo || task.assignedTo;
    task.attachments = req.body.attachments || task.attachments;

    if (req.body.status && req.body.status !== prevStatus) {
      task.status = req.body.status;
      task.statusHistory.push({
        status: req.body.status,
        changedBy: req.user._id,
        note: "Updated by admin",
      });
    }

    if (req.body.todoChecklist !== undefined) {
      task.todoChecklist = req.body.todoChecklist;
      const done = task.todoChecklist.filter((i) => i.completed).length;
      task.progress =
        task.todoChecklist.length > 0
          ? Math.round((done / task.todoChecklist.length) * 100)
          : 0;
    }

    const updated = await task.save();
    res.json({ message: "Task updated successfully", task: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Delete task (admin only) ────────────────────────────────────────────────
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    await task.deleteOne();
    // Clean up orphaned notifications
    await Notification.deleteMany({ task: req.params.id });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Update task status/checklist (member or admin) ─────────────────────────
export const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("createdBy", "_id name");
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAssigned = task.assignedTo.some(
      (uid) => uid.toString() === req.user._id.toString()
    );
    if (!isAssigned && req.user.role !== "admin")
      return res.status(403).json({ message: "Not authorized" });

    const prevStatus = task.status;
    const { status, todoChecklist, note = "" } = req.body;

    if (status) task.status = status;

    if (todoChecklist) {
      task.todoChecklist = todoChecklist;
      const done = todoChecklist.filter((i) => i.completed).length;
      task.progress =
        todoChecklist.length > 0 ? Math.round((done / todoChecklist.length) * 100) : 0;
    }

    const newStatus = task.status;

    // Record in status history only when status actually changed
    if (newStatus !== prevStatus) {
      task.statusHistory.push({ status: newStatus, changedBy: req.user._id, note });

      // Notify admin (task creator) when a member changes status
      if (req.user.role !== "admin" && task.createdBy) {
        const emoji = newStatus === "Completed" ? "✅" : "🔄";
        await notify({
          recipient: task.createdBy._id,
          sender: req.user._id,
          task: task._id,
          type: "status_change",
          newStatus,
          message: `${emoji} ${req.user.name} changed "${task.title}" → ${newStatus}${
            note ? ` — "${note}"` : ""
          }`,
        });
      }
    }

    await task.save();

    // Return fully-populated task so the client can update state immediately
    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email profileImageUrl")
      .populate("createdBy", "name email")
      .populate("statusHistory.changedBy", "name profileImageUrl")
      .populate("comments.author", "name profileImageUrl");

    // Emit real-time socket event for status changes
    if (status && status !== prevStatus) {
      const io = req.app.get("io");
      if (io) {
        // Notify admin if a member changed the status
        if (req.user.role !== "admin") {
          io.to(`user_${task.createdBy._id}`).emit("task_status_changed", {
            taskId: task._id,
            taskTitle: task.title,
            newStatus: status,
            prevStatus,
            changedBy: { name: req.user.name, _id: req.user._id },
          });
        }
        // Notify all assigned members
        task.assignedTo.forEach((uid) => {
          if (uid.toString() !== req.user._id.toString()) {
            io.to(`user_${uid}`).emit("task_status_changed", {
              taskId: task._id,
              taskTitle: task.title,
              newStatus: status,
              prevStatus,
              changedBy: { name: req.user.name, _id: req.user._id },
            });
          }
        });
      }
    }

    res.json({ message: "Task status updated", task: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Add comment ─────────────────────────────────────────────────────────────
export const addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("createdBy", "_id");
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAssigned = task.assignedTo.some(
      (uid) => uid.toString() === req.user._id.toString()
    );
    const isCreator = task.createdBy._id.toString() === req.user._id.toString();
    if (!isAssigned && !isCreator && req.user.role !== "admin")
      return res.status(403).json({ message: "Not authorized" });

    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment text is required" });

    task.comments.push({ author: req.user._id, text: text.trim() });
    await task.save();

    // Notify admin when a member comments
    if (req.user.role !== "admin") {
      await notify({
        recipient: task.createdBy._id,
        sender: req.user._id,
        task: task._id,
        type: "comment",
        message: `💬 ${req.user.name} commented on "${task.title}": "${text.trim()}"`,
      });
    }

    const updated = await Task.findById(task._id).populate(
      "comments.author",
      "name profileImageUrl"
    );
    res.json({ message: "Comment added", comments: updated.comments });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── User dashboard stats ────────────────────────────────────────────────────
export const getUserDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const base = { assignedTo: userId };

    const [total, pending, inProgress, completed] = await Promise.all([
      Task.countDocuments(base),
      Task.countDocuments({ ...base, status: "Pending" }),
      Task.countDocuments({ ...base, status: "In Progress" }),
      Task.countDocuments({ ...base, status: "Completed" }),
    ]);

    const recentTasks = await Task.find(base).sort({ updatedAt: -1 }).limit(10);

    const priorityData = await Task.aggregate([
      { $match: base },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    res.json({
      statistics: {
        totalTasks: total,
        pendingTasks: pending,
        inProgressTasks: inProgress,
        completedTasks: completed,
      },
      charts: { priorityData },
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
