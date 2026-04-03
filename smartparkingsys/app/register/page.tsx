"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthRedirect } from "@/components/RouteGuard";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setErrorMessage(data.error ?? "Registration failed.");
        return;
      }

      setSuccessMessage(
        data.message ?? "Registration successful. Redirecting to login...",
      );
      setEmail("");
      setPassword("");
      setRole("user");

      window.setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch {
      setErrorMessage("Unable to register right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthRedirect>
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid w-full gap-6 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur md:grid-cols-[0.95fr_1.05fr] sm:p-8">
          <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Register
            </p>
            <h1 className="mt-4 text-3xl font-bold text-slate-950">
              Create your parking account
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Sign up with your email and password, then continue to login to
              access the parking system.
            </p>
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
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
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
                  placeholder="Create a password"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                  required
                />
              </div>

              <fieldset>
                <legend className="block text-sm font-medium text-slate-700">
                  Role
                </legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-white">
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={role === "user"}
                      onChange={() => setRole("user")}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <span>
                      <span className="block font-semibold text-slate-900">
                        User
                      </span>
                      <span className="block text-xs text-slate-500">
                        Entry access after login
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-white">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === "admin"}
                      onChange={() => setRole("admin")}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <span>
                      <span className="block font-semibold text-slate-900">
                        Admin
                      </span>
                      <span className="block text-xs text-slate-500">
                        Entry, exit, and dashboard access
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {successMessage}
                </div>
              ) : null}

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
                {isSubmitting ? "Registering..." : "Register"}
              </button>
            </form>

            <p className="mt-5 text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                Login
              </Link>
            </p>
          </div>
        </section>
      </main>
    </AuthRedirect>
  );
}
