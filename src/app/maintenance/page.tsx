"use client";

import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, CircularProgress } from '@mui/material';
import { Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

const MaintenancePage = () => {
  const [message, setMessage] = useState('Estamos realizando mejoras en el sistema. Volveremos pronto.');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaintenanceMessage = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('maintenance_message, maintenance_mode')
          .eq('id', 1)
          .single();

        if (data) {
          if (data.maintenance_message) {
            setMessage(data.maintenance_message);
          }
          // Si por alguna razón accedieron aquí y el mantenimiento está apagado, redirigir
          if (data.maintenance_mode === false) {
            window.location.href = '/';
          }
        }
      } catch (err) {
        console.error('Error fetching maintenance info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceMessage();
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#050505',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background gradients */}
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle, rgba(204,0,0,0.15) 0%, rgba(0,0,0,0) 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            >
              <SettingsIcon size={80} color="#cc0000" />
            </motion.div>
          </Box>

          <Typography variant="h1" sx={{
            fontWeight: 900,
            fontSize: { xs: '3rem', md: '5rem' },
            lineHeight: 1,
            mb: 3,
            background: 'linear-gradient(90deg, #ffffff, #aaaaaa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            <span style={{ WebkitTextFillColor: '#cc0000' }}>DEVIL </span>GAMING
          </Typography>

          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
            Estamos en Mantenimiento
          </Typography>

          <Typography variant="body1" sx={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '1.2rem',
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.6
          }}>
            {message}
          </Typography>

          <Box sx={{ mt: 8, display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={30} thickness={5} sx={{ color: 'rgba(255,255,255,0.2)', mb: 2 }} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
              Actualizando Sistemas
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default MaintenancePage;
