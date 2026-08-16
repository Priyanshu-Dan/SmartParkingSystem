"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthRedirect } from "@/components/RouteGuard";
import { setAuthSession } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = (await response.json()) as {
        token?: string;
        role?: "admin" | "user";
        error?: string;
      };

      if (!response.ok) {
        setErrorMessage(data.error ?? "Login failed.");
        return;
      }

      if (!data.token || !data.role) {
        setErrorMessage("Login response was incomplete.");
        return;
      }

      setAuthSession(data.token, data.role);
      router.push(data.role === "admin" ? "/dashboard" : "/entry");
    } catch {
      setErrorMessage("Unable to login right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthRedirect>
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid w-full gap-6 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur md:grid-cols-[0.95fr_1.05fr] sm:p-8">
          <div className="rounded-[1.75rem] border border-sky-200 bg-sky-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
              Login
            </p>
            <h1 className="mt-4 text-3xl font-bold text-slate-950">
              Access the parking system
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Sign in with your registered account to continue to the pages
              allowed for your access level.
            </p>
            <div className="mt-6 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-600">
              Your access level is based on the role assigned to your account during registration.  
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  required
                />
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-5 text-sm text-slate-600">
              Need an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-sky-700 transition hover:text-sky-800"
              >
                Register
              </Link>
            </p>
          </div>
        </section>
      </main>
    </AuthRedirect>
  );
}
