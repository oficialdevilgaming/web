"use client";

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  Stack,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { CheckCircle2, Truck, ListChecks, ArrowLeft, MessageCircle, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';

import { useCart } from '../../../context/CartContext';
import { supabase } from '../../../lib/supabase';

const steps = ['Contacto y Envío', 'Confirmación'];

const CheckoutPage = () => {
  const { state, dispatch } = useCart();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMsg, setErrorModalMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    phone: '',
    email: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const originalSubtotal = state.items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
  const subtotal = state.items.reduce((acc: number, item: any) => {
    const effectivePrice = item.price * (1 - (item.discount || 0) / 100);
    return acc + effectivePrice * item.quantity;
  }, 0);
  const discountTotal = originalSubtotal - subtotal;
  const shipping = subtotal > 500 ? 0 : 15;
  const total = subtotal + shipping;

  const isFormValid =
    formData.firstName &&
    formData.lastName &&
    formData.phone &&
    formData.email &&
    formData.address &&
    formData.city &&
    formData.zipCode;

  const isCartValid = state.items.length > 0;

  const handleNext = async () => {
    if (activeStep === 0) {
      // 1. Save to Supabase
      const newOrder = {
        customer_name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
        phone: formData.phone || '',
        email: formData.email || '',
        address: formData.address || '',
        city: formData.city || '',
        zip_code: formData.zipCode || '',
        total: Number(total) || 0,
        status: 'Pendiente',
        items: (state.items || []).map(item => ({
          id: item.id,
          name: item.name,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) * (1 - (item.discount || 0) / 100)
        }))
      };

      if (!isFormValid) {
        setErrorModalMsg('Completa todos los campos antes de continuar.');
        setErrorModalOpen(true);
        return;
      }

      if (!isCartValid) {
        setErrorModalMsg('Tu carrito está vacío.');
        setErrorModalOpen(true);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select('id')
        .single();

      if (error || !data) {
        console.error('Order insert error:', error);
        setErrorModalMsg(error?.message || 'Error al registrar el pedido');
        setErrorModalOpen(true);
        return;
      }
      const orderId = data.id;

      // Descontar el stock de los productos comprados
      for (const item of state.items) {
        const { data: product, error } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (!product || error) continue;

        const currentStock = product.stock || 0;
        const newStock = Math.max(0, currentStock - (item.quantity || 0));

        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.id);
      }

      // 2. Format WhatsApp Message
      const message = `*NUEVO PEDIDO: #${orderId}*\n\n` +
        `*Cliente:* ${formData.firstName} ${formData.lastName}\n` +
        `*Email:* ${formData.email}\n` +
        `*Teléfono:* ${formData.phone}\n` +
        `*Dirección:* ${formData.address}, ${formData.city}\n\n` +
        `*Productos:*\n` +
        state.items.map(item => {
          const effPrice = item.price * (1 - (item.discount || 0) / 100);
          const priceDetail = item.discount && item.discount > 0
            ? `$${effPrice.toLocaleString('es-ES', { maximumFractionDigits: 0 })} (con ${item.discount}% OFF, antes $${item.price.toLocaleString('es-ES')})`
            : `$${item.price.toLocaleString('es-ES')}`;
          return `- ${item.quantity}x ${item.name} - ${priceDetail} (Subtotal: $${(effPrice * item.quantity).toLocaleString('es-ES', { maximumFractionDigits: 0 })})`;
        }).join('\n') +
        `\n\n*TOTAL: $${total.toLocaleString('es-ES')}*`;

      const generatedLink = `https://wa.me/5491155099149?text=${encodeURIComponent(message)}`;
      setWhatsappUrl(generatedLink);

      // 3. Clear Cart and go to confirmation
      dispatch({ type: 'CLEAR_CART' });
      setActiveStep(1);

      window.open(generatedLink, '_blank');
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  if (state.items.length === 0 && activeStep < 1) {
    return (
      <Container sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 800 }}>Tu carrito está vacío</Typography>
        <Button component={NextLink} href="/shop" variant="contained">Volver a la Tienda</Button>
      </Container>
    );
  }

  const renderShippingForm = () => (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Información de Contacto</Typography>
        <Typography variant="body2" color="text.secondary">Ingresa tus datos para coordinar el pago y envío.</Typography>
      </Box>

      <Alert icon={<MessageCircle size={20} />} severity="info" sx={{ borderRadius: 2 }}>
        <AlertTitle sx={{ fontWeight: 700 }}>Gestión por WhatsApp</AlertTitle>
        Al finalizar, se generará un mensaje automático para enviarnos por WhatsApp y coordinar el{' '}<Typography component="span" sx={{ fontWeight: 700 }}>pago y seguimiento</Typography>.
      </Alert>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Nombre" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Apellidos" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
        </Grid>
        <Grid size={12}>
          <TextField fullWidth type="email" label="Correo Electrónico" name="email" value={formData.email} onChange={handleInputChange} required />
        </Grid>
        <Grid size={12}>
          <TextField fullWidth label="Teléfono (WhatsApp)" name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="Ej: +54 9 11 ..." />
        </Grid>
        <Grid size={12}>
          <TextField fullWidth label="Dirección de Envío" name="address" value={formData.address} onChange={handleInputChange} required />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Ciudad" name="city" value={formData.city} onChange={handleInputChange} required />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Código Postal" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required />
        </Grid>
      </Grid>
    </Stack>
  );

  const renderConfirmation = () => (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <CheckCircle2 size={80} color="#4caf50" style={{ marginBottom: '24px' }} />
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>¡Pedido Registrado!</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
        Hemos registrado tu pedido en el sistema. Para concretar la compra, es {' '}<Typography component="span" sx={{ fontWeight: 700 }}>indispensable</Typography> que nos envíes el mensaje por WhatsApp.
      </Typography>

      <Stack spacing={2} alignItems="center">
        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={<Send size={20} />}
          onClick={() => window.open(whatsappUrl, '_blank')}
          sx={{ py: 2, px: 6, fontWeight: 900, borderRadius: 3, fontSize: '1.1rem' }}
        >
          ENVIAR PEDIDO POR WHATSAPP
        </Button>
        <Button
          variant="text"
          onClick={() => router.push('/')}
          sx={{ fontWeight: 600, color: 'text.secondary' }}
        >
          Volver al Inicio
        </Button>
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: '#f4f4f4', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        {activeStep < 1 ? (
          <>
            <Typography variant="h4" sx={{ mb: 6, fontWeight: 800, textAlign: 'center' }}>Finalizar Compra</Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 8, display: { xs: 'none', sm: 'flex' } }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
                  {activeStep === 0 && renderShippingForm()}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
                    <Button
                      variant="text"
                      color="inherit"
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      startIcon={<ArrowLeft size={18} />}
                      sx={{ fontWeight: 600 }}
                    >
                      Atrás
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{ px: 6, py: 1.5, fontWeight: 800 }}
                    >
                      Continuar y Enviar
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 800 }}>Resumen de Compra</Typography>
                  <Stack spacing={2}>
                    {state.items.map((item: any) => {
                      return (
                        <Box key={item.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.quantity}x {item.name}
                            </Typography>
                            <Box sx={{ textAlign: 'right', minWidth: '80px' }}>
                              {item.discount > 0 ? (
                                <>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    ${(item.price * (1 - item.discount / 100) * item.quantity).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                                  </Typography>
                                  <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary', display: 'block' }}>
                                    ${(item.price * item.quantity).toLocaleString('es-ES')}
                                  </Typography>
                                </>
                              ) : (
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                  ${(item.price * item.quantity).toLocaleString('es-ES')}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Precio</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>${originalSubtotal.toLocaleString('es-ES')}</Typography>
                    </Box>
                    {discountTotal > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="error.main">Descuento</Typography>
                        <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>-${discountTotal.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</Typography>
                      </Box>
                    )}
                    {/* <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Envío</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{shipping === 0 ? 'Gratis' : `$${shipping}`}</Typography>
                    </Box> */}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>Total</Typography>
                      <Typography variant="h5" color="primary.main" sx={{ fontWeight: 900 }}>
                        ${total.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Stack spacing={2} sx={{ mt: 3, px: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Truck size={18} opacity={0.5} />
                    <Typography variant="caption" color="text.secondary">Entrega coordinada vía WhatsApp</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <ListChecks size={18} opacity={0.5} />
                    <Typography variant="caption" color="text.secondary">Atención personalizada 24/7</Typography>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </>
        ) : (
          renderConfirmation()
        )}
      </Container>

      {/* Error Modal */}
      <Dialog open={errorModalOpen} onClose={() => setErrorModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1, color: 'error.main' }}>Error</DialogTitle>
        <DialogContent>
          <Typography>{errorModalMsg}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setErrorModalOpen(false)} variant="contained" color="primary" sx={{ fontWeight: 700 }}>
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CheckoutPage;
