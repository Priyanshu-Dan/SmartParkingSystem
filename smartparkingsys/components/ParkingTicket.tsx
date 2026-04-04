"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { formatDateTime } from "@/lib/parking";

type ParkingTicketProps = {
  ticketId: string;
  vehicleNumber: string;
  slotNumber: number;
  entryTime: string;
  pricePerHour: number | null;
};

export function ParkingTicket({
  ticketId,
  vehicleNumber,
  slotNumber,
  entryTime,
  pricePerHour,
}: ParkingTicketProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function generateQRCode() {
      try {
        setIsGenerating(true);
        setError("");

        const value = JSON.stringify({ ticketId });
        const dataUrl = await QRCode.toDataURL(value, {
          margin: 2,
          width: 240,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });

        if (isMounted) {
          setQrCodeUrl(dataUrl);
        }
      } catch {
        if (isMounted) {
          setError("Unable to generate the QR code right now.");
        }
      } finally {
        if (isMounted) {
          setIsGenerating(false);
        }
      }
    }

    generateQRCode();

    return () => {
      isMounted = false;
    };
  }, [ticketId]);

  async function downloadTicket() {
    const node = document.getElementById("ticket");

    if (!node) {
      setError("Unable to find the ticket to download.");
      return;
    }

    try {
      setIsDownloading(true);
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = "parking-ticket.png";
      link.href = dataUrl;
      link.click();
    } catch {
      setError("Unable to download the ticket right now.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        id="ticket"
        className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-md"
      >
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            Smart Parking System
          </p>
          <h3 className="mt-3 text-2xl font-bold text-slate-950">
            Parking Ticket
          </h3>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex items-center justify-between gap-4">
            <span>Vehicle Number</span>
            <span className="font-semibold text-slate-900">{vehicleNumber}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Slot Number</span>
            <span className="font-semibold text-slate-900">P-{slotNumber}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Entry Time</span>
            <span className="text-right font-semibold text-slate-900">
              {formatDateTime(entryTime)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Rate</span>
            <span className="font-semibold text-slate-900">
              {pricePerHour === null ? "Loading..." : `Rs. ${pricePerHour}/hour`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Ticket ID</span>
            <span className="font-semibold text-slate-900">{ticketId}</span>
          </div>
        </div>

        <div className="mt-6">
          {isGenerating ? (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
              Generating QR code...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : (
            <Image
              src={qrCodeUrl}
              alt={`QR code for ticket ${ticketId}`}
              width={220}
              height={220}
              className="mx-auto mt-4 rounded-2xl"
              unoptimized
            />
          )}
        </div>
      </div>

      {error && !isGenerating ? null : (
        <button
          type="button"
          onClick={downloadTicket}
          disabled={isGenerating || isDownloading}
          className="mx-auto block rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isDownloading ? "Downloading..." : "Download Ticket"}
        </button>
      )}
    </div>
  );
}
