"use client";

import React from 'react';
import { Box, Container, Typography, Paper, Grid, Stack, Button } from '@mui/material';
import { MapPin, Clock, Compass, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const LocationCard = () => {
  const mapUrl = "https://maps.google.com/maps?q=Devil%20gaming,%20Justo%20Jos%C3%A9%20de%20Urquiza%204777,%20Caseros&t=&z=16&ie=UTF8&iwloc=&output=embed";
  const mapsDirectionsUrl = "https://www.google.com/maps/place/Devil+gaming/@-34.60554,-58.5658073,17z/data=!3m1!4b1!4m6!3m5!1s0x95bcb94c39e7b181:0x56eb15460566652c!8m2!3d-34.6055444!4d-58.5632324!16s%2Fg%2F11mdmtfnvp";

  return (
    <Container maxWidth="xl" sx={{ py: 10 }}>
      {/* Title */}
      <Box sx={{ textIndent: 0, textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            background: 'linear-gradient(90deg, #0c0b0bff, #c71818ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
            textShadow: '0 0 20px rgba(255,255,255,0.05)'
          }}
        >
          Vení a Nuestro Local
        </Typography>
      </Box>

      {/* Main Card */}
      <Paper
        elevation={0}
        component={motion.div}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        sx={{
          bgcolor: '#121212',
          border: '1px solid rgba(255,0,0,0.15)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3), 0 0 30px rgba(204,0,0,0.05)',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <Grid container alignItems="stretch">
          {/* Map iframe Column */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ minHeight: { xs: '300px', md: '450px' } }}>
            <Box
              component="iframe"
              title="Devil Gaming Location"
              src={mapUrl}
              sx={{
                width: '100%',
                height: '100%',
                border: 'none',
                filter: 'invert(90%) hue-rotate(180deg) grayscale(20%) contrast(90%)',
                opacity: 0.9,
                display: 'block'
              }}
              allowFullScreen
              loading="lazy"
            />
          </Grid>

          {/* Details Column */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
            <Stack
              justifyContent="center"
              spacing={4}
              sx={{
                p: { xs: 4, sm: 6, md: 8 },
                width: '100%',
                color: 'white',
                position: 'relative'
              }}
            >
              {/* Decorative Red Line Accent */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: { xs: '100%', md: 4 },
                  height: { xs: 4, md: '100%' },
                  bgcolor: 'primary.main',
                  boxShadow: '0 0 15px #cc0000'
                }}
              />

              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: 'white' }}>
                  <span style={{ color: '#cc0000' }}>DEVIL</span> GAMING
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  Tu tienda gamer preferida en Zona Oeste. Vení a retirar tus compras y asesorarte con los que saben.
                </Typography>
              </Box>

              <Stack spacing={3.5}>
                {/* Location Info */}
                <Stack direction="row" spacing={2.5} alignItems="flex-start">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      bgcolor: 'rgba(204,0,0,0.1)',
                      color: 'primary.main',
                      border: '1px solid rgba(204,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MapPin size={24} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1.5, display: 'block', mb: 0.5 }}>
                      DIRECCIÓN
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      Justo José de Urquiza 4777
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Caseros, Buenos Aires
                    </Typography>
                  </Box>
                </Stack>

                {/* Schedule Info */}
                <Stack direction="row" spacing={2.5} alignItems="flex-start">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      bgcolor: 'rgba(204,0,0,0.1)',
                      color: 'primary.main',
                      border: '1px solid rgba(204,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Clock size={24} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 1.5, display: 'block', mb: 0.5 }}>
                      DÍAS Y HORARIOS
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      Martes a Sábado
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      15:00 a 19:00 hrs
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

              {/* Action Button */}
              <Box>
                <Button
                  component="a"
                  href={mapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<Compass size={18} />}
                  sx={{
                    py: 1.8,
                    px: 4,
                    fontWeight: 800,
                    borderRadius: 3,
                    boxShadow: '0 8px 25px rgba(204,0,0,0.3)',
                    '&:hover': {
                      boxShadow: '0 12px 30px rgba(204,0,0,0.5)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s'
                  }}
                >
                  CÓMO LLEGAR
                </Button>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default LocationCard;
