import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null },
    unreadByAdmin: { type: Number, default: 0 },
    unreadByMember: { type: Number, default: 0 },
  },
  { timestamps: true }
);

conversationSchema.index({ admin: 1, member: 1, sessionId: 1 });
conversationSchema.index({ member: 1, isActive: 1 });

export default mongoose.model("Conversation", conversationSchema);
