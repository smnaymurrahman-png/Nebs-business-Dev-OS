import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAffiliateSession } from "@/lib/affiliate-auth";

const DUPLICATE_MSG = "This lead already exists in the system.";

async function checkDuplicate(email: string, phone: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM leads
    WHERE
      (${email.includes("@")} AND lower("emailAddress") = ${email.trim().toLowerCase()})
      OR (
        length(regexp_replace(${phone}, '\D', '', 'g')) >= 7
        AND regexp_replace("phoneNumber", '\D', '', 'g')
              = regexp_replace(${phone}, '\D', '', 'g')
      )
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function GET(req: NextRequest) {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const leads = await prisma.lead.findMany({
    where: { affiliateId: session.id },
    include: {
      industry:       { select: { name: true } },
      serviceTypeOpt: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(leads);
}

export async function POST(req: NextRequest) {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const {
    fullName,
    emailAddress,
    phoneNumber,
    businessName,
    industryId,
    serviceTypeId,
    referenceAmount,
    leadIntent,
    confirmed,
  } = await req.json();

  if (!fullName || !emailAddress || !phoneNumber || !businessName || !leadIntent) {
    return Response.json({ error: "Required fields missing" }, { status: 400 });
  }
  if (!confirmed) {
    return Response.json({ error: "You must confirm the information is accurate" }, { status: 400 });
  }

  const isDuplicate = await checkDuplicate(emailAddress, phoneNumber);
  if (isDuplicate) {
    return Response.json({ error: DUPLICATE_MSG }, { status: 409 });
  }

  const lead = await prisma.lead.create({
    data: {
      fullName,
      emailAddress,
      phoneNumber,
      businessName,
      businessDetails: "",
      leadType:        "COLD",
      leadFrom:        "Affiliate Portal",
      leadStatus:      "SUBMITTED",
      source:          "MANUAL",
      affiliateId:     session.id,
      industryId:      industryId || null,
      serviceTypeId:   serviceTypeId || null,
      referenceAmount: referenceAmount ? parseFloat(referenceAmount) : null,
      leadIntent,
    },
  });

  return Response.json(lead, { status: 201 });
}
