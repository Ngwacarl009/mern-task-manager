import { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  LuArrowLeft, LuExternalLink, LuPlay, LuCircleCheck,
  LuMessageSquare, LuSend, LuClock, LuHistory,
} from "react-icons/lu";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { PriorityBadge, StatusBadge, ProgressBar, AvatarGroup, Avatar, Spinner } from "../../components/cards";
import axiosInstance, { API_PATHS } from "../../utils/axiosInstance";
import { UserContext } from "../../context/userContext";
import moment from "moment";

const ViewTaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [task,    setTask]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Comment state
  const [comment,    setComment]    = useState("");
  const [noteForStatus, setNoteForStatus] = useState("");
  const [postingComment, setPosting] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  const commentsRef = useRef(null);

  const fetchTask = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.TASKS.GET_BY_ID(id));
      setTask(res.data);
    } catch { toast.error("Failed to load task"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTask(); }, [id]);

  // ── Checklist toggle ──────────────────────────────────────────────────────
  const toggleChecklist = async (index) => {
    const updated = task.todoChecklist.map((item, i) =>
      i === index ? { ...item, completed: !item.completed } : item
    );
    const done    = updated.filter((i) => i.completed).length;
    const progress = updated.length > 0 ? Math.round((done / updated.length) * 100) : 0;
    const newStatus = progress === 100 ? "Completed" : progress > 0 ? "In Progress" : "Pending";

    setSaving(true);
    try {
      const res = await axiosInstance.put(API_PATHS.TASKS.UPDATE_STATUS(id), {
        todoChecklist: updated, status: newStatus,
      });
      setTask(res.data.task);
      if (newStatus !== task.status) toast.success(`Status → ${newStatus}`);
    } catch { toast.error("Failed to update checklist"); }
    finally { setSaving(false); }
  };

  // ── Direct status change ─────────────────────────────────────────────────
  const handleStatusChange = (newStatus) => {
    if (newStatus === task.status) return;
    setPendingStatus(newStatus);
    setShowNote(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    setSaving(true);
    try {
      const res = await axiosInstance.put(API_PATHS.TASKS.UPDATE_STATUS(id), {
        status: pendingStatus,
        note: noteForStatus.trim(),
      });
      setTask(res.data.task);
      toast.success(`Status updated to ${pendingStatus}`);
      setShowNote(false);
      setPendingStatus(null);
      setNoteForStatus("");
    } catch { toast.error("Failed to update status"); }
    finally { setSaving(false); }
  };

  // ── Add comment ───────────────────────────────────────────────────────────
  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      const res = await axiosInstance.post(API_PATHS.TASKS.ADD_COMMENT(id), { text: comment.trim() });
      setTask((prev) => ({ ...prev, comments: res.data.comments }));
      setComment("");
      toast.success("Note sent to admin");
      setTimeout(() => commentsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch { toast.error("Failed to send comment"); }
    finally { setPosting(false); }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-24"><Spinner size={36} /></div>
    </DashboardLayout>
  );

  if (!task) return (
    <DashboardLayout>
      <div className="text-center py-24 text-slate-400 font-medium">Task not found</div>
    </DashboardLayout>
  );

  const isAdmin    = user?.role === "admin";
  const isAssigned = task.assignedTo?.some((u) => u._id === user?._id || u === user?._id);
  const canAct     = isAssigned || isAdmin;
  const isOverdue  = task.dueDate && moment(task.dueDate).isBefore(moment(), "day") && task.status !== "Completed";

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5 animate-in">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-2">
          <LuArrowLeft size={16} /> Back
        </button>

        {/* ── Task header ── */}
        <div className="card space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              {isOverdue && <span className="badge bg-red-50 text-red-600 border border-red-100">Overdue</span>}
            </div>
            {saving && <span className="text-xs text-slate-400 flex items-center gap-1"><Spinner size={12} /> Saving…</span>}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{task.title}</h1>
            {task.description && (
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">{task.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Due date</p>
              <p className={`text-sm font-semibold ${isOverdue ? "text-red-500" : "text-slate-700"}`}>
                {task.dueDate ? moment(task.dueDate).format("MMM D, YYYY") : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assigned to</p>
              <AvatarGroup users={task.assignedTo || []} maxShow={5} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Created by</p>
              <p className="text-sm font-semibold text-slate-700">{task.createdBy?.name || "—"}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-semibold">Progress</span>
              <span className="font-bold text-slate-700">{task.progress}%</span>
            </div>
            <ProgressBar progress={task.progress} />
          </div>
        </div>

        {/* ── Status action buttons (for members) ── */}
        {canAct && !isAdmin && (
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <LuClock size={16} className="text-brand-500" /> Update status
            </h2>

            {!showNote ? (
              <div className="flex flex-wrap gap-2">
                {task.status !== "In Progress" && (
                  <button onClick={() => handleStatusChange("In Progress")}
                    className="btn-secondary border-blue-200 text-blue-700 hover:bg-blue-50">
                    <LuPlay size={14} /> Start Task
                  </button>
                )}
                {task.status !== "Completed" && (
                  <button onClick={() => handleStatusChange("Completed")}
                    className="btn-secondary border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    <LuCircleCheck size={14} /> Mark Completed
                  </button>
                )}
                {task.status !== "Pending" && (
                  <button onClick={() => handleStatusChange("Pending")}
                    className="btn-ghost text-slate-500">
                    Reset to Pending
                  </button>
                )}
                {task.status === "Completed" && (
                  <p className="text-sm text-emerald-600 font-medium flex items-center gap-2">
                    <LuCircleCheck size={16} /> This task is complete!
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Changing status to <strong className="text-slate-900">{pendingStatus}</strong>.
                  Add an optional note for the admin:
                </p>
                <textarea value={noteForStatus}
                  onChange={(e) => setNoteForStatus(e.target.value)}
                  className="input resize-none" rows={2}
                  placeholder="e.g. Waiting for client feedback before completing…" />
                <div className="flex gap-2">
                  <button onClick={() => { setShowNote(false); setPendingStatus(null); setNoteForStatus(""); }}
                    className="btn-secondary flex-1">Cancel</button>
                  <button onClick={confirmStatusChange} disabled={saving}
                    className="btn-primary flex-1">
                    {saving ? <Spinner size={14} className="text-white" /> : "Confirm"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Checklist ── */}
        {task.todoChecklist?.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">Checklist</h2>
              <span className="text-xs text-slate-400 font-medium">
                {task.todoChecklist.filter((i) => i.completed).length} / {task.todoChecklist.length} done
              </span>
            </div>
            <ul className="space-y-1.5">
              {task.todoChecklist.map((item, i) => (
                <li key={i}
                  onClick={() => canAct && !saving && toggleChecklist(i)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    canAct ? "cursor-pointer hover:bg-slate-50" : "cursor-default"
                  }`}>
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                    item.completed
                      ? "bg-brand-500 border-brand-500"
                      : "border-slate-300 hover:border-brand-400"
                  }`}>
                    {item.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm transition-colors ${
                    item.completed ? "line-through text-slate-400" : "text-slate-700"
                  }`}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Attachments ── */}
        {task.attachments?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-3">Attachments</h2>
            <ul className="space-y-2">
              {task.attachments.map((url, i) => (
                <li key={i}>
                  <a href={url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 hover:underline truncate">
                    <LuExternalLink size={14} className="flex-shrink-0" />
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Comments / Notes ── */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <LuMessageSquare size={16} className="text-brand-500" />
            Notes & messages
            {task.comments?.length > 0 && (
              <span className="text-xs font-semibold text-slate-400">({task.comments.length})</span>
            )}
          </h2>

          {/* Comment list */}
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {task.comments?.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                No messages yet. Leave a note for the admin below.
              </p>
            )}
            {task.comments?.map((c, i) => {
              const isOwn = c.author?._id === user?._id || c.author === user?._id;
              return (
                <div key={i} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                  <Avatar user={c.author} size="sm" className="flex-shrink-0 mt-0.5" />
                  <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? "bg-brand-500 text-white rounded-tr-sm"
                        : "bg-slate-100 text-slate-800 rounded-tl-sm"
                    }`}>
                      {c.text}
                    </div>
                    <p className="text-[10px] text-slate-400 px-1">
                      {c.author?.name} · {moment(c.createdAt).fromNow()}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={commentsRef} />
          </div>

          {/* Comment input */}
          {canAct && (
            <form onSubmit={handleComment} className="flex gap-2">
              <input type="text" value={comment} onChange={(e) => setComment(e.target.value)}
                className="input flex-1"
                placeholder="Send a note to the admin…"
                disabled={postingComment}
              />
              <button type="submit" disabled={!comment.trim() || postingComment}
                className="btn-primary px-3 flex-shrink-0">
                {postingComment ? <Spinner size={14} className="text-white" /> : <LuSend size={15} />}
              </button>
            </form>
          )}
        </div>

        {/* ── Status history ── */}
        {task.statusHistory?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <LuHistory size={16} className="text-brand-500" /> Activity history
            </h2>
            <div className="space-y-3">
              {[...task.statusHistory].reverse().map((h, i) => {
                const colorMap = {
                  "Completed":   "bg-emerald-500",
                  "In Progress": "bg-blue-500",
                  "Pending":     "bg-slate-400",
                };
                return (
                  <div key={i} className="flex gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${colorMap[h.status] || "bg-slate-400"}`} />
                      {i < task.statusHistory.length - 1 && (
                        <div className="w-px flex-1 bg-slate-100 mt-1" />
                      )}
                    </div>
                    <div className="pb-3 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-700">{h.changedBy?.name || "Admin"}</span>
                        <span className="text-xs text-slate-400">→</span>
                        <StatusBadge status={h.status} />
                        <span className="text-[11px] text-slate-400">{moment(h.createdAt).fromNow()}</span>
                      </div>
                      {h.note && (
                        <p className="text-xs text-slate-500 mt-0.5 italic">"{h.note}"</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewTaskDetails;
