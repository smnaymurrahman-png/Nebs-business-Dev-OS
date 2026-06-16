import { getAffiliateSession } from "@/lib/affiliate-auth";

export async function GET() {
  const session = await getAffiliateSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(session);
}
