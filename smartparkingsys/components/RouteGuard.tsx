"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredRole, getStoredToken } from "@/lib/auth-client";

type RouteGuardProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

export function RouteGuard({
  children,
  requireAdmin = false,
}: RouteGuardProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [requireAdmin, router]);

  const token = isMounted ? getStoredToken() : null;
  const role = isMounted ? getStoredRole() : null;
  const isAllowed = Boolean(token) && (!requireAdmin || role === "admin");

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    if (!token) {
      router.replace("/login");
      return;
    }

    if (requireAdmin && role !== "admin") {
      router.replace("/entry");
    }
  }, [isMounted, requireAdmin, role, router, token]);

  if (!isMounted || !isAllowed) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          Checking your session...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

export function AuthRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [router]);

  const token = isMounted ? getStoredToken() : null;
  const role = isMounted ? getStoredRole() : null;

  useEffect(() => {
    if (!isMounted || !token) {
      return;
    }

    router.replace(role === "admin" ? "/dashboard" : "/entry");
  }, [isMounted, role, router, token]);

  if (!isMounted || token) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          Preparing authentication...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
