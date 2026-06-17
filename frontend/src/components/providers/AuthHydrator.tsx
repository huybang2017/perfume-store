'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useGetProfileQuery } from '@/store/api/authApi';
import { setCredentials, logout } from '@/store/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';

/** Restores Redux auth state from localStorage + profile API after refresh */
export function AuthHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const { token, user } = useAuth();
  const storedToken =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const activeToken = token ?? storedToken;

  const { data, isError, isSuccess } = useGetProfileQuery(undefined, {
    skip: !activeToken || !!user,
  });

  useEffect(() => {
    if (!activeToken) return;
    if (isSuccess && data?.success && data.data) {
      dispatch(
        setCredentials({
          user: data.data,
          token: activeToken,
        }),
      );
    }
    if (isError) {
      dispatch(logout());
    }
  }, [activeToken, isSuccess, isError, data, dispatch]);

  return <>{children}</>;
}
