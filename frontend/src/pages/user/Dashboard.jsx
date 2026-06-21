import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import {
  LuClipboardList, LuClock, LuCircleCheck, LuLoader,
  LuArrowRight, LuPlay, LuCalendar,
} from "react-icons/lu";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { StatCard, PriorityBadge, StatusBadge, ProgressBar, Spinner, EmptyState } from "../../components/cards";
import axiosInstance, { API_PATHS } from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { UserContext } from "../../context/userContext";
import moment from "moment";

const COLORS = ["#ef4444", "#f59e0b", "#10b981"];

const UserDashboard = () => {
  const { user } = useContext(UserContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get(API_PATHS.TASKS.USER_DASHBOARD_STATS);
        setStats(res.data);
      } catch { toast.error("Failed to load dashboard"); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-24"><Spinner size={36} /></div>
    </DashboardLayout>
  );

  const priorityData = stats?.charts?.priorityData?.map((d) => ({ name: d._id, value: d.count })) || [];
  const s = stats?.statistics || {};
  const completionRate = s.totalTasks > 0
    ? Math.round((s.completedTasks / s.totalTasks) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-7 animate-in">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              Hi, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="page-subtitle">
              {s.totalTasks === 0
                ? "No tasks assigned yet. Check back soon."
                : `You have ${s.pendingTasks} pending and ${s.inProgressTasks} in-progress task${s.inProgressTasks !== 1 ? "s" : ""}.`}
            </p>
          </div>
          <Link to="/user/tasks" className="btn-primary">
            <LuPlay size={14} /> View My Tasks
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Assigned"   count={s.totalTasks || 0}     icon={<LuClipboardList />} color="bg-brand-100 text-brand-600" />
          <StatCard label="Pending"    count={s.pendingTasks || 0}    icon={<LuClock />}         color="bg-amber-100 text-amber-600" />
          <StatCard label="In Progress"count={s.inProgressTasks || 0} icon={<LuLoader />}        color="bg-blue-100 text-blue-600" />
          <StatCard label="Completed"  count={s.completedTasks || 0}  icon={<LuCircleCheck />}   color="bg-emerald-100 text-emerald-600" />
        </div>

        {/* Completion gauge + chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Completion ring */}
          <div className="card flex flex-col items-center justify-center gap-3 py-6">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke={completionRate === 100 ? "#10b981" : "#875cf5"} strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionRate / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">{completionRate}%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">Completion rate</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.completedTasks} of {s.totalTasks} tasks done</p>
            </div>
          </div>

          {/* Priority chart */}
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-3 text-sm">Tasks by priority</h2>
            {priorityData.length === 0 ? (
              <EmptyState icon="📊" title="No data" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={priorityData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                    {priorityData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "none", borderRadius: 10, color: "#f1f5f9", fontSize: 12 }}
                    itemStyle={{ color: "#f1f5f9" }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick links */}
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-3 text-sm">Quick actions</h2>
            <div className="space-y-2">
              {[
                { label: "All my tasks",         to: "/user/tasks",               color: "bg-brand-50 text-brand-600 hover:bg-brand-100" },
                { label: "In-progress tasks",    to: "/user/tasks?status=In+Progress", color: "bg-blue-50 text-blue-600 hover:bg-blue-100" },
                { label: "Pending tasks",        to: "/user/tasks?status=Pending",  color: "bg-amber-50 text-amber-600 hover:bg-amber-100" },
                { label: "Completed tasks",      to: "/user/tasks?status=Completed",color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" },
              ].map((q) => (
                <Link key={q.to} to={q.to}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${q.color}`}>
                  {q.label}
                  <LuArrowRight size={14} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Recent tasks</h2>
            <Link to="/user/tasks" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              All tasks <LuArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-1">
            {stats?.recentTasks?.slice(0, 6).map((task) => (
              <Link key={task._id} to={`/user/task-details/${task._id}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate group-hover:text-brand-600 transition-colors">
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <LuCalendar size={10} />
                      Due {moment(task.dueDate).format("MMM D, YYYY")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-20">
                    <ProgressBar progress={task.progress} />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">{task.progress}%</span>
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
              </Link>
            ))}
            {(!stats?.recentTasks?.length) && (
              <EmptyState icon="✅" title="No tasks yet"
                message="Your admin will assign tasks to you soon." />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
