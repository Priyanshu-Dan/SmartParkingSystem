"use client";

import { useEffect, useState } from "react";
import { ParkingGrid } from "@/components/ParkingGrid";
import { RouteGuard } from "@/components/RouteGuard";
import { StatsCard } from "@/components/StatsCard";
import {
  type ParkingSlot,
  type ParkingTicket,
  formatDateTime,
  getParkingState,
} from "@/lib/mockParking";

export default function DashboardPage() {
  const [slots, setSlots] = useState<ParkingSlot[]>(() => getParkingState().slots);
  const [tickets, setTickets] = useState<ParkingTicket[]>(() => getParkingState().tickets);

  useEffect(() => {
    const syncDashboard = () => {
      const state = getParkingState();
      setSlots(state.slots);
      setTickets(state.tickets);
    };

    window.addEventListener("storage", syncDashboard);
    window.addEventListener("parking-state-updated", syncDashboard);

    return () => {
      window.removeEventListener("storage", syncDashboard);
      window.removeEventListener("parking-state-updated", syncDashboard);
    };
  }, []);

  const totalSlots = slots.length;
  const occupiedSlots = slots.filter((slot) => slot.isOccupied).length;
  const freeSlots = totalSlots - occupiedSlots;
  const activeTickets = tickets.filter((ticket) => ticket.status === "ACTIVE");
  const occupancyRate = totalSlots
    ? Math.round((occupiedSlots / totalSlots) * 100)
    : 0;

  return (
    <RouteGuard requireAdmin>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
          Dashboard
        </p>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          Smart parking system overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Monitor slot availability, inspect active tickets, and review the
          current parking layout from one place.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total Slots" value={totalSlots} accent="bg-slate-900" />
        <StatsCard
          label="Occupied Slots"
          value={occupiedSlots}
          accent="bg-rose-500"
        />
        <StatsCard label="Free Slots" value={freeSlots} accent="bg-emerald-500" />
        <StatsCard
          label="Active Tickets"
          value={activeTickets.length}
          accent="bg-sky-500"
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Live parking grid
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Occupancy is currently at {occupancyRate}% of lot capacity.
              </p>
            </div>
            <div className="flex gap-3 text-xs font-medium text-slate-600">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                Free
              </span>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">
                Occupied
              </span>
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>

          <div className="mt-6">
            <ParkingGrid slots={slots} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900">
            Ticket activity
          </h2>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Vehicle Number</th>
                    <th className="px-4 py-3 font-semibold">Slot Number</th>
                    <th className="px-4 py-3 font-semibold">Entry Time</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {[...tickets].sort((a, b) => b.entryTime.localeCompare(a.entryTime)).map((ticket) => (
                    <tr key={ticket.ticketId}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {ticket.vehicleNumber}
                      </td>
                      <td className="px-4 py-3">P-{ticket.slotNumber}</td>
                      <td className="px-4 py-3">
                        {formatDateTime(ticket.entryTime)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            ticket.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      </main>
    </RouteGuard>
  );
}
