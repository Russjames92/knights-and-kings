'use client';

import { useEffect, useState } from 'react';
import { getMyRealms, createRealm, getRegions } from '../lib/api';
import type { Realm, Region } from '../lib/api';
import RealmMap from '../components/RealmMap';
import { useAuth } from '../lib/useAuth';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [realms, setRealms] = useState<Realm[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [creating, setCreating] = useState(false);
  const [placementLat, setPlacementLat] = useState<number | null>(null);
  const [placementLng, setPlacementLng] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    loadData();
  }, [isAuthenticated, authLoading]);

  async function loadData() {
    try {
      const [realmData, regionData] = await Promise.all([getMyRealms(), getRegions()]);
      setRealms(realmData.realms);
      setRegions(regionData.regions);
      if (regionData.regions.length > 0) {
        setSelectedRegion(regionData.regions[0].id);
      }
    } catch {
      // If auth fails, redirect to login
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !selectedRegion) return;
    if (placementLat === null || placementLng === null) {
      alert('Click on the map to choose a location for your realm.');
      return;
    }

    setCreating(true);
    try {
      await createRealm({
        name: newName.trim(),
        originLat: placementLat,
        originLng: placementLng,
        regionId: selectedRegion
      });
      setNewName('');
      setPlacementLat(null);
      setPlacementLng(null);
      setShowCreate(false);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create realm');
    } finally {
      setCreating(false);
    }
  }

  function getTierColor(score: number): string {
    if (score <= 20) return 'text-red-400';
    if (score <= 40) return 'text-orange-400';
    if (score <= 60) return 'text-yellow-400';
    if (score <= 80) return 'text-green-400';
    return 'text-emerald-400';
  }

  if (loading) {
    return <div className="py-12 text-center text-yellow-600">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-yellow-500">Your Realms</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-yellow-700 px-4 py-2 font-semibold text-[#1a1207] hover:bg-yellow-600"
        >
          {showCreate ? 'Cancel' : 'Create Realm'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-xl border border-yellow-900/40 bg-[#211808] p-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-yellow-600">Realm Name</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Name your realm..."
              className="w-full rounded-lg border border-yellow-900/40 bg-[#1a1207] px-4 py-2 text-[#e8dcc8] placeholder-yellow-900/60 focus:border-yellow-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-yellow-600">Region</label>
            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              className="w-full rounded-lg border border-yellow-900/40 bg-[#1a1207] px-4 py-2 text-[#e8dcc8] focus:border-yellow-600 focus:outline-none"
            >
              {regions.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-yellow-600">Location (click the map)</label>
            <RealmMap
              centerLat={placementLat ?? 30}
              centerLng={placementLng ?? 10}
              placementMode={true}
              placementLat={placementLat}
              placementLng={placementLng}
              onPlacement={(lat, lng) => {
                setPlacementLat(lat);
                setPlacementLng(lng);
              }}
              height="300px"
            />
            {placementLat !== null && placementLng !== null && (
              <p className="mt-1 text-xs text-yellow-700">
                Selected: ({placementLat.toFixed(2)}, {placementLng.toFixed(2)})
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={creating || !newName.trim() || placementLat === null}
            className="rounded-lg bg-yellow-700 px-6 py-2 font-semibold text-[#1a1207] hover:bg-yellow-600 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Found Realm'}
          </button>
        </form>
      )}

      {realms.length === 0 ? (
        <div className="rounded-xl border border-yellow-900/40 bg-[#211808] p-12 text-center">
          <p className="text-lg text-yellow-600">No realms yet. Create your first realm to begin!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {realms.map(realm => (
            <a
              key={realm.id}
              href={`/realm/${realm.id}`}
              className="block rounded-xl border border-yellow-900/40 bg-[#211808] p-6 transition hover:border-yellow-700"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-yellow-400">{realm.name}</h2>
                {realm.isInterregnum && (
                  <span className="rounded bg-red-900/60 px-2 py-0.5 text-xs text-red-300">Interregnum</span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-yellow-700">Legitimacy</span>
                  <p className={`font-semibold ${getTierColor(realm.legitimacyScore)}`}>
                    {Math.round(realm.legitimacyScore)}
                  </p>
                </div>
                <div>
                  <span className="text-yellow-700">Wealth</span>
                  <p className="font-semibold text-yellow-300">{realm.wealth}</p>
                </div>
                <div>
                  <span className="text-yellow-700">Population</span>
                  <p className="font-semibold text-yellow-300">{realm.population}</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-yellow-800">
                {realm.institutionSlots?.filter(s => s.installedCardId).length ?? 0}/
                {realm.institutionSlots?.length ?? 0} institutions staffed
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
