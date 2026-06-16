import { prisma } from "@/lib/prisma";
import { getAffiliateSession, signAffiliateToken, affiliateCookieOptions, AFFILIATE_COOKIE } from "@/lib/affiliate-auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: session.id },
    select: { id: true, fullName: true, email: true, phone: true, affiliateCode: true, status: true, createdAt: true },
  });
  if (!affiliate) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(affiliate);
}

export async function PUT(req: NextRequest) {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { fullName, phone, currentPassword, newPassword } = await req.json();

  // Password change
  if (newPassword) {
    if (!currentPassword) return Response.json({ error: "Current password required" }, { status: 400 });
    if (newPassword.length < 8) return Response.json({ error: "New password must be at least 8 characters" }, { status: 400 });

    const affiliate = await prisma.affiliate.findUnique({ where: { id: session.id }, select: { passwordHash: true } });
    if (!affiliate) return Response.json({ error: "Not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, affiliate.passwordHash);
    if (!valid) return Response.json({ error: "Current password is incorrect" }, { status: 400 });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.affiliate.update({ where: { id: session.id }, data: { passwordHash } });
    return Response.json({ success: true, message: "Password updated" });
  }

  // Profile update
  const updated = await prisma.affiliate.update({
    where: { id: session.id },
    data: {
      fullName: fullName?.trim() ?? undefined,
      phone: phone?.trim() ?? undefined,
    },
    select: { id: true, fullName: true, email: true, phone: true, affiliateCode: true, status: true },
  });

  // Refresh cookie if name changed
  const newToken = await signAffiliateToken({
    id: updated.id,
    email: updated.email,
    name: updated.fullName,
    code: updated.affiliateCode,
    status: updated.status,
  });

  const res = NextResponse.json(updated);
  res.cookies.set(AFFILIATE_COOKIE, newToken, affiliateCookieOptions());
  return res;
}
