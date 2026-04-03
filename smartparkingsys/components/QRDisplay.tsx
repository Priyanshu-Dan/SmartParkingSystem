"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

type QRDisplayProps = {
  ticketId: string;
  vehicleNumber?: string;
  slotNumber?: number;
};

export function QRDisplay({
  ticketId,
  vehicleNumber,
  slotNumber,
}: QRDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState("");

  function handleDownload() {
    if (!qrCodeUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${ticketId}.png`;
    link.click();
  }

  useEffect(() => {
    let isMounted = true;

    async function generateQRCode() {
      try {
        setIsGenerating(true);
        setError("");

        const value = JSON.stringify({ ticketId });
        const dataUrl = await QRCode.toDataURL(value, {
          margin: 2,
          width: 280,
          color: {
            dark: "#0f172a",
            light: "#f8fafc",
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

  if (isGenerating) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Generating QR code...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <Image
        src={qrCodeUrl}
        alt={`QR code for ticket ${ticketId}`}
        className="mx-auto h-64 w-64 rounded-2xl"
        width={256}
        height={256}
        unoptimized
      />
      <p className="mt-4 text-center text-sm text-slate-500">
        Scan this code at the exit gate to complete checkout.
      </p>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <div className="flex items-center justify-between gap-3">
          <span>Ticket</span>
          <span className="font-semibold text-slate-900">{ticketId}</span>
        </div>
        {vehicleNumber ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Vehicle</span>
            <span className="font-semibold text-slate-900">{vehicleNumber}</span>
          </div>
        ) : null}
        {slotNumber ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Slot</span>
            <span className="font-semibold text-slate-900">P-{slotNumber}</span>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Download QR
      </button>
    </div>
  );
}
