import { useState, useEffect, useCallback, useRef, useContext } from "react";
import { SocketContext } from "../context/socketContext";
import axiosInstance from "../utils/axiosInstance";

export default function useChat(conversationId) {
  const { socket } = useContext(SocketContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimer = useRef(null);
  const isTyping = useRef(false);

  // Load messages
  const loadMessages = useCallback(async (pg = 1, append = false) => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/api/chat/conversation/${conversationId}/messages?page=${pg}&limit=50`
      );
      const { messages: msgs, pagination } = res.data;
      setMessages((prev) => (append ? [...msgs, ...prev] : msgs));
      setHasMore(pg < pagination.pages);
      setPage(pg);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Load more (older messages)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) loadMessages(page + 1, true);
  }, [loading, hasMore, page, loadMessages]);

  // Mark read
  const markRead = useCallback(async () => {
    if (!conversationId) return;
    try {
      await axiosInstance.put(`/api/chat/conversation/${conversationId}/read`);
    } catch {}
  }, [conversationId]);

  // Socket events
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit("join_conversation", { conversationId });

    const handleNewMessage = ({ message, conversationId: cid }) => {
      if (cid === conversationId) {
        setMessages((prev) => [...prev, message]);
        markRead();
      }
    };

    const handleTyping = ({ userId, userName, conversationId: cid }) => {
      if (cid === conversationId) {
        setTypingUser(userName);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTypingUser(null), 3000);
      }
    };

    const handleStopTyping = ({ conversationId: cid }) => {
      if (cid === conversationId) setTypingUser(null);
    };

    const handleMessagesRead = ({ conversationId: cid }) => {
      if (cid === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.status !== "read" ? { ...m, status: "read" } : m))
        );
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.emit("leave_conversation", { conversationId });
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
      socket.off("messages_read", handleMessagesRead);
      clearTimeout(typingTimer.current);
    };
  }, [socket, conversationId, markRead]);

  // Load on mount
  useEffect(() => {
    if (conversationId) {
      loadMessages(1, false);
      markRead();
    }
  }, [conversationId, loadMessages, markRead]);

  // Emit typing
  const emitTyping = useCallback(() => {
    if (!socket || !conversationId) return;
    if (!isTyping.current) {
      isTyping.current = true;
      socket.emit("typing_start", { conversationId });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      socket.emit("typing_stop", { conversationId });
    }, 2000);
  }, [socket, conversationId]);

  return { messages, loading, hasMore, typingUser, loadMore, emitTyping, reload: () => loadMessages(1, false) };
}
