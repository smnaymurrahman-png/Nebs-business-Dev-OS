"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { FormField, inputClass, selectClass } from "@/components/shared/FormField";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  name: string;
  email: string;
  designation?: string;
  role: string;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  ADMIN: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100",
  USER: "bg-gray-100 text-gray-700",
};

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50/50" />
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm">
          <Plus className="w-4 h-4" />Add Member
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                {["Name", "Email", "Designation", "Role", "Joined", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No users found</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {u.name[0].toUpperCase()}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{u.designation ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-700"}`}>
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Pencil className="w-3.5 h-3.5" /></button>
                        {currentRole === "SUPER_ADMIN" && u.id !== session?.user?.id && (
                          <button onClick={() => del(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
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
        {error && <p className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-xl font-medium">{error}</p>}
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
              {availableRoles.map((r) => (<option key={r} value={r}>{r.replace("_", " ")}</option>))}
            </select>
          </FormField>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModal(null)} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={save} disabled={loading} className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-sm">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
