import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { LuZap, LuMail, LuLock, LuEye, LuEyeOff } from "react-icons/lu";
import { UserContext } from "../../context/userContext";
import axiosInstance, { API_PATHS } from "../../utils/axiosInstance";

const Login = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields");
    setLoading(true);
    try {
      const res = await axiosInstance.post(API_PATHS.AUTH.LOGIN, { email, password });
      updateUser(res.data);
      toast.success("Welcome back!");
      navigate(res.data.role === "admin" ? "/admin/dashboard" : "/user/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel – branding */}
      <div className="hidden lg:flex w-2/5 bg-gradient-to-br from-brand-600 via-brand-500 to-violet-400 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{ width: `${160 + i * 100}px`, height: `${160 + i * 100}px`,
                top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <LuZap size={20} className="text-white" />
          </div>
          <span className="text-white text-xl font-bold">TaskFlow</span>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Manage tasks.<br />Track progress.<br />Ship faster.
          </h2>
          <p className="mt-4 text-white/70 text-base leading-relaxed">
            A professional task management platform for modern teams — with real-time updates and smart notifications.
          </p>
        </div>
        <p className="relative text-white/40 text-xs">© {new Date().getFullYear()} TaskFlow</p>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md animate-in">
          <div className="text-center mb-8">
            <div className="lg:hidden inline-flex items-center gap-2 mb-6">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
                <LuZap size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">TaskFlow</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
            <p className="text-slate-500 text-sm mt-1">Enter your credentials to continue</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <LuMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="input pl-9" placeholder="you@company.com" autoComplete="email" />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <LuLock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPw ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-9 pr-10" placeholder="••••••••" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full py-2.5 mt-2 text-base font-semibold">
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-5">
              Don't have an account?{" "}
              <Link to="/signup" className="text-brand-600 font-semibold hover:text-brand-700">
                Create one →
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Admin access? Use the Admin Invite Token during sign-up.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
