import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export type AuthRole = "admin" | "user";

export type AuthTokenPayload = {
  userId: string;
  role: AuthRole;
  iat?: number;
  exp?: number;
};

export type AuthenticatedRequest = NextRequest & {
  authUser?: AuthTokenPayload;
};

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Please define the JWT_SECRET environment variable in .env.local");
}

export function signAuthToken(payload: { userId: string; role: AuthRole }) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}

export function getTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
}

export function authenticateRequest(request: AuthenticatedRequest) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Authorization token is required" },
        { status: 401 },
      ),
    };
  }

  try {
    const decoded = verifyAuthToken(token);
    request.authUser = decoded;

    return {
      user: decoded,
    };
  } catch {
    return {
      error: NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }),
    };
  }
}

export function requireAuth(request: AuthenticatedRequest) {
  return authenticateRequest(request);
}

export function requireAdmin(request: AuthenticatedRequest) {
  const authResult = authenticateRequest(request);

  if (authResult.error) {
    return authResult;
  }

  if (authResult.user.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Admin access is required" },
        { status: 403 },
      ),
    };
  }

  return authResult;
}
