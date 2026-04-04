import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ParkingSlot from "@/models/ParkingSlot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();

    const slots = await ParkingSlot.find({}).sort({ slotNumber: 1 }).lean();

    return NextResponse.json(slots, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch parking slots" },
      { status: 500 },
    );
  }
}
