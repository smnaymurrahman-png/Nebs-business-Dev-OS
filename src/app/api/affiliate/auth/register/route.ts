import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateAffiliateCode } from "@/lib/affiliate-auth";

export async function POST(req: NextRequest) {
  const { fullName, email, phone, password } = await req.json();

  if (!fullName || !email || !phone || !password) {
    return Response.json({ error: "All fields are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await prisma.affiliate.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Ensure unique affiliate code (retry on collision)
  let affiliateCode = generateAffiliateCode();
  let attempts = 0;
  while (await prisma.affiliate.findUnique({ where: { affiliateCode } })) {
    affiliateCode = generateAffiliateCode();
    if (++attempts > 10) throw new Error("Could not generate unique affiliate code");
  }

  const affiliate = await prisma.affiliate.create({
    data: {
      fullName,
      email,
      phone,
      passwordHash,
      affiliateCode,
      status: "PENDING",
    },
    select: { id: true, email: true, affiliateCode: true, status: true },
  });

  return Response.json(affiliate, { status: 201 });
}
