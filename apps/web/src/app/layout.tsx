import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Knights & Kings',
  description: 'Medieval realm simulator'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#1a1207] text-[#e8dcc8]">
        <nav className="border-b border-yellow-900/40 bg-[#211808]/80 px-6 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <a href="/" className="text-lg font-bold text-yellow-500">Knights &amp; Kings</a>
            <div className="flex gap-4 text-sm">
              <a href="/" className="text-yellow-600 hover:text-yellow-400">Dashboard</a>
              <a href="/login" className="text-yellow-600 hover:text-yellow-400">Login</a>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
