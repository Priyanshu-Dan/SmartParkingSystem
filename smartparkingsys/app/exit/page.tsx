"use client";

import { toPng } from "html-to-image";
import { useEffect, useId, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  type Html5QrcodeCameraScanConfig,
  type QrcodeSuccessCallback,
} from "html5-qrcode";
import { RouteGuard } from "@/components/RouteGuard";
import { getStoredToken } from "@/lib/auth-client";
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

type ScannerBoxDimensions = {
  width: number;
  height: number;
};

const SCANNER_FPS = 18;
const SCANNER_ASPECT_RATIO = 1;
const SCANNER_TARGET_BOX_SIZE = 280;

function extractTicketId(rawValue: string) {
  const trimmedValue = rawValue.trim();

  try {
    const parsedValue = JSON.parse(trimmedValue) as { ticketId?: string };
    return parsedValue.ticketId ?? trimmedValue;
  } catch {
    return trimmedValue;
  }
}

function getScannerBoxSize(
  viewfinderWidth: number,
  viewfinderHeight: number,
): ScannerBoxDimensions {
  const frameSize = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) - 32);
  const clampedSize = Math.max(180, Math.min(SCANNER_TARGET_BOX_SIZE, frameSize));

  return {
    width: clampedSize,
    height: clampedSize,
  };
}

function createScannerConfig(
  videoConstraints: MediaTrackConstraints,
): Html5QrcodeCameraScanConfig {
  return {
    fps: SCANNER_FPS,
    qrbox: getScannerBoxSize,
    aspectRatio: SCANNER_ASPECT_RATIO,
    videoConstraints,
  };
}

export default function ExitPage() {
  const scannerElementId = useId().replace(/:/g, "-");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerCleanupPromiseRef = useRef<Promise<void> | null>(null);
  const isScannerStartingRef = useRef(false);
  const hasProcessedScanRef = useRef(false);
  const isUnmountingRef = useRef(false);
  const receiptId = useId().replace(/:/g, "-");
  const [ticketIdInput, setTicketIdInput] = useState("");
  const [tickets, setTickets] = useState<ParkingTicket[]>(() => getParkingState().tickets);
  const [pricePerHour, setPricePerHour] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerLoading, setIsScannerLoading] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scannerMessage, setScannerMessage] = useState("");
  const [summary, setSummary] = useState<ExitSummary | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [configError, setConfigError] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

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
          throw new Error(data.error ?? "Unable to load the configured rate.");
        }

        setPricePerHour(data.pricePerHour);
        setConfigError("");
      } catch (configFetchError) {
        setConfigError(
          configFetchError instanceof Error
            ? configFetchError.message
            : "Unable to load the configured rate.",
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
      isUnmountingRef.current = true;

      void cleanupScanner(true);
    };
  }, []);

  function getOrCreateScanner() {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(scannerElementId);
    }

    return scannerRef.current;
  }

  async function cleanupScanner(clearScanner = false) {
    if (scannerCleanupPromiseRef.current) {
      await scannerCleanupPromiseRef.current;
      return;
    }

    const scanner = scannerRef.current;

    if (!scanner) {
      return;
    }

    const cleanupPromise = (async () => {
      try {
        const scannerState = scanner.getState();

        if (
          scannerState === Html5QrcodeScannerState.SCANNING ||
          scannerState === Html5QrcodeScannerState.PAUSED
        ) {
          await scanner.stop();
        }
      } catch (error) {
        console.log("Scanner stop error:", error);
      }

      if (clearScanner) {
        try {
          scanner.clear();
        } catch (error) {
          console.log("Scanner cleanup error:", error);

          if (!isUnmountingRef.current) {
            setScannerMessage(
              "Camera stopped, but the preview container could not be fully cleared.",
            );
          }
        }
      }

      hasProcessedScanRef.current = false;
      isScannerStartingRef.current = false;

      if (clearScanner && scannerRef.current === scanner) {
        scannerRef.current = null;
      }

      if (!isUnmountingRef.current) {
        setIsScannerActive(false);
        setIsScannerLoading(false);
      }
    })();

    scannerCleanupPromiseRef.current = cleanupPromise;

    try {
      await cleanupPromise;
    } finally {
      scannerCleanupPromiseRef.current = null;
    }
  }

  async function stopScanner() {
    await cleanupScanner();
  }

  async function startScannerWithPreferredCamera(
    scanner: Html5Qrcode,
    onScanSuccess: QrcodeSuccessCallback,
  ) {
    const startAttempts: Array<{
      label: "rear" | "default";
      config: Html5QrcodeCameraScanConfig;
    }> = [
      {
        label: "rear",
        config: createScannerConfig({
          facingMode: { exact: "environment" },
          aspectRatio: { ideal: SCANNER_ASPECT_RATIO },
          frameRate: { ideal: SCANNER_FPS, max: 20 },
        }),
      },
      {
        label: "rear",
        config: createScannerConfig({
          facingMode: { ideal: "environment" },
          aspectRatio: { ideal: SCANNER_ASPECT_RATIO },
          frameRate: { ideal: SCANNER_FPS, max: 20 },
        }),
      },
      {
        label: "default",
        config: createScannerConfig({
          aspectRatio: { ideal: SCANNER_ASPECT_RATIO },
          frameRate: { ideal: SCANNER_FPS, max: 20 },
        }),
      },
    ];

    let lastError: unknown;

    for (const attempt of startAttempts) {
      try {
        await scanner.start(
          { facingMode: "environment" },
          attempt.config,
          onScanSuccess,
          () => undefined,
        );
        return attempt.label;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }

  async function startScanner() {
    if (
      isScannerStartingRef.current ||
      scannerCleanupPromiseRef.current ||
      isScannerLoading ||
      isScannerActive
    ) {
      return;
    }

    const existingScanner = scannerRef.current;

    if (existingScanner) {
      try {
        const scannerState = existingScanner.getState();

        if (
          scannerState === Html5QrcodeScannerState.SCANNING ||
          scannerState === Html5QrcodeScannerState.PAUSED
        ) {
          return;
        }
      } catch (error) {
        console.log("Scanner state read error:", error);
      }
    }

    isScannerStartingRef.current = true;
    hasProcessedScanRef.current = false;

    setError("");
    setMessage("");
    setScannerMessage("Starting camera and looking for the best lens...");
    setIsScannerLoading(true);

    try {
      const scanner = getOrCreateScanner();

      const onScanSuccess: QrcodeSuccessCallback = async (decodedText) => {
        if (hasProcessedScanRef.current) {
          return;
        }

        hasProcessedScanRef.current = true;

        const parsedTicketId = extractTicketId(decodedText);

        setError("");
        setMessage("");
        setTicketIdInput(parsedTicketId);
        setScannerMessage(`QR detected instantly. Ticket ${parsedTicketId} is ready to process.`);
        setIsScannerActive(false);
        await stopScanner();
      };

      const activeCamera = await startScannerWithPreferredCamera(
        scanner,
        onScanSuccess,
      );

      setIsScannerActive(true);
      setIsScannerLoading(false);
      setScannerMessage(
        activeCamera === "default"
          ? "Scanner is live on the available camera. Hold the full QR inside the square frame."
          : "Rear camera is live. Hold the full QR inside the square frame for the fastest scan.",
      );
    } catch {
      await cleanupScanner(true);
      setScannerMessage("");
      setError(
        "Camera access was blocked or is unavailable. You can still paste the QR payload or enter the ticket ID manually.",
      );
    } finally {
      isScannerStartingRef.current = false;
    }
  }

  async function handleProcessExit() {
    const parsedTicketId = extractTicketId(ticketIdInput);

    if (!parsedTicketId) {
      setError("Scan a QR code or enter a ticket ID before processing exit.");
      return;
    }

    if (pricePerHour === null) {
      setError("The current hourly rate is still loading. Please try again.");
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
    const price = duration * pricePerHour;
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
      pricePerHour,
      price,
      slotNumber: ticket.slotNumber,
      ticketId: ticket.ticketId,
    });
    setMessage(`Exit processed for ticket ${parsedTicketId}.`);
    setTicketIdInput("");
    setIsSubmitting(false);
  }

  async function downloadReceipt() {
    const node = document.getElementById(receiptId);

    if (!node || !summary) {
      setReceiptError("Unable to find the receipt to download.");
      return;
    }

    try {
      setIsDownloadingReceipt(true);
      setReceiptError("");

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `parking-receipt-${summary.ticketId}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setReceiptError("Unable to download the receipt right now.");
    } finally {
      setIsDownloadingReceipt(false);
    }
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
            Scan tickets and calculate the bill
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Scan the QR with the webcam, paste the QR JSON payload, or enter the
            ticket ID manually. Billing uses the live hourly rate configured by
            the admin dashboard.
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

              <div className="relative mt-6">
                <div
                  id={scannerElementId}
                  className="min-h-80 overflow-hidden rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50"
                />

                {!isScannerActive && !isScannerLoading ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-2xl bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
                      Place the QR inside the center square
                    </div>
                  </div>
                ) : null}

                <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl bg-slate-950/78 px-4 py-3 text-center text-xs font-medium leading-5 text-white backdrop-blur">
                  Hold steady for a moment after the QR enters the frame. The scanner
                  stops automatically as soon as a code is detected.
                </div>
              </div>

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

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Current rate:{" "}
                <span className="font-semibold text-slate-900">
                  {pricePerHour === null ? "Loading..." : `Rs. ${pricePerHour}/hour`}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Billing is calculated as rounded-up parking hours multiplied by
                the configured hourly rate.
              </div>

              {configError ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {configError}
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
                <div className="mt-6 space-y-4">
                  <div
                    id={receiptId}
                    className="rounded-3xl bg-slate-50 p-6"
                  >
                    <div className="border-b border-slate-200 pb-4 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Smart Parking System
                      </p>
                      <h3 className="mt-3 text-2xl font-bold text-slate-950">
                        Parking Receipt
                      </h3>
                    </div>

                    <dl className="mt-5 space-y-3 text-sm text-slate-600">
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

                  {receiptError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {receiptError}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void downloadReceipt()}
                    disabled={isDownloadingReceipt}
                    className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-amber-200"
                  >
                    {isDownloadingReceipt ? "Downloading receipt..." : "Download Receipt"}
                  </button>
                </div>
              ) : (
                <div className="mt-6 flex min-h-72 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
                  Scan a ticket or enter an ID to generate the final bill with
                  the configured hourly rate.
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
