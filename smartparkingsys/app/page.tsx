export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-sm backdrop-blur sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
          Smart Parking
        </p>
        <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          One parking platform with QR ticketing, live occupancy, entry
          management, exit billing, and secure sign-in.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Sign in to unlock the pages available to your stored account role, or
          register a new account to get started.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <a
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
            href="/login"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              /login
            </p>
            <h3 className="mt-3 text-xl font-bold text-slate-950">
              Sign in
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Access the platform with your saved role and token.
            </p>
          </a>
          <a
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
            href="/register"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              /register
            </p>
            <h3 className="mt-3 text-xl font-bold text-slate-950">
              Create account
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Register a new account before logging into the system.
            </p>
          </a>
          <a
            className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 transition hover:-translate-y-1 hover:shadow-md"
            href="/entry"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              /entry
            </p>
            <h3 className="mt-3 text-xl font-bold text-slate-950">
              Entry
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Issue tickets and assign parking slots after sign-in.
            </p>
          </a>
          <a
            className="rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5 transition hover:-translate-y-1 hover:shadow-md"
            href="/dashboard"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              /dashboard
            </p>
            <h3 className="mt-3 text-xl font-bold text-slate-950">
              Operations
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Monitor activity, occupancy, and billing once authorized.
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}
