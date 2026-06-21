import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { LuZap, LuUser, LuMail, LuLock, LuKey, LuCamera, LuEye, LuEyeOff } from "react-icons/lu";
import { UserContext } from "../../context/userContext";
import axiosInstance, { API_PATHS } from "../../utils/axiosInstance";

const SignUp = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", adminInviteToken: "" });
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error("Please fill in all required fields");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const res = await axiosInstance.post(API_PATHS.AUTH.REGISTER, { ...form, profileImageUrl: "" });
      let profileImageUrl = "";

      if (profileImage) {
        const fd = new FormData();
        fd.append("profileImage", profileImage);
        const imgRes = await axiosInstance.post(API_PATHS.AUTH.UPLOAD_IMAGE, fd, {
          headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${res.data.token}` },
        });
        profileImageUrl = imgRes.data.profileImageUrl;
        await axiosInstance.put(API_PATHS.AUTH.PROFILE, { profileImageUrl },
          { headers: { Authorization: `Bearer ${res.data.token}` } });
      }

      updateUser({ ...res.data, profileImageUrl });
      toast.success("Account created! Welcome 🎉");
      navigate(res.data.role === "admin" ? "/admin/dashboard" : "/user/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md animate-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-sm">
              <LuZap size={18} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">TaskFlow</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mt-2">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Join your team on TaskFlow</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar picker */}
            <div className="flex justify-center">
              <label className="relative cursor-pointer group">
                <div className="w-20 h-20 rounded-2xl bg-brand-50 border-2 border-dashed border-brand-200 overflow-hidden flex items-center justify-center group-hover:border-brand-400 transition-colors">
                  {profilePreview
                    ? <img src={profilePreview} alt="preview" className="w-full h-full object-cover" />
                    : <LuUser size={30} className="text-brand-300" />}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center shadow-sm">
                  <LuCamera size={12} className="text-white" />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              </label>
            </div>

            <div>
              <label className="label">Full Name *</label>
              <div className="relative">
                <LuUser size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input pl-9" placeholder="Alex Johnson" />
              </div>
            </div>

            <div>
              <label className="label">Email *</label>
              <div className="relative">
                <LuMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input pl-9" placeholder="alex@company.com" />
              </div>
            </div>

            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <LuLock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPw ? "text" : "password"} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pl-9 pr-10" placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">
                Admin Invite Token{" "}
                <span className="text-slate-400 font-normal text-xs">(optional — leave blank for member role)</span>
              </label>
              <div className="relative">
                <LuKey size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={form.adminInviteToken}
                  onChange={(e) => setForm({ ...form, adminInviteToken: e.target.value })}
                  className="input pl-9" placeholder="Enter token if you have one" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 mt-1 text-base font-semibold">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
