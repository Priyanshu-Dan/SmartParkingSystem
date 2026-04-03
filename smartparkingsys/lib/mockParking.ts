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

type ParkingState = {
  slots: ParkingSlot[];
  tickets: ParkingTicket[];
};

const STORAGE_KEY = "smart-parking-system-state";
const GRID_COLUMNS = 5;
const TOTAL_SLOTS = 25;

export function createInitialSlots(): ParkingSlot[] {
  const occupiedSlots = new Set([2, 7, 11, 18]);

  return Array.from({ length: TOTAL_SLOTS }, (_, index) => {
    const slotNumber = index + 1;

    return {
      slotNumber,
      isOccupied: occupiedSlots.has(slotNumber),
      row: Math.floor(index / GRID_COLUMNS) + 1,
      col: (index % GRID_COLUMNS) + 1,
    };
  });
}

export function createInitialTickets(): ParkingTicket[] {
  const now = Date.now();

  return [
    {
      ticketId: "TKT-A102",
      vehicleNumber: "MH12AB1234",
      slotNumber: 2,
      entryTime: new Date(now - 1000 * 60 * 90).toISOString(),
      exitTime: null,
      price: 0,
      status: "ACTIVE",
    },
    {
      ticketId: "TKT-B245",
      vehicleNumber: "DL01CD9090",
      slotNumber: 7,
      entryTime: new Date(now - 1000 * 60 * 190).toISOString(),
      exitTime: null,
      price: 0,
      status: "ACTIVE",
    },
    {
      ticketId: "TKT-C876",
      vehicleNumber: "KA09EF7654",
      slotNumber: 11,
      entryTime: new Date(now - 1000 * 60 * 45).toISOString(),
      exitTime: null,
      price: 0,
      status: "ACTIVE",
    },
    {
      ticketId: "TKT-D331",
      vehicleNumber: "GJ05LM4321",
      slotNumber: 18,
      entryTime: new Date(now - 1000 * 60 * 20).toISOString(),
      exitTime: null,
      price: 0,
      status: "ACTIVE",
    },
    {
      ticketId: "TKT-Z999",
      vehicleNumber: "UP14XY1111",
      slotNumber: 15,
      entryTime: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
      exitTime: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
      price: 40,
      status: "COMPLETED",
    },
  ];
}

function createInitialState(): ParkingState {
  return {
    slots: createInitialSlots(),
    tickets: createInitialTickets(),
  };
}

export function getParkingState(): ParkingState {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  const savedState = window.localStorage.getItem(STORAGE_KEY);

  if (!savedState) {
    const initialState = createInitialState();
    saveParkingState(initialState);
    return initialState;
  }

  try {
    return JSON.parse(savedState) as ParkingState;
  } catch {
    const fallbackState = createInitialState();
    saveParkingState(fallbackState);
    return fallbackState;
  }
}

export function saveParkingState(state: ParkingState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("parking-state-updated"));
}

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

export function generateTicketId() {
  return `TKT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function getTicketPayload(ticketId: string) {
  return JSON.stringify({ ticketId });
}

export function calculateDurationHours(entryTime: string, exitTime: string) {
  const diffMs = new Date(exitTime).getTime() - new Date(entryTime).getTime();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
}

export function findTicketById(ticketId: string) {
  return getParkingState().tickets.find((ticket) => ticket.ticketId === ticketId);
}

export function findFirstFreeSlot(slots: ParkingSlot[]) {
  return slots.find((slot) => !slot.isOccupied) ?? null;
}

export async function mockDelay(duration = 700) {
  await new Promise((resolve) => setTimeout(resolve, duration));
}
