"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
      <div className="w-full max-w-sm px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold">N</span>
            </div>
            <h1 className="text-[20px] font-bold text-gray-900">Nebs BD OS</h1>
            <p className="text-[13px] text-gray-400 mt-1">Business Development Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-lg px-4 py-3 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@nebs.com"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white text-gray-700 placeholder:text-gray-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white text-gray-700 placeholder:text-gray-300 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none disabled:opacity-60 transition-all mt-2"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-center text-[11px] text-gray-400 mt-6">
            Internal access only · Nebs Agency
          </p>
        </div>
      </div>
    </div>
  );
}
