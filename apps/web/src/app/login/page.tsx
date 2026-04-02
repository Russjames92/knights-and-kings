'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
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
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm text-yellow-600">
              Your Name
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
            {loading ? 'Entering...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
