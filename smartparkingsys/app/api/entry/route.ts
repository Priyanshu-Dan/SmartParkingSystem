import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth, type AuthenticatedRequest } from "@/lib/auth";
import ParkingSlot from "@/models/ParkingSlot";
import Ticket from "@/models/Ticket";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authResult = requireAuth(request as AuthenticatedRequest);

    if (authResult.error) {
      return authResult.error;
    }

    const body = (await request.json()) as {
      vehicleNumber?: string;
      slotId?: string;
    };

    const vehicleNumber = body.vehicleNumber?.trim().toUpperCase();
    const requestedSlotId = body.slotId?.trim();

    if (!vehicleNumber) {
      return NextResponse.json(
        { error: "Vehicle number is required" },
        { status: 400 },
      );
    }

    const slot = requestedSlotId
      ? await ParkingSlot.findOneAndUpdate(
          { _id: requestedSlotId, isOccupied: false },
          { $set: { isOccupied: true } },
          { new: true },
        )
      : await ParkingSlot.findOneAndUpdate(
          { isOccupied: false },
          { $set: { isOccupied: true } },
          { sort: { slotNumber: 1 }, new: true },
        );

    if (!slot) {
      return NextResponse.json(
        {
          error: requestedSlotId
            ? "Selected slot is unavailable"
            : "Parking Full",
        },
        { status: 400 },
      );
    }

    try {
      const ticket = await Ticket.create({
        vehicleNumber,
        slotId: slot._id,
        entryTime: new Date(),
        status: "ACTIVE",
      });

      return NextResponse.json(
        {
          ticketId: ticket._id,
          slotNumber: slot.slotNumber,
        },
        { status: 201 },
      );
    } catch (error) {
      await ParkingSlot.findByIdAndUpdate(slot._id, {
        $set: { isOccupied: false },
      });

      throw error;
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to create parking entry" },
      { status: 500 },
    );
  }
}
