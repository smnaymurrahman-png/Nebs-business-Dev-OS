import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AFFILIATE_COOKIE = "af_token";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET);

async function verifyAffiliate(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(AFFILIATE_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Affiliate portal routes ─────────────────────────────────────────────────
  if (pathname.startsWith("/affiliate/")) {
    const isAuthPage =
      pathname.startsWith("/affiliate/login") ||
      pathname.startsWith("/affiliate/register");

    const loggedIn = await verifyAffiliate(request);

    if (isAuthPage) {
      if (loggedIn) return NextResponse.redirect(new URL("/affiliate/dashboard", request.url));
      return NextResponse.next();
    }

    // All other /affiliate/* routes require a valid affiliate session
    if (!loggedIn) {
      const res = NextResponse.redirect(new URL("/affiliate/login", request.url));
      res.cookies.set(AFFILIATE_COOKIE, "", { maxAge: 0, path: "/" });
      return res;
    }

    return NextResponse.next();
  }

  // ── Public referral form ────────────────────────────────────────────────────
  if (pathname.startsWith("/r/")) return NextResponse.next();

  // ── Internal user routes (existing logic) ───────────────────────────────────
  const session = await auth();

  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/api/auth");
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const role = (session?.user as { role?: string })?.role;
  if (pathname.startsWith("/super-admin") && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (
    pathname.startsWith("/admin") &&
    role !== "ADMIN" &&
    role !== "SUPER_ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
