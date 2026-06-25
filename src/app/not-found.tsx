"use client";

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Container, Stack, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShoppingBag, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkMaintenance = async () => {
      if (authLoading) return;

      // Admins bypass maintenance redirect
      if (user?.role === 'admin') {
        setChecking(false);
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
          return;
        }
      } catch (err) {
        console.error('Error checking maintenance mode:', err);
      }

      setChecking(false);
    };

    checkMaintenance();
  }, [user, authLoading, router]);

  if (authLoading || checking) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#050505' }}>
        <CircularProgress sx={{ color: '#cc0000' }} />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#050505',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background radial glow */}
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '70vw',
        height: '70vw',
        background: 'radial-gradient(circle, rgba(204,0,0,0.18) 0%, rgba(0,0,0,0) 70%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* Scanline overlay */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.22) 50%)',
        backgroundSize: '100% 4px',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Carbon fibre texture */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
        opacity: 0.1,
        zIndex: 0,
      }} />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <Stack spacing={4} alignItems="center">

          {/* Logo / Brand */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Typography sx={{
              fontWeight: 900,
              fontSize: { xs: '1.4rem', sm: '1.8rem' },
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.15)',
            }}>
              <span style={{ color: '#cc0000' }}>DEVIL</span> GAMING
            </Typography>
          </motion.div>

          {/* Animated Warning Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.1, 1], opacity: 1 }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          >
            <Box sx={{
              display: 'inline-flex',
              p: 2,
              borderRadius: '50%',
              bgcolor: 'rgba(204, 0, 0, 0.1)',
              border: '2px solid rgba(204, 0, 0, 0.3)',
              boxShadow: '0 0 30px rgba(204, 0, 0, 0.25)',
              color: '#cc0000',
            }}>
              <AlertTriangle size={52} />
            </Box>
          </motion.div>

          {/* Glowing 404 Text */}
          <Box sx={{ position: 'relative' }}>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <Typography variant="h1" sx={{
                fontSize: { xs: '6rem', sm: '8rem', md: '11rem' },
                fontWeight: 900,
                color: 'white',
                lineHeight: 0.9,
                letterSpacing: -2,
                textShadow: '0 0 50px rgba(204,0,0,0.65), 0 0 120px rgba(204,0,0,0.3)',
              }}>
                404
              </Typography>
            </motion.div>

            {/* Red accent line */}
            <Box sx={{
              position: 'absolute',
              bottom: -12,
              left: '20%',
              width: '60%',
              height: '4px',
              background: 'linear-gradient(90deg, transparent, #cc0000, transparent)',
              boxShadow: '0 0 12px #cc0000',
            }} />
          </Box>

          {/* Messages */}
          <Stack spacing={1.5} sx={{ maxWidth: '500px', pt: 1 }}>
            <Typography variant="h4" sx={{
              fontWeight: 900,
              color: 'white',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Misión Fallida — Ruta Perdida
            </Typography>
            <Typography variant="body1" sx={{
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: '1rem',
              lineHeight: 1.7,
            }}>
              El arsenal o componente que estás buscando no se encuentra en esta ubicación. Es posible que haya sido reubicado o que la coordenada sea incorrecta.
            </Typography>
          </Stack>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          >
            <Button
              component={Link}
              href="/"
              variant="contained"
              size="large"
              startIcon={<ShoppingBag size={20} />}
              sx={{
                py: 1.75,
                px: 5,
                fontSize: '1rem',
                fontWeight: 800,
                borderRadius: 3,
                bgcolor: '#cc0000',
                boxShadow: '0 8px 24px rgba(204, 0, 0, 0.35)',
                letterSpacing: 0.5,
                '&:hover': {
                  bgcolor: '#e60000',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 14px 30px rgba(204, 0, 0, 0.5)',
                },
                transition: 'all 0.2s',
              }}
            >
              Explorar Tienda
            </Button>
          </motion.div>

        </Stack>
      </Container>
    </Box>
  );
}
