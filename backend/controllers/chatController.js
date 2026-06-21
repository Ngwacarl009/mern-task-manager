import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";

// ─── Get or create active conversation (Admin starts chat with member) ────────
export const getOrCreateConversation = async (req, res) => {
  try {
    const { memberId } = req.params;
    const adminId = req.user._id;

    const member = await User.findById(memberId).select("name email profileImageUrl role");
    if (!member || member.role !== "member")
      return res.status(404).json({ message: "Member not found" });

    // Find active conversation, or create one
    let conversation = await Conversation.findOne({
      admin: adminId,
      member: memberId,
      isActive: true,
    })
      .populate("admin", "name profileImageUrl")
      .populate("member", "name profileImageUrl");

    if (!conversation) {
      conversation = await Conversation.create({
        admin: adminId,
        member: memberId,
        sessionId: uuidv4(),
        isActive: true,
      });
      conversation = await Conversation.findById(conversation._id)
        .populate("admin", "name profileImageUrl")
        .populate("member", "name profileImageUrl");
    }

    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get conversation for member (their active chat with admin) ───────────────
export const getMemberConversation = async (req, res) => {
  try {
    const memberId = req.user._id;

    const conversation = await Conversation.findOne({
      member: memberId,
      isActive: true,
    })
      .populate("admin", "name profileImageUrl")
      .populate("member", "name profileImageUrl")
      .sort({ updatedAt: -1 });

    res.json({ conversation: conversation || null });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get messages for a conversation (paginated) ─────────────────────────────
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    // Auth check: must be admin or the member in this conversation
    const isAuthorized =
      conversation.admin.toString() === userId.toString() ||
      conversation.member.toString() === userId.toString();
    if (!isAuthorized) return res.status(403).json({ message: "Access denied" });

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId })
        .populate("sender", "name profileImageUrl")
        .populate("taskRef", "title status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Message.countDocuments({ conversation: conversationId }),
    ]);

    res.json({
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Send a message ──────────────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, taskRef } = req.body;
    const senderId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const isAdmin = conversation.admin.toString() === senderId.toString();
    const isMember = conversation.member.toString() === senderId.toString();
    if (!isAdmin && !isMember) return res.status(403).json({ message: "Access denied" });

    const receiverId = isAdmin ? conversation.member : conversation.admin;

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
      taskRef: taskRef || null,
      status: "sent",
    });

    // Update conversation metadata
    const updateData = {
      lastMessage: content.trim().substring(0, 100),
      lastMessageAt: new Date(),
    };
    if (isAdmin) updateData.unreadByMember = (conversation.unreadByMember || 0) + 1;
    else updateData.unreadByAdmin = (conversation.unreadByAdmin || 0) + 1;

    await Conversation.findByIdAndUpdate(conversationId, updateData);

    const populated = await Message.findById(message._id)
      .populate("sender", "name profileImageUrl")
      .populate("taskRef", "title status");

    // Emit via Socket.IO (attached to req.app)
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${receiverId}`).emit("new_message", {
        message: populated,
        conversationId,
      });
      io.to(`user_${receiverId}`).emit("unread_update", { conversationId });
    }

    res.status(201).json({ message: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Mark messages as read ───────────────────────────────────────────────────
export const markMessagesRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const now = new Date();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Not found" });

    const isAdmin = conversation.admin.toString() === userId.toString();
    const isMember = conversation.member.toString() === userId.toString();
    if (!isAdmin && !isMember) return res.status(403).json({ message: "Access denied" });

    await Message.updateMany(
      { conversation: conversationId, receiver: userId, status: { $ne: "read" } },
      { status: "read", readAt: now }
    );

    // Reset unread counter for the reader
    const resetField = isAdmin ? { unreadByAdmin: 0 } : { unreadByMember: 0 };
    await Conversation.findByIdAndUpdate(conversationId, resetField);

    // Notify sender their messages were read
    const io = req.app.get("io");
    if (io) {
      const otherId = isAdmin ? conversation.member : conversation.admin;
      io.to(`user_${otherId}`).emit("messages_read", { conversationId, readAt: now });
    }

    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get all members with their conversation summaries (Admin) ────────────────
export const getMembersWithConversations = async (req, res) => {
  try {
    const adminId = req.user._id;

    const members = await User.find({ role: "member" }).select("name email profileImageUrl");

    const conversations = await Conversation.find({ admin: adminId, isActive: true })
      .populate("member", "name profileImageUrl");

    const convMap = {};
    conversations.forEach((c) => {
      if (c.member) convMap[c.member._id.toString()] = c;
    });

    const result = members.map((m) => {
      const conv = convMap[m._id.toString()];
      return {
        member: m,
        conversation: conv || null,
        unreadCount: conv ? conv.unreadByAdmin : 0,
      };
    });

    res.json({ members: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get archived conversations for admin (past sessions) ─────────────────────
export const getConversationHistory = async (req, res) => {
  try {
    const { memberId } = req.params;
    const adminId = req.user._id;

    const conversations = await Conversation.find({ admin: adminId, member: memberId })
      .populate("member", "name profileImageUrl")
      .sort({ createdAt: -1 });

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Archive (end) a conversation session (admin) ─────────────────────────────
export const archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const adminId = req.user._id;

    const conversation = await Conversation.findOne({ _id: conversationId, admin: adminId });
    if (!conversation) return res.status(404).json({ message: "Not found" });

    conversation.isActive = false;
    await conversation.save();

    res.json({ message: "Conversation archived" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── Get unread counts for current user ──────────────────────────────────────
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === "admin";

    let count;
    if (isAdmin) {
      const convs = await Conversation.find({ admin: userId, isActive: true });
      count = convs.reduce((sum, c) => sum + (c.unreadByAdmin || 0), 0);
    } else {
      const convs = await Conversation.find({ member: userId, isActive: true });
      count = convs.reduce((sum, c) => sum + (c.unreadByMember || 0), 0);
    }

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
