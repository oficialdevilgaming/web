"use client";

import React from 'react';
import { Box, Container, Typography, Link, Stack, Grid } from '@mui/material';
import { Mail, MapPin, Clock } from 'lucide-react';
import NextLink from 'next/link';

const Footer = () => {
  const mapsDirectionsUrl = "https://www.google.com/maps/place/Devil+gaming/@-34.60554,-58.5658073,17z/data=!3m1!4b1!4m6!3m5!1s0x95bcb94c39e7b181:0x56eb15460566652c!8m2!3d-34.6055444!4d-58.5632324!16s%2Fg%2F11mdmtfnvp";

  return (
    <Box sx={{ bgcolor: 'secondary.main', color: 'white', py: 6, mt: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <Container maxWidth="xl">
        <Grid container spacing={5}>
          {/* Brand & Copyright */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={2}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: 1 }}>
                DEVIL<span style={{ color: 'white' }}>GAMING</span>
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.5, maxWidth: 300, lineHeight: 1.6 }}>
                Dominá tu mundo con el estándar de élite en hardware y periféricos premium.
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.3, display: 'block', mt: 1 }}>
                © 2026 <span style={{ color: '#cc0000', fontWeight: 800 }}>DEVIL</span> <span style={{ color: '#ffffff', fontWeight: 800 }}>GAMING</span>. Todos los derechos reservados.
              </Typography>
            </Stack>
          </Grid>

          {/* Quick Links Column */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Stack spacing={3}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: 'white',
                  fontSize: '1.25rem',
                  letterSpacing: '0.02em'
                }}
              >
                Dudas?
              </Typography>
              <Stack spacing={1.5}>
                {[
                  { label: 'Garantía', tab: 'garantia' },
                  { label: 'Envíos', tab: 'envios' },
                  { label: 'Términos', tab: 'terminos' }
                ].map((link) => (
                  <Link
                    key={link.tab}
                    component={NextLink}
                    href={`/info?tab=${link.tab}`}
                    color="inherit"
                    variant="body2"
                    sx={{
                      width: 'fit-content',
                      opacity: 0.7,
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      '&:hover': {
                        opacity: 1,
                        color: 'primary.main',
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </Stack>
          </Grid>

          {/* Contact Column */}
          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
            <Stack spacing={3}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: 'white',
                  fontSize: '1.25rem',
                  letterSpacing: '0.02em'
                }}
              >
                Contactános
              </Typography>

              <Stack spacing={2.5}>
                {/* Direction */}
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box sx={{ color: 'primary.main', mt: 0.5 }}>
                    <MapPin size={20} />
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255,255,255,0.4)',
                        fontWeight: 700,
                        letterSpacing: 1.2,
                        display: 'block',
                        mb: 0.5
                      }}
                    >
                      DIRECCIÓN
                    </Typography>
                    <Link
                      href={mapsDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="inherit"
                      variant="body2"
                      sx={{
                        textDecoration: 'none',
                        fontWeight: 500,
                        opacity: 0.8,
                        transition: 'opacity 0.2s',
                        '&:hover': {
                          opacity: 1,
                          color: 'primary.main'
                        }
                      }}
                    >
                      Justo José de Urquiza 4777, Caseros, Buenos Aires
                    </Link>
                  </Box>
                </Stack>

                {/* Email */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: 'primary.main' }}>
                    <Mail size={20} />
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255,255,255,0.4)',
                        fontWeight: 700,
                        letterSpacing: 1.2,
                        display: 'block',
                        mb: 0.5
                      }}
                    >
                      MAIL
                    </Typography>
                    <Link
                      href="mailto:oficial.devilgaming@gmail.com"
                      color="inherit"
                      variant="body2"
                      sx={{
                        textDecoration: 'none',
                        fontWeight: 500,
                        opacity: 0.8,
                        transition: 'opacity 0.2s',
                        '&:hover': {
                          opacity: 1,
                          color: 'primary.main'
                        }
                      }}
                    >
                      oficial.devilgaming@gmail.com
                    </Link>
                  </Box>
                </Stack>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer;
