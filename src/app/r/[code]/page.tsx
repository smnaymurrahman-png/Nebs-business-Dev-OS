import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LeadCaptureForm from "./LeadCaptureForm";

export const dynamic = "force-dynamic";

export default async function PublicLeadCapturePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const affiliate = await prisma.affiliate.findUnique({
    where: { affiliateCode: code },
    select: { id: true, fullName: true, status: true },
  });

  if (!affiliate || affiliate.status !== "ACTIVE") notFound();

  const [industries, serviceTypes] = await Promise.all([
    prisma.industry.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.serviceTypeLookup.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold">N</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Get in touch with Nebs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Referred by <span className="font-semibold text-violet-700">{affiliate.fullName}</span>
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <LeadCaptureForm
            affiliateCode={code}
            affiliateName={affiliate.fullName}
            industries={industries}
            serviceTypes={serviceTypes}
          />
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © {new Date().getFullYear()} Nebs BD · Your information is kept private
        </p>
      </div>
    </div>
  );
}
