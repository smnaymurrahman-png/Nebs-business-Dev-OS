"use client";

import { useEffect, useState } from "react";
import { CopyReferralLink } from "@/components/affiliate/CopyReferralLink";
import { Check } from "lucide-react";

interface Profile { id: string; fullName: string; email: string; phone: string; affiliateCode: string; status: string; createdAt: string }

export default function AffiliateSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [pwErr, setPwErr] = useState("");

  useEffect(() => {
    fetch("/api/affiliate/settings")
      .then((r) => r.json())
      .then((d) => { setProfile(d); setFullName(d.fullName); setPhone(d.phone); });
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true); setProfileErr(""); setProfileMsg("");
    const res = await fetch("/api/affiliate/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone }),
    });
    setSavingProfile(false);
    if (res.ok) { setProfileMsg("Profile updated"); const d = await res.json(); setProfile(d); }
    else { const e = await res.json(); setProfileErr(e.error ?? "Failed"); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwErr("Passwords do not match"); return; }
    if (newPw.length < 8) { setPwErr("Password must be at least 8 characters"); return; }
    setSavingPw(true); setPwErr(""); setPwMsg("");
    const res = await fetch("/api/affiliate/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    setSavingPw(false);
    if (res.ok) { setPwMsg("Password changed"); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
    else { const e = await res.json(); setPwErr(e.error ?? "Failed"); }
  };

  const field = "w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 text-gray-700 placeholder:text-gray-300";

  if (!profile) return <div className="py-16 text-center text-sm text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your profile and security</p>
      </div>

      {/* Affiliate identity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Affiliate Identity</p>
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <p className="text-xs text-gray-400">Affiliate ID</p>
            <p className="font-mono text-xs font-semibold text-gray-700 mt-0.5">{profile.affiliateCode}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Status</p>
            <p className="font-semibold text-emerald-600 text-xs mt-0.5">{profile.status}</p>
          </div>
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Referral Link</p>
        <CopyReferralLink code={profile.affiliateCode} />
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Profile</p>
        {profileErr && <p className="mb-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{profileErr}</p>}
        {profileMsg && <p className="mb-3 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" />{profileMsg}</p>}
        <form onSubmit={saveProfile} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={field} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
            <input value={profile.email} disabled className={`${field} bg-gray-50 text-gray-400 cursor-not-allowed`} />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
          </div>
          <button type="submit" disabled={savingProfile}
            className="px-5 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
            {savingProfile ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Change Password</p>
        {pwErr && <p className="mb-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{pwErr}</p>}
        {pwMsg && <p className="mb-3 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 flex items-center gap-1.5"><Check className="w-3.5 h-3.5" />{pwMsg}</p>}
        <form onSubmit={changePassword} className="space-y-3">
          {[
            { label: "Current Password", value: currentPw, set: setCurrentPw },
            { label: "New Password", value: newPw, set: setNewPw },
            { label: "Confirm New Password", value: confirmPw, set: setConfirmPw },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
              <input type="password" value={value} onChange={(e) => set(e.target.value)} required minLength={label.includes("Current") ? 1 : 8} className={field} />
            </div>
          ))}
          <button type="submit" disabled={savingPw}
            className="px-5 py-2 text-sm font-semibold bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors">
            {savingPw ? "Changing…" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
