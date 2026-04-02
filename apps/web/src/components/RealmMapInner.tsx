'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { NearbyRealm } from '../lib/api';

// Gold crown icon for player's realm
const crownIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    font-size: 22px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
  ">&#x1F451;</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Preview marker for placement
const previewIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 24px; height: 24px; border-radius: 50%; border: 3px solid #eab308;
    background: rgba(234,179,8,0.3); box-shadow: 0 0 12px rgba(234,179,8,0.5);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

function getTierColor(tier: string): string {
  switch (tier) {
    case 'Sovereign': return '#34d399';
    case 'Established': return '#22c55e';
    case 'Contested': return '#eab308';
    case 'Fragile': return '#f97316';
    case 'Illegitimate': return '#ef4444';
    default: return '#a3a3a3';
  }
}

function makeNearbyIcon(tier: string) {
  const color = getTierColor(tier);
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 16px; height: 16px; border-radius: 50%; border: 2px solid ${color};
      background: ${color}44; box-shadow: 0 0 8px ${color}80;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [map, lat, lng]);
  return null;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export interface RealmMapProps {
  centerLat: number;
  centerLng: number;
  realmName?: string;
  realmLegitimacyTier?: string;
  nearbyRealms?: NearbyRealm[];
  onRaidTarget?: (realmId: string) => void;
  // Placement mode (for Create Realm modal)
  placementMode?: boolean;
  placementLat?: number | null;
  placementLng?: number | null;
  onPlacement?: (lat: number, lng: number) => void;
  height?: string;
}

export default function RealmMapInner({
  centerLat,
  centerLng,
  realmName,
  realmLegitimacyTier,
  nearbyRealms = [],
  onRaidTarget,
  placementMode = false,
  placementLat,
  placementLng,
  onPlacement,
  height = '400px'
}: RealmMapProps) {
  return (
    <div
      style={{ height, width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}
      className="realm-map-container"
    >
      <style>{`
        .realm-map-container .leaflet-container {
          background: #1a1207;
          height: 100%;
          width: 100%;
        }
        .realm-map-container .leaflet-tile-pane {
          filter: saturate(0.3) sepia(0.5) brightness(0.7);
        }
        .realm-map-container .leaflet-control-zoom a {
          background: #211808 !important;
          color: #eab308 !important;
          border-color: #422006 !important;
        }
        .realm-map-container .leaflet-control-zoom a:hover {
          background: #422006 !important;
        }
        .realm-map-container .leaflet-control-attribution {
          background: rgba(26, 18, 7, 0.8) !important;
          color: #a16207 !important;
          font-size: 10px;
        }
        .realm-map-container .leaflet-control-attribution a {
          color: #ca8a04 !important;
        }
        .realm-map-container .leaflet-popup-content-wrapper {
          background: #211808;
          color: #e8dcc8;
          border: 1px solid #422006;
          border-radius: 8px;
        }
        .realm-map-container .leaflet-popup-tip {
          background: #211808;
          border: 1px solid #422006;
        }
        .realm-map-container .leaflet-popup-close-button {
          color: #a16207 !important;
        }
      `}</style>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={placementMode ? 3 : 6}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
          url="https://tile.opentopomap.org/{z}/{x}/{y}.png"
          maxZoom={17}
        />

        <RecenterMap lat={centerLat} lng={centerLng} />

        {placementMode && onPlacement && (
          <ClickHandler onClick={onPlacement} />
        )}

        {/* Player's realm marker (non-placement mode) */}
        {!placementMode && realmName && (
          <Marker position={[centerLat, centerLng]} icon={crownIcon}>
            <Popup>
              <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                <strong style={{ color: '#eab308' }}>{realmName}</strong>
                {realmLegitimacyTier && (
                  <div style={{ color: getTierColor(realmLegitimacyTier), marginTop: 4 }}>
                    {realmLegitimacyTier}
                  </div>
                )}
                <div style={{ color: '#a16207', marginTop: 2, fontSize: '11px' }}>Your Realm</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Placement preview marker */}
        {placementMode && placementLat != null && placementLng != null && (
          <Marker position={[placementLat, placementLng]} icon={previewIcon}>
            <Popup>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#eab308' }}>
                New Realm Location<br />
                ({placementLat.toFixed(2)}, {placementLng.toFixed(2)})
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearby realm markers */}
        {nearbyRealms.map(r => (
          <Marker key={r.id} position={[r.originLat, r.originLng]} icon={makeNearbyIcon(r.legitimacyTier)}>
            <Popup>
              <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                <strong style={{ color: '#e8dcc8' }}>{r.name}</strong>
                <div style={{ color: getTierColor(r.legitimacyTier), marginTop: 4 }}>
                  {r.legitimacyTier} ({Math.round(r.legitimacyScore)})
                </div>
                <div style={{ color: '#a16207', marginTop: 2, fontSize: '11px' }}>
                  Ruler: {r.ownerDisplayName}
                </div>
                {onRaidTarget && (
                  <button
                    onClick={() => onRaidTarget(r.id)}
                    style={{
                      marginTop: 8,
                      padding: '4px 12px',
                      background: '#991b1b',
                      color: '#fecaca',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = '#b91c1c')}
                    onMouseOut={e => (e.currentTarget.style.background = '#991b1b')}
                  >
                    Launch Raid
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
