import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { LuPlus, LuPencil, LuTrash2, LuDownload, LuCalendar, LuUsers } from "react-icons/lu";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import {
  PriorityBadge, StatusBadge, AvatarGroup, ProgressBar,
  DeleteConfirmModal, Spinner, EmptyState,
} from "../../components/cards";
import axiosInstance, { API_PATHS } from "../../utils/axiosInstance";
import { downloadBlob } from "../../utils/helper";
import moment from "moment";

const TABS = ["All", "Pending", "In Progress", "Completed"];

const ManageTasks = () => {
  const [tasks, setTasks]           = useState([]);
  const [counts, setCounts]         = useState({});
  const [activeTab, setActiveTab]   = useState("All");
  const [loading, setLoading]       = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, task: null });
  const navigate = useNavigate();

  const fetchTasks = async (status = "All") => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`${API_PATHS.TASKS.GET_ALL}?status=${status}`);
      setTasks(res.data.tasks || []);
      setCounts(res.data.statusCounts || {});
    } catch { toast.error("Failed to load tasks"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(activeTab); }, [activeTab]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(API_PATHS.TASKS.DELETE(deleteModal.task._id));
      toast.success("Task deleted");
      setDeleteModal({ open: false, task: null });
      fetchTasks(activeTab);
    } catch { toast.error("Delete failed"); }
  };

  const handleExport = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_TASKS, { responseType: "blob" });
      downloadBlob(res.data, "tasks_report.xlsx");
      toast.success("Report downloaded");
    } catch { toast.error("Export failed"); }
  };

  const tabCount = {
    All: counts.all,
    Pending: counts.pendingTasks,
    "In Progress": counts.inProgressTasks,
    Completed: counts.completedTasks,
  };

  const isOverdue = (date) => date && moment(date).isBefore(moment(), "day");

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Manage Tasks</h1>
            <p className="page-subtitle">{counts.all || 0} tasks total</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="btn-secondary">
              <LuDownload size={15} /> Export
            </button>
            <button onClick={() => navigate("/admin/create-task")} className="btn-primary">
              <LuPlus size={15} /> New Task
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`tab ${activeTab === tab ? "tab-active" : "tab-inactive"}`}>
              {tab}
              {tabCount[tab] !== undefined && (
                <span className={`ml-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab ? "bg-brand-100 text-brand-600" : "bg-slate-200 text-slate-500"
                }`}>
                  {tabCount[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-24"><Spinner size={36} /></div>
        ) : tasks.length === 0 ? (
          <EmptyState icon="📋" title="No tasks found"
            message={activeTab === "All" ? "Create your first task to get started." : `No ${activeTab.toLowerCase()} tasks.`}
            action={activeTab === "All" && (
              <button onClick={() => navigate("/admin/create-task")} className="btn-primary">
                <LuPlus size={15} /> Create task
              </button>
            )}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div key={task._id} className="card-hover group flex flex-col gap-3">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => navigate(`/admin/create-task/${task._id}`)}
                      className="btn-icon text-slate-400 hover:text-brand-600 hover:bg-brand-50">
                      <LuPencil size={14} />
                    </button>
                    <button onClick={() => setDeleteModal({ open: true, task })}
                      className="btn-icon text-slate-400 hover:text-red-600 hover:bg-red-50">
                      <LuTrash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-semibold text-slate-900 line-clamp-2 leading-snug">{task.title}</h3>
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                  )}
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
                    <span className="font-medium">Progress</span>
                    <span className="font-semibold text-slate-700">{task.progress}%</span>
                  </div>
                  <ProgressBar progress={task.progress} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                  <AvatarGroup users={task.assignedTo || []} />
                  {task.dueDate && (
                    <span className={`flex items-center gap-1 text-xs font-medium ${
                      isOverdue(task.dueDate) && task.status !== "Completed"
                        ? "text-red-500" : "text-slate-400"
                    }`}>
                      <LuCalendar size={11} />
                      {moment(task.dueDate).format("MMM D")}
                      {isOverdue(task.dueDate) && task.status !== "Completed" && " · Overdue"}
                    </span>
                  )}
                </div>

                {/* Checklist hint */}
                {task.todoChecklist?.length > 0 && (
                  <p className="text-[11px] text-slate-400 font-medium">
                    {task.todoChecklist.filter((i) => i.completed).length}/{task.todoChecklist.length} checklist items
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, task: null })}
        onConfirm={handleDelete}
        itemName={deleteModal.task?.title}
      />
    </DashboardLayout>
  );
};

export default ManageTasks;
