"use client";

import { useEffect, useState } from "react";
import { type ComponentType } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search, Users, Shield, ShieldCheck, UserPlus } from "lucide-react";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  name: string;
  email: string;
  designation?: string;
  role: string;
  createdAt: string;
}

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  ADMIN: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
  USER: "bg-gray-100 text-gray-600",
};

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  USER: "Member",
};

const AVATAR_COLORS = ["bg-blue-500", "bg-indigo-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500"];

function Avatar({ name }: { name: string }) {
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`w-7 h-7 rounded-md ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor }: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-3">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

const emptyForm = { name: "", email: "", password: "", designation: "", role: "USER" };

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const currentRole = (session?.user as { role?: string })?.role;
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => fetch("/api/users").then((r) => r.json()).then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) =>
    [u.name, u.email, u.designation ?? ""].some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setForm(emptyForm); setError(""); setModal("add"); };
  const openEdit = (u: User) => {
    setSelected(u);
    setForm({ name: u.name, email: u.email, password: "", designation: u.designation ?? "", role: u.role });
    setError(""); setModal("edit");
  };

  const save = async () => {
    setLoading(true); setError("");
    try {
      const payload = modal === "edit" && !form.password ? { name: form.name, email: form.email, designation: form.designation, role: form.role } : form;
      const res = modal === "add"
        ? await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch(`/api/users/${selected!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); setError(e.error ?? "Error"); return; }
      await load(); setModal(null);
    } finally { setLoading(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    load();
  };

  const availableRoles = currentRole === "SUPER_ADMIN"
    ? ["USER", "ADMIN", "SUPER_ADMIN"]
    : ["USER", "ADMIN"];

  const now = new Date();
  const thisMonth = users.filter((u) => {
    const d = new Date(u.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const admins = users.filter((u) => u.role === "ADMIN").length;
  const superAdmins = users.filter((u) => u.role === "SUPER_ADMIN").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Users}      label="Total Members"  value={users.length}  iconBg="bg-blue-50"    iconColor="text-blue-600" />
        <StatCard icon={Shield}     label="Admins"         value={admins}        iconBg="bg-sky-50"     iconColor="text-sky-600" />
        <StatCard icon={ShieldCheck} label="Super Admins" value={superAdmins}   iconBg="bg-indigo-50"  iconColor="text-indigo-600" />
        <StatCard icon={UserPlus}   label="New This Month" value={thisMonth}    iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold text-gray-700">Team Members</h2>
            <span className="bg-gray-100 text-gray-500 text-[11px] px-2 py-0.5 rounded-full font-semibold">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members..." className="pl-8 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white placeholder:text-gray-300 text-gray-700 w-52 transition-all" />
            </div>
            <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all">
              <Plus className="w-4 h-4" />Add Member
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Name", "Email", "Designation", "Role", "Joined", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                      <Users className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-[13px] font-medium text-gray-500">No members yet</p>
                    <p className="text-[12px] mt-1">Add your first team member to get started</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="group border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} />
                        <p className="text-[13px] font-semibold text-gray-700">{u.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-500">{u.email}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-500">{u.designation || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${ROLE_BADGE[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-gray-400 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        {currentRole === "SUPER_ADMIN" && u.id !== session?.user?.id && (
                          <button onClick={() => del(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === "add" ? "Add Team Member" : "Edit Member"} size="md">
        {error && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium">{error}</p>}
        <div className="space-y-4">
          <FormField label="Full Name" required>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass()} placeholder="John Doe" />
          </FormField>
          <FormField label="Work Email" required>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass()} placeholder="john@nebs.com" />
          </FormField>
          <FormField label={modal === "add" ? "Password" : "New Password (leave blank to keep)"} required={modal === "add"}>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass()} placeholder="••••••••" />
          </FormField>
          <FormField label="Designation">
            <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className={inputClass()} placeholder="Business Developer, BD Manager..." />
          </FormField>
          <FormField label="Role" required>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={selectClass()}>
              {availableRoles.map((r) => (<option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>))}
            </select>
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={save} disabled={loading} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
