import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  LuClipboardList, LuClock, LuCircleCheck, LuLoader, LuTrendingUp,
  LuZap, LuActivity, LuPlus, LuArrowRight, LuUsers,
} from "react-icons/lu";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { StatCard, PriorityBadge, StatusBadge, AvatarGroup, Spinner, EmptyState } from "../../components/cards";
import axiosInstance, { API_PATHS } from "../../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { UserContext } from "../../context/userContext";
import moment from "moment";

const CHART_COLORS = {
  status: ["#875cf5", "#f59e0b", "#10b981"],
  priority: { High: "#ef4444", Medium: "#f59e0b", Low: "#10b981" },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-xl shadow-lg">
      <p className="font-medium">{label || payload[0].name}</p>
      <p className="text-slate-300">{payload[0].value} tasks</p>
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useContext(UserContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.TASKS.DASHBOARD_STATS);
      setStats(res.data);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <Spinner size={36} />
      </div>
    </DashboardLayout>
  );

  const statusChartData = stats?.charts?.statusData?.map((d) => ({ name: d._id, value: d.count })) || [];
  const priorityChartData = stats?.charts?.priorityData?.map((d) => ({ name: d._id, count: d.count })) || [];
  const s = stats?.statistics || {};

  return (
    <DashboardLayout>
      <div className="space-y-7 animate-in">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              Good {moment().hour() < 12 ? "morning" : moment().hour() < 18 ? "afternoon" : "evening"},{" "}
              {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="page-subtitle">Here's what's happening with your team today.</p>
          </div>
          <Link to="/admin/create-task" className="btn-primary">
            <LuPlus size={16} /> New Task
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Tasks"  count={s.totalTasks || 0}    icon={<LuClipboardList />} color="bg-brand-100 text-brand-600" />
          <StatCard label="Pending"      count={s.pendingTasks || 0}   icon={<LuClock />}         color="bg-amber-100 text-amber-600" />
          <StatCard label="In Progress"  count={s.inProgressTasks || 0}icon={<LuLoader />}        color="bg-blue-100 text-blue-600" />
          <StatCard label="Completed"    count={s.completedTasks || 0} icon={<LuCircleCheck />}   color="bg-emerald-100 text-emerald-600" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Status donut — 2 cols */}
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">Status Overview</h2>
              <span className="badge badge-pending text-xs">{s.totalTasks || 0} total</span>
            </div>
            {statusChartData.length === 0 ? (
              <EmptyState icon="📊" title="No data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusChartData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                    {statusChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS.status[i % 3]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Priority bar — 3 cols */}
          <div className="card lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">Tasks by Priority</h2>
            </div>
            {priorityChartData.length === 0 ? (
              <EmptyState icon="📊" title="No data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priorityChartData} barCategoryGap="35%">
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9", radius: 6 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {priorityChartData.map((entry, i) => (
                      <Cell key={i} fill={CHART_COLORS.priority[entry.name] || "#875cf5"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bottom grid: Recent tasks + Activity feed */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Recent tasks table — 2 cols */}
          <div className="card xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <LuClipboardList size={16} className="text-brand-500" /> Recent Tasks
              </h2>
              <Link to="/admin/tasks" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                View all <LuArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Title", "Priority", "Status", "Due", "Assignees"].map((h) => (
                      <th key={h} className="text-left pb-3 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wider
                        first:pl-2 last:pr-2 last:hidden last:lg:table-cell [&:nth-child(2)]:hidden [&:nth-child(2)]:md:table-cell [&:nth-child(4)]:hidden [&:nth-child(4)]:md:table-cell">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats?.recentTasks?.map((task) => (
                    <tr key={task._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-3 px-1 pl-2">
                        <p className="font-medium text-slate-800 line-clamp-1 group-hover:text-brand-600 transition-colors">
                          {task.title}
                        </p>
                      </td>
                      <td className="py-3 px-1 hidden md:table-cell">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="py-3 px-1">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="py-3 px-1 text-slate-500 text-xs hidden md:table-cell">
                        {task.dueDate ? moment(task.dueDate).format("MMM D") : "—"}
                      </td>
                      <td className="py-3 px-1 pr-2 hidden lg:table-cell">
                        <AvatarGroup users={task.assignedTo || []} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!stats?.recentTasks?.length) && (
                <EmptyState icon="📋" title="No tasks yet" message="Create your first task to get started." />
              )}
            </div>
          </div>

          {/* Activity feed — 1 col */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <LuActivity size={16} className="text-brand-500" /> Activity
              </h2>
              <span className="text-xs text-slate-400">Live</span>
            </div>
            <div className="space-y-0 max-h-72 overflow-y-auto -mr-1 pr-1">
              {stats?.activityFeed?.length === 0 ? (
                <EmptyState icon="📡" title="No activity yet" message="Status updates will appear here." />
              ) : (
                stats?.activityFeed?.map((item, i) => {
                  const statusColor = {
                    "Completed": "text-emerald-600 bg-emerald-50",
                    "In Progress": "text-blue-600 bg-blue-50",
                    "Pending": "text-slate-600 bg-slate-100",
                  }[item.statusHistory?.status] || "text-slate-600 bg-slate-100";
                  return (
                    <div key={i} className="flex gap-3 py-3 border-b border-slate-50 last:border-0">
                      {item.actor?.profileImageUrl ? (
                        <img src={item.actor.profileImageUrl}
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" alt="" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 text-xs flex items-center justify-center font-semibold flex-shrink-0 mt-0.5">
                          {item.actor?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 leading-snug">
                          <span className="font-semibold">{item.actor?.name || "Someone"}</span>{" "}
                          marked <span className="font-medium text-slate-900 line-clamp-1">"{item.title}"</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${statusColor}`}>
                            {item.statusHistory?.status}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {moment(item.statusHistory?.createdAt).fromNow()}
                          </span>
                        </div>
                        {item.statusHistory?.note && (
                          <p className="text-[10px] text-slate-400 mt-0.5 italic line-clamp-1">
                            "{item.statusHistory.note}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
