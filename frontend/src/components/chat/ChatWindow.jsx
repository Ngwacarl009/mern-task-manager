import { useState, useRef, useEffect, useContext } from "react";
import { UserContext } from "../../context/userContext";
import { SocketContext } from "../../context/socketContext";
import useChat from "../../hooks/useChat";
import ChatMessage from "./ChatMessage";
import axiosInstance from "../../utils/axiosInstance";
import { IoSend, IoClose, IoChevronDown } from "react-icons/io5";
import { MdHistory } from "react-icons/md";
import moment from "moment";

export default function ChatWindow({ conversation, otherUser, onClose, onMinimize, isMinimized }) {
  const { user } = useContext(UserContext);
  const { isOnline } = useContext(SocketContext);
  const { messages, loading, typingUser, loadMore, emitTyping } = useChat(conversation?._id);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const handleSend = async () => {
    if (!input.trim() || sending || !conversation) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      await axiosInstance.post(`/api/chat/conversation/${conversation._id}/messages`, { content });
    } catch {
      setInput(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    emitTyping();
  };

  if (!conversation) return null;

  const online = isOnline(otherUser?._id);

  // Group messages by date
  const grouped = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const date = moment(msg.createdAt).format("YYYY-MM-DD");
    if (date !== lastDate) {
      grouped.push({ type: "date", date, label: moment(msg.createdAt).calendar(null, { sameDay: "[Today]", lastDay: "[Yesterday]", lastWeek: "dddd", sameElse: "MMM D, YYYY" }) });
      lastDate = date;
    }
    grouped.push({ type: "message", data: msg });
  });

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
              {otherUser?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${online ? "bg-green-400" : "bg-slate-500"}`} />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-none">{otherUser?.name}</p>
            <p className="text-xs mt-0.5 text-slate-400">{online ? "Online" : "Offline"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onMinimize && (
            <button onClick={onMinimize} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
              <IoChevronDown size={18} />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
              <IoClose size={18} />
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-600">
            {loading && (
              <div className="text-center py-4">
                <div className="inline-block w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {grouped.map((item, i) =>
              item.type === "date" ? (
                <div key={`date-${item.date}`} className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-xs text-slate-500 whitespace-nowrap">{item.label}</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>
              ) : (
                <ChatMessage
                  key={item.data._id}
                  message={item.data}
                  isOwn={item.data.sender?._id === user?._id || item.data.sender === user?._id}
                />
              )
            )}
            {typingUser && (
              <div className="flex items-end gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {typingUser[0]?.toUpperCase()}
                </div>
                <div className="bg-slate-700 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
                <span className="text-xs text-slate-500">{typingUser} is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 bg-slate-900 border-t border-slate-700">
            <div className="flex items-end gap-2 bg-slate-700 rounded-xl px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKey}
                placeholder="Type a message... (Enter to send)"
                rows={1}
                className="flex-1 bg-transparent text-white text-sm placeholder-slate-400 resize-none focus:outline-none max-h-24 leading-relaxed"
                style={{ scrollbarWidth: "none" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white flex-shrink-0"
              >
                <IoSend size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 text-center">
              Session: {moment(conversation.createdAt).format("MMM D, YYYY h:mm A")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
