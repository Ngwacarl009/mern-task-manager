import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { LuCalendar, LuArrowRight } from "react-icons/lu";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { PriorityBadge, StatusBadge, ProgressBar, Spinner, EmptyState } from "../../components/cards";
import axiosInstance, { API_PATHS } from "../../utils/axiosInstance";
import moment from "moment";

const TABS = ["All", "Pending", "In Progress", "Completed"];

const MyTasks = () => {
  const [tasks,  setTasks]     = useState([]);
  const [counts, setCounts]    = useState({});
  const [tab,    setTab]       = useState("All");
  const [loading,setLoading]   = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`${API_PATHS.TASKS.GET_ALL}?status=${tab}`);
        setTasks(res.data.tasks || []);
        setCounts(res.data.statusCounts || {});
      } catch { toast.error("Failed to load tasks"); }
      finally { setLoading(false); }
    };
    fetch();
  }, [tab]);

  const tabCount = {
    All: counts.all,
    Pending: counts.pendingTasks,
    "In Progress": counts.inProgressTasks,
    Completed: counts.completedTasks,
  };

  const isOverdue = (d) => d && moment(d).isBefore(moment(), "day");

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Tasks</h1>
            <p className="page-subtitle">
              {counts.all || 0} task{counts.all !== 1 ? "s" : ""} assigned to you
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`tab ${tab === t ? "tab-active" : "tab-inactive"}`}>
              {t}
              {tabCount[t] !== undefined && (
                <span className={`ml-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                  tab === t ? "bg-brand-100 text-brand-600" : "bg-slate-200 text-slate-500"
                }`}>
                  {tabCount[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-24"><Spinner size={36} /></div>
        ) : tasks.length === 0 ? (
          <EmptyState icon="✅" title={`No ${tab.toLowerCase()} tasks`}
            message={tab === "All" ? "You don't have any tasks yet." : `No ${tab.toLowerCase()} tasks at the moment.`}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map((task) => {
              const overdue = isOverdue(task.dueDate) && task.status !== "Completed";
              return (
                <Link key={task._id} to={`/user/task-details/${task._id}`}
                  className="card-hover flex flex-col gap-3 group">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                    {overdue && (
                      <span className="badge bg-red-50 text-red-600 border border-red-100">Overdue</span>
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                    )}
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span className="font-medium">Progress</span>
                      <span className="font-semibold text-slate-700">{task.progress}%</span>
                    </div>
                    <ProgressBar progress={task.progress} />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    {task.dueDate ? (
                      <span className={`text-xs flex items-center gap-1 font-medium ${overdue ? "text-red-500" : "text-slate-400"}`}>
                        <LuCalendar size={11} />
                        {moment(task.dueDate).format("MMM D, YYYY")}
                      </span>
                    ) : <span />}
                    <span className="text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <LuArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyTasks;
