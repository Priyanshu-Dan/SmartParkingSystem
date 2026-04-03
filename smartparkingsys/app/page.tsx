export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-sm backdrop-blur sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
          Frontend Demo
        </p>
        <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          A complete smart parking system simulating vehicle entry, QR-based ticketing, automated exit billing, and real-time lot monitoring through a unified UI
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Parking, but smarter — fully interactive.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <a
            className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6 transition hover:-translate-y-1 hover:shadow-md"
            href="/entry"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
              /entry
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">
              Assign parking slots
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Select a free slot, enter a vehicle number, and generate a QR
              ticket for arrival.
            </p>
          </a>
          <a
            className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6 transition hover:-translate-y-1 hover:shadow-md"
            href="/exit"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
              /exit
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">
              Process vehicle exits
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Simulate scanning a QR, compute the duration, and display the
              parking bill instantly.
            </p>
          </a>
          <a
            className="rounded-[1.75rem] border border-sky-200 bg-sky-50 p-6 transition hover:-translate-y-1 hover:shadow-md"
            href="/dashboard"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              /dashboard
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">
              Monitor the full lot
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review occupancy, active tickets, and the visual slot grid in one
              admin view.
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}
