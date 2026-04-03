"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearAuthSession,
  getStoredRole,
  getStoredToken,
  type ClientRole,
} from "@/lib/auth-client";

type AuthState = {
  isLoggedIn: boolean;
  role: ClientRole | null;
};

function readAuthState(): AuthState {
  return {
    isLoggedIn: Boolean(getStoredToken()),
    role: getStoredRole(),
  };
}

function navLinkClass(isActive: boolean) {
  return `rounded-full border px-4 py-2 text-sm font-medium transition ${
    isActive
      ? "border-slate-950 bg-slate-950 text-white"
      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950"
  }`;
}

export function AuthNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    role: null,
  });

  useEffect(() => {
    const syncAuthState = () => {
      setAuthState(readAuthState());
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("auth-state-changed", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("auth-state-changed", syncAuthState);
    };
  }, []);

  function handleLogout() {
    clearAuthSession();
    router.push("/login");
  }

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {!authState.isLoggedIn ? (
        <>
          <Link href="/login" className={navLinkClass(pathname === "/login")}>
            Login
          </Link>
          <Link
            href="/register"
            className={navLinkClass(pathname === "/register")}
          >
            Register
          </Link>
        </>
      ) : (
        <>
          <Link href="/entry" className={navLinkClass(pathname === "/entry")}>
            Entry
          </Link>
          {authState.role === "admin" ? (
            <>
              <Link href="/exit" className={navLinkClass(pathname === "/exit")}>
                Exit
              </Link>
              <Link
                href="/dashboard"
                className={navLinkClass(pathname === "/dashboard")}
              >
                Dashboard
              </Link>
            </>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
          >
            Logout
          </button>
        </>
      )}
    </nav>
  );
}
