import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserCircle, Lock, Shield, Save } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/account/profile`, { name, email }, { withCredentials: true });
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      await axios.put(`${API}/account/password`, {
        current_password: currentPassword, new_password: newPassword,
      }, { withCredentials: true });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl" data-testid="account-page">
      <div>
        <h1 className="font-['Outfit'] text-3xl font-bold text-white mb-1">Account Settings</h1>
        <p className="text-slate-400">Manage your profile and security</p>
      </div>

      {/* Profile */}
      <div className="glass-card rounded-2xl p-6" data-testid="profile-section">
        <div className="flex items-center gap-2 mb-5">
          <UserCircle className="w-5 h-5 text-cyan-400" />
          <h2 className="font-['Outfit'] text-lg font-semibold text-white">Profile</h2>
        </div>
        <div className="flex items-center gap-4 mb-6">
          {user?.picture ? (
            <img src={user.picture} alt="" className="w-16 h-16 rounded-2xl" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-2xl font-bold text-cyan-400">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div>
            <p className="text-white font-medium">{user?.name}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-xs font-medium capitalize">
              {user?.plan || "free"} plan
            </span>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-slate-300 text-sm mb-1.5 block">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="account-name-input"
              className="bg-slate-950/50 border-slate-800 focus:border-cyan-500 text-white h-11 rounded-xl" />
          </div>
          <div>
            <Label className="text-slate-300 text-sm mb-1.5 block">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} data-testid="account-email-input"
              className="bg-slate-950/50 border-slate-800 focus:border-cyan-500 text-white h-11 rounded-xl" />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} data-testid="save-profile-btn"
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl">
            <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Password */}
      <div className="glass-card rounded-2xl p-6" data-testid="password-section">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-5 h-5 text-cyan-400" />
          <h2 className="font-['Outfit'] text-lg font-semibold text-white">Change Password</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-slate-300 text-sm mb-1.5 block">Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              data-testid="current-password-input"
              className="bg-slate-950/50 border-slate-800 focus:border-cyan-500 text-white h-11 rounded-xl" />
          </div>
          <div>
            <Label className="text-slate-300 text-sm mb-1.5 block">New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              data-testid="new-password-input"
              className="bg-slate-950/50 border-slate-800 focus:border-cyan-500 text-white h-11 rounded-xl" />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword} data-testid="change-password-btn"
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700">
            <Shield className="w-4 h-4 mr-2" /> {changingPassword ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>
    </div>
  );
}
