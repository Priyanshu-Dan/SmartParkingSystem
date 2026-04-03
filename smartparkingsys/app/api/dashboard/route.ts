import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, type AuthenticatedRequest } from "@/lib/auth";
import ParkingSlot from "@/models/ParkingSlot";
import Ticket from "@/models/Ticket";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authResult = requireAdmin(request as AuthenticatedRequest);

    if (authResult.error) {
      return authResult.error;
    }

    const [totalSlots, occupiedSlots, activeTickets] = await Promise.all([
      ParkingSlot.countDocuments(),
      ParkingSlot.countDocuments({ isOccupied: true }),
      Ticket.countDocuments({ status: "ACTIVE" }),
    ]);

    return NextResponse.json({
      totalSlots,
      occupiedSlots,
      freeSlots: totalSlots - occupiedSlots,
      activeTickets,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
