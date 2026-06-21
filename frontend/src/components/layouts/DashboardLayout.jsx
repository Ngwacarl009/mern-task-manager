import Sidebar from "./Sidebar";

const DashboardLayout = ({ children }) => (
  <div className="flex min-h-screen bg-slate-50">
    <Sidebar />
    <main className="flex-1 md:ml-64 min-h-screen">
      <div className="max-w-7xl mx-auto p-5 md:p-8 animate-in">
        {children}
      </div>
    </main>
  </div>
);

export default DashboardLayout;
