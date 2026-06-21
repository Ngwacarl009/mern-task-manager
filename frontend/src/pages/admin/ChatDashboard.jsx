import { useState, useEffect, useContext, useCallback } from "react";
import { UserContext } from "../../context/userContext";
import { SocketContext } from "../../context/socketContext";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import ChatWindow from "../../components/chat/ChatWindow";
import axiosInstance from "../../utils/axiosInstance";
import { IoChatbubbles, IoSearch, IoArchive, IoTime } from "react-icons/io5";
import { MdHistory, MdPeople } from "react-icons/md";
import moment from "moment";
import toast from "react-hot-toast";

export default function ChatDashboard() {
  const { user } = useContext(UserContext);
  const { isOnline } = useContext(SocketContext);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [search, setSearch] = useState("");
  const [historyMode, setHistoryMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/chat/members");
      setMembers(res.data.members || []);
    } catch {
      toast.error("Failed to load members");
    }
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const selectMember = async (member) => {
    setLoading(true);
    setHistoryMode(false);
    setHistory([]);
    try {
      const res = await axiosInstance.get(`/api/chat/conversation/with/${member._id}`);
      setConversation(res.data.conversation);
      setSelectedMember(member);
      loadMembers();
    } catch {
      toast.error("Failed to open conversation");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (member) => {
    setSelectedMember(member);
    setHistoryMode(true);
    try {
      const res = await axiosInstance.get(`/api/chat/history/${member._id}`);
      setHistory(res.data.conversations || []);
    } catch {
      toast.error("Failed to load history");
    }
  };

  const archiveConversation = async () => {
    if (!conversation) return;
    try {
      await axiosInstance.put(`/api/chat/conversation/${conversation._id}/archive`);
      toast.success("Conversation archived");
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
  const totalUnread = members.reduce((s, m) => s + (m.unreadCount || 0), 0);

  return (
    <DashboardLayout activeMenu="Chat">
      <div className="flex h-[calc(100vh-80px)] gap-4">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <IoChatbubbles className="text-violet-400" size={20} />
                <h2 className="text-white font-semibold">Messages</h2>
              </div>
              {totalUnread > 0 && (
                <span className="bg-violet-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {totalUnread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
              <IoSearch size={14} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team members..."
                className="bg-transparent text-white text-sm placeholder-slate-400 outline-none flex-1"
              />
            </div>
          </div>

          {/* Member list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 p-8">
                <MdPeople size={36} />
                <p className="text-sm text-center">No members found</p>
              </div>
            ) : (
              filtered.map(({ member, conversation: conv, unreadCount }) => (
                <div
                  key={member._id}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 cursor-pointer transition-all group ${
                    selectedMember?._id === member._id
                      ? "bg-violet-600/20 border-l-2 border-l-violet-500"
                      : "hover:bg-slate-700/40"
                  }`}
                  onClick={() => selectMember(member)}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold">
                      {member.name[0].toUpperCase()}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${isOnline(member._id) ? "bg-green-400" : "bg-slate-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-medium truncate">{member.name}</p>
                      <span className="text-xs text-slate-500 ml-1">
                        {conv?.lastMessageAt ? moment(conv.lastMessageAt).fromNow() : ""}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {conv?.lastMessage || (isOnline(member._id) ? "● Online" : "Offline")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <span className="bg-violet-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); loadHistory(member); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-slate-600 transition-all"
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* No conversation selected */}
          {!selectedMember && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700">
              <IoChatbubbles size={56} className="text-slate-600 mb-4" />
              <p className="text-lg font-medium text-slate-400">Select a member to start chatting</p>
              <p className="text-sm mt-1">Choose from the list on the left</p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex items-center justify-center bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Active chat */}
          {!loading && selectedMember && !historyMode && conversation && (
            <div className="flex-1 flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800 rounded-t-xl border border-slate-700 border-b-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Active session</span>
                  <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
                    {moment(conversation.createdAt).format("MMM D, h:mm A")}
                  </span>
                </div>
                <button
                  onClick={archiveConversation}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-400 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-all"
                >
                  <IoArchive size={14} />
                  Archive session
                </button>
              </div>
              <div className="flex-1 overflow-hidden rounded-b-xl">
                <ChatWindow
                  conversation={conversation}
                  otherUser={selectedMember}
                />
              </div>
            </div>
          )}

          {/* History view */}
          {historyMode && selectedMember && (
            <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2">
                <MdHistory className="text-violet-400" size={20} />
                <h3 className="text-white font-semibold">Chat History – {selectedMember.name}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                    <IoTime size={36} />
                    <p>No previous sessions found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((conv) => (
                      <div
                        key={conv._id}
                        className={`p-4 rounded-xl border transition-all ${conv.isActive ? "border-violet-500/50 bg-violet-500/10 cursor-pointer hover:bg-violet-500/15" : "border-slate-700 bg-slate-700/20"}`}
                        onClick={() => {
                          if (conv.isActive) {
                            setConversation(conv);
                            setHistoryMode(false);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${conv.isActive ? "bg-green-500/20 text-green-400" : "bg-slate-600 text-slate-400"}`}>
                            {conv.isActive ? "● Active" : "Archived"}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">
                              {moment(conv.createdAt).format("MMM D, YYYY · h:mm A")}
                            </span>
                            {conv.isActive && (
                              <span className="text-xs text-violet-400 font-medium">Click to open →</span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 truncate">
                          {conv.lastMessage || "No messages in this session"}
                        </p>
                        <p className="text-xs text-slate-600 mt-1.5">
                          Session: {conv.sessionId}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
