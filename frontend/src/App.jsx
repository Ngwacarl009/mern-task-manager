import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useContext } from "react";
import { UserContext } from "./context/userContext";
import UserProvider from "./context/userContext";
import SocketProvider from "./context/socketContext";

import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import AdminDashboard from "./pages/admin/Dashboard";
import ManageTasks from "./pages/admin/ManageTasks";
import CreateTask from "./pages/admin/CreateTask";
import ManageUsers from "./pages/admin/ManageUsers";
import ChatDashboard from "./pages/admin/ChatDashboard";
import UserDashboard from "./pages/user/Dashboard";
import MyTasks from "./pages/user/MyTasks";
import ViewTaskDetails from "./pages/user/ViewTaskDetails";
import AdminChat from "./components/chat/AdminChat";
import MemberChat from "./components/chat/MemberChat";

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user } = useContext(UserContext);
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/user/dashboard" />;
  return children;
};

// Floating chat overlay — shown on all pages when logged in
const ChatOverlay = () => {
  const { user } = useContext(UserContext);
  if (!user) return null;
  // Admin has the full /admin/chat page + FAB; member has floating box
  return user.role === "admin" ? <AdminChat /> : <MemberChat />;
};

const AppRoutes = () => {
  const { user } = useContext(UserContext);
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/tasks"     element={<PrivateRoute adminOnly><ManageTasks /></PrivateRoute>} />
        <Route path="/admin/create-task"     element={<PrivateRoute adminOnly><CreateTask /></PrivateRoute>} />
        <Route path="/admin/create-task/:id" element={<PrivateRoute adminOnly><CreateTask /></PrivateRoute>} />
        <Route path="/admin/users"     element={<PrivateRoute adminOnly><ManageUsers /></PrivateRoute>} />
        <Route path="/admin/chat"      element={<PrivateRoute adminOnly><ChatDashboard /></PrivateRoute>} />

        {/* Member */}
        <Route path="/user/dashboard"       element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
        <Route path="/user/tasks"           element={<PrivateRoute><MyTasks /></PrivateRoute>} />
        <Route path="/user/task-details/:id" element={<PrivateRoute><ViewTaskDetails /></PrivateRoute>} />

        <Route
          path="/"
          element={
            user
              ? user.role === "admin"
                ? <Navigate to="/admin/dashboard" />
                : <Navigate to="/user/dashboard" />
              : <Navigate to="/login" />
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Global floating chat */}
      <ChatOverlay />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            borderRadius: "12px",
            fontSize: "14px",
            padding: "12px 16px",
          },
          success: { iconTheme: { primary: "#875cf5", secondary: "#fff" } },
        }}
      />
    </Router>
  );
};

const App = () => (
  <UserProvider>
    <SocketProvider>
      <AppRoutes />
    </SocketProvider>
  </UserProvider>
);

export default App;
