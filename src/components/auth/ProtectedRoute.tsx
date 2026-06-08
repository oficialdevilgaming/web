"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Basic client-side redirect
    // A more robust app would do this in Next.js proxy.ts using cookies
    if (!isAuthenticated) {
      router.push('/login');
    } else if (adminOnly && user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, adminOnly, user, router, loading]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || (adminOnly && user?.role !== 'admin')) {
    return null; 
  }

  return <>{children}</>;
};

export default ProtectedRoute;
