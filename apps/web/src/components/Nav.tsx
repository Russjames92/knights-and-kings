'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function Nav() {
  const { data: session, status } = useSession();
  const [devDisplayName, setDevDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDevDisplayName(localStorage.getItem('displayName'));
    }
  }, []);

  const isDevAuth = !session?.user && !!devDisplayName;

  function handleDevSignOut() {
    localStorage.removeItem('userId');
    localStorage.removeItem('displayName');
    window.location.href = '/login';
  }

  return (
    <nav className="border-b border-yellow-900/40 bg-[#211808]/80 px-6 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <a href="/" className="text-lg font-bold text-yellow-500">
          Knights &amp; Kings
        </a>
        <div className="flex items-center gap-4 text-sm">
          <a href="/" className="text-yellow-600 hover:text-yellow-400">
            Dashboard
          </a>
          {status === 'loading' ? null : session?.user ? (
            <div className="flex items-center gap-3">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-7 w-7 rounded-full border border-yellow-900/40"
                />
              )}
              <span className="text-yellow-500">
                {session.user.name ?? session.user.email ?? 'Player'}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-yellow-600 hover:text-yellow-400"
              >
                Sign Out
              </button>
            </div>
          ) : isDevAuth ? (
            <div className="flex items-center gap-3">
              <span className="text-yellow-500">{devDisplayName}</span>
              <button
                onClick={handleDevSignOut}
                className="text-yellow-600 hover:text-yellow-400"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <a href="/login" className="text-yellow-600 hover:text-yellow-400">
              Login
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
