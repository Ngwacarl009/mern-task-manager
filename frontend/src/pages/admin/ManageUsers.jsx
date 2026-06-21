import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { LuTrash2, LuDownload, LuMail, LuCircleCheck, LuClock, LuLoader } from "react-icons/lu";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { DeleteConfirmModal, Spinner, EmptyState, ProgressBar } from "../../components/cards";
import axiosInstance, { API_PATHS } from "../../utils/axiosInstance";
import { downloadBlob } from "../../utils/helper";

const ManageUsers = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_PATHS.USERS.GET_ALL);
      setUsers(res.data || []);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(API_PATHS.USERS.DELETE(deleteModal.user._id));
      toast.success("User removed");
      setDeleteModal({ open: false, user: null });
      fetchUsers();
    } catch { toast.error("Delete failed"); }
  };

  const handleExport = async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_USERS, { responseType: "blob" });
      downloadBlob(res.data, "users_report.xlsx");
      toast.success("Report downloaded");
    } catch { toast.error("Export failed"); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Team Members</h1>
            <p className="page-subtitle">{users.length} member{users.length !== 1 ? "s" : ""} registered</p>
          </div>
          <button onClick={handleExport} className="btn-secondary">
            <LuDownload size={15} /> Export Report
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Spinner size={36} /></div>
        ) : users.length === 0 ? (
          <EmptyState icon="👥" title="No members yet"
            message="Members will appear here once they create accounts." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {users.map((user) => {
              const total = user.taskCount || 0;
              const done  = user.completedTaskCount || 0;
              const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <div key={user._id} className="card-hover">
                  {/* User header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt={user.name}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 text-lg font-bold flex items-center justify-center flex-shrink-0">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <LuMail size={11} />
                          <span className="truncate">{user.email}</span>
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setDeleteModal({ open: true, user })}
                      className="btn-icon text-slate-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0">
                      <LuTrash2 size={15} />
                    </button>
                  </div>

                  {/* Task stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "Total",    value: total,                      icon: <LuLoader size={12} />,       color: "text-slate-700 bg-slate-100" },
                      { label: "Pending",  value: user.pendingTaskCount || 0,  icon: <LuClock size={12} />,        color: "text-amber-700 bg-amber-50" },
                      { label: "Done",     value: done,                        icon: <LuCircleCheck size={12} />,  color: "text-emerald-700 bg-emerald-50" },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-xl py-2 px-1 text-center ${s.color}`}>
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          {s.icon}
                          <span className="text-[10px] font-semibold uppercase tracking-wide">{s.label}</span>
                        </div>
                        <p className="text-xl font-bold">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Completion progress */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span className="font-medium">Completion rate</span>
                      <span className="font-semibold text-slate-700">{pct}%</span>
                    </div>
                    <ProgressBar progress={pct} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        onConfirm={handleDelete}
        itemName={deleteModal.user?.name}
      />
    </DashboardLayout>
  );
};

export default ManageUsers;
