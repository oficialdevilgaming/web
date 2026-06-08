"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Paper, Avatar, Rating, Stack, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';

const GoogleReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState<number>(5.0);
  const [reviewsCount, setReviewsCount] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const data = await res.json();
          if (data.rating) {
            setRating(data.rating);
            console.log(data);
          }
          setReviewsCount(data.reviewsCount || 0);
          const mapped = (data.reviews || []).map((r: any) => ({
            author_name: r.author_name || r.user?.name || "Usuario de Google",
            rating: r.rating || 5,
            text: r.text || r.snippet || "",
            time: r.time || r.date || "Reseña de Google",
          }));
          setReviews(mapped);
        } else {
          throw new Error("HTTP error " + res.status);
        }
      } catch (e) {
        console.error("Error fetching reviews from local API, loading fallback:", e);
        // Direct client fallback
        setReviews([
          { author_name: "Waldemar Perez", rating: 5, text: "Excelente atención. No tienen por qué desconfiar, compren con seguridad que por algo tiene muchísimas reseñas positivas. Le compré una rx6800xt full box, con los sellos de seguridad que nunca fue abierta. Le...", time: "Reseña de Google" },
          { author_name: "Leito \"Black\" Maldonado", rating: 5, text: "No serán las mejores fotos y hay mucho que acomodar pero lo prometido es deuda. La verdad la atención 10 puntos, maxi un genio gracias por el aguante y la paciencia, gente super confiable no duden. Suerte co...", time: "Reseña de Google" },
          { author_name: "Agus Reds", rating: 5, text: "La placa en 2 dias ya la tenia en el correo bien embalada e impecable. Me mando mil videos de test y la estoy usando para jugar todo en ultra anda perfecto!", time: "Reseña de Google" }
        ]);
        setRating(5.0);
      }
    };

    fetchReviews();
  }, []);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setActiveIndex(index);
    }
  };

  const handleBulletClick = (index: number) => {
    if (scrollContainerRef.current) {
      const clientWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({
        left: index * clientWidth,
        behavior: 'smooth'
      });
      setActiveIndex(index);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Box sx={{ py: 3, bgcolor: '#f4f4f4', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <Container maxWidth="xl">
        {/* Title */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              color: 'black',
              fontSize: { xs: '2rem', md: '2.75rem' },
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              mb: 2
            }}
          >
            Lo que los <span style={{ color: '#cc0000', textShadow: '0 0 25px rgba(204,0,0,0.5)' }}>Gamers dicen</span>
          </Typography>

          {/* Business Google Rating Badge */}
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ mt: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'black' }}>
              {rating.toFixed(1)}
            </Typography>
            <Rating
              value={rating}
              precision={0.1}
              readOnly
              sx={{
                color: '#ffc107',
                '& .MuiRating-iconFilled': {
                  color: '#ffc107'
                }
              }}
            />
            {reviewsCount > 0 && (
              <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.5)', fontWeight: 600 }}>
                {reviewsCount} opiniones en Google
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Carousel / Grid Container */}
        <Box sx={{ position: 'relative', width: '100%', mb: 4 }}>
          <Box
            ref={scrollContainerRef}
            onScroll={handleScroll}
            sx={{
              display: 'flex',
              gap: 3,
              overflowX: 'auto',
              scrollSnapType: isMobile ? 'x mandatory' : 'none',
              scrollbarWidth: 'none', // Firefox
              '&::-webkit-scrollbar': {
                display: 'none' // Safari/Chrome
              },
              pt: 1.5, // Space at the top to prevent clipping card hover translation
              pb: 2.5, // Space at the bottom to prevent clipping card hover shadows
              px: { xs: 1, md: 2 }
            }}
          >
            {reviews.map((review, idx) => (
              <Box
                key={idx}
                component={motion.div}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                sx={{
                  flex: { xs: '0 0 100%', md: '1 1 0px' },
                  minWidth: { xs: '280px', md: '300px' },
                  scrollSnapAlign: 'center',
                  display: 'flex',
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    width: '100%',
                    bgcolor: '#000000ff',
                    border: '1px solid rgba(204, 0, 0, 0.23)',
                    backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(204, 0, 0, 0.2) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(204, 0, 0, 0.15) 0%, transparent 40%)',
                    borderRadius: 4,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      borderColor: 'rgba(204,0,0,0.4)',
                      transform: 'translateY(-6px)'
                    }
                  }}
                >
                  <Box>
                    {/* Header */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: '#000000',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          width: 44,
                          height: 44,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
                        }}
                      >
                        {getInitials(review.author_name)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'white' }}>
                          {review.author_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                          {review.time}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Stars */}
                    <Rating
                      value={review.rating}
                      readOnly
                      size="small"
                      sx={{
                        mb: 2,
                        color: '#ffc107',
                        '& .MuiRating-iconFilled': {
                          color: '#ffc107'
                        }
                      }}
                    />

                    {/* Text */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        fontStyle: 'italic',
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      "{review.text}"
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Bullets (Only visible on mobile) */}
        {isMobile && reviews.length > 0 && (
          <Stack
            direction="row"
            spacing={1.5}
            justifyContent="center"
          >
            {reviews.map((_, idx) => (
              <Box
                key={idx}
                onClick={() => handleBulletClick(idx)}
                sx={{
                  width: activeIndex === idx ? 12 : 8,
                  height: activeIndex === idx ? 12 : 8,
                  borderRadius: '50%',
                  bgcolor: activeIndex === idx ? 'primary.main' : 'rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: 'primary.light'
                  }
                }}
              />
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default GoogleReviews;
