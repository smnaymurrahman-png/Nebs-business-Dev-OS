"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Wallet, Clock, CheckCircle2, DollarSign, Edit2, Check, X } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

type MethodType = "BKASH" | "NAGAD" | "BANK" | "INTERNATIONAL";

interface PayoutMethod {
  id: string;
  type: MethodType;
  details: Record<string, string>;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  rejectReason: string | null;
  paidAt: string | null;
  createdAt: string;
  payoutMethod: { type: string; details: Record<string, string> } | null;
}

interface Balance {
  pending: number;
  available: number;
  paid: number;
  minimum: number;
}

const METHOD_LABELS: Record<MethodType, string> = {
  BKASH: "bKash",
  NAGAD: "Nagad",
  BANK: "Bank Account",
  INTERNATIONAL: "International Transfer",
};

const PAYOUT_STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700",
  APPROVED:  "bg-blue-50 text-blue-700",
  PAID:      "bg-emerald-50 text-emerald-700",
  REJECTED:  "bg-red-50 text-red-600",
};

const METHOD_FIELDS: Record<MethodType, Array<{ key: string; label: string; placeholder: string }>> = {
  BKASH: [
    { key: "number", label: "bKash Number", placeholder: "01XXXXXXXXX" },
  ],
  NAGAD: [
    { key: "number", label: "Nagad Number", placeholder: "01XXXXXXXXX" },
  ],
  BANK: [
    { key: "bankName",      label: "Bank Name",       placeholder: "Dutch-Bangla Bank" },
    { key: "accountNumber", label: "Account Number",  placeholder: "XXXXXXXXXXXX" },
    { key: "accountName",   label: "Account Name",    placeholder: "Full name on account" },
    { key: "branch",        label: "Branch",          placeholder: "Gulshan Branch" },
    { key: "district",      label: "District",        placeholder: "Dhaka" },
  ],
  INTERNATIONAL: [
    { key: "bankName",      label: "Bank Name",       placeholder: "Chase Bank" },
    { key: "accountName",   label: "Account Name",    placeholder: "Full name on account" },
    { key: "accountNumber", label: "Account Number",  placeholder: "XXXXXXXXXXXX" },
    { key: "routingNumber", label: "Routing Number",  placeholder: "XXXXXXXXX" },
    { key: "swiftCode",     label: "SWIFT Code",      placeholder: "XXXXXXXX" },
    { key: "country",       label: "Country",         placeholder: "United States" },
  ],
};

function MethodForm({
  type,
  initial,
  onSave,
  onCancel,
  saving,
}: {
  type: MethodType;
  initial?: Record<string, string>;
  onSave: (details: Record<string, string>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const fields = METHOD_FIELDS[type];
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, initial?.[f.key] ?? ""]))
  );
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const empty = fields.find((f) => !values[f.key]?.trim());
    if (empty) { setError(`${empty.label} is required`); return; }
    setError("");
    await onSave(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3">
      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.key} className={fields.length === 1 ? "sm:col-span-2" : ""}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{f.label}</label>
            <input value={values[f.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 text-gray-700 placeholder:text-gray-300" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
          <Check className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
      </div>
    </form>
  );
}

function MethodCard({ method, onSaved, onDelete }: { method: PayoutMethod; onSaved: () => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fields = METHOD_FIELDS[method.type] ?? [];

  const save = async (details: Record<string, string>) => {
    setSaving(true);
    await fetch(`/api/affiliate/payout-methods/${method.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ details }),
    });
    setSaving(false);
    setEditing(false);
    onSaved();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-800">{METHOD_LABELS[method.type]}</p>
          {!editing && (
            <div className="mt-1.5 space-y-0.5">
              {fields.map((f) => method.details[f.key] && (
                <p key={f.key} className="text-xs text-gray-500">
                  <span className="text-gray-400">{f.label}: </span>{method.details[f.key]}
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setEditing((e) => !e)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            {editing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {editing && (
        <MethodForm type={method.type} initial={method.details} onSave={save} onCancel={() => setEditing(false)} saving={saving} />
      )}
    </div>
  );
}

interface RequestModalProps {
  available: number;
  minimum: number;
  methods: PayoutMethod[];
  onClose: () => void;
  onSaved: () => void;
}

function RequestModal({ available, minimum, methods, onClose, onSaved }: RequestModalProps) {
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!methodId) { setError("Select a payout method"); return; }
    if (isNaN(parsed) || parsed <= 0) { setError("Enter a valid amount"); return; }
    if (parsed < minimum) { setError(`Minimum payout is $${minimum} USD`); return; }
    if (parsed > available) { setError(`Amount exceeds available balance ($${available.toFixed(2)})`); return; }

    setSaving(true); setError("");
    const res = await fetch("/api/affiliate/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutMethodId: methodId, amount: parsed }),
    });
    setSaving(false);
    if (!res.ok) {
      const e = await res.json();
      setError(e.error ?? "Failed to submit");
    } else {
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Request Payout</h2>
          <p className="text-xs text-gray-500 mt-0.5">Available: <span className="font-semibold text-emerald-600">${available.toFixed(2)}</span> · Minimum: ${minimum}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Payout Method *</label>
            <select value={methodId} onChange={(e) => setMethodId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30 bg-white text-gray-700">
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {METHOD_LABELS[m.type]} — {Object.values(m.details)[0] ?? ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amount (USD) *</label>
            <input type="number" min={minimum} max={available} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min $${minimum} · Max $${available.toFixed(2)}`}
              className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 text-gray-700 placeholder:text-gray-300" />
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
          <button type="submit" disabled={saving}
            className="px-5 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors">
            {saving ? "Submitting…" : "Payout Now"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AffiliatePayoutsPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [addingType, setAddingType] = useState<MethodType | null>(null);
  const [addingSaving, setAddingSaving] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  const loadAll = useCallback(async () => {
    const [b, m, p] = await Promise.all([
      fetch("/api/affiliate/payouts/balance").then((r) => r.json()),
      fetch("/api/affiliate/payout-methods").then((r) => r.json()),
      fetch("/api/affiliate/payouts").then((r) => r.json()),
    ]);
    setBalance(b);
    setMethods(Array.isArray(m) ? m : []);
    setPayouts(Array.isArray(p) ? p : []);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addMethod = async (details: Record<string, string>) => {
    if (!addingType) return;
    setAddingSaving(true);
    await fetch("/api/affiliate/payout-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: addingType, details }),
    });
    setAddingSaving(false);
    setAddingType(null);
    loadAll();
  };

  const deleteMethod = async (id: string) => {
    const res = await fetch(`/api/affiliate/payout-methods/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const e = await res.json();
      alert(e.error ?? "Cannot delete");
    } else {
      loadAll();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Payouts</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your earnings and withdrawal requests</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending (in hold)", value: balance?.pending ?? 0, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "Available",         value: balance?.available ?? 0, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Paid Out",          value: balance?.paid ?? 0, icon: DollarSign, color: "text-blue-600 bg-blue-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", color)}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-gray-900">${value.toFixed(2)}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Request payout button */}
      {balance && balance.available >= (balance.minimum ?? 15) && methods.length > 0 && (
        <button onClick={() => setShowRequest(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm">
          <Wallet className="w-4 h-4" /> Request Payout
        </button>
      )}
      {balance && balance.available > 0 && balance.available < (balance.minimum ?? 15) && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
          Available balance (${balance.available.toFixed(2)}) is below the minimum payout of ${balance.minimum}
        </p>
      )}
      {balance && balance.available >= (balance.minimum ?? 15) && methods.length === 0 && (
        <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
          Add a payout method below before requesting a withdrawal
        </p>
      )}

      {/* Payout Methods */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Payout Methods</h2>
          {!addingType && (
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 rounded-lg hover:bg-violet-100 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Method
              </button>
              {/* Dropdown on hover */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {(["BKASH", "NAGAD", "BANK", "INTERNATIONAL"] as MethodType[]).map((t) => (
                  <button key={t} onClick={() => setAddingType(t)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors">
                    {METHOD_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add method form */}
        {addingType && (
          <div className="bg-white rounded-xl border border-violet-100 p-4 mb-3">
            <p className="text-sm font-semibold text-gray-700">Add {METHOD_LABELS[addingType]}</p>
            <MethodForm type={addingType} onSave={addMethod} onCancel={() => setAddingType(null)} saving={addingSaving} />
          </div>
        )}

        {methods.length === 0 && !addingType ? (
          <p className="text-sm text-gray-400 py-3">No payout methods added yet</p>
        ) : (
          <div className="space-y-2">
            {methods.map((m) => (
              <MethodCard key={m.id} method={m} onSaved={loadAll} onDelete={() => deleteMethod(m.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Payout History */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Payout History</h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-gray-400 py-3">No payout requests yet</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Date", "Amount", "Method", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3.5 text-sm font-bold text-gray-800">${Number(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">
                      {p.payoutMethod ? METHOD_LABELS[p.payoutMethod.type as MethodType] ?? p.payoutMethod.type : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <span className={cn("inline-block px-2 py-0.5 rounded text-[11px] font-semibold", PAYOUT_STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-500")}>
                          {p.status}
                        </span>
                        {p.rejectReason && <p className="text-xs text-red-500 mt-0.5">{p.rejectReason}</p>}
                        {p.paidAt && <p className="text-xs text-gray-400 mt-0.5">Paid {formatDate(p.paidAt)}</p>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showRequest && balance && (
        <RequestModal
          available={balance.available}
          minimum={balance.minimum}
          methods={methods}
          onClose={() => setShowRequest(false)}
          onSaved={loadAll}
        />
      )}
    </div>
  );
}
