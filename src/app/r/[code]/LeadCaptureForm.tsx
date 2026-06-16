"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Option { id: string; name: string }

interface Props {
  affiliateCode: string;
  affiliateName: string;
  industries: Option[];
  serviceTypes: Option[];
}

const INTENT_OPTIONS = [
  { value: "NEED_QUOTATION", label: "Need a Quotation" },
  { value: "INTERESTED",     label: "Interested in Service" },
  { value: "URGENT",         label: "Urgently Needed" },
];

export default function LeadCaptureForm({ affiliateCode, affiliateName, industries, serviceTypes }: Props) {
  const [form, setForm] = useState({
    fullName: "", emailAddress: "", phoneNumber: "", businessName: "",
    industryId: "", serviceTypeId: "", referenceAmount: "", leadIntent: "", confirmed: false,
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "duplicate" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.confirmed) return;

    setStatus("submitting");
    const res = await fetch(`/api/r/${affiliateCode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        emailAddress: form.emailAddress,
        phoneNumber: form.phoneNumber,
        businessName: form.businessName,
        industryId: form.industryId || null,
        serviceTypeId: form.serviceTypeId || null,
        referenceAmount: form.referenceAmount ? parseFloat(form.referenceAmount) : null,
        leadIntent: form.leadIntent || null,
      }),
    });

    if (res.status === 409) { setStatus("duplicate"); return; }
    if (!res.ok) {
      const e = await res.json();
      setErrorMsg(e.error ?? "Something went wrong");
      setStatus("error");
      return;
    }
    setStatus("success");
  };

  if (status === "success") {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h2>
        <p className="text-gray-500">Your information has been submitted. The Nebs team will be in touch shortly.</p>
      </div>
    );
  }

  if (status === "duplicate") {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-base font-bold text-gray-900 mb-2">Already in our system</h2>
        <p className="text-amber-700 text-sm">This lead already exists in the system.</p>
      </div>
    );
  }

  const field = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 text-gray-700 placeholder:text-gray-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === "error" && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{errorMsg}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name *</label>
          <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required placeholder="Your full name" className={field} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address *</label>
          <input type="email" value={form.emailAddress} onChange={(e) => set("emailAddress", e.target.value)} required placeholder="you@company.com" className={field} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number *</label>
          <input type="tel" value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} required placeholder="+880 1X XXXX XXXX" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Business Name *</label>
          <input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} required placeholder="Your business or company name" className={field} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Industry</label>
          <select value={form.industryId} onChange={(e) => set("industryId", e.target.value)} className={cn(field, "bg-white")}>
            <option value="">Select industry…</option>
            {industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Service Type</label>
          <select value={form.serviceTypeId} onChange={(e) => set("serviceTypeId", e.target.value)} className={cn(field, "bg-white")}>
            <option value="">Select service…</option>
            {serviceTypes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reference Amount</label>
          <input type="number" min="0" step="0.01" value={form.referenceAmount} onChange={(e) => set("referenceAmount", e.target.value)} placeholder="Optional budget / reference" className={field} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">What do you need?</label>
          <select value={form.leadIntent} onChange={(e) => set("leadIntent", e.target.value)} className={cn(field, "bg-white")}>
            <option value="">Select…</option>
            {INTENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer mt-2">
        <input type="checkbox" checked={form.confirmed} onChange={(e) => set("confirmed", e.target.checked)}
          className="mt-0.5 accent-violet-600 w-4 h-4 rounded shrink-0" required />
        <span className="text-sm text-gray-600 leading-snug">
          I confirm that the information above is accurate and I consent to being contacted by the Nebs team.
        </span>
      </label>

      <button type="submit" disabled={status === "submitting" || !form.confirmed}
        className="w-full py-3 text-sm font-bold bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors">
        {status === "submitting" ? "Submitting…" : `Submit to ${affiliateName}`}
      </button>
    </form>
  );
}
