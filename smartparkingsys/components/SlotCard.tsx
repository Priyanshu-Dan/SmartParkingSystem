"use client";

import type { ParkingSlot } from "@/lib/parking";

type SlotCardProps = {
  slot: ParkingSlot;
  isSelected: boolean;
  onClick?: (slot: ParkingSlot) => void;
};

export function SlotCard({ slot, isSelected, onClick }: SlotCardProps) {
  const isDisabled = slot.isOccupied;

  return (
    <button
      type="button"
      onClick={() => !isDisabled && onClick?.(slot)}
      disabled={isDisabled}
      className={`group flex aspect-square flex-col items-center justify-center rounded-2xl border px-3 py-4 text-center shadow-sm transition duration-200 ${
        slot.isOccupied
          ? "cursor-not-allowed border-rose-300 bg-rose-100 text-rose-700"
          : isSelected
            ? "border-amber-500 bg-amber-100 text-amber-900 ring-2 ring-amber-400"
            : "border-emerald-300 bg-emerald-100 text-emerald-800 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
      }`}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.24em]">
        {slot.isOccupied ? "Occupied" : isSelected ? "Selected" : "Free"}
      </span>
      <span className="mt-3 text-2xl font-bold">P-{slot.slotNumber}</span>
      <span className="mt-2 text-xs opacity-75">
        Row {slot.row}, Col {slot.col}
      </span>
    </button>
  );
}
