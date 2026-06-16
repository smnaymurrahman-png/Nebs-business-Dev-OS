import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signAffiliateToken, affiliateCookieOptions, AFFILIATE_COOKIE } from "@/lib/affiliate-auth";

const STATUS_MESSAGES: Record<string, string> = {
  PENDING: "Your account is pending approval by the Nebs team.",
  SUSPENDED: "Your account has been suspended. Contact support for help.",
  BANNED: "Your account has been permanently deactivated.",
};

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }

  const affiliate = await prisma.affiliate.findUnique({ where: { email } });
  if (!affiliate) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, affiliate.passwordHash);
  if (!valid) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (affiliate.status !== "ACTIVE") {
    return Response.json(
      { error: STATUS_MESSAGES[affiliate.status] ?? "Account unavailable" },
      { status: 403 }
    );
  }

  const token = await signAffiliateToken({
    id: affiliate.id,
    email: affiliate.email,
    name: affiliate.fullName,
    code: affiliate.affiliateCode,
    status: affiliate.status,
  });

  const res = NextResponse.json({
    id: affiliate.id,
    name: affiliate.fullName,
    email: affiliate.email,
    code: affiliate.affiliateCode,
  });
  res.cookies.set(AFFILIATE_COOKIE, token, affiliateCookieOptions());
  return res;
}
