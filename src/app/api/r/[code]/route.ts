import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ code: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { code } = await params;

  const affiliate = await prisma.affiliate.findUnique({
    where: { affiliateCode: code },
    select: { id: true, status: true },
  });

  if (!affiliate || affiliate.status !== "ACTIVE")
    return Response.json({ error: "Invalid or inactive affiliate link" }, { status: 404 });

  const { fullName, emailAddress, phoneNumber, businessName, industryId, serviceTypeId, referenceAmount, leadIntent } =
    await req.json();

  if (!fullName?.trim() || !emailAddress?.trim() || !phoneNumber?.trim() || !businessName?.trim())
    return Response.json({ error: "Full name, email, phone, and business name are required" }, { status: 400 });

  const email = emailAddress.trim().toLowerCase();
  const phone = phoneNumber.trim();

  // Duplicate check (same logic as affiliate lead submission)
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM leads
    WHERE
      (${email.includes("@")} AND lower("emailAddress") = ${email})
      OR (
        length(regexp_replace(${phone}, '\D', '', 'g')) >= 7
        AND regexp_replace("phoneNumber", '\D', '', 'g')
              = regexp_replace(${phone}, '\D', '', 'g')
      )
    LIMIT 1
  `;
  if (rows.length > 0)
    return Response.json({ error: "This lead already exists in the system." }, { status: 409 });

  await prisma.lead.create({
    data: {
      fullName: fullName.trim(),
      emailAddress: email,
      phoneNumber: phone,
      businessName: businessName.trim(),
      industryId: industryId ?? null,
      serviceTypeId: serviceTypeId ?? null,
      referenceAmount: referenceAmount ? parseFloat(referenceAmount) : null,
      leadIntent: leadIntent ?? null,
      source: "PUBLIC_FORM",
      leadStatus: "SUBMITTED",
      affiliateId: affiliate.id,
      leadType: "COLD",
      businessDetails: "",
      leadFrom: "Public Form",
      createdById: null,
    },
  });

  // Notify admins (non-blocking)
  prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } }, select: { id: true } })
    .then((admins) =>
      prisma.notification.createMany({
        data: admins.map((a) => ({
          recipientType: "ADMIN" as const,
          recipientId: a.id,
          type: "NEW_LEAD",
          payload: { leadName: fullName.trim(), source: "public_form", affiliateCode: code },
        })),
      })
    )
    .catch(() => {});

  return Response.json({ success: true }, { status: 201 });
}
