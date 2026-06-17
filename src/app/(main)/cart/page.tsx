"use client";

import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  IconButton,
  Stack,
  Divider,
  Link,
  Breadcrumbs
} from '@mui/material';
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import NextLink from 'next/link';

import { useCart } from '../../../context/CartContext';
import { getCDNUrl } from '../../../lib/imageUtils';

const CartPage = () => {
  const { state, dispatch } = useCart();

  const originalTotal = state.items.reduce((acc: number, item: any) => {
    return acc + item.price * item.quantity;
  }, 0);

  const discountTotal = state.items.reduce((acc: number, item: any) => {
    return acc + (item.price * (item.discount || 0) / 100) * item.quantity;
  }, 0);

  const subtotal = originalTotal - discountTotal;
  const shipping = subtotal > 500 ? 0 : 15;
  const total = subtotal + shipping;

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const handleRemove = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  if (state.items.length === 0) {
    return (
      <Box sx={{ bgcolor: '#f4f4f4', minHeight: '80vh', py: 10 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Paper elevation={0} sx={{ p: 8, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>Tu carrito está vacío</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Parece que aún no has añadido nada. Explora nuestras ofertas en hardware gaming.
            </Typography>
            <Button
              component={NextLink}
              href="/shop"
              variant="contained"
              size="large"
              sx={{ py: 2, px: 6, fontWeight: 800 }}
            >
              Ir a la Tienda
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f4f4f4', minHeight: '80vh', pb: 10 }}>
      {/* Breadcrumbs */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid rgba(0,0,0,0.05)', py: 2 }}>
        <Container maxWidth="xl">
          <Breadcrumbs separator="›" aria-label="breadcrumb">
            <Link component={NextLink} href="/" color="inherit" underline="hover">Inicio</Link>
            <Typography color="text.primary">Carrito</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 800 }}>Tu Carrito</Typography>

        <Grid container spacing={4}>
          {/* Items List */}
          <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 1, lg: 1 } }}>
            <Stack spacing={{ xs: 2, sm: 3 }}>
              <Button
                component={NextLink}
                href="/shop"
                startIcon={<ArrowLeft size={18} />}
                sx={{
                  order: { xs: 1, sm: 2 },
                  alignSelf: { xs: 'flex-start', sm: 'flex-start' },
                  fontWeight: 700,
                  mt: { xs: -1, sm: 0 }
                }}
              >
                Continuar Comprando
              </Button>

              <Paper
                elevation={0}
                sx={{
                  order: { xs: 2, sm: 1 },
                  p: { xs: 0, sm: 3 },
                  borderRadius: { xs: 0, sm: 4 },
                  border: { xs: 'none', sm: '1px solid rgba(0,0,0,0.05)' },
                  bgcolor: { xs: 'transparent', sm: 'white' }
                }}
              >
                {state.items.map((item: any, index: number) => (
                  <Box
                    key={item.id}
                    sx={{
                      bgcolor: 'white',
                      border: { xs: '1px solid rgba(0,0,0,0.05)', sm: 'none' },
                      borderRadius: { xs: 3, sm: 0 },
                      p: { xs: 2, sm: 0 },
                      mb: { xs: index < state.items.length - 1 ? 2 : 0, sm: 0 }
                    }}
                  >
                    <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center" sx={{ py: { xs: 0, sm: 3 } }}>
                      <Grid size={{ xs: 3, sm: 2 }} sx={{ order: { xs: 1, sm: 1 } }}>
                        <Box
                          component="img"
                          src={getCDNUrl(item.images[0])}
                          alt={item.name}
                          sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 2, border: '1px solid #eee', display: 'block' }}
                        />
                      </Grid>
                      <Grid size={{ xs: 7, sm: 4 }} sx={{ order: { xs: 2, sm: 2 }, minWidth: 0 }}>
                        <Link
                          component={NextLink}
                          href={`/product/${item.id}`}
                          sx={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.25 }}>{item.name}</Typography>
                        </Link>
                        <Typography variant="body2" color="text.secondary">{item.brand}</Typography>
                      </Grid>
                      <Grid size={{ xs: 5, sm: 3 }} sx={{ order: { xs: 4, sm: 3 } }}>
                        <Stack direction="row" alignItems="center" sx={{ border: '1px solid #ddd', borderRadius: 1, width: 'fit-content', bgcolor: '#fff' }}>
                          <IconButton size="small" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>
                            <Minus size={16} />
                          </IconButton>
                          <Typography sx={{ px: 2, fontWeight: 700 }}>{item.quantity}</Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus size={16} />
                          </IconButton>
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 7, sm: 2 }} sx={{ textAlign: 'right', order: { xs: 5, sm: 4 } }}>
                        {item.discount > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', fontSize: { xs: '1.05rem', sm: '1.4rem' }, lineHeight: 1.15 }}>
                                ${(item.price * (1 - item.discount / 100) * item.quantity).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                              </Typography>
                              <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary', fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.95rem' } }}>
                                ${(item.price * item.quantity).toLocaleString('es-ES')}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5, display: 'block' }}>
                              ${(item.price * (1 - item.discount / 100)).toLocaleString('es-ES', { maximumFractionDigits: 0 })} / ud. ({item.discount}% OFF)
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', fontSize: { xs: '1.05rem', sm: '1.4rem' }, lineHeight: 1.15 }}>
                              ${(item.price * item.quantity).toLocaleString('es-ES')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5, display: 'block' }}>
                              ${item.price.toLocaleString('es-ES')} / ud.
                            </Typography>
                          </Box>
                        )}
                      </Grid>
                      <Grid size={{ xs: 2, sm: 1 }} sx={{ textAlign: 'right', order: { xs: 3, sm: 5 }, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                        <IconButton color="error" onClick={() => handleRemove(item.id)} sx={{ p: { xs: 0.75, sm: 1 } }}>
                          <Trash2 size={18} />
                        </IconButton>
                      </Grid>
                    </Grid>
                    {index < state.items.length - 1 && <Divider sx={{ display: { xs: 'none', sm: 'block' } }} />}
                  </Box>
                ))}
              </Paper>
            </Stack>
          </Grid>

          {/* Order Summary */}
          <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 2, lg: 2 } }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.05)',
                position: { xs: 'static', lg: 'sticky' },
                top: { lg: 100 }
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 800 }}>Resumen del Pedido</Typography>

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Productos (sin desc.)</Typography>
                  <Typography sx={{ fontWeight: 600 }}>${originalTotal.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</Typography>
                </Box>

                {discountTotal > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="error.main">Descuento</Typography>
                    <Typography color="error.main" sx={{ fontWeight: 700 }}>
                      -${discountTotal.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Subtotal</Typography>
                  <Typography sx={{ fontWeight: 600 }}>${subtotal.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</Typography>
                </Box>

                {/* <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Envío</Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-ES')}`}
                  </Typography>
                </Box> */}

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Total</Typography>
                  <Typography variant="h4" color="primary.main" sx={{ fontWeight: 900 }}>
                    ${total.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </Typography>
                </Box>

                <Button
                  component={NextLink}
                  href="/checkout"
                  variant="contained"
                  fullWidth
                  size="large"
                  endIcon={<ArrowRight size={20} />}
                  sx={{ py: 2, mt: 2, mb: 4, fontWeight: 800, fontSize: '1.1rem' }}
                >
                  Finalizar Compra
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CartPage;
