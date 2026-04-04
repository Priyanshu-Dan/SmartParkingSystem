import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, type AuthenticatedRequest } from "@/lib/auth";
import { getSystemConfig } from "@/lib/system-config";
import ParkingSlot from "@/models/ParkingSlot";
import Ticket from "@/models/Ticket";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authResult = requireAdmin(request as AuthenticatedRequest);

    if (authResult.error) {
      return authResult.error;
    }

    const body = (await request.json()) as {
      ticketId?: string;
    };

    const ticketId = body.ticketId?.trim();

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 },
      );
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Ticket already completed" },
        { status: 400 },
      );
    }

    const slot = await ParkingSlot.findById(ticket.slotId);

    if (!slot) {
      return NextResponse.json(
        { error: "Associated parking slot not found" },
        { status: 500 },
      );
    }

    const exitTime = new Date();
    const durationMs = exitTime.getTime() - new Date(ticket.entryTime).getTime();
    const duration = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
    const config = await getSystemConfig();
    const pricePerHour = config.pricePerHour;
    const price = duration * pricePerHour;

    ticket.exitTime = exitTime;
    ticket.price = price;
    ticket.status = "COMPLETED";
    await ticket.save();

    slot.isOccupied = false;
    await slot.save();

    return NextResponse.json({
      vehicleNumber: ticket.vehicleNumber,
      entryTime: ticket.entryTime,
      exitTime,
      duration,
      pricePerHour,
      price,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process parking exit" },
      { status: 500 },
    );
  }
}
