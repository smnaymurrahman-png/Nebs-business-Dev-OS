import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export const AFFILIATE_COOKIE = "af_token";
const EXPIRES_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface AffiliateSession {
  id: string;
  email: string;
  name: string;
  code: string;
  status: string;
}

export async function signAffiliateToken(payload: AffiliateSession): Promise<string> {
  return new SignJWT({ ...(payload as unknown as JWTPayload) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifyAffiliateToken(token: string): Promise<AffiliateSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as AffiliateSession;
  } catch {
    return null;
  }
}

export function affiliateCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAge ?? EXPIRES_SECONDS,
  };
}

// For use in Server Components and API route handlers (not middleware)
export async function getAffiliateSession(): Promise<AffiliateSession | null> {
  const store = await cookies();
  const token = store.get(AFFILIATE_COOKIE)?.value;
  if (!token) return null;
  return verifyAffiliateToken(token);
}

// For use in API route handlers where request is available
export async function getAffiliateSessionFromRequest(
  req: NextRequest
): Promise<AffiliateSession | null> {
  const token = req.cookies.get(AFFILIATE_COOKIE)?.value;
  if (!token) return null;
  return verifyAffiliateToken(token);
}

export function generateAffiliateCode(): string {
  // NBL- prefix + 6 chars, no 0/O/1/I to avoid visual confusion
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "NBL-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
