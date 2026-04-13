"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-border bg-white px-3 py-2.5 text-[14px] outline-none placeholder:text-[#c0bdb6] focus:border-coral";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F3EE] px-4 py-16">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-1 font-sans text-[18px] font-medium">
            <span>give</span>
            <span className="text-coral">nest</span>
          </a>
          <p className="mt-2 text-[13px] text-muted">Admin portal</p>
        </div>

        <div className="rounded-[12px] border border-border bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-center font-serif text-[22px] font-medium">Sign in</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.05em] text-muted">
                Email
              </label>
              <input
                type="email"
                className={inputCls}
                placeholder="you@givenest.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.05em] text-muted">
                Password
              </label>
              <input
                type="password"
                className={inputCls}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className={`mt-1 w-full rounded-md bg-coral py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#d4574a] ${
                loading || !email.trim() || !password ? "cursor-default opacity-40" : "cursor-pointer"
              }`}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-[13px] text-coral hover:underline">
            ← Back to givenest.com
          </a>
        </div>
      </div>
    </div>
  );
}
