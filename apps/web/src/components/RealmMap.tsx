'use client';

import dynamic from 'next/dynamic';
import type { RealmMapProps } from './RealmMapInner';

const RealmMapInner = dynamic(() => import('./RealmMapInner'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center rounded-xl border border-yellow-900/40 bg-[#1a1207]"
      style={{ height: '400px' }}
    >
      <p className="text-yellow-700">Loading map...</p>
    </div>
  )
});

export default function RealmMap(props: RealmMapProps) {
  return <RealmMapInner {...props} />;
}
