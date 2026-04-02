'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const DEV_AUTH = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (session?.user) {
    router.replace('/');
    return null;
  }

  async function handleDevLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/auth/dev-login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ externalId: name.trim(), displayName: name.trim() })
        }
      );

      if (!res.ok) throw new Error('Login failed');
      const { userId } = await res.json();
      localStorage.setItem('userId', userId);
      localStorage.setItem('displayName', name.trim());
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-yellow-900/40 bg-[#211808] p-8 shadow-xl">
        <h1 className="mb-6 text-2xl font-bold text-yellow-500">Enter the Realm</h1>

        <div className="space-y-3">
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-yellow-900/40 bg-[#1a1207] px-4 py-3 font-semibold text-[#e8dcc8] hover:border-yellow-600 hover:bg-[#2a1a0a]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          <button
            onClick={() => signIn('discord', { callbackUrl: '/' })}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-yellow-900/40 bg-[#1a1207] px-4 py-3 font-semibold text-[#e8dcc8] hover:border-yellow-600 hover:bg-[#2a1a0a]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#5865F2">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Sign in with Discord
          </button>
        </div>

        {DEV_AUTH && (
          <>
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-yellow-900/40" />
              <span className="text-xs text-yellow-900">DEV MODE</span>
              <div className="h-px flex-1 bg-yellow-900/40" />
            </div>

            <form onSubmit={handleDevLogin} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm text-yellow-600">
                  Dev Login — Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full rounded-lg border border-yellow-900/40 bg-[#1a1207] px-4 py-2 text-[#e8dcc8] placeholder-yellow-900/60 focus:border-yellow-600 focus:outline-none"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full rounded-lg bg-yellow-700 px-4 py-2 font-semibold text-[#1a1207] hover:bg-yellow-600 disabled:opacity-50"
              >
                {loading ? 'Entering...' : 'Dev Login'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
