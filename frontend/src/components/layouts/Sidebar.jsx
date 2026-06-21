import { useContext, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LuLayoutDashboard, LuClipboardList, LuUsers, LuLogOut,
  LuMenu, LuX, LuSquareCheck, LuBell, LuCheckCheck,
  LuZap, LuMessageSquare,
} from "react-icons/lu";
import { UserContext } from "../../context/userContext";
import axiosInstance, { API_PATHS } from "../../utils/axiosInstance";
import moment from "moment";

// ── Notification panel ────────────────────────────────────────────────────────
const NotificationPanel = ({ isOpen, onClose, notifications, unread, onMarkAll }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute left-full top-0 ml-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 animate-scale-in overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
        {unread > 0 && (
          <button onClick={onMarkAll} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
            <LuCheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <LuBell className="mx-auto text-slate-300 mb-2" size={28} />
            <p className="text-sm text-slate-400">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`px-4 py-3 border-b border-slate-50 last:border-0 ${
                !n.isRead ? "bg-brand-50/50" : ""
              }`}
            >
              <div className="flex gap-3">
                {n.sender?.profileImageUrl ? (
                  <img src={n.sender.profileImageUrl} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" alt="" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 text-xs flex items-center justify-center font-semibold flex-shrink-0 mt-0.5">
                    {n.sender?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{moment(n.createdAt).fromNow()}</p>
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = () => {
  const { user, clearUser } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const isAdmin = user?.role === "admin";

  const adminLinks = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LuLayoutDashboard },
    { to: "/admin/tasks",     label: "Manage Tasks", icon: LuClipboardList },
    { to: "/admin/users",     label: "Team Members", icon: LuUsers },
    { to: "/admin/chat",      label: "Chat", icon: LuMessageSquare },
  ];
  const userLinks = [
    { to: "/user/dashboard", label: "Dashboard", icon: LuLayoutDashboard },
    { to: "/user/tasks",     label: "My Tasks", icon: LuClipboardList },
  ];
  const links = isAdmin ? adminLinks : userLinks;

  // Poll notifications every 30 s
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get(API_PATHS.NOTIFICATIONS.GET_ALL);
        setNotifications(res.data.notifications || []);
        setUnread(res.data.unreadCount || 0);
      } catch { /* silent */ }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAll = async () => {
    try {
      await axiosInstance.put(API_PATHS.NOTIFICATIONS.MARK_READ, {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const handleLogout = () => { clearUser(); navigate("/login"); };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white border border-slate-200 p-2 rounded-xl shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <LuX size={20} className="text-slate-700" /> : <LuMenu size={20} className="text-slate-700" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/30 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-40 flex flex-col
          shadow-sidebar transform transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-sm">
              <LuZap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">TaskFlow</span>
          </Link>
        </div>

        {/* User info */}
        <div className="px-4 py-3 mx-3 my-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="avatar" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
                isAdmin ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-600"
              }`}>
                {isAdmin ? "Admin" : "Member"}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-3 overflow-y-auto">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">
            {isAdmin ? "Admin" : "Menu"}
          </p>
          <ul className="space-y-0.5">
            {links.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to || location.pathname.startsWith(to + "/");
              return (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={() => setIsOpen(false)}
                    className={`nav-link ${active ? "nav-link-active" : "nav-link-inactive"}`}
                  >
                    <Icon size={18} className={active ? "text-brand-600" : "text-slate-500"} />
                    <span>{label}</span>
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Notifications button */}
          <div className="mt-4 relative">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">
              Inbox
            </p>
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`nav-link w-full ${notifOpen ? "nav-link-active" : "nav-link-inactive"}`}
              >
                <LuBell size={18} className={notifOpen ? "text-brand-600" : "text-slate-500"} />
                <span>Notifications</span>
                {unread > 0 && (
                  <span className="ml-auto bg-brand-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
              <NotificationPanel
                isOpen={notifOpen}
                onClose={() => setNotifOpen(false)}
                notifications={notifications}
                unread={unread}
                onMarkAll={handleMarkAll}
              />
            </div>
          </div>
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="nav-link nav-link-inactive w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <LuLogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
