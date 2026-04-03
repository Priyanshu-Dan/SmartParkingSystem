import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Parking Management System",
  description: "Frontend-first smart parking management dashboard and ticket flow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_#fef3c7,_#f8fafc_45%,_#e0f2fe)] text-slate-950">
        <div className="flex min-h-full flex-col">
          <header className="border-b border-white/60 bg-white/70 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Smart Parking
                </p>
                <h1 className="mt-1 text-xl font-bold text-slate-950">
                  Management System
                </h1>
              </div>
              <nav className="flex flex-wrap gap-3 text-sm font-medium">
                <a
                  href="/entry"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  Entry
                </a>
                <a
                  href="/exit"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:border-amber-300 hover:text-amber-700"
                >
                  Exit
                </a>
                <a
                  href="/dashboard"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
                >
                  Dashboard
                </a>
              </nav>
            </div>
          </header>
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
