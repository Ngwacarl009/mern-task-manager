import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getOrCreateConversation,
  getMemberConversation,
  getMessages,
  sendMessage,
  markMessagesRead,
  getMembersWithConversations,
  getConversationHistory,
  archiveConversation,
  getUnreadCount,
} from "../controllers/chatController.js";

const router = express.Router();

// Shared
router.get("/unread-count", protect, getUnreadCount);
router.get("/conversation/:conversationId/messages", protect, getMessages);
router.post("/conversation/:conversationId/messages", protect, sendMessage);
router.put("/conversation/:conversationId/read", protect, markMessagesRead);

// Admin only
router.get("/members", protect, adminOnly, getMembersWithConversations);
router.get("/conversation/with/:memberId", protect, adminOnly, getOrCreateConversation);
router.get("/history/:memberId", protect, adminOnly, getConversationHistory);
router.put("/conversation/:conversationId/archive", protect, adminOnly, archiveConversation);

// Member only
router.get("/my-conversation", protect, getMemberConversation);

export default router;
