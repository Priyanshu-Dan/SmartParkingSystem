import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { signAuthToken } from "@/lib/auth";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = signAuthToken({
      userId: user._id.toString(),
      role: user.role,
    });

    return NextResponse.json({
      token,
      role: user.role,
    });
  } catch {
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 },
    );
  }
}
