'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  getRealm,
  getRealmEvents,
  getNearbyRealms,
  getRealmDynasty,
  createDynasty,
  crownHeir,
  establishInstitution,
  removeInstitution,
  reappointInstitution,
  initiateRaid
} from '../../../lib/api';
import type { Realm, LegitimacyInfo, GameEvent, InstitutionSlot, NearbyRealm, Dynasty, Heir } from '../../../lib/api';
import RealmMap from '../../../components/RealmMap';

const INSTITUTION_TYPES = ['King', 'Queen', 'Bishop', 'Knight', 'Rook', 'Pawn'] as const;

const PILLAR_LABELS: Record<string, string> = {
  Institutions: 'Institutions',
  Wealth: 'Wealth',
  Population: 'Population',
  Culture: 'Culture',
  Faith: 'Faith',
  Victory: 'Victory',
  Time: 'Time'
};

function PillarBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  let color = 'bg-red-600';
  if (pct > 20) color = 'bg-orange-500';
  if (pct > 40) color = 'bg-yellow-500';
  if (pct > 60) color = 'bg-green-500';
  if (pct > 80) color = 'bg-emerald-400';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-yellow-600">{label}</span>
        <span className="text-yellow-400">{Math.round(pct)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#1a1207]">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DynastyPanel({ dynasty, realmId, onRefresh }: { dynasty: Dynasty | null; realmId: string; onRefresh: () => void }) {
  const [showCreate, setShowCreate] = useState(false);
  const [dynastyName, setDynastyName] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!dynastyName.trim()) return;
    setCreating(true);
    try {
      await createDynasty(realmId, dynastyName.trim());
      setShowCreate(false);
      setDynastyName('');
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create dynasty');
    } finally {
      setCreating(false);
    }
  }

  if (!dynasty) {
    return (
      <div className="rounded-xl border border-yellow-900/40 bg-[#211808] p-6">
        <h2 className="mb-4 text-lg font-semibold text-yellow-500">Dynasty</h2>
        {showCreate ? (
          <div className="space-y-3">
            <input
              type="text"
              value={dynastyName}
              onChange={e => setDynastyName(e.target.value)}
              placeholder="Dynasty name..."
              className="w-full rounded-lg border border-yellow-900/40 bg-[#1a1207] px-4 py-2 text-sm text-[#e8dcc8] placeholder-yellow-900/60 focus:border-yellow-600 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={creating || !dynastyName.trim()}
                className="rounded bg-yellow-700 px-4 py-2 text-sm font-semibold text-[#1a1207] hover:bg-yellow-600 disabled:opacity-50"
              >
                {creating ? 'Founding...' : 'Found Dynasty'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded bg-yellow-900/40 px-4 py-2 text-sm text-yellow-500 hover:bg-yellow-900/60"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-yellow-800">No dynasty established yet.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 rounded bg-yellow-700 px-4 py-2 text-sm font-semibold text-[#1a1207] hover:bg-yellow-600"
            >
              Found a Dynasty
            </button>
          </div>
        )}
      </div>
    );
  }

  const legacyEchoes = dynasty.legacyEchoes ?? [];
  const pastKings = dynasty.reigns ?? [];
  const crownedHeirs = dynasty.heirs?.filter(h => h.isCrowned) ?? [];

  return (
    <div className="rounded-xl border border-yellow-900/40 bg-[#211808] p-6">
      <h2 className="mb-1 text-lg font-semibold text-yellow-500">{dynasty.name} Dynasty</h2>
      <p className="mb-4 text-xs text-yellow-700">
        Founded {new Date(dynasty.foundedAt).toLocaleDateString()}
      </p>

      {/* Legacy Echoes */}
      {legacyEchoes.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-medium text-purple-400">Legacy Echoes</h3>
          <div className="flex flex-wrap gap-2">
            {legacyEchoes.map((echo, i) => (
              <div key={i} className="rounded-full bg-purple-900/30 px-3 py-1 text-xs text-purple-300">
                {Object.entries(echo.pillarBiases).map(([pillar, bias]) =>
                  `${pillar} +${(bias * echo.strength).toFixed(1)}`
                ).join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lineage */}
      {(pastKings.length > 0 || crownedHeirs.length > 0) && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-yellow-600">Royal Lineage</h3>
          <div className="space-y-1">
            {pastKings.slice(0, 10).map(reign => (
              <div key={reign.id} className="flex items-center justify-between text-xs">
                <span className="text-yellow-400">
                  King (Reign {new Date(reign.startedAt).toLocaleDateString()})
                </span>
                <span className="text-yellow-700">
                  {reign.endReason === 'peaceful_transfer' ? 'Peaceful' : reign.endedEarly ? 'Fell' : 'Active'}
                </span>
              </div>
            ))}
            {crownedHeirs.map(heir => (
              <div key={heir.id} className="flex items-center justify-between text-xs">
                <span className="text-yellow-400">{heir.name}</span>
                <span className={
                  heir.quality === 'promising' ? 'text-green-400' :
                  heir.quality === 'average' ? 'text-yellow-400' :
                  'text-red-400'
                }>
                  {heir.quality}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HeirNotification({ heir, onCrown, onDecline }: { heir: Heir; onCrown: () => void; onDecline: () => void }) {
  const [crowning, setCrowning] = useState(false);
  const [revealed, setRevealed] = useState<{ quality: string } | null>(null);

  async function handleCrown() {
    setCrowning(true);
    try {
      const result = await crownHeir(heir.id);
      setRevealed({ quality: result.quality });
      setTimeout(() => onCrown(), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to crown heir');
      setCrowning(false);
    }
  }

  if (revealed) {
    const qualityColor = revealed.quality === 'promising' ? 'text-green-400 border-green-700 bg-green-900/20' :
                          revealed.quality === 'average' ? 'text-yellow-400 border-yellow-700 bg-yellow-900/20' :
                          'text-red-400 border-red-700 bg-red-900/20';
    return (
      <div className={`rounded-lg border p-4 text-center ${qualityColor}`}>
        <p className="text-lg font-bold">{heir.name}</p>
        <p className="mt-1 text-sm">
          Revealed as: <span className="font-semibold uppercase">{revealed.quality}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-700 bg-amber-900/20 p-4">
      <div className="text-center">
        <p className="text-sm text-amber-300">An heir stands ready to claim the throne!</p>
        <p className="mt-1 text-xl font-bold text-amber-400">{heir.name}</p>
        <p className="mt-1 text-xs text-amber-600">Their true nature remains hidden until crowned...</p>
        <div className="mt-3 flex justify-center gap-3">
          <button
            onClick={handleCrown}
            disabled={crowning}
            className="rounded-lg bg-amber-700 px-6 py-2 font-semibold text-[#1a1207] hover:bg-amber-600 disabled:opacity-50"
          >
            {crowning ? 'Crowning...' : `Crown ${heir.name.split(' ')[0]}`}
          </button>
          <button
            onClick={onDecline}
            className="rounded-lg bg-yellow-900/40 px-4 py-2 text-sm text-yellow-500 hover:bg-yellow-900/60"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

function InstitutionCard({ slot, realmId, onRefresh }: { slot: InstitutionSlot | undefined; type: string; realmId: string; onRefresh: () => void }) {
  const type = slot?.type ?? '';
  const [loading, setLoading] = useState(false);

  async function handleEstablish() {
    setLoading(true);
    try {
      await establishInstitution(type, realmId);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (!confirm(`Remove ${type} head? ${type === 'King' ? 'This will cause GOVERNMENT COLLAPSE!' : ''}`)) return;
    setLoading(true);
    try {
      await removeInstitution(type, realmId);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleReappoint() {
    setLoading(true);
    try {
      await reappointInstitution(type, realmId);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  if (!slot) {
    return (
      <div className="rounded-lg border border-dashed border-yellow-900/30 bg-[#1a1207]/50 p-4 text-center">
        <p className="text-sm text-yellow-800">{type}</p>
        <p className="mt-1 text-xs text-yellow-900">Not established</p>
        <button
          onClick={handleEstablish}
          disabled={loading}
          className="mt-2 rounded bg-yellow-900/40 px-3 py-1 text-xs text-yellow-500 hover:bg-yellow-900/60 disabled:opacity-50"
        >
          Establish
        </button>
      </div>
    );
  }

  const hasCard = !!slot.installedCardId;
  const termEnd = slot.termEndsAt ? new Date(slot.termEndsAt) : null;
  const daysLeft = termEnd ? Math.max(0, Math.ceil((termEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div className={`rounded-lg border p-4 ${hasCard ? 'border-yellow-700/60 bg-[#2a1a08]' : 'border-yellow-900/30 bg-[#1a1207]/80'}`}>
      <div className="flex items-start justify-between">
        <p className="font-semibold text-yellow-400">{type}</p>
        {hasCard && slot.consecutiveTerms > 0 && (
          <span className="rounded bg-yellow-900/40 px-1.5 py-0.5 text-xs text-yellow-600">
            Term {slot.consecutiveTerms + 1}
          </span>
        )}
      </div>
      {hasCard ? (
        <>
          {slot.installedCard?.template && (
            <p className="mt-1 text-sm text-yellow-300">{slot.installedCard.template.name}</p>
          )}
          {daysLeft !== null && (
            <p className="mt-1 text-xs text-yellow-700">{daysLeft} days remaining</p>
          )}
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleReappoint}
              disabled={loading}
              className="rounded bg-green-900/40 px-2 py-1 text-xs text-green-400 hover:bg-green-900/60 disabled:opacity-50"
            >
              Reappoint
            </button>
            <button
              onClick={handleRemove}
              disabled={loading}
              className="rounded bg-red-900/40 px-2 py-1 text-xs text-red-400 hover:bg-red-900/60 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-xs text-yellow-800">Vacant</p>
          <a
            href={`/realm/${realmId}/cards`}
            className="mt-2 inline-block rounded bg-yellow-900/40 px-3 py-1 text-xs text-yellow-500 hover:bg-yellow-900/60"
          >
            Install Card
          </a>
        </>
      )}
    </div>
  );
}

export default function RealmPage() {
  const params = useParams();
  const realmId = params.id as string;
  const [realm, setRealm] = useState<Realm | null>(null);
  const [legitimacy, setLegitimacy] = useState<LegitimacyInfo | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [dynasty, setDynasty] = useState<Dynasty | null>(null);
  const [pendingHeir, setPendingHeir] = useState<Heir | null>(null);
  const [loading, setLoading] = useState(true);
  const [nearbyRealms, setNearbyRealms] = useState<NearbyRealm[]>([]);
  const [raidTarget, setRaidTarget] = useState('');
  const [raiding, setRaiding] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [realmData, eventData, dynastyData] = await Promise.all([
        getRealm(realmId),
        getRealmEvents(realmId),
        getRealmDynasty(realmId).catch(() => ({ dynasty: null }))
      ]);
      setRealm(realmData.realm);
      setLegitimacy(realmData.legitimacy);
      setEvents(eventData.events);
      setDynasty(dynastyData.dynasty);

      // Find pending (uncrowned) heir
      if (dynastyData.dynasty?.heirs) {
        const pending = dynastyData.dynasty.heirs.find(h => !h.isCrowned);
        setPendingHeir(pending ?? null);
      } else {
        setPendingHeir(null);
      }

      // Load nearby realms for the map
      try {
        const nearby = await getNearbyRealms(realmData.realm.originLat, realmData.realm.originLng);
        setNearbyRealms(nearby.realms);
      } catch {
        // Non-critical, map works without nearby realms
      }
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

  async function handleRaid() {
    if (!raidTarget.trim()) return;
    setRaiding(true);
    try {
      const result = await initiateRaid(realmId, raidTarget.trim());
      alert(result.result.success
        ? `Raid successful! Looted ${result.result.lootGained} wealth.`
        : 'Raid failed! Your forces were repelled.'
      );
      setRaidTarget('');
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Raid failed');
    } finally {
      setRaiding(false);
    }
  }

  if (loading || !realm || !legitimacy) {
    return <div className="py-12 text-center text-yellow-600">Loading realm...</div>;
  }

  const slots = realm.institutionSlots ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-yellow-500">{realm.name}</h1>
          <p className="mt-1 text-sm text-yellow-700">
            Coordinates: {realm.originLat.toFixed(2)}, {realm.originLng.toFixed(2)}
          </p>
        </div>
        <a
          href={`/realm/${realmId}/cards`}
          className="rounded-lg bg-yellow-700 px-4 py-2 font-semibold text-[#1a1207] hover:bg-yellow-600"
        >
          Manage Cards
        </a>
      </div>

      {/* Interregnum warning */}
      {realm.isInterregnum && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-center">
          <p className="text-lg font-semibold text-red-400">INTERREGNUM</p>
          <p className="mt-1 text-sm text-red-300">
            The realm has no king! Legitimacy is draining. Install a King card to restore order.
          </p>
        </div>
      )}

      {/* Heir notification */}
      {pendingHeir && (
        <HeirNotification
          heir={pendingHeir}
          onCrown={loadData}
          onDecline={() => setPendingHeir(null)}
        />
      )}

      {/* Dynasty panel */}
      <DynastyPanel dynasty={dynasty} realmId={realmId} onRefresh={loadData} />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-yellow-900/40 bg-[#211808] p-4">
          <p className="text-xs text-yellow-700">Legitimacy</p>
          <p className="text-2xl font-bold text-yellow-400">{Math.round(legitimacy.score)}</p>
          <p className="text-xs text-yellow-600">{legitimacy.tier}</p>
        </div>
        <div className="rounded-lg border border-yellow-900/40 bg-[#211808] p-4">
          <p className="text-xs text-yellow-700">Wealth</p>
          <p className="text-2xl font-bold text-yellow-300">{realm.wealth}</p>
        </div>
        <div className="rounded-lg border border-yellow-900/40 bg-[#211808] p-4">
          <p className="text-xs text-yellow-700">Population</p>
          <p className="text-2xl font-bold text-yellow-300">{realm.population}</p>
        </div>
        <div className="rounded-lg border border-yellow-900/40 bg-[#211808] p-4">
          <p className="text-xs text-yellow-700">Institutions</p>
          <p className="text-2xl font-bold text-yellow-300">
            {slots.filter(s => s.installedCardId).length}/{slots.length}
          </p>
        </div>
      </div>

      {/* Legitimacy pillars */}
      <div className="rounded-xl border border-yellow-900/40 bg-[#211808] p-6">
        <h2 className="mb-4 text-lg font-semibold text-yellow-500">Legitimacy Pillars</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(PILLAR_LABELS).map(([key, label]) => (
            <PillarBar key={key} label={label} value={legitimacy.pillars[key] ?? 0} />
          ))}
        </div>
      </div>

      {/* Institution grid */}
      <div className="rounded-xl border border-yellow-900/40 bg-[#211808] p-6">
        <h2 className="mb-4 text-lg font-semibold text-yellow-500">Institutions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {INSTITUTION_TYPES.map(type => {
            const slot = slots.find(s => s.type === type);
            return (
              <InstitutionCard
                key={type}
                slot={slot}
                type={type}
                realmId={realmId}
                onRefresh={loadData}
              />
            );
          })}
        </div>
      </div>

      {/* Raid panel */}
      <div className="rounded-xl border border-yellow-900/40 bg-[#211808] p-6">
        <h2 className="mb-4 text-lg font-semibold text-yellow-500">Raid</h2>
        <p className="mb-3 text-xs text-yellow-800">
          Click a nearby realm on the map above to target, or enter a realm ID below.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={raidTarget}
            onChange={e => setRaidTarget(e.target.value)}
            placeholder="Target realm ID..."
            className="flex-1 rounded-lg border border-yellow-900/40 bg-[#1a1207] px-4 py-2 text-sm text-[#e8dcc8] placeholder-yellow-900/60 focus:border-yellow-600 focus:outline-none"
          />
          <button
            onClick={handleRaid}
            disabled={raiding || !raidTarget.trim()}
            className="rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-700 disabled:opacity-50"
          >
            {raiding ? 'Raiding...' : 'Launch Raid'}
          </button>
        </div>
        <p className="mt-2 text-xs text-yellow-800">Requires Knight institution to be staffed.</p>
      </div>

      {/* Event log */}
      <div className="rounded-xl border border-yellow-900/40 bg-[#211808] p-6">
        <h2 className="mb-4 text-lg font-semibold text-yellow-500">Recent Events</h2>
        {events.length === 0 ? (
          <p className="text-sm text-yellow-800">No events yet.</p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 20).map(event => (
              <div key={event.id} className="flex items-start justify-between border-b border-yellow-900/20 pb-2">
                <div>
                  <span className="text-sm font-medium text-yellow-400">{event.eventType}</span>
                  <p className="text-xs text-yellow-700">
                    {JSON.stringify(event.data).slice(0, 80)}
                  </p>
                </div>
                <span className="text-xs text-yellow-800">
                  {new Date(event.occurredAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Realm Map */}
      <div className="rounded-xl border border-yellow-900/40 bg-[#211808] p-6">
        <h2 className="mb-4 text-lg font-semibold text-yellow-500">Realm Map</h2>
        <RealmMap
          centerLat={realm.originLat}
          centerLng={realm.originLng}
          realmName={realm.name}
          realmLegitimacyTier={legitimacy.tier}
          nearbyRealms={nearbyRealms}
          onRaidTarget={(targetId) => setRaidTarget(targetId)}
          height="400px"
        />
        <p className="mt-2 text-xs text-yellow-800">
          Position: ({realm.originLat.toFixed(4)}, {realm.originLng.toFixed(4)})
        </p>
      </div>
    </div>
  );
}
