"use client";

import React from 'react';
import { Box, Typography, Button, Container, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Home, ShoppingBag, AlertTriangle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import FloatingContact from '../components/layout/FloatingContact';

export default function NotFound() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'black' }}>
      <Navbar />
      
      <Box sx={{
        flexGrow: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 8, md: 12 },
        background: `
          linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.95)),
          radial-gradient(at 50% 50%, rgba(204, 0, 0, 0.25) 0px, transparent 60%)
        `,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
          opacity: 0.12,
          zIndex: 0,
        }
      }}>
        {/* Animated glitch/scanline effect */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 4px',
          zIndex: 1,
          pointerEvents: 'none'
        }} />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <Stack spacing={4} alignItems="center">
            
            {/* Animated Warning Icon with Red Pulse Glow */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.1, 1], opacity: 1 }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            >
              <Box sx={{
                display: 'inline-flex',
                p: 2,
                borderRadius: '50%',
                bgcolor: 'rgba(204, 0, 0, 0.1)',
                border: '2px solid rgba(204, 0, 0, 0.3)',
                boxShadow: '0 0 25px rgba(204, 0, 0, 0.2)',
                color: '#cc0000',
                mb: 1
              }}>
                <AlertTriangle size={48} />
              </Box>
            </motion.div>

            {/* Glowing 404 Text */}
            <Box sx={{ position: 'relative' }}>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <Typography variant="h1" sx={{
                  fontSize: { xs: '6rem', sm: '8rem', md: '10rem' },
                  fontWeight: 900,
                  color: 'white',
                  lineHeight: 0.9,
                  letterSpacing: -2,
                  textShadow: '0 0 50px rgba(204,0,0,0.6), 0 0 100px rgba(204,0,0,0.3)'
                }}>
                  404
                </Typography>
              </motion.div>
              
              {/* Decorative side bar line */}
              <Box sx={{
                position: 'absolute',
                bottom: -10,
                left: '25%',
                width: '50%',
                height: '4px',
                background: 'linear-gradient(90deg, transparent, #cc0000, transparent)',
                boxShadow: '0 0 10px #cc0000'
              }} />
            </Box>

            {/* Messages */}
            <Stack spacing={1.5} sx={{ maxWidth: '500px' }}>
              <Typography variant="h4" sx={{
                fontWeight: 900,
                color: 'white',
                fontSize: { xs: '1.5rem', sm: '2rem' },
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                Misión Fallida - Ruta Perdida
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', lineHeight: 1.6 }}>
                El arsenal o componente que estás buscando no se encuentra en esta ubicación. Es posible que haya sido reubicado o que la coordenada sea incorrecta.
              </Typography>
            </Stack>

            {/* Action Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', justifyContent: 'center', pt: 2 }}>
              <Button
                component={Link}
                href="/"
                variant="outlined"
                size="large"
                startIcon={<Home size={18} />}
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: 3,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                Volver al Inicio
              </Button>
              <Button
                component={Link}
                href="/shop"
                variant="contained"
                size="large"
                startIcon={<ShoppingBag size={18} />}
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: 3,
                  bgcolor: '#cc0000',
                  boxShadow: '0 8px 20px rgba(204, 0, 0, 0.3)',
                  '&:hover': {
                    bgcolor: '#e60000',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 25px rgba(204, 0, 0, 0.45)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                Explorar Tienda
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <FloatingContact />
      <Footer />
    </Box>
  );
}
