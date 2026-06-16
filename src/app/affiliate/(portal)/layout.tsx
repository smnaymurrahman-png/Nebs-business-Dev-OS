import { redirect } from "next/navigation";
import { getAffiliateSession } from "@/lib/affiliate-auth";
import { AffiliatePortalLayout } from "@/components/affiliate/AffiliatePortalLayout";

export default async function AffiliatePortalRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAffiliateSession();
  if (!session) redirect("/affiliate/login");

  return <AffiliatePortalLayout session={session}>{children}</AffiliatePortalLayout>;
}
