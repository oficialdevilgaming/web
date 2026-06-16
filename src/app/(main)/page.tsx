"use client";

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container, Grid, Paper, Stack, CircularProgress, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { supabase } from '../../lib/supabase';
import ProductCard from '../../components/product/ProductCard';
import GoogleReviews from '../../components/layout/GoogleReviews';
import { getCDNUrl } from '../../lib/imageUtils';
import { ArrowRight, Truck, ShieldCheck, Zap, Headphones, Cpu, Monitor, ChevronLeft, ChevronRight, RefreshCcw, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface HeroProps {
  banners: any[];
  loading: boolean;
}

const Hero = ({ banners, loading }: HeroProps) => {
  if (loading) {
    return (
      <Box sx={{
        width: '100%',
        height: { xs: 'auto', md: '70vh' },
        minHeight: { xs: '500px', md: '550px' },
        bgcolor: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (banners.length === 0) {
    return (
      <Box sx={{
        width: '100%',
        height: { xs: 'auto', md: '70vh' }, // Altura más compacta para notebooks
        minHeight: { xs: '500px', md: '550px' },
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#000000ff',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 6, md: 0 }
      }}>
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Video Overlay / Darkening Gradient */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)),
            radial-gradient(at 0% 0%, rgba(204, 0, 0, 0.2) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(204, 0, 0, 0.2) 0px, transparent 50%)
          `,
          zIndex: 0,
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
            opacity: 0.1,
          }
        }} />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="overline" color="primary.main" sx={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: 5, display: 'block', mb: 1 }}>
                ESTÁNDAR DE ÉLITE
              </Typography>
              <Typography variant="h1" color="white" sx={{
                mb: 1.5,
                fontSize: { xs: '2.2rem', md: '3.4rem' },
                lineHeight: 1.1,
                fontWeight: 900,
                textShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}>
                DOMINA TU MUNDO <br />
                CON{' '}
                <motion.span
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{
                    display: 'inline-block',
                    textShadow: '0 0 40px rgba(255,0,0,0.6)'
                  }}
                >
                  <span style={{ color: '#cc0000' }}>DEVIL</span>{' '}
                  <span style={{ color: '#ffffff' }}>GAMING</span>
                </motion.span>
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
                <Button
                  component={Link}
                  href="/shop"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowRight />}
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    borderRadius: 3,
                    boxShadow: '0 10px 20px rgba(204, 0, 0, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 15px 30px rgba(204, 0, 0, 0.4)',
                    },
                    transition: 'all 0.3s'
                  }}
                >
                  Explorar Arsenal
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box >
    );
  }

  return (
    <Box sx={{
      width: '100%',
      height: { xs: 'auto', md: '70vh' },
      minHeight: { xs: '500px', md: '550px' },
      position: 'relative',
      overflow: 'hidden',
      bgcolor: 'black',
    }}>
      <style>{`
        .hero-swiper .swiper-pagination {
          bottom: 20px !important;
        }
        .hero-swiper .swiper-pagination-bullet {
          width: 10px !important;
          height: 10px !important;
          background: rgba(255,255,255,0.45) !important;
          opacity: 1 !important;
          transition: all 0.3s ease !important;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: white !important;
          transform: scale(1.3) !important;
          box-shadow: 0 0 8px rgba(255,255,255,0.9) !important;
        }
      `}</style>
      <Swiper
        className="hero-swiper"
        modules={[Navigation, Pagination, Autoplay]}
        navigation={{
          prevEl: '#hero-prev',
          nextEl: '#hero-next',
        }}
        pagination={{ clickable: true }}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        loop={banners.length > 1}
        style={{ width: '100%', height: '100%' }}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <Box sx={{
              width: '100%',
              height: '100%',
              minHeight: { xs: '500px', md: '550px' },
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
            }}>
              {/* Background image using img tag for reliability */}
              <Box
                component="img"
                src={getCDNUrl(banner.image_url)}
                alt={banner.title || 'Banner'}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  zIndex: 0,
                }}
              />

              {/* Overlay / Darkening Gradient */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: `
                  linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.75)),
                  radial-gradient(at 0% 0%, rgba(204, 0, 0, 0.15) 0px, transparent 50%),
                  radial-gradient(at 100% 100%, rgba(204, 0, 0, 0.15) 0px, transparent 50%)
                `,
                zIndex: 1,
              }} />

              {/* Text content overlay */}
              {(banner.title || banner.subtitle || banner.button_text) && (
                <Container
                  maxWidth="xl"
                  sx={{
                    position: 'relative',
                    zIndex: 2,
                    py: { xs: 6, md: 0 },
                    // Padding horizontal para que el texto no quede debajo de las flechas
                    px: { xs: '60px', md: '90px' },
                  }}
                >
                  <Grid container spacing={4} alignItems="center">
                    <Grid size={{ xs: 12, md: 7 }}>
                      {banner.subtitle && (
                        <Typography
                          variant="overline"
                          color="primary.main"
                          sx={{
                            fontWeight: 900,
                            fontSize: '0.9rem',
                            letterSpacing: 5,
                            display: 'block',
                            mb: 1,
                            textTransform: 'uppercase',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                          }}
                        >
                          {banner.subtitle}
                        </Typography>
                      )}

                      {banner.title && (
                        <Typography
                          variant="h1"
                          color="white"
                          sx={{
                            mb: 3,
                            fontSize: { xs: '2.2rem', md: '3.4rem' },
                            lineHeight: 1.1,
                            fontWeight: 900,
                            textShadow: '0 4px 10px rgba(0,0,0,0.8)'
                          }}
                        >
                          {banner.title}
                        </Typography>
                      )}

                      {banner.button_text && (
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
                          <Button
                            component={Link}
                            href={banner.button_link || '/shop'}
                            variant="contained"
                            size="large"
                            endIcon={<ArrowRight />}
                            sx={{
                              py: 1.5,
                              px: 4,
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              borderRadius: 3,
                              boxShadow: '0 10px 20px rgba(204, 0, 0, 0.3)',
                              '&:hover': {
                                transform: 'translateY(-3px)',
                                boxShadow: '0 15px 30px rgba(204, 0, 0, 0.4)',
                              },
                              transition: 'all 0.3s'
                            }}
                          >
                            {banner.button_text}
                          </Button>
                        </Stack>
                      )}
                    </Grid>
                  </Grid>
                </Container>
              )}
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <IconButton
            id="hero-prev"
            sx={{
              position: 'absolute',
              left: { xs: 8, md: 20 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: 'white',
              color: 'black',
              width: { xs: 36, md: 48 },
              height: { xs: 36, md: 48 },
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.92)',
                transform: 'translateY(-50%) scale(1.08)',
              },
              transition: 'all 0.2s',
            }}
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </IconButton>

          <IconButton
            id="hero-next"
            sx={{
              position: 'absolute',
              right: { xs: 8, md: 20 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: 'white',
              color: 'black',
              width: { xs: 36, md: 48 },
              height: { xs: 36, md: 48 },
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.92)',
                transform: 'translateY(-50%) scale(1.08)',
              },
              transition: 'all 0.2s',
            }}
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </IconButton>
        </>
      )}
    </Box>
  );
};

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<any[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, discount, stock, images, category_id, category:categories(name)')
        .eq('featured', true)
        .limit(8);

      if (!error) {
        setFeaturedProducts(data || []);
      }
      setLoading(false);
    };

    const fetchBanners = async () => {
      setBannersLoading(true);
      try {
        const { data, error } = await supabase
          .from('hero_banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error) {
          setBanners(data || []);
        }
      } catch (err) {
        console.error("Error fetching banners:", err);
      } finally {
        setBannersLoading(false);
      }
    };

    fetchFeatured();
    fetchBanners();
  }, []);

  return (
    <Box>
      <Hero banners={banners} loading={bannersLoading} />

      {/* GPU Trade-in Service Section */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <motion.div
          animate={{
            y: [0, -15, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Box sx={{
            position: 'relative',
            overflow: 'hidden',
            bgcolor: '#050505',
            borderRadius: { xs: 6, md: 8 },
            backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(204, 0, 0, 0.2) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(204, 0, 0, 0.15) 0%, transparent 40%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(204,0,0,0.1)',
            p: { xs: 4, md: 6 }
          }}>
            <Grid container spacing={6} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <Typography variant="overline" color="primary" sx={{ fontWeight: 900, letterSpacing: 4 }}>
                    SERVICIO EXCLUSIVO DEVIL GAMING
                  </Typography>
                  <Typography variant="h2" color="white" sx={{ fontWeight: 900, mt: 1, mb: 3, lineHeight: 1 }}>
                    CANJE DE{' '}<br />
                    <span style={{ color: '#cc0000' }}>PLACAS DE VIDEO</span>
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, maxWidth: 500, fontSize: '1.1rem' }}>
                    ¿Querés dar el salto a la próxima generación? Traé tu placa de video usada, la tasamos en el momento y te llevás la que quieras pagando solo la diferencia.
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                    Consultá disponibilidad por WhatsApp antes de venir.
                  </Typography>
                </motion.div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  style={{ position: 'relative' }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '80%',
                      height: '80%',
                      bgcolor: 'primary.main',
                      filter: 'blur(100px)',
                      opacity: 0.2,
                      zIndex: 0
                    }}
                  />
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      bgcolor: 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      position: 'relative',
                      zIndex: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Stack spacing={3}>
                      {[
                        { icon: <Cpu color="#cc0000" />, step: "Paso 1", label: "Traé tu placa de video usada" },
                        { icon: <RefreshCcw color="#cc0000" />, step: "Paso 2", label: "La tasamos en el momento" },
                        { icon: <Zap color="#cc0000" />, step: "Paso 3", label: "Pagás solo la diferencia y te la llevás" }
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + (i * 0.1) }}
                        >
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(204,0,0,0.1)', borderRadius: 2 }}>{item.icon}</Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{item.step}</Typography>
                              <Typography variant="body1" sx={{ color: 'white', fontWeight: 800 }}>{item.label}</Typography>
                            </Box>
                          </Box>
                        </motion.div>
                      ))}
                    </Stack>
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>
          </Box>
        </motion.div>
      </Container>

      {/* Featured Carousel */}
      <Box sx={{ py: 2.5 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, mb: 1, gap: { xs: .5, md: 0 } }}>
            <Box>
              <Typography variant="h2" sx={{
                fontWeight: 900,
                background: 'linear-gradient(90deg, #ff0000, #cc0000)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                textShadow: '0 0 20px rgba(255,0,0,0.15)',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' }
              }}>
                Productos Destacados
              </Typography>
            </Box>
            <Button component={Link} href="/shop?featured=true" endIcon={<ArrowRight size={20} />} sx={{ fontWeight: 700 }}>
              Ver Todos
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress /></Box>
          ) : featuredProducts.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={30}
              slidesPerView={1}
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000 }}
              breakpoints={{
                640: { slidesPerView: 2 },
                960: { slidesPerView: 3 },
                1200: { slidesPerView: 4 },
                1536: { slidesPerView: 5 },
              }}
              style={{ padding: '20px 5px 50px 5px' }}
            >
              {featuredProducts.map((product) => (
                <SwiperSlide key={product.id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <Typography variant="body1" align="center" color="text.secondary">Añade productos en el panel de administrador para verlos aquí.</Typography>
          )}
        </Container>
      </Box>

      <GoogleReviews />

    </Box>
  );
};

export default HomePage;
