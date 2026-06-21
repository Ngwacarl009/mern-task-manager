import { useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "../../context/userContext";
import { SocketContext } from "../../context/socketContext";
import ChatWindow from "./ChatWindow";
import axiosInstance from "../../utils/axiosInstance";
import { IoChatbubbles, IoClose, IoChevronDown } from "react-icons/io5";
import toast from "react-hot-toast";

const QUICK_REPLIES = [
  "I have started the task.",
  "I am making good progress.",
  "I am facing an issue – can you help?",
  "The frontend is 80% completed.",
  "The task is completed and ready for review.",
];

export default function MemberChat() {
  const { user } = useContext(UserContext);
  const { socket, isOnline } = useContext(SocketContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showQuick, setShowQuick] = useState(false);
  const [pulseNew, setPulseNew] = useState(false);

  const loadConversation = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/chat/my-conversation");
      if (res.data.conversation) {
        setConversation(res.data.conversation);
        setAdminUser(res.data.conversation.admin);
        setUnreadCount(res.data.conversation.unreadByMember || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Fetch unread count periodically
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await axiosInstance.get("/api/chat/unread-count");
        setUnreadCount(res.data.unreadCount || 0);
      } catch {}
    };
    const interval = setInterval(fetchUnread, 20000);
    return () => clearInterval(interval);
  }, []);

  // Socket: listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ message, conversationId }) => {
      if (!isOpen || isMinimized) {
        setUnreadCount((prev) => prev + 1);
        setPulseNew(true);
        setTimeout(() => setPulseNew(false), 3000);
        // Auto-open chat if closed
        if (!isOpen) {
          setIsOpen(true);
          setIsMinimized(false);
          loadConversation();
        }
        if (isMinimized) {
          setIsMinimized(false);
        }
      }
    };

    const handleUnreadUpdate = () => {
      axiosInstance.get("/api/chat/unread-count").then((res) => {
        setUnreadCount(res.data.unreadCount || 0);
      }).catch(() => {});
    };

    socket.on("new_message", handleNewMessage);
    socket.on("unread_update", handleUnreadUpdate);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("unread_update", handleUnreadUpdate);
    };
  }, [socket, isOpen, isMinimized, loadConversation]);

  // Clear unread when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const sendQuickReply = async (text) => {
    if (!conversation) return;
    try {
      await axiosInstance.post(`/api/chat/conversation/${conversation._id}/messages`, { content: text });
      setShowQuick(false);
      toast.success("Message sent!");
    } catch {
      toast.error("Failed to send");
    }
  };

  if (!conversation && !isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => { setIsOpen(true); loadConversation(); }}
          className="relative w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <IoChatbubbles size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Box */}
      {isOpen && (
        <div className={`w-80 ${isMinimized ? "h-auto" : "h-[480px]"} bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden transition-all duration-200`}>
          {/* Header only if minimized */}
          {isMinimized ? (
            <div
              className="flex items-center justify-between px-4 py-3 bg-slate-900 rounded-2xl cursor-pointer"
              onClick={() => setIsMinimized(false)}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                    {adminUser?.name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${isOnline(adminUser?._id) ? "bg-green-400" : "bg-slate-500"}`} />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Admin</p>
                  <p className="text-xs text-slate-400">{isOnline(adminUser?._id) ? "Online" : "Offline"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
                <IoChevronDown className="text-slate-400 rotate-180" size={18} />
              </div>
            </div>
          ) : (
            <>
              {/* Quick replies banner */}
              {showQuick && (
                <div className="absolute bottom-[480px] right-0 w-72 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 p-3 z-10">
                  <p className="text-xs text-slate-400 mb-2 font-medium">Quick replies:</p>
                  <div className="space-y-1.5">
                    {QUICK_REPLIES.map((text, i) => (
                      <button
                        key={i}
                        onClick={() => sendQuickReply(text)}
                        className="w-full text-left text-sm text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <ChatWindow
                  conversation={conversation}
                  otherUser={adminUser}
                  onClose={() => setIsOpen(false)}
                  onMinimize={() => setIsMinimized(true)}
                  isMinimized={false}
                />
              </div>
              {/* Quick reply toggle */}
              <div className="px-4 pb-2 bg-slate-900 border-t border-slate-700 flex justify-end">
                <button
                  onClick={() => setShowQuick(!showQuick)}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors py-1"
                >
                  ⚡ Quick replies
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setIsOpen(!isOpen); setIsMinimized(false); }}
        className={`relative w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${pulseNew ? "bg-violet-500 shadow-violet-500/50 shadow-xl" : "bg-violet-600 hover:bg-violet-500"}`}
      >
        {isOpen ? <IoClose size={24} /> : <IoChatbubbles size={24} />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
