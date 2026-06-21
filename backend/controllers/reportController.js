import Task from "../models/Task.js";
import User from "../models/User.js";
import xlsx from "xlsx";

// @desc   Export all tasks report
// @route  GET /api/reports/export/tasks
export const exportTasksReport = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    const taskData = tasks.map((task) => ({
      Title: task.title,
      Description: task.description,
      Priority: task.priority,
      Status: task.status,
      "Due Date": task.dueDate
        ? new Date(task.dueDate).toLocaleDateString()
        : "N/A",
      "Assigned To": task.assignedTo.map((u) => u.name).join(", "),
      "Created By": task.createdBy?.name || "N/A",
      Progress: `${task.progress}%`,
      "Created At": new Date(task.createdAt).toLocaleDateString(),
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(taskData);
    xlsx.utils.book_append_sheet(wb, ws, "Tasks");
    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=tasks_report.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Export users report
// @route  GET /api/reports/export/users
export const exportUsersReport = async (req, res) => {
  try {
    const users = await User.find({ role: "member" }).select("-password");

    const userData = await Promise.all(
      users.map(async (user) => {
        const totalTasks = await Task.countDocuments({ assignedTo: user._id });
        const completedTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "Completed",
        });
        const pendingTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "Pending",
        });
        const inProgressTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: "In Progress",
        });
        return {
          Name: user.name,
          Email: user.email,
          "Total Tasks": totalTasks,
          Completed: completedTasks,
          Pending: pendingTasks,
          "In Progress": inProgressTasks,
          "Member Since": new Date(user.createdAt).toLocaleDateString(),
        };
      })
    );

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(userData);
    xlsx.utils.book_append_sheet(wb, ws, "Users");
    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=users_report.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
