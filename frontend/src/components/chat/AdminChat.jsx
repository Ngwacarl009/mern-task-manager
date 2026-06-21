import { useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "../../context/userContext";
import { SocketContext } from "../../context/socketContext";
import ChatWindow from "./ChatWindow";
import axiosInstance from "../../utils/axiosInstance";
import { IoChatbubbles, IoSearch, IoClose, IoChevronBack, IoArchive } from "react-icons/io5";
import { MdHistory } from "react-icons/md";
import moment from "moment";
import toast from "react-hot-toast";

export default function AdminChat() {
  const { user } = useContext(UserContext);
  const { isOnline, socket } = useContext(SocketContext);
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("members"); // members | chat | history
  const [history, setHistory] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/chat/members");
      setMembers(res.data.members || []);
      const total = (res.data.members || []).reduce((sum, m) => sum + (m.unreadCount || 0), 0);
      setTotalUnread(total);
    } catch {}
  }, []);

  useEffect(() => {
    if (isOpen) loadMembers();
  }, [isOpen, loadMembers]);

  // Socket: refresh member list when new message arrives
  useEffect(() => {
    if (!socket) return;
    const handleUnread = () => loadMembers();
    socket.on("unread_update", handleUnread);
    return () => socket.off("unread_update", handleUnread);
  }, [socket, loadMembers]);

  // Periodic refresh for unread count badge
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await axiosInstance.get("/api/chat/unread-count");
        setTotalUnread(res.data.unreadCount || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const openChatWith = async (member) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/chat/conversation/with/${member._id}`);
      setConversation(res.data.conversation);
      setSelectedMember(member);
      setView("chat");
      loadMembers();
    } catch {
      toast.error("Failed to open conversation");
    } finally {
      setLoading(false);
    }
  };

  const openHistory = async (member) => {
    try {
      const res = await axiosInstance.get(`/api/chat/history/${member._id}`);
      setHistory(res.data.conversations || []);
      setSelectedMember(member);
      setView("history");
    } catch {
      toast.error("Failed to load history");
    }
  };

  const archiveConversation = async () => {
    if (!conversation) return;
    try {
      await axiosInstance.put(`/api/chat/conversation/${conversation._id}/archive`);
      toast.success("Conversation archived");
      setView("members");
      setConversation(null);
      setSelectedMember(null);
      loadMembers();
    } catch {
      toast.error("Failed to archive");
    }
  };

  const filtered = members.filter((m) =>
    m.member.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      {isOpen && (
        <div className="w-96 h-[580px] bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
            <div className="flex items-center gap-2">
              {view !== "members" && (
                <button
                  onClick={() => { setView("members"); setConversation(null); setSelectedMember(null); loadMembers(); }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors mr-1"
                >
                  <IoChevronBack size={18} />
                </button>
              )}
              <IoChatbubbles className="text-violet-400" size={20} />
              <h3 className="text-white font-semibold text-sm">
                {view === "members" && "Team Messages"}
                {view === "chat" && selectedMember?.name}
                {view === "history" && `History – ${selectedMember?.name}`}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {view === "chat" && (
                <button onClick={archiveConversation} title="Archive conversation" className="text-slate-400 hover:text-orange-400 p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                  <IoArchive size={16} />
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                <IoClose size={18} />
              </button>
            </div>
          </div>

          {/* Members List */}
          {view === "members" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
                  <IoSearch size={14} className="text-slate-400 flex-shrink-0" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search members..."
                    className="bg-transparent text-white text-sm placeholder-slate-400 outline-none flex-1"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                    <IoChatbubbles size={32} />
                    <p className="text-sm">No members found</p>
                  </div>
                ) : (
                  filtered.map(({ member, conversation: conv, unreadCount }) => (
                    <div
                      key={member._id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 border-b border-slate-700/50 cursor-pointer transition-colors group"
                      onClick={() => openChatWith(member)}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
                          {member.name[0].toUpperCase()}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${isOnline(member._id) ? "bg-green-400" : "bg-slate-500"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-white text-sm font-medium truncate">{member.name}</p>
                          {conv && (
                            <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                              {moment(conv.lastMessageAt || conv.updatedAt).fromNow()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {conv?.lastMessage || (isOnline(member._id) ? "Online" : "Tap to start chat")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {unreadCount > 0 && (
                          <span className="bg-violet-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openHistory(member); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-all"
                          title="View history"
                        >
                          <MdHistory size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Chat View */}
          {view === "chat" && conversation && selectedMember && (
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                conversation={conversation}
                otherUser={selectedMember}
                onClose={() => { setView("members"); setConversation(null); setSelectedMember(null); loadMembers(); }}
              />
            </div>
          )}

          {/* History View */}
          {view === "history" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                  <MdHistory size={32} />
                  <p className="text-sm">No previous sessions</p>
                </div>
              ) : (
                history.map((conv) => (
                  <div
                    key={conv._id}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${conv.isActive ? "border-violet-500/50 bg-violet-500/10" : "border-slate-700 bg-slate-700/30 hover:bg-slate-700/50"}`}
                    onClick={async () => {
                      if (conv.isActive) {
                        setConversation(conv);
                        setView("chat");
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${conv.isActive ? "bg-green-500/20 text-green-400" : "bg-slate-600 text-slate-400"}`}>
                        {conv.isActive ? "Active" : "Archived"}
                      </span>
                      <span className="text-xs text-slate-500">{moment(conv.createdAt).format("MMM D, YYYY")}</span>
                    </div>
                    <p className="text-sm text-slate-300 truncate">{conv.lastMessage || "No messages yet"}</p>
                    <p className="text-xs text-slate-500 mt-1">Session ID: {conv.sessionId.substring(0, 8)}...</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg hover:shadow-violet-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        {isOpen ? <IoClose size={24} /> : <IoChatbubbles size={24} />}
        {!isOpen && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}
