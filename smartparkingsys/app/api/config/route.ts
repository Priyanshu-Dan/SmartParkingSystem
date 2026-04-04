import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  requireAdmin,
  requireAuth,
  type AuthenticatedRequest,
} from "@/lib/auth";
import {
  getSystemConfig,
  updateSystemConfigPrice,
} from "@/lib/system-config";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authResult = requireAuth(request as AuthenticatedRequest);

    if (authResult.error) {
      return authResult.error;
    }

    const config = await getSystemConfig();

    return NextResponse.json({
      pricePerHour: config.pricePerHour,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch system config" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authResult = requireAdmin(request as AuthenticatedRequest);

    if (authResult.error) {
      return authResult.error;
    }

    const body = (await request.json()) as { pricePerHour?: number };
    const pricePerHour = body.pricePerHour;

    if (!Number.isFinite(pricePerHour) || Number(pricePerHour) <= 0) {
      return NextResponse.json(
        { error: "Price per hour must be a positive number" },
        { status: 400 },
      );
    }

    const config = await updateSystemConfigPrice(Number(pricePerHour));

    return NextResponse.json({
      message: "Price updated successfully",
      pricePerHour: config.pricePerHour,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update system config" },
      { status: 500 },
    );
  }
}
