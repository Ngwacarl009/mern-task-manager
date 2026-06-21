import moment from "moment";
import { BsCheck, BsCheckAll } from "react-icons/bs";

const statusIcon = (status) => {
  if (status === "read") return <BsCheckAll className="text-violet-400" size={14} />;
  if (status === "delivered") return <BsCheckAll className="text-slate-400" size={14} />;
  return <BsCheck className="text-slate-400" size={14} />;
};

export default function ChatMessage({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3 group`}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end">
          {message.sender?.name?.[0]?.toUpperCase() || "?"}
        </div>
      )}
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {!isOwn && (
          <span className="text-xs text-slate-400 mb-1 px-1">{message.sender?.name}</span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isOwn
              ? "bg-violet-600 text-white rounded-br-sm"
              : "bg-slate-700 text-slate-100 rounded-bl-sm"
          }`}
        >
          {message.taskRef && (
            <div className={`text-xs mb-1.5 pb-1.5 border-b ${isOwn ? "border-violet-500 text-violet-200" : "border-slate-600 text-slate-400"}`}>
              📋 Re: {message.taskRef.title}
            </div>
          )}
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-xs text-slate-500">
            {moment(message.createdAt).format("h:mm A")}
          </span>
          {isOwn && statusIcon(message.status)}
        </div>
      </div>
      {isOwn && (
        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold ml-2 flex-shrink-0 self-end">
          {message.sender?.name?.[0]?.toUpperCase() || "?"}
        </div>
      )}
    </div>
  );
}
