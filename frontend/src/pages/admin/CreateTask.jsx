import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { LuPlus, LuX, LuArrowLeft, LuCalendar, LuTriangleAlert } from "react-icons/lu";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { Spinner, Avatar } from "../../components/cards";
import axiosInstance, { API_PATHS } from "../../utils/axiosInstance";

const PRIORITIES = ["Low", "Medium", "High"];
const STATUSES   = ["Pending", "In Progress", "Completed"];

const Section = ({ title, children }) => (
  <div className="card space-y-4">
    <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3">{title}</h2>
    {children}
  </div>
);

const CreateTask = () => {
  const { id }  = useParams();
  const isEdit  = Boolean(id);
  const navigate = useNavigate();

  const [users,  setUsers]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [form,   setForm]   = useState({
    title: "", description: "", priority: "Medium", status: "Pending",
    dueDate: "", assignedTo: [], attachments: [], todoChecklist: [],
  });
  const [todoInput,   setTodoInput]   = useState("");
  const [attachInput, setAttachInput] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axiosInstance.get(API_PATHS.USERS.GET_ALL);
        setUsers(res.data || []);
      } catch { toast.error("Failed to load users"); }

      if (isEdit) {
        try {
          const res = await axiosInstance.get(API_PATHS.TASKS.GET_BY_ID(id));
          const t = res.data;
          setForm({
            title: t.title || "", description: t.description || "",
            priority: t.priority || "Medium", status: t.status || "Pending",
            dueDate: t.dueDate ? t.dueDate.split("T")[0] : "",
            assignedTo: t.assignedTo?.map((u) => u._id) || [],
            attachments: t.attachments || [],
            todoChecklist: t.todoChecklist || [],
          });
        } catch { toast.error("Failed to load task"); }
      }
    };
    init();
  }, [id]);

  const toggle = (f, val) => setForm((p) => ({
    ...p,
    [f]: p[f].includes(val) ? p[f].filter((x) => x !== val) : [...p[f], val],
  }));

  const addTodo = () => {
    if (!todoInput.trim()) return;
    setForm((p) => ({ ...p, todoChecklist: [...p.todoChecklist, { text: todoInput.trim(), completed: false }] }));
    setTodoInput("");
  };

  const addAttach = () => {
    if (!attachInput.trim()) return;
    setForm((p) => ({ ...p, attachments: [...p.attachments, attachInput.trim()] }));
    setAttachInput("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.assignedTo.length) return toast.error("Assign to at least one member");
    setLoading(true);
    try {
      if (isEdit) {
        await axiosInstance.put(API_PATHS.TASKS.UPDATE(id), form);
        toast.success("Task updated!");
      } else {
        await axiosInstance.post(API_PATHS.TASKS.CREATE, form);
        toast.success("Task created!");
      }
      navigate("/admin/tasks");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save task");
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto animate-in">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate("/admin/tasks")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors">
            <LuArrowLeft size={16} /> Back to tasks
          </button>
          <h1 className="page-title">{isEdit ? "Edit task" : "Create new task"}</h1>
          <p className="page-subtitle">{isEdit ? "Update task details below." : "Fill in the details to create a new task."}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Details */}
          <Section title="Task details">
            <div>
              <label className="label">Title *</label>
              <input type="text" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input" placeholder="e.g. Redesign landing page" />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input resize-none" rows={3}
                placeholder="Describe what needs to be done..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => {
                    const colors = { Low: "border-emerald-300 bg-emerald-50 text-emerald-700", Medium: "border-amber-300 bg-amber-50 text-amber-700", High: "border-red-300 bg-red-50 text-red-700" };
                    const inactive = "border-slate-200 bg-white text-slate-500 hover:border-slate-300";
                    return (
                      <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                        className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                          form.priority === p ? colors[p] : inactive
                        }`}>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {isEdit && (
                <div>
                  <label className="label">Status</label>
                  <select value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="input">
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div className={isEdit ? "col-span-2 md:col-span-1" : ""}>
                <label className="label">Due Date</label>
                <div className="relative">
                  <LuCalendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="date" value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="input pl-9" />
                </div>
              </div>
            </div>
          </Section>

          {/* Assign members */}
          <Section title="Assign to *">
            {users.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
                <LuTriangleAlert size={16} />
                No members yet. Create member accounts first.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {users.map((user) => {
                  const checked = form.assignedTo.includes(user._id);
                  return (
                    <label key={user._id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        checked
                          ? "border-brand-400 bg-brand-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}>
                      <input type="checkbox" checked={checked}
                        onChange={() => toggle("assignedTo", user._id)}
                        className="w-4 h-4 accent-brand-500 rounded" />
                      <Avatar user={user} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Checklist */}
          <Section title="Checklist items">
            <div className="flex gap-2">
              <input type="text" value={todoInput} onChange={(e) => setTodoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTodo())}
                className="input flex-1" placeholder="Add a checklist item and press Enter…" />
              <button type="button" onClick={addTodo} className="btn-primary px-3">
                <LuPlus size={16} />
              </button>
            </div>
            {form.todoChecklist.length > 0 && (
              <ul className="space-y-1.5">
                {form.todoChecklist.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5 group">
                    <div className="w-4 h-4 rounded border-2 border-slate-300 flex-shrink-0" />
                    <span className="text-sm text-slate-700 flex-1">{item.text}</span>
                    <button type="button"
                      onClick={() => setForm((p) => ({ ...p, todoChecklist: p.todoChecklist.filter((_, j) => j !== i) }))}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <LuX size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Attachments */}
          <Section title="Attachments (links)">
            <div className="flex gap-2">
              <input type="url" value={attachInput}
                onChange={(e) => setAttachInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAttach())}
                className="input flex-1" placeholder="https://..." />
              <button type="button" onClick={addAttach} className="btn-primary px-3">
                <LuPlus size={16} />
              </button>
            </div>
            {form.attachments.length > 0 && (
              <ul className="space-y-1.5">
                {form.attachments.map((url, i) => (
                  <li key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5 group">
                    <a href={url} target="_blank" rel="noreferrer"
                      className="text-sm text-brand-600 hover:underline truncate max-w-[85%]">
                      {url}
                    </a>
                    <button type="button"
                      onClick={() => setForm((p) => ({ ...p, attachments: p.attachments.filter((_, j) => j !== i) }))}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <LuX size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => navigate("/admin/tasks")} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary min-w-[120px]">
              {loading ? <Spinner size={16} className="text-white" /> : isEdit ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateTask;
