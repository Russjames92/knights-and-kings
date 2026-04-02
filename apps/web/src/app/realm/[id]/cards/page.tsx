'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getMyCards, draftCard, hostBanquet, installCard, getRealm } from '../../../../lib/api';
import type { CardInstance, Realm, InstitutionSlot } from '../../../../lib/api';

const RARITY_COLORS: Record<string, string> = {
  Common: 'border-gray-600 text-gray-300',
  Uncommon: 'border-green-700 text-green-400',
  Rare: 'border-blue-600 text-blue-400',
  UltraRare: 'border-purple-600 text-purple-400',
  Legendary: 'border-yellow-500 text-yellow-300'
};

export default function CardsPage() {
  const params = useParams();
  const realmId = params.id as string;
  const [cards, setCards] = useState<CardInstance[]>([]);
  const [realm, setRealm] = useState<Realm | null>(null);
  const [slots, setSlots] = useState<InstitutionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [banqueting, setBanqueting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [cardData, realmData] = await Promise.all([
        getMyCards(),
        getRealm(realmId)
      ]);
      setCards(cardData.cards);
      setRealm(realmData.realm);
      setSlots(realmData.realm.institutionSlots ?? []);
    } catch {
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  }, [realmId]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) { window.location.href = '/login'; return; }
    loadData();
  }, [loadData]);

  async function handleDraft() {
    setDrafting(true);
    try {
      const result = await draftCard(realmId);
      alert(`Drafted: ${result.card.template.name} (${result.card.template.rarity}) for ${result.cost} wealth`);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Draft failed');
    } finally {
      setDrafting(false);
    }
  }

  async function handleBanquet() {
    setBanqueting(true);
    try {
      const result = await hostBanquet(realmId);
      alert(`Banquet yielded: ${result.card.template.name} (${result.card.template.rarity}) for ${result.cost} wealth`);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Banquet failed');
    } finally {
      setBanqueting(false);
    }
  }

  async function handleInstall(card: CardInstance) {
    const slot = slots.find(s => s.type === card.template.type && !s.installedCardId);
    if (!slot) {
      alert(`No vacant ${card.template.type} slot available. Establish one first.`);
      return;
    }
    try {
      await installCard(card.template.type, realmId, card.id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Install failed');
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-yellow-600">Loading cards...</div>;
  }

  const uninstalled = cards.filter(c => !c.installedSlot);
  const installed = cards.filter(c => c.installedSlot);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <a href={`/realm/${realmId}`} className="text-sm text-yellow-700 hover:text-yellow-500">
            Back to Realm
          </a>
          <h1 className="mt-1 text-3xl font-bold text-yellow-500">Card Management</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDraft}
            disabled={drafting}
            className="rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-green-100 hover:bg-green-700 disabled:opacity-50"
          >
            {drafting ? 'Drafting...' : 'Draft Card (30w)'}
          </button>
          <button
            onClick={handleBanquet}
            disabled={banqueting}
            className="rounded-lg bg-purple-800 px-4 py-2 text-sm font-semibold text-purple-100 hover:bg-purple-700 disabled:opacity-50"
          >
            {banqueting ? 'Hosting...' : 'Host Banquet (300w)'}
          </button>
        </div>
      </div>

      {realm && (
        <p className="text-sm text-yellow-700">
          Realm Wealth: <span className="font-semibold text-yellow-400">{realm.wealth}</span>
        </p>
      )}

      {/* Hand - uninstalled cards */}
      <div className="rounded-xl border border-yellow-900/40 bg-[#211808] p-6">
        <h2 className="mb-4 text-lg font-semibold text-yellow-500">Your Hand ({uninstalled.length} cards)</h2>
        {uninstalled.length === 0 ? (
          <p className="text-sm text-yellow-800">No cards in hand. Draft or host a banquet to acquire cards.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {uninstalled.map(card => (
              <div
                key={card.id}
                className={`rounded-lg border p-4 ${RARITY_COLORS[card.template.rarity] ?? 'border-gray-600'} bg-[#1a1207]`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{card.template.name}</h3>
                  <span className="rounded bg-[#211808] px-2 py-0.5 text-xs">{card.template.rarity}</span>
                </div>
                <p className="mt-1 text-xs text-yellow-700">Type: {card.template.type}</p>
                {card.template.flavorText && (
                  <p className="mt-1 text-xs italic text-yellow-800">{card.template.flavorText}</p>
                )}
                {card.template.benefitPillars && Object.keys(card.template.benefitPillars).length > 0 && (
                  <p className="mt-1 text-xs text-green-500">
                    + {Object.entries(card.template.benefitPillars).map(([k, v]) => `${k}: ${v}`).join(', ')}
                  </p>
                )}
                {card.template.downsidePillars && Object.keys(card.template.downsidePillars).length > 0 && (
                  <p className="text-xs text-red-400">
                    {Object.entries(card.template.downsidePillars).map(([k, v]) => `${k}: ${v}`).join(', ')}
                  </p>
                )}
                <button
                  onClick={() => handleInstall(card)}
                  className="mt-3 w-full rounded bg-yellow-800/60 px-3 py-1.5 text-xs font-semibold text-yellow-300 hover:bg-yellow-800 transition"
                >
                  Install to {card.template.type}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Installed cards */}
      <div className="rounded-xl border border-yellow-900/40 bg-[#211808] p-6">
        <h2 className="mb-4 text-lg font-semibold text-yellow-500">Installed ({installed.length} cards)</h2>
        {installed.length === 0 ? (
          <p className="text-sm text-yellow-800">No cards installed in institutions.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {installed.map(card => (
              <div
                key={card.id}
                className={`rounded-lg border p-4 ${RARITY_COLORS[card.template.rarity] ?? 'border-gray-600'} bg-[#2a1a08]`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{card.template.name}</h3>
                  <span className="rounded bg-green-900/40 px-2 py-0.5 text-xs text-green-400">Installed</span>
                </div>
                <p className="mt-1 text-xs text-yellow-700">
                  Serving as {card.template.type}
                </p>
                {card.template.flavorText && (
                  <p className="mt-1 text-xs italic text-yellow-800">{card.template.flavorText}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
