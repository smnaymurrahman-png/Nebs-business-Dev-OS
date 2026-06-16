"use client";

import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Offer {
  id: string;
  serviceName: string;
  details: string;
  price: number;
  duration: string;
  createdAt: string;
  author: { name: string };
}

export default function AffiliateOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/affiliate/offers")
      .then((r) => r.json())
      .then((data) => { setOffers(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Offers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Current service packages published by the Nebs team</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-400">Loading…</div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center py-16">
          <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mb-3">
            <Tag className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">No offers available yet</p>
          <p className="text-xs text-gray-400 mt-1">Check back soon — the Nebs team will publish offers here</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-violet-200 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-base font-bold text-gray-900 leading-snug">{offer.serviceName}</h2>
                <span className="shrink-0 px-2.5 py-1 bg-violet-50 text-violet-700 text-sm font-bold rounded-lg">
                  ${Number(offer.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{offer.details}</p>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  <Tag className="w-3 h-3" /> {offer.duration}
                </span>
                <p className="text-xs text-gray-400">
                  By <span className="font-medium text-gray-500">{offer.author.name}</span> · {formatDate(offer.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
