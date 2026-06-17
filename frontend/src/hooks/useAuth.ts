'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

export function useAuth() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const storedToken =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const accessToken = token ?? storedToken;

  return {
    user,
    token: accessToken,
    isAuthenticated: !!accessToken,
    isAdmin: user?.role === 'admin' || user?.role === 'staff',
  };
}
