import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { UserContext } from "./userContext";
import toast from "react-hot-toast";

export const SocketContext = createContext(null);

const SOCKET_URL = "http://localhost:8000";

export default function SocketProvider({ children }) {
  const { user } = useContext(UserContext);
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user?.token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token: user.token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("online_users", (users) => setOnlineUsers(users));

    // Global task status change notifications
    socket.on("task_status_changed", ({ taskTitle, newStatus, prevStatus, changedBy }) => {
      const emoji = newStatus === "Completed" ? "✅" : newStatus === "In Progress" ? "🔄" : "⏳";
      toast(`${emoji} ${changedBy.name} changed "${taskTitle}"\n${prevStatus} → ${newStatus}`, {
        duration: 5000,
        style: {
          background: "#1e293b",
          color: "#f1f5f9",
          borderRadius: "12px",
          fontSize: "13px",
          padding: "12px 16px",
          maxWidth: "360px",
        },
      });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user?.token]);

  const isOnline = useCallback(
    (userId) => onlineUsers.includes(userId?.toString()),
    [onlineUsers]
  );

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers, connected, isOnline }}>
      {children}
    </SocketContext.Provider>
  );
}
