import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ParkingSlot from "@/models/ParkingSlot";

export async function GET() {
  try {
    await connectDB();

    const slots = await ParkingSlot.find({}).sort({ slotNumber: 1 });

    return NextResponse.json(slots);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch parking slots" },
      { status: 500 },
    );
  }
}
