"use client";

import { useEffect, useState } from "react";
import { ParkingGrid } from "@/components/ParkingGrid";
import { RouteGuard } from "@/components/RouteGuard";
import { StatsCard } from "@/components/StatsCard";
import { getStoredToken } from "@/lib/auth-client";
import {
  type ParkingSlot,
  type ParkingTicket,
  formatDateTime,
} from "@/lib/mockParking";

export default function DashboardPage() {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [tickets, setTickets] = useState<ParkingTicket[]>([]);
  const [pricePerHour, setPricePerHour] = useState<number | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [configMessage, setConfigMessage] = useState("");
  const [configError, setConfigError] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [ticketsError, setTicketsError] = useState("");

  async function fetchSlots() {
    try {
      const response = await fetch("/api/slots", {
        cache: "no-store",
      });

      const data = (await response.json()) as
        | ParkingSlot[]
        | { error?: string };

      if (!response.ok || !Array.isArray(data)) {
        throw new Error(
          !Array.isArray(data) && data.error
            ? data.error
            : "Unable to load parking slots.",
        );
      }

      setSlots(data);
      setSlotsError("");
    } catch (slotsFetchError) {
      setSlotsError(
        slotsFetchError instanceof Error
          ? slotsFetchError.message
          : "Unable to load parking slots.",
      );
    }
  }

  async function fetchTickets() {
    const token = getStoredToken();

    if (!token) {
      return;
    }

    try {
      const response = await fetch("/api/tickets", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json()) as
        | ParkingTicket[]
        | { error?: string };

      if (!response.ok || !Array.isArray(data)) {
        throw new Error(
          !Array.isArray(data) && data.error
            ? data.error
            : "Unable to load ticket activity.",
        );
      }

      setTickets(data);
      setTicketsError("");
    } catch (ticketsFetchError) {
      setTicketsError(
        ticketsFetchError instanceof Error
          ? ticketsFetchError.message
          : "Unable to load ticket activity.",
      );
    }
  }

  useEffect(() => {
    async function fetchConfig() {
      const token = getStoredToken();

      if (!token) {
        return;
      }

      try {
        const response = await fetch("/api/config", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = (await response.json()) as {
          error?: string;
          pricePerHour?: number;
        };

        if (!response.ok || typeof data.pricePerHour !== "number") {
          throw new Error(data.error ?? "Unable to load system pricing.");
        }

        setPricePerHour(data.pricePerHour);
        setPriceInput(String(data.pricePerHour));
        setConfigError("");
      } catch (configFetchError) {
        setConfigError(
          configFetchError instanceof Error
            ? configFetchError.message
            : "Unable to load system pricing.",
        );
      }
    }

    void fetchConfig();
  }, []);

  useEffect(() => {
    void fetchSlots();
    void fetchTickets();

    const refreshDashboard = () => {
      void fetchSlots();
      void fetchTickets();
    };

    const intervalId = window.setInterval(() => {
      refreshDashboard();
    }, 5000);

    const handleFocus = () => {
      refreshDashboard();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const totalSlots = slots.length;
  const occupiedSlots = slots.filter((slot) => slot.isOccupied).length;
  const freeSlots = totalSlots - occupiedSlots;
  const activeTickets = tickets.filter((ticket) => ticket.status === "ACTIVE");
  const occupancyRate = totalSlots
    ? Math.round((occupiedSlots / totalSlots) * 100)
    : 0;

  async function handleUpdatePrice() {
    const token = getStoredToken();
    const nextPrice = Number(priceInput);

    if (!token) {
      setConfigError("Your session has expired. Please log in again.");
      return;
    }

    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      setConfigError("Enter a valid price per hour before updating.");
      return;
    }

    setIsUpdatingPrice(true);
    setConfigError("");
    setConfigMessage("");

    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pricePerHour: nextPrice }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        pricePerHour?: number;
      };

      if (!response.ok || typeof data.pricePerHour !== "number") {
        throw new Error(data.error ?? "Unable to update pricing.");
      }

      setPricePerHour(data.pricePerHour);
      setPriceInput(String(data.pricePerHour));
      setConfigMessage(data.message ?? "Price updated successfully.");
      window.dispatchEvent(new Event("system-config-updated"));
    } catch (updateError) {
      setConfigError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update pricing.",
      );
    } finally {
      setIsUpdatingPrice(false);
    }
  }

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

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Pricing control
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Set the live hourly parking rate used across entry tickets and exit billing.
            </p>
            <p className="mt-3 text-sm text-slate-700">
              Current rate:{" "}
              <span className="font-semibold text-slate-900">
                {pricePerHour === null ? "Loading..." : `Rs. ${pricePerHour}/hour`}
              </span>
            </p>
          </div>

          <div className="w-full max-w-md">
            <label className="block text-sm font-medium text-slate-700">
              Set Price per Hour (Rs.)
            </label>
            <div className="mt-2 flex gap-3">
              <input
                value={priceInput}
                onChange={(event) => setPriceInput(event.target.value)}
                inputMode="numeric"
                placeholder="Enter hourly rate"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => void handleUpdatePrice()}
                disabled={isUpdatingPrice}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isUpdatingPrice ? "Updating..." : "Update Price"}
              </button>
            </div>

            {configError ? (
              <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {configError}
              </div>
            ) : null}

            {slotsError ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {slotsError}
              </div>
            ) : null}

            {ticketsError ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {ticketsError}
              </div>
            ) : null}

            {configMessage ? (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {configMessage}
              </div>
            ) : null}
          </div>
        </div>
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

        <div className="h-full rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-full flex-col">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Ticket activity
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-inner">
              <div className="overflow-x-auto rounded-2xl bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="sticky top-0 z-10 bg-white text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Vehicle Number</th>
                    <th className="px-4 py-3 font-semibold">Slot Number</th>
                    <th className="px-4 py-3 font-semibold">Entry Time</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {[...tickets].sort((a, b) => b.entryTime.localeCompare(a.entryTime)).length ? (
                    [...tickets]
                      .sort((a, b) => b.entryTime.localeCompare(a.entryTime))
                      .map((ticket) => (
                    <tr
                      key={ticket.ticketId}
                      className="transition hover:bg-slate-50"
                    >
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
                      ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No tickets available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
    </RouteGuard>
  );
}
