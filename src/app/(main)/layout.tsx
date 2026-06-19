"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import FloatingContact from "../../components/layout/FloatingContact";
import { Box, CircularProgress } from "@mui/material";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkMaintenance = async () => {
      // Esperar a que el estado de autenticación termine de cargar
      if (authLoading) return;

      // Si el usuario es administrador, saltamos la comprobación de mantenimiento
      if (user?.role === 'admin') {
        setMaintenanceLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('settings')
          .select('maintenance_mode')
          .eq('id', 1)
          .single();

        if (!error && data?.maintenance_mode) {
          router.replace('/maintenance');
        } else {
          setMaintenanceLoading(false);
        }
      } catch (err) {
        console.error('Error checking maintenance mode:', err);
        setMaintenanceLoading(false);
      }
    };

    checkMaintenance();
  }, [user, authLoading, router]);

  if (authLoading || maintenanceLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        bgcolor: '#050505' 
      }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flexGrow: 1 }}>
        {children}
      </main>
      <FloatingContact />
      <Footer />
    </div>
  );
}

