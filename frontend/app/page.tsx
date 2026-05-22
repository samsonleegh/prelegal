"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { fakeLogin, getStoredUser, storeUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getStoredUser()) router.replace("/draft");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await fakeLogin(name.trim(), email.trim());
      storeUser(user);
      router.replace("/draft");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#032147]">Prelegal</h1>
          <p className="text-sm text-slate-600">Sign in to start drafting agreements.</p>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-800">Name</span>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            required
            minLength={1}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-800">Email</span>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            required
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting || name.trim() === "" || email.trim() === ""}
          className="inline-flex items-center justify-center rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#5e2d75] disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting ? "Signing in…" : "Continue"}
        </button>

        <p className="text-center text-xs text-slate-500">
          Placeholder sign-in. No password required.
        </p>
      </form>
    </main>
  );
}
