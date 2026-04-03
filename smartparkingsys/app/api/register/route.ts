import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = (await request.json()) as {
      email?: string;
      password?: string;
      role?: "admin" | "user";
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const requestedRole = body.role === "admin" ? "admin" : "user";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role =
      email === "admin@parking.com"
        ? "admin"
        : requestedRole === "admin"
          ? "admin"
          : "user";

    await User.create({
      email,
      password: hashedPassword,
      role,
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        role,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 },
    );
  }
}
