import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, type AuthenticatedRequest } from "@/lib/auth";
import Ticket from "@/models/Ticket";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authResult = requireAdmin(request as AuthenticatedRequest);

    if (authResult.error) {
      return authResult.error;
    }

    const tickets = await Ticket.find({})
      .populate("slotId", "slotNumber")
      .sort({ entryTime: -1 })
      .lean();

    const normalizedTickets = tickets.map((ticket) => ({
      ticketId: String(ticket._id),
      vehicleNumber: ticket.vehicleNumber,
      slotNumber:
        ticket.slotId && typeof ticket.slotId === "object" && "slotNumber" in ticket.slotId
          ? Number(ticket.slotId.slotNumber)
          : 0,
      entryTime: new Date(ticket.entryTime).toISOString(),
      exitTime: ticket.exitTime ? new Date(ticket.exitTime).toISOString() : null,
      price: ticket.price,
      status: ticket.status,
    }));

    return NextResponse.json(normalizedTickets, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 },
    );
  }
}
