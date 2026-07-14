"use client";

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  Stack
} from '@mui/material';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Link from 'next/link';
import { getCDNUrl } from '../../lib/imageUtils';


interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ open, onClose }) => {
  const { state, dispatch } = useCart();

  const originalTotal = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountTotal = state.items.reduce((acc, item) => acc + (item.price * (item.discount || 0) / 100) * item.quantity, 0);
  const total = originalTotal - discountTotal;

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const handleRemove = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 }, bgcolor: '#fff', overflow: 'hidden' }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ShoppingBag size={20} color="#cc0000" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Tu Carrito ({state.items.length})</Typography>
          </Stack>
          <IconButton onClick={onClose}>
            <X size={24} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.15)', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(0,0,0,0.25)' },
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(226, 7, 7, 0.98) transparent'
        }}>
          {state.items.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <ShoppingBag size={64} color="rgba(0,0,0,0.1)" strokeWidth={1} style={{ marginBottom: '16px' }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>Tu carrito está vacío</Typography>
              <Button
                component={Link}
                href="/shop"
                variant="contained"
                onClick={onClose}
                sx={{ borderRadius: '50px', px: 4 }}
              >
                Ir a la Tienda
              </Button>
            </Box>
          ) : (
            <List>
              {state.items.map((item) => (
                <React.Fragment key={item.id}>
                  <ListItem alignItems="flex-start" sx={{ px: 1, py: 2 }}>
                    <ListItemAvatar sx={{ mr: 2 }}>
                      <Avatar
                        src={getCDNUrl(item.images?.[0])}
                        variant="rounded"
                        sx={{ width: 80, height: 80, bgcolor: '#f5f5f5', border: '1px solid rgba(0,0,0,0.05)' }}
                      />
                    </ListItemAvatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, pr: 3 }}>{item.name}</Typography>
                      {item.discount && item.discount > 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary', fontWeight: 500 }}>
                            ${item.price.toLocaleString('es-ES')}
                          </Typography>
                          <Typography variant="body2" color="error.main" sx={{ fontWeight: 800 }}>
                            ${(item.price * (1 - item.discount / 100)).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="primary.main" sx={{ fontWeight: 800, mb: 1 }}>
                          ${item.price.toLocaleString('es-ES')}
                        </Typography>
                      )}

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" sx={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: 1 }}>
                          <IconButton size="small" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>
                            <Minus size={14} />
                          </IconButton>
                          <Typography variant="body2" sx={{ px: 1, minWidth: 20, textAlign: 'center', fontWeight: 700 }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus size={14} />
                          </IconButton>
                        </Stack>
                        <IconButton size="small" color="error" onClick={() => handleRemove(item.id)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Stack>
                    </Box>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {state.items.length > 0 && (
          <Box sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.05)', bgcolor: 'rgba(0,0,0,0.01)' }}>
            <Stack spacing={2}>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Precio</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>${originalTotal.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</Typography>
                </Box>
                {discountTotal > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>Descuento</Typography>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>-${discountTotal.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</Typography>
                  </Box>
                )}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>Subtotal</Typography>
                  <Typography variant="h5" color="primary.main" sx={{ fontWeight: 800 }}>${total.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</Typography>
                </Box>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Envío e impuestos se calcularán en el pago.
              </Typography>
              <Button
                component={Link}
                href="/cart"
                variant="outlined"
                fullWidth
                onClick={onClose}
                sx={{ py: 1.5, fontWeight: 700 }}
              >
                Ver Carrito Completo
              </Button>
              <Button
                component={Link}
                href="/checkout"
                variant="contained"
                fullWidth
                onClick={onClose}
                endIcon={<ArrowRight size={20} />}
                sx={{ py: 2, fontWeight: 800, fontSize: '1rem' }}
              >
                Realizar Pedido
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default CartDrawer;
