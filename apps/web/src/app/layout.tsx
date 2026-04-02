import './globals.css';
import type { ReactNode } from 'react';
import Providers from '../components/Providers';
import Nav from '../components/Nav';

export const metadata = {
  title: 'Knights & Kings',
  description: 'Medieval realm simulator'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#1a1207] text-[#e8dcc8]">
        <Providers>
          <Nav />
          <main className="mx-auto max-w-6xl px-6 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
