"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PREVIEW_ADMIN_EMAIL, PREVIEW_ADMIN_PASSWORD } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") ?? "/admin";

  const [email, setEmail] = useState(PREVIEW_ADMIN_EMAIL);
  const [password, setPassword] = useState(PREVIEW_ADMIN_PASSWORD);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          from: redirectTo,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { message?: string; redirectTo?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.message ?? "Login failed. Please try again.");
      }

      router.replace(result?.redirectTo ?? "/admin");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Login failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-900 p-6 text-white shadow-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Protected admin access
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Sign in before entering the management area</h1>
          <p className="mt-3 text-sm text-emerald-50/90 sm:text-base">
            All `/admin` routes now require an authenticated session. This preview login will be
            replaced by NestJS-backed authentication in the next phase.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-emerald-50/90">
            <li>• Redirects unauthenticated users to this sign-in screen</li>
            <li>• Keeps the dashboard, list, and detail pages protected</li>
            <li>• Ready to swap to real JWT login when backend auth is added</li>
          </ul>

          <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm">
            <p className="font-semibold text-white">Preview credentials</p>
            <p className="mt-2 text-emerald-50">Email: {PREVIEW_ADMIN_EMAIL}</p>
            <p className="text-emerald-50">Password: {PREVIEW_ADMIN_PASSWORD}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Internal access
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Admin sign in</h2>
            <p className="mt-2 text-sm text-slate-500">You will be redirected to: {redirectTo}</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                placeholder="ops@yomaelevator.com"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign in to admin"}
            </button>

            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Back to public form
            </Link>

            <p className="text-xs text-slate-500">
              Current stage: protected preview login with a session cookie for `/admin` routes.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
