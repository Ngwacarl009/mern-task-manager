import Notification from "../models/Notification.js";

// @desc  Get notifications for the current user
// @route GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .populate("sender", "name profileImageUrl")
        .populate("task", "title")
        .sort({ createdAt: -1 })
        .limit(50),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc  Mark notifications as read (all, or specific IDs)
// @route PUT /api/notifications/read
export const markAsRead = async (req, res) => {
  try {
    const filter = { recipient: req.user._id };
    if (req.body.ids?.length) filter._id = { $in: req.body.ids };
    await Notification.updateMany(filter, { isRead: true });
    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
