"use client";

import type { ParkingSlot } from "@/lib/mockParking";
import { SlotCard } from "./SlotCard";

type ParkingGridProps = {
  slots: ParkingSlot[];
  selectedSlotNumber?: number | null;
  onSelectSlot?: (slot: ParkingSlot) => void;
};

export function ParkingGrid({
  slots,
  selectedSlotNumber,
  onSelectSlot,
}: ParkingGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
      {slots.map((slot) => (
        <SlotCard
          key={slot.slotNumber}
          slot={slot}
          isSelected={selectedSlotNumber === slot.slotNumber}
          onClick={onSelectSlot}
        />
      ))}
    </div>
  );
}
