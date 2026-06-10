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
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
              {state.items.map((item: any, index: number) => (
                <Box key={item.id}>
                  <Grid container spacing={2} alignItems="center" sx={{ py: 3 }}>
                    <Grid size={{ xs: 4, sm: 2 }}>
                      <Box
                        component="img"
                        src={getCDNUrl(item.images[0])}
                        alt={item.name}
                        sx={{ width: '100%', borderRadius: 2, border: '1px solid #eee' }}
                      />
                    </Grid>
                    <Grid size={{ xs: 8, sm: 4 }}>
                      <Link
                        component={NextLink}
                        href={`/product/${item.id}`}
                        sx={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                      </Link>
                      <Typography variant="body2" color="text.secondary">{item.brand}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Stack direction="row" alignItems="center" sx={{ border: '1px solid #ddd', borderRadius: 1, width: 'fit-content' }}>
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
                    <Grid size={{ xs: 4, sm: 2 }} sx={{ textAlign: 'right' }}>
                      {item.discount > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', fontSize: { xs: '1.1rem', sm: '1.4rem' } }}>
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
                          <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', fontSize: { xs: '1.1rem', sm: '1.4rem' } }}>
                            ${(item.price * item.quantity).toLocaleString('es-ES')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5, display: 'block' }}>
                            ${item.price.toLocaleString('es-ES')} / ud.
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    <Grid size={{ xs: 2, sm: 1 }} sx={{ textAlign: 'right' }}>
                      <IconButton color="error" onClick={() => handleRemove(item.id)}>
                        <Trash2 size={20} />
                      </IconButton>
                    </Grid>
                  </Grid>
                  {index < state.items.length - 1 && <Divider />}
                </Box>
              ))}
            </Paper>

            <Button
              component={NextLink}
              href="/shop"
              startIcon={<ArrowLeft size={18} />}
              sx={{ mt: 3, fontWeight: 700 }}
            >
              Continuar Comprando
            </Button>
          </Grid>

          {/* Order Summary */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 4,
                border: '1px solid rgba(0,0,0,0.05)',
                position: 'sticky',
                top: 100
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
