"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  type QrcodeSuccessCallback,
} from "html5-qrcode";
import { RouteGuard } from "@/components/RouteGuard";
import {
  calculateDurationHours,
  findTicketById,
  formatCurrency,
  formatDateTime,
  getParkingState,
  mockDelay,
  saveParkingState,
  type ParkingTicket,
} from "@/lib/mockParking";

type ExitSummary = {
  vehicleNumber: string;
  entryTime: string;
  exitTime: string;
  duration: number;
  pricePerHour: number;
  price: number;
  slotNumber: number;
  ticketId: string;
};

function extractTicketId(rawValue: string) {
  const trimmedValue = rawValue.trim();

  try {
    const parsedValue = JSON.parse(trimmedValue) as { ticketId?: string };
    return parsedValue.ticketId ?? trimmedValue;
  } catch {
    return trimmedValue;
  }
}

export default function ExitPage() {
  const scannerElementId = useId().replace(/:/g, "-");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [ticketIdInput, setTicketIdInput] = useState("");
  const [tickets, setTickets] = useState<ParkingTicket[]>(() => getParkingState().tickets);
  const [pricePerHour, setPricePerHour] = useState("100");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerLoading, setIsScannerLoading] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scannerMessage, setScannerMessage] = useState("");
  const [summary, setSummary] = useState<ExitSummary | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const syncTickets = () => {
      setTickets(getParkingState().tickets);
    };

    window.addEventListener("storage", syncTickets);
    window.addEventListener("parking-state-updated", syncTickets);

    return () => {
      window.removeEventListener("storage", syncTickets);
      window.removeEventListener("parking-state-updated", syncTickets);
    };
  }, []);

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (scanner && scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        void scanner.stop().catch(() => undefined);
      }
      if (scanner) {
        void scanner.clear().catch(() => undefined);
      }
    };
  }, []);

  async function stopScanner() {
    const scanner = scannerRef.current;

    if (!scanner) {
      return;
    }

    try {
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        await scanner.stop();
      }
      await scanner.clear();
    } catch {
      setScannerMessage(
        "Camera stopped, but the preview container could not be fully cleared.",
      );
    } finally {
      scannerRef.current = null;
      setIsScannerActive(false);
      setIsScannerLoading(false);
    }
  }

  async function startScanner() {
    if (isScannerLoading || isScannerActive) {
      return;
    }

    setError("");
    setMessage("");
    setScannerMessage("Requesting camera permission...");
    setIsScannerLoading(true);

    try {
      const scanner = new Html5Qrcode(scannerElementId);
      scannerRef.current = scanner;

      const onScanSuccess: QrcodeSuccessCallback = async (decodedText) => {
        const parsedTicketId = extractTicketId(decodedText);
        setTicketIdInput(parsedTicketId);
        setScannerMessage(`QR scanned successfully: ${parsedTicketId}`);
        await stopScanner();
      };

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1,
        },
        onScanSuccess,
        () => undefined,
      );

      setIsScannerActive(true);
      setIsScannerLoading(false);
      setScannerMessage("Scanner is live. Point the camera at the QR code.");
    } catch {
      setScannerMessage("");
      setError(
        "Camera access was blocked or is unavailable. You can still paste the QR payload or enter the ticket ID manually.",
      );
      setIsScannerLoading(false);
      setIsScannerActive(false);
      scannerRef.current = null;
    }
  }

  async function handleProcessExit() {
    const parsedTicketId = extractTicketId(ticketIdInput);
    const parsedPrice = Number(pricePerHour);

    if (!parsedTicketId) {
      setError("Scan a QR code or enter a ticket ID before processing exit.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("Enter a valid hourly rate before calculating the bill.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");
    setSummary(null);

    await mockDelay();

    const ticket = findTicketById(parsedTicketId);

    if (!ticket) {
      setError("No ticket was found for the scanned or entered ID.");
      setIsSubmitting(false);
      return;
    }

    if (ticket.status === "COMPLETED") {
      setError("This ticket has already been closed at the exit gate.");
      setIsSubmitting(false);
      return;
    }

    const exitTime = new Date().toISOString();
    const duration = calculateDurationHours(ticket.entryTime, exitTime);
    const price = duration * parsedPrice;
    const state = getParkingState();

    const updatedTickets = state.tickets.map((item) =>
      item.ticketId === parsedTicketId
        ? { ...item, exitTime, price, status: "COMPLETED" as const }
        : item,
    );

    const updatedSlots = state.slots.map((slot) =>
      slot.slotNumber === ticket.slotNumber
        ? { ...slot, isOccupied: false }
        : slot,
    );

    saveParkingState({
      slots: updatedSlots,
      tickets: updatedTickets,
    });

    setTickets(updatedTickets);
    setSummary({
      vehicleNumber: ticket.vehicleNumber,
      entryTime: ticket.entryTime,
      exitTime,
      duration,
      pricePerHour: parsedPrice,
      price,
      slotNumber: ticket.slotNumber,
      ticketId: ticket.ticketId,
    });
    setMessage(`Exit processed for ticket ${parsedTicketId}.`);
    setTicketIdInput("");
    setIsSubmitting(false);
  }

  const activeTickets = tickets.filter((ticket) => ticket.status === "ACTIVE");

  return (
    <RouteGuard requireAdmin>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Exit Gate
          </p>
          <h1 className="mt-4 text-3xl font-bold text-slate-950">
            Scan tickets, confirm pricing, and calculate the bill
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Scan the QR with the webcam, paste the QR JSON payload, or enter the
            ticket ID manually. The hourly rate remains editable before final
            checkout.
          </p>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    QR scanner
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Use the webcam first, or fall back to manual ticket entry.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={startScanner}
                    disabled={isScannerLoading || isScannerActive}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isScannerLoading
                      ? "Starting camera..."
                      : isScannerActive
                        ? "Scanner Active"
                        : "Start Scanner"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void stopScanner()}
                    disabled={!isScannerActive && !isScannerLoading}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Stop Scanner
                  </button>
                </div>
              </div>

              <div
                id={scannerElementId}
                className="mt-6 min-h-80 overflow-hidden rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50"
              />

              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {scannerMessage ||
                  "Camera inactive. Start the scanner to detect QR tickets."}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-slate-900">
                Manual fallback and pricing
              </h2>

              <label className="mt-6 block text-sm font-medium text-slate-700">
                Ticket ID or QR payload
              </label>
              <input
                value={ticketIdInput}
                onChange={(event) => setTicketIdInput(event.target.value)}
                placeholder='e.g. TKT-A102 or {"ticketId":"TKT-A102"}'
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white"
              />

              <label className="mt-5 block text-sm font-medium text-slate-700">
                Price per hour
              </label>
              <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <span className="text-sm font-semibold text-slate-500">Rs.</span>
                <input
                  value={pricePerHour}
                  onChange={(event) => setPricePerHour(event.target.value)}
                  inputMode="numeric"
                  placeholder="100"
                  className="w-full bg-transparent px-3 py-3 text-slate-900 outline-none"
                />
                <span className="text-sm text-slate-500">/ hour</span>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Billing is calculated as rounded-up parking hours multiplied by
                the selected hourly rate.
              </div>

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
                onClick={handleProcessExit}
                disabled={isSubmitting}
                className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Calculating bill..." : "Process Exit"}
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-slate-900">
                Billing summary
              </h2>

              {summary ? (
                <div className="mt-6 rounded-3xl bg-slate-50 p-6">
                  <dl className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-4">
                      <dt>Ticket ID</dt>
                      <dd className="font-semibold text-slate-900">
                        {summary.ticketId}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt>Vehicle Number</dt>
                      <dd className="font-semibold text-slate-900">
                        {summary.vehicleNumber}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt>Slot Number</dt>
                      <dd className="font-semibold text-slate-900">
                        P-{summary.slotNumber}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt>Entry Time</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatDateTime(summary.entryTime)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt>Exit Time</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatDateTime(summary.exitTime)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt>Duration</dt>
                      <dd className="font-semibold text-slate-900">
                        {summary.duration} hour{summary.duration > 1 ? "s" : ""}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt>Rate Applied</dt>
                      <dd className="font-semibold text-slate-900">
                        {formatCurrency(summary.pricePerHour)} / hour
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
                      <dt>Total Price</dt>
                      <dd className="text-xl font-bold text-slate-950">
                        {formatCurrency(summary.price)}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="mt-6 flex min-h-72 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
                  Scan a ticket or enter an ID, then confirm the hourly rate to
                  generate the final bill.
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-slate-900">
                Active mock tickets
              </h2>
              <div className="mt-5 space-y-3">
                {activeTickets.length ? (
                  activeTickets.map((ticket) => (
                    <button
                      key={ticket.ticketId}
                      type="button"
                      onClick={() => setTicketIdInput(ticket.ticketId)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-amber-300 hover:bg-amber-50"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold text-slate-900">
                          {ticket.ticketId}
                        </p>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          ACTIVE
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {ticket.vehicleNumber} | P-{ticket.slotNumber}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Entered at {formatDateTime(ticket.entryTime)}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    No active tickets right now.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </RouteGuard>
  );
}
