import User from "../models/User.js";
import Task from "../models/Task.js";

// @desc   Get all users (admin only)
// @route  GET /api/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "member" }).select("-password");
    const usersWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        const taskCount = await Task.countDocuments({ assignedTo: user._id });
        const pendingTaskCount = await Task.countDocuments({
          assignedTo: user._id,
          status: "Pending",
        });
        const inProgressTaskCount = await Task.countDocuments({
          assignedTo: user._id,
          status: "In Progress",
        });
        const completedTaskCount = await Task.countDocuments({
          assignedTo: user._id,
          status: "Completed",
        });
        return {
          ...user.toObject(),
          taskCount,
          pendingTaskCount,
          inProgressTaskCount,
          completedTaskCount,
        };
      })
    );
    res.json(usersWithTaskCounts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Get user by ID (admin only)
// @route  GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc   Delete user (admin only)
// @route  DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
