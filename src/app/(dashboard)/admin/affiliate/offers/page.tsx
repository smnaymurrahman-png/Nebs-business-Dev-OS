"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Check, X, Tag } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface Offer {
  id: string;
  serviceName: string;
  details: string;
  price: number;
  duration: string;
  createdAt: string;
  author: { name: string };
}

function OfferForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<Offer>;
  onSave: (data: { serviceName: string; details: string; price: string; duration: string }) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [serviceName, setServiceName] = useState(initial?.serviceName ?? "");
  const [details, setDetails] = useState(initial?.details ?? "");
  const [price, setPrice] = useState(initial?.price !== undefined ? String(initial.price) : "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || !details.trim() || !price || !duration.trim()) {
      setError("All fields are required");
      return;
    }
    setError("");
    await onSave({ serviceName, details, price, duration });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Service Name *</label>
          <input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="e.g. Web Development Package"
            className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-gray-700 placeholder:text-gray-300" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Details *</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Describe what's included…"
            className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-gray-700 placeholder:text-gray-300 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Price (USD) *</label>
          <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00"
            className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-gray-700 placeholder:text-gray-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Duration *</label>
          <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 30 days, 3 months"
            className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 text-gray-700 placeholder:text-gray-300" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
        <button type="submit" disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : <><Check className="w-3.5 h-3.5" /> {initial?.id ? "Save Changes" : "Create Offer"}</>}
        </button>
      </div>
    </form>
  );
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await fetch("/api/admin/offers").then((r) => r.json());
    setOffers(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createOffer = async (data: { serviceName: string; details: string; price: string; duration: string }) => {
    setSaving(true);
    const res = await fetch("/api/admin/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (res.ok) { setShowCreate(false); load(); }
  };

  const updateOffer = async (id: string, data: { serviceName: string; details: string; price: string; duration: string }) => {
    setSaving(true);
    const res = await fetch(`/api/admin/offers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (res.ok) { setEditingId(null); load(); }
  };

  const deleteOffer = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/admin/offers/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Offers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Publish service packages visible to all active affiliates</p>
        </div>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Create Offer
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-blue-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">New Offer</h2>
          <OfferForm
            onSave={createOffer}
            onCancel={() => setShowCreate(false)}
            saving={saving}
          />
        </div>
      )}

      {/* Offers list */}
      {offers.length === 0 && !showCreate ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center py-16">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
            <Tag className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No offers yet</p>
          <p className="text-xs text-gray-400 mt-1">Create your first offer above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {editingId === offer.id ? (
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Edit Offer</h3>
                  <OfferForm
                    initial={offer}
                    onSave={(data) => updateOffer(offer.id, data)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900">{offer.serviceName}</h3>
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                          ${Number(offer.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          {offer.duration}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{offer.details}</p>
                      <p className="text-xs text-gray-400 mt-3">
                        By <span className="font-medium text-gray-500">{offer.author.name}</span> · {formatDate(offer.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setEditingId(offer.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteOffer(offer.id)} disabled={deletingId === offer.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors" title="Delete">
                        {deletingId === offer.id ? <span className="text-xs">…</span> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
