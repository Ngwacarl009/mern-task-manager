import { LuTrendingUp } from "react-icons/lu";

// ── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard = ({ label, count, icon, color, trend }) => (
  <div className="card group hover:shadow-card-hover transition-all duration-200">
    <div className="flex items-start justify-between">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${color} transition-transform duration-200 group-hover:scale-110`}>
        {icon}
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          <LuTrendingUp size={12} className={trend < 0 ? "rotate-180" : ""} />
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="mt-4">
      <p className="text-3xl font-bold text-slate-900 tabular-nums">{count}</p>
      <p className="text-sm text-slate-500 mt-0.5 font-medium">{label}</p>
    </div>
  </div>
);

// ── Priority Badge ───────────────────────────────────────────────────────────
export const PriorityBadge = ({ priority }) => {
  const map = {
    High:   { cls: "badge badge-high",   dot: "bg-red-500" },
    Medium: { cls: "badge badge-medium", dot: "bg-amber-500" },
    Low:    { cls: "badge badge-low",    dot: "bg-emerald-500" },
  };
  const cfg = map[priority] || { cls: "badge badge-low", dot: "bg-slate-400" };
  return (
    <span className={cfg.cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {priority}
    </span>
  );
};

// ── Status Badge ─────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    "Pending":     { cls: "badge badge-pending",   dot: "bg-slate-400" },
    "In Progress": { cls: "badge badge-progress",  dot: "bg-blue-500 animate-pulse-dot" },
    "Completed":   { cls: "badge badge-completed", dot: "bg-emerald-500" },
  };
  const cfg = map[status] || { cls: "badge badge-pending", dot: "bg-slate-400" };
  return (
    <span className={cfg.cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

// ── Progress Bar ─────────────────────────────────────────────────────────────
export const ProgressBar = ({ progress }) => {
  const pct = Math.min(100, Math.max(0, progress));
  const color =
    pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-brand-500" : "bg-amber-500";
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className={`${color} h-2 rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// ── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
];

export const Avatar = ({ user, size = "sm", className = "" }) => {
  const idx = user?.name?.charCodeAt(0) % AVATAR_COLORS.length || 0;
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : size === "md" ? "w-9 h-9 text-sm" : "w-12 h-12 text-base";
  return user?.profileImageUrl ? (
    <img src={user.profileImageUrl} alt={user.name} title={user.name}
      className={`${sizeClass} rounded-full border-2 border-white object-cover flex-shrink-0 ${className}`} />
  ) : (
    <div title={user?.name}
      className={`${sizeClass} ${AVATAR_COLORS[idx]} rounded-full border-2 border-white flex items-center justify-center font-semibold flex-shrink-0 ${className}`}>
      {user?.name?.[0]?.toUpperCase()}
    </div>
  );
};

// ── Avatar Group ─────────────────────────────────────────────────────────────
export const AvatarGroup = ({ users = [], maxShow = 3 }) => (
  <div className="flex -space-x-2">
    {users.slice(0, maxShow).map((user, i) => (
      <Avatar key={i} user={user} size="sm" />
    ))}
    {users.length > maxShow && (
      <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 text-slate-500 text-xs flex items-center justify-center font-semibold">
        +{users.length - maxShow}
      </div>
    )}
  </div>
);

// ── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] overflow-y-auto animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-xl font-light">
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ─────────────────────────────────────────────────────
export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Confirm deletion" size="sm">
    <div className="flex flex-col items-center text-center gap-4 py-2">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <span className="text-red-500 text-xl">🗑</span>
      </div>
      <p className="text-slate-600 text-sm leading-relaxed">
        Are you sure you want to permanently delete <strong className="text-slate-800">"{itemName}"</strong>?
        <br />This action cannot be undone.
      </p>
    </div>
    <div className="flex gap-3 mt-6">
      <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
      <button onClick={onConfirm} className="btn-danger flex-1">Delete</button>
    </div>
  </Modal>
);

// ── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 24, className = "" }) => (
  <svg className={`animate-spin text-brand-500 ${className}`} width={size} height={size}
    viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// ── Skeleton ─────────────────────────────────────────────────────────────────
export const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
);

// ── Empty state ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, message, action }) => (
  <div className="empty-state">
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mb-4">
      {icon || "📋"}
    </div>
    <p className="font-semibold text-slate-700 text-base">{title || "Nothing here yet"}</p>
    {message && <p className="text-slate-400 text-sm mt-1 max-w-xs">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
