'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function useAuth() {
  const { data: session, status } = useSession();
  const [devUserId, setDevUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDevUserId(localStorage.getItem('userId'));
    }
  }, []);

  const isAuthenticated = status === 'authenticated' || !!devUserId;
  const isLoading = status === 'loading';

  return { session, isAuthenticated, isLoading, devUserId };
}
