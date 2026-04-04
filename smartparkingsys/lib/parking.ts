export type ParkingSlot = {
  slotNumber: number;
  isOccupied: boolean;
  row: number;
  col: number;
};

export type TicketStatus = "ACTIVE" | "COMPLETED";

export type ParkingTicket = {
  ticketId: string;
  vehicleNumber: string;
  slotNumber: number;
  entryTime: string;
  exitTime: string | null;
  price: number;
  status: TicketStatus;
};

export function formatDateTime(value: string | null) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function findFirstFreeSlot<T extends ParkingSlot>(slots: T[]) {
  return slots.find((slot) => !slot.isOccupied) ?? null;
}
