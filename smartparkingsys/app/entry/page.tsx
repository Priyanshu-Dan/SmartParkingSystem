"use client";

import { useEffect, useState } from "react";
import { ParkingGrid } from "@/components/ParkingGrid";
import { ParkingTicket as ParkingTicketComponent } from "@/components/ParkingTicket";
import { RouteGuard } from "@/components/RouteGuard";
import { getStoredToken } from "@/lib/auth-client";
import {
  type ParkingSlot,
  type ParkingTicket as ParkingTicketType,
  findFirstFreeSlot,
  formatDateTime,
} from "@/lib/mockParking";

type LiveParkingSlot = ParkingSlot & {
  _id: string;
};

export default function EntryPage() {
  const [slots, setSlots] = useState<LiveParkingSlot[]>([]);
  const [selectedSlotNumber, setSelectedSlotNumber] = useState<number | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [issuedTicket, setIssuedTicket] = useState<ParkingTicketType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pricePerHour, setPricePerHour] = useState<number | null>(null);
  const [configError, setConfigError] = useState("");
  const [slotsError, setSlotsError] = useState("");

  const selectedSlot =
    slots.find((slot) => slot.slotNumber === selectedSlotNumber) ?? null;

  async function fetchSlots() {
    try {
      const response = await fetch("/api/slots", {
        cache: "no-store",
      });

      const data = (await response.json()) as
        | LiveParkingSlot[]
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
          throw new Error(data.error ?? "Unable to load pricing.");
        }

        setPricePerHour(data.pricePerHour);
        setConfigError("");
      } catch (configFetchError) {
        setConfigError(
          configFetchError instanceof Error
            ? configFetchError.message
            : "Unable to load the current parking rate.",
        );
      }
    }

    void fetchConfig();
    window.addEventListener("system-config-updated", fetchConfig);

    return () => {
      window.removeEventListener("system-config-updated", fetchConfig);
    };
  }, []);

  useEffect(() => {
    void fetchSlots();

    const intervalId = window.setInterval(() => {
      void fetchSlots();
    }, 5000);

    const handleFocus = () => {
      void fetchSlots();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  async function handleParkVehicle() {
    const token = getStoredToken();

    if (!vehicleNumber.trim()) {
      setError("Enter a vehicle number before assigning a slot.");
      return;
    }

    if (!selectedSlot) {
      setError("Select a free parking slot to continue.");
      return;
    }

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");
    setIssuedTicket(null);

    try {
      const response = await fetch("/api/entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleNumber,
          slotId: selectedSlot._id,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        slotNumber?: number;
        ticketId?: string;
      };

      if (
        !response.ok ||
        typeof data.ticketId !== "string" ||
        typeof data.slotNumber !== "number"
      ) {
        throw new Error(data.error ?? "Unable to create a parking entry.");
      }

      const entryTime = new Date().toISOString();

      setIssuedTicket({
        ticketId: data.ticketId,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        slotNumber: data.slotNumber,
        entryTime,
        exitTime: null,
        price: 0,
        status: "ACTIVE",
      });
      setVehicleNumber("");
      setSelectedSlotNumber(null);
      setMessage(`Parking confirmed for slot P-${data.slotNumber}.`);
      await fetchSlots();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create a parking entry.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAutoAssign() {
    const freeSlot = findFirstFreeSlot(slots);

    if (!freeSlot) {
      setError("Parking is currently full. No free slots are available.");
      return;
    }

    setError("");
    setSelectedSlotNumber(freeSlot.slotNumber);
  }

  const freeSlots = slots.filter((slot) => !slot.isOccupied).length;

  return (
    <RouteGuard>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
          Entry Gate
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              Park a vehicle and issue a QR ticket
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Select any free bay from the grid, enter the vehicle number, and
              generate a mock QR ticket for the driver.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {pricePerHour === null ? "Loading current rate..." : `Rate: Rs. ${pricePerHour}/hr`}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Parking slot selection
            </h2>
            <div className="flex gap-3 text-xs font-medium text-slate-600">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                Green: Free
              </span>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">
                Red: Occupied
              </span>
            </div>
          </div>

          <div className="mt-6">
            <ParkingGrid
              slots={slots}
              selectedSlotNumber={selectedSlotNumber}
              onSelectSlot={(slot) => setSelectedSlotNumber(slot.slotNumber)}
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAutoAssign}
              disabled={!freeSlots}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Auto-assign free slot
            </button>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              Tap any green slot to reserve it manually.
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900">
            Vehicle details
          </h2>

          <label className="mt-6 block text-sm font-medium text-slate-700">
            Vehicle Number
          </label>
          <input
            value={vehicleNumber}
            onChange={(event) => setVehicleNumber(event.target.value)}
            placeholder="e.g. MH12AB1234"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
          />

          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Selected slot:{" "}
            <span className="font-semibold text-slate-900">
              {selectedSlot ? `P-${selectedSlot.slotNumber}` : "None"}
            </span>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            Current rate:{" "}
            <span className="font-semibold text-slate-900">
              {pricePerHour === null ? "Loading..." : `Rs. ${pricePerHour}/hour`}
            </span>
          </div>

          {configError ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {configError}
            </div>
          ) : null}

          {slotsError ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {slotsError}
            </div>
          ) : null}

          {selectedSlot ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Slot P-{selectedSlot.slotNumber} is reserved in this mock flow
              until you confirm parking below.
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleParkVehicle}
            disabled={isSubmitting}
            className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Parking vehicle..." : "Park Vehicle"}
          </button>

          {issuedTicket ? (
            <div className="mt-8 space-y-5">
              <div className="rounded-3xl bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-900">
                  Ticket created
                </h3>
                <dl className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4">
                    <dt>Ticket ID</dt>
                    <dd className="font-semibold text-slate-900">
                      {issuedTicket.ticketId}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt>Slot Number</dt>
                    <dd className="font-semibold text-slate-900">
                      P-{issuedTicket.slotNumber}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt>Entry Time</dt>
                    <dd className="font-semibold text-slate-900">
                      {formatDateTime(issuedTicket.entryTime)}
                    </dd>
                  </div>
                </dl>
              </div>

              <ParkingTicketComponent
                ticketId={issuedTicket.ticketId}
                vehicleNumber={issuedTicket.vehicleNumber}
                slotNumber={issuedTicket.slotNumber}
                entryTime={issuedTicket.entryTime}
                pricePerHour={pricePerHour}
              />
            </div>
          ) : null}
        </div>
      </section>
      </main>
    </RouteGuard>
  );
}
