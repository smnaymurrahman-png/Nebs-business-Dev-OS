"use client";

import { useState } from "react";
import Link from "next/link";

type Stage = "form" | "success";

export default function AffiliateRegisterPage() {
  const [stage, setStage] = useState<Stage>("form");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/affiliate/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed");
    } else {
      setStage("success");
    }
  };

  if (stage === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="w-full max-w-sm px-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Application submitted</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your affiliate account is pending approval by the Nebs team. You will be able to log in once
              an admin activates your account.
            </p>
            <Link
              href="/affiliate/login"
              className="mt-6 inline-block text-sm font-semibold text-violet-600 hover:underline"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
      <div className="w-full max-w-sm px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-11 h-11 bg-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold">N</span>
            </div>
            <h1 className="text-[20px] font-bold text-gray-900">Become an Affiliate</h1>
            <p className="text-[13px] text-gray-400 mt-1">Register to start referring leads</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-lg px-4 py-3 font-medium">
                {error}
              </div>
            )}

            {[
              { key: "fullName", label: "Full Name", type: "text", placeholder: "John Doe" },
              { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
              { key: "phone", label: "Phone", type: "tel", placeholder: "+880 1XXX-XXXXXX" },
              { key: "password", label: "Password", type: "password", placeholder: "Min 8 characters" },
              { key: "confirm", label: "Confirm Password", type: "password", placeholder: "Repeat password" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={set(key as keyof typeof form)}
                  required
                  placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 bg-white text-gray-700 placeholder:text-gray-300 transition-all"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 focus:outline-none disabled:opacity-60 transition-all mt-2"
            >
              {loading ? "Submitting…" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/affiliate/login" className="text-violet-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
