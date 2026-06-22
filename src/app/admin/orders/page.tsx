"use client";

import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Select,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  TablePagination,
  TextField,
  InputAdornment,
  Grid,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Avatar,
  TableSortLabel,
  Collapse,
} from '@mui/material';
import { Eye, Clock, CheckCircle, Truck, AlertCircle, ShoppingBag, Search, User, Phone, Trash2, Plus, X, MessageCircle, Edit2, MapPin, DollarSign, ChevronDown, ChevronRight, Mail } from 'lucide-react';
import { useState, useEffect, Suspense, Fragment } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useAlert } from '../../../context/AlertContext';

// Placeholder número de WhatsApp de la tienda
const WHATSAPP_STORE_NUMBER = '5491155099149';

const statusIcons: { [key: string]: any } = {
  'Pendiente': <Clock size={16} />,
  'Enviado': <Truck size={16} />,
  'Pagado': <DollarSign size={16} />,
  'Entregado': <CheckCircle size={16} />,
  'Cancelado': <AlertCircle size={16} />,
};

const statusColors: { [key: string]: any } = {
  'Pendiente': 'warning',
  'Enviado': 'info',
  'Pagado': 'secondary',
  'Entregado': 'success',
  'Cancelado': 'error',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderItem = { id: string; name: string; price: number; discount?: number; quantity: number; images?: string[]; stock?: number };
type Product = { id: string; name: string; price: number; discount?: number; stock: number; category_id: string; images?: string[]; category?: { name: string } };
type Category = { id: string; name: string; parent_id?: string | null };

// ─── Wizard para crear pedido ─────────────────────────────────────────────────
const STEPS = ['Productos', 'Contacto', 'Confirmar Pedido'];

interface CreateOrderWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CreateOrderWizard = ({ open, onClose, onCreated }: CreateOrderWizardProps) => {
  const { showAlert } = useAlert();
  const [activeStep, setActiveStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [orderDate, setOrderDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []));
    }
  }, [open]);

  useEffect(() => {
    if (selectedParentId) {
      // Si hay subcategoría seleccionada, usamos solo esa. 
      // Si no, usamos el padre + todos sus hijos.
      const idsToFetch = selectedSubCategoryId
        ? [selectedSubCategoryId]
        : [selectedParentId, ...categories.filter(c => c.parent_id === selectedParentId).map(c => c.id)];

      supabase
        .from('products')
        .select('*, category:categories(name)')
        .in('category_id', idsToFetch)
        .then(({ data }) => setProducts(data || []));
    } else {
      setProducts([]);
    }
  }, [selectedParentId, selectedSubCategoryId, categories]);

  const handleAddProduct = (product: Product) => {
    const existing = cartItems.find(i => i.id === product.id);
    if (existing) {
      if (existing.quantity + 1 > product.stock) {
        showAlert(`No se puede agregar más unidades. El stock disponible de "${product.name}" es ${product.stock}.`);
        return;
      }
      setCartItems(prev => prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      if (product.stock < 1) {
        showAlert(`"${product.name}" no tiene stock disponible.`);
        return;
      }
      setCartItems(prev => [...prev, { id: product.id, name: product.name, price: product.price, discount: product.discount, quantity: 1, images: product.images, stock: product.stock }]);
    }
  };

  const handleRemoveProduct = (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const handleQtyChange = (id: string, qty: number) => {
    if (qty < 1) { handleRemoveProduct(id); return; }
    const item = cartItems.find(i => i.id === id);
    if (item && item.stock !== undefined && qty > item.stock) {
      showAlert(`No se puede agregar más unidades. El stock disponible es ${item.stock}.`);
      return;
    }
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const total = cartItems.reduce((acc, i) => acc + (i.price * (1 - (i.discount || 0) / 100)) * i.quantity, 0);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.from('orders').insert([{
        customer_name: contactName.trim(),
        phone: contactPhone.trim(),
        email: contactEmail.trim(),
        address: address.trim(),
        city: city.trim(),
        zip_code: zipCode.trim(),
        items: cartItems,
        total,
        status: 'Pendiente',
        created_at: new Date(orderDate).toISOString(),
      }]).select('id').single();

      if (error || !data) {
        showAlert('Error al crear el pedido: ' + (error?.message || 'Error desconocido'));
        return;
      }

      // Descontar stock inmediatamente (Reserva Inmediata)
      for (const item of cartItems) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single();
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
        }
      }

      onCreated();
      handleReset();
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedParentId('');
    setSelectedSubCategoryId('');
    setCartItems([]);
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setAddress('');
    setCity('');
    setZipCode('');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setOrderDate(now.toISOString().slice(0, 16));
    setProducts([]);
    onClose();
  };

  const canNext = () => {
    if (activeStep === 0) return cartItems.length > 0;
    if (activeStep === 1) return contactName.trim() !== '' && contactPhone.trim() !== '';
    return true;
  };

  return (
    <Dialog open={open} onClose={handleReset} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShoppingBag size={22} color="#cc0000" />
          Nuevo Pedido
        </Box>
        <IconButton size="small" onClick={handleReset}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* ── Paso 1: Productos ── */}
        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Buscá y seleccioná los productos para este pedido:
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={selectedParentId}
                      label="Categoría"
                      onChange={(e) => {
                        setSelectedParentId(e.target.value);
                        setSelectedSubCategoryId('');
                      }}
                      sx={{ bgcolor: 'white' }}
                    >
                      <MenuItem value="">Seleccionar categoría...</MenuItem>
                      {categories.filter(c => !c.parent_id).map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {selectedParentId && categories.some(c => c.parent_id === selectedParentId) && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Subcategoría</InputLabel>
                      <Select
                        value={selectedSubCategoryId}
                        label="Subcategoría"
                        onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                        sx={{ bgcolor: 'white' }}
                      >
                        <MenuItem value="">Sin subcategoría</MenuItem>
                        {categories.filter(c => c.parent_id === selectedParentId).map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )}
                </Stack>
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingBag size={16} /> Productos disponibles
              </Typography>
              <Box sx={{
                maxHeight: 320,
                overflowY: 'auto',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 2,
                p: 1.5,
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.02)', borderRadius: '4px' },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.15)', borderRadius: '4px' },
                '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(0,0,0,0.25)' }
              }}>
                {products.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Search size={32} color="rgba(0,0,0,0.1)" style={{ margin: '0 auto 12px' }} />
                    <Typography variant="body2" color="text.secondary">
                      {(selectedSubCategoryId || selectedParentId) ? 'No hay productos en esta categoría.' : 'Seleccioná una categoría para ver productos.'}
                    </Typography>
                  </Box>
                ) : products.map(p => (
                  <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', p: 1.5, mb: 1, borderRadius: 2, border: '1px solid rgba(0,0,0,0.04)', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.08)' }, transition: 'all 0.2s', gap: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 800 }}>${p.price.toLocaleString('es-ES')}</Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleAddProduct(p)}
                      disableElevation
                      sx={{ minWidth: 36, p: 1, fontWeight: 800, borderRadius: 2 }}
                      disabled={p.stock === 0}
                    >
                      {p.stock === 0 ? 'S/S' : <Plus size={16} />}
                    </Button>
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle size={16} /> Carrito ({cartItems.length} items)
              </Typography>
              <Box sx={{
                height: 'auto',
                maxHeight: { xs: 320, md: 480 },
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 2,
                bgcolor: 'rgba(0,0,0,0.01)',
                overflow: 'hidden'
              }}>
                <Box sx={{
                  flexGrow: 1,
                  flexShrink: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  p: 1.5,
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-track': { background: 'transparent' },
                  '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.15)', borderRadius: '4px' },
                  '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(0,0,0,0.25)' }
                }}>
                  {cartItems.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center', opacity: 0.6 }}>
                      <ShoppingBag size={48} color="rgba(0,0,0,0.2)" style={{ margin: '0 auto 16px' }} />
                      <Typography variant="body2" color="text.secondary">
                        Aún no hay productos seleccionados.
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1}>
                      {cartItems.map(item => {
                        const effPrice = item.price * (1 - (item.discount || 0) / 100);
                        return (
                          <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'white', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{item.name}</Typography>
                              {item.discount && item.discount > 0 ? (
                                <>
                                  <Typography variant="caption" color="primary" sx={{ fontWeight: 800 }}>${(effPrice * item.quantity).toLocaleString('es-ES', { maximumFractionDigits: 0 })}</Typography>
                                  <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary', ml: 0.5 }}>${(item.price * item.quantity).toLocaleString('es-ES')}</Typography>
                                </>
                              ) : (
                                <Typography variant="caption" color="primary" sx={{ fontWeight: 800 }}>${(item.price * item.quantity).toLocaleString('es-ES')}</Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2, p: 0.5 }}>
                              <IconButton size="small" onClick={() => handleQtyChange(item.id, item.quantity - 1)} sx={{ p: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, lineHeight: 1 }}>−</Typography>
                              </IconButton>
                              <Typography variant="body2" sx={{ fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{item.quantity}</Typography>
                              <IconButton size="small" onClick={() => handleQtyChange(item.id, item.quantity + 1)} sx={{ p: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, lineHeight: 1 }}><Plus size={12} /></Typography>
                              </IconButton>
                            </Box>
                            <IconButton size="small" color="error" onClick={() => handleRemoveProduct(item.id)} sx={{ bgcolor: 'error.lighter' }}>
                              <Trash2 size={16} />
                            </IconButton>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Box>

                <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)', bgcolor: 'white', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>Total:</Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>${total.toLocaleString('es-ES')}</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* ── Paso 2: Datos de contacto ── */}
        {activeStep === 1 && (
          <Stack spacing={3} sx={{ maxWidth: 480, mx: 'auto', py: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Completá los datos del cliente para registrar el pedido.
            </Typography>
            <TextField
              fullWidth
              label="Nombre completo"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><User size={18} /></InputAdornment>
              }}
            />
            <TextField
              fullWidth
              label="Teléfono (WhatsApp)"
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Phone size={18} /></InputAdornment>
              }}
            />
            <TextField
              fullWidth
              type="email"
              label="Correo Electrónico"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Mail size={18} /></InputAdornment>
              }}
            />
            <TextField
              fullWidth
              label="Dirección"
              value={address}
              onChange={e => setAddress(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><MapPin size={18} /></InputAdornment>
              }}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 8 }}>
                <TextField
                  fullWidth
                  label="Ciudad"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  label="C.P."
                  value={zipCode}
                  onChange={e => setZipCode(e.target.value)}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              type="datetime-local"
              label="Fecha y hora del pedido"
              value={orderDate}
              onChange={e => setOrderDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              onClick={(e) => (e.target as any).showPicker?.()}
              inputProps={{ lang: 'es-ES' }}
            />
          </Stack>
        )}

        {/* ── Paso 3: Confirmación ── */}
        {activeStep === 2 && (
          <Stack spacing={3} sx={{ py: 2 }}>
            <Box sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', bgcolor: 'rgba(0,0,0,0.01)' }}>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2, fontWeight: 700, letterSpacing: '0.05em' }}>
                INFORMACIÓN DEL CLIENTE
              </Typography>
              <Grid container spacing={2.5}>
                {/* Nombre */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: '#cc0000',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <User size={18} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Nombre</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{contactName}</Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Teléfono */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: '#25d366',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Phone size={18} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Teléfono</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{contactPhone}</Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Email */}
                {contactEmail && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: '#3f51b5',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Mail size={18} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Email</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{contactEmail}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                )}

                {/* Dirección */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'rgba(0,0,0,0.05)',
                      color: 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <MapPin size={18} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Dirección de Entrega</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {address || 'No especificada'}{city ? `, ${city}` : ''}{zipCode ? ` (CP: ${zipCode})` : ''}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Productos</Typography>
              <Stack spacing={1}>
                {cartItems.map(item => {
                  const effPrice = item.price * (1 - (item.discount || 0) / 100);
                  return (
                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{item.quantity}x {item.name}{item.discount && item.discount > 0 ? ` (-${item.discount}%)` : ''}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>${(effPrice * item.quantity).toLocaleString('es-ES', { maximumFractionDigits: 0 })}</Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Total del Pedido</Typography>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>${total.toLocaleString('es-ES')}</Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        {activeStep > 0 && (
          <Button onClick={() => setActiveStep(s => s - 1)} color="inherit" sx={{ fontWeight: 600 }}>
            Atrás
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="contained"
            onClick={() => setActiveStep(s => s + 1)}
            disabled={!canNext()}
            sx={{ fontWeight: 700, px: 4 }}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{ fontWeight: 700, px: 4 }}
          >
            {saving ? 'Guardando...' : 'Confirmar Pedido'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ─── Edit Order Wizard ────────────────────────────────────────────────────────
interface EditOrderWizardProps {
  open: boolean;
  order: any;
  onClose: () => void;
  onUpdated: () => void;
}

const EditOrderWizard = ({ open, order, onClose, onUpdated }: EditOrderWizardProps) => {
  const { showAlert } = useAlert();
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (order) {
      setContactName(order.customer_name || '');
      setContactPhone(order.phone || '');
      setContactEmail(order.email || '');
      setAddress(order.address || '');
      setCity(order.city || '');
      setZipCode(order.zip_code || '');

      const fetchStocksAndSetItems = async () => {
        const items = order.items || [];
        if (items.length > 0) {
          const itemIds = items.map((i: any) => i.id);
          const { data: productsData } = await supabase
            .from('products')
            .select('id, stock')
            .in('id', itemIds);

          const stockMap = new Map(productsData?.map(p => [p.id, p.stock]) || []);

          // El stock efectivo disponible = stock en BD + cantidad ya reservada en este pedido
          // (porque al editar devolveremos y retomaremos el stock según la diferencia)
          const isActive = order.status !== 'Cancelado';
          setCartItems(items.map((i: any) => {
            const dbStock = stockMap.get(i.id) ?? 9999;
            const effectiveStock = isActive ? dbStock + i.quantity : dbStock;
            return { ...i, stock: effectiveStock };
          }));
        } else {
          setCartItems([]);
        }
      };

      fetchStocksAndSetItems();

      if (order.created_at) {
        const d = new Date(order.created_at);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setOrderDate(d.toISOString().slice(0, 16));
      }
    }
  }, [order]);

  useEffect(() => {
    if (open) {
      supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []));
    }
  }, [open]);

  useEffect(() => {
    if (selectedParentId) {
      const idsToFetch = selectedSubCategoryId
        ? [selectedSubCategoryId]
        : [selectedParentId, ...categories.filter(c => c.parent_id === selectedParentId).map(c => c.id)];

      supabase
        .from('products')
        .select('*, category:categories(name)')
        .in('category_id', idsToFetch)
        .then(({ data }) => setProducts(data || []));
    } else {
      setProducts([]);
    }
  }, [selectedParentId, selectedSubCategoryId, categories]);

  const handleAddProduct = (product: Product) => {
    const existing = cartItems.find(i => i.id === product.id);
    if (existing) {
      // Para pedidos activos el stock de BD ya fue descontado por esta reserva,
      // por lo que el límite efectivo = stock_BD + unidades_ya_en_pedido
      const isActive = order?.status !== 'Cancelado';
      const effectiveLimit = isActive
        ? product.stock + existing.quantity
        : product.stock;
      if (existing.quantity + 1 > effectiveLimit) {
        showAlert(`No se puede agregar más unidades. El stock disponible de "${product.name}" es ${product.stock}.`);
        return;
      }
      setCartItems(prev => prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      if (product.stock < 1) {
        showAlert(`"${product.name}" no tiene stock disponible.`);
        return;
      }
      setCartItems(prev => [...prev, { id: product.id, name: product.name, price: product.price, discount: product.discount, quantity: 1, images: product.images, stock: product.stock }]);
    }
  };

  const handleRemoveProduct = (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const handleQtyChange = (id: string, qty: number) => {
    if (qty < 1) { handleRemoveProduct(id); return; }
    const item = cartItems.find(i => i.id === id);
    if (item && item.stock !== undefined && qty > item.stock) {
      showAlert(`No se puede agregar más unidades. El stock disponible es ${item.stock}.`);
      return;
    }
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const total = cartItems.reduce((acc, i) => acc + (i.price * (1 - (i.discount || 0) / 100)) * i.quantity, 0);

  const handleUpdate = async () => {
    if (!order) return;
    setSaving(true);
    const { error } = await supabase
      .from('orders')
      .update({
        customer_name: contactName.trim(),
        phone: contactPhone.trim(),
        email: contactEmail.trim(),
        address: address.trim(),
        city: city.trim(),
        zip_code: zipCode.trim(),
        items: cartItems.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price * (1 - (i.discount || 0) / 100),
          quantity: i.quantity,
        })),
        total,
        created_at: new Date(orderDate).toISOString(),
      })
      .eq('id', order.id);

    setSaving(false);
    if (!error) {
      // Ajustar el stock de los productos comprados si el pedido no está Cancelado
      if (order.status !== 'Cancelado') {
        const oldItemsMap = new Map<string, number>(order.items?.map((i: any) => [i.id, i.quantity]) || []);
        const newItemsMap = new Map<string, number>(cartItems.map((i: any) => [i.id, i.quantity]));
        const allItemIds = Array.from(new Set<string>([...oldItemsMap.keys(), ...newItemsMap.keys()]));

        for (const itemId of allItemIds) {
          const oldQty = oldItemsMap.get(itemId) || 0;
          const newQty = newItemsMap.get(itemId) || 0;
          const diff = newQty - oldQty;

          if (diff !== 0) {
            const { data: product } = await supabase
              .from('products')
              .select('stock')
              .eq('id', itemId)
              .single();

            if (product) {
              const currentStock = product.stock || 0;
              const newStock = Math.max(0, currentStock - diff);
              await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', itemId);
            }
          }
        }
      }
      onUpdated();
      onClose();
    } else {
      showAlert('Error al actualizar el pedido: ' + error.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Edit2 size={22} color="#cc0000" />
          Editar Pedido {order?.id}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={4} sx={{ py: 2 }}>
          {/* Datos de contacto */}
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Datos del Cliente</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nombre completo"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><User size={18} /></InputAdornment>
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Teléfono (WhatsApp)"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Phone size={18} /></InputAdornment>
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 12 }}>
                <TextField
                  fullWidth
                  type="email"
                  label="Correo Electrónico"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Mail size={18} /></InputAdornment>
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 12 }}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Fecha y hora del pedido"
                  value={orderDate}
                  onChange={e => setOrderDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  onClick={(e) => (e.target as any).showPicker?.()}
                  inputProps={{ lang: 'es-ES' }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><MapPin size={18} /></InputAdornment>
                  }}
                />
              </Grid>
              <Grid size={{ xs: 8 }}>
                <TextField
                  fullWidth
                  label="Ciudad"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  label="C.P."
                  value={zipCode}
                  onChange={e => setZipCode(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Gestión de Productos */}
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Productos del Pedido</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Agregar nuevos productos al pedido:
                  </Typography>
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Categoría</InputLabel>
                      <Select
                        value={selectedParentId}
                        label="Categoría"
                        onChange={(e) => {
                          setSelectedParentId(e.target.value);
                          setSelectedSubCategoryId('');
                        }}
                        sx={{ bgcolor: 'white' }}
                      >
                        <MenuItem value="">Seleccionar categoría...</MenuItem>
                        {categories.filter(c => !c.parent_id).map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                      </Select>
                    </FormControl>

                    {selectedParentId && categories.some(c => c.parent_id === selectedParentId) && (
                      <FormControl fullWidth size="small">
                        <InputLabel>Subcategoría</InputLabel>
                        <Select
                          value={selectedSubCategoryId}
                          label="Subcategoría"
                          onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                          sx={{ bgcolor: 'white' }}
                        >
                          <MenuItem value="">Sin subcategoría</MenuItem>
                          {categories.filter(c => c.parent_id === selectedParentId).map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )}
                  </Stack>
                </Box>

                <Box sx={{
                  maxHeight: 280,
                  overflowY: 'auto',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  p: 1.5,
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.02)', borderRadius: '4px' },
                  '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.15)', borderRadius: '4px' }
                }}>
                  {products.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Search size={28} color="rgba(0,0,0,0.1)" style={{ margin: '0 auto 8px' }} />
                      <Typography variant="body2" color="text.secondary">
                        {(selectedSubCategoryId || selectedParentId) ? 'No hay productos en esta categoría.' : 'Seleccioná una categoría para ver productos.'}
                      </Typography>
                    </Box>
                  ) : products.map(p => (
                    <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', p: 1.5, mb: 1, borderRadius: 2, border: '1px solid rgba(0,0,0,0.04)', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }, gap: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                        <Typography variant="caption" color="primary" sx={{ fontWeight: 800 }}>${p.price.toLocaleString('es-ES')}</Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleAddProduct(p)}
                        disableElevation
                        sx={{ minWidth: 36, p: 1, fontWeight: 800, borderRadius: 2 }}
                        disabled={p.stock === 0}
                      >
                        {p.stock === 0 ? 'S/S' : <Plus size={16} />}
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{
                  height: 380,
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  bgcolor: 'rgba(0,0,0,0.01)'
                }}>
                  <Box sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: 1.5,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.15)', borderRadius: '4px' }
                  }}>
                    {cartItems.length === 0 ? (
                      <Box sx={{ py: 6, textAlign: 'center', opacity: 0.6 }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay productos en el pedido.
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={1}>
                        {cartItems.map(item => (
                          <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'white', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{item.name}</Typography>
                              <Typography variant="caption" color="primary" sx={{ fontWeight: 800 }}>${(item.price * item.quantity).toLocaleString('es-ES')}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2, p: 0.5 }}>
                              <IconButton size="small" onClick={() => handleQtyChange(item.id, item.quantity - 1)} sx={{ p: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, lineHeight: 1 }}>−</Typography>
                              </IconButton>
                              <Typography variant="body2" sx={{ fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{item.quantity}</Typography>
                              <IconButton size="small" onClick={() => handleQtyChange(item.id, item.quantity + 1)} sx={{ p: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, lineHeight: 1 }}><Plus size={12} /></Typography>
                              </IconButton>
                            </Box>
                            <IconButton size="small" color="error" onClick={() => handleRemoveProduct(item.id)} sx={{ bgcolor: 'error.lighter' }}>
                              <Trash2 size={16} />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                  <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)', bgcolor: 'white' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>Total Pedido:</Typography>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>${total.toLocaleString('es-ES')}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleUpdate}
          disabled={saving || !contactName.trim() || !contactPhone.trim() || cartItems.length === 0}
          sx={{ fontWeight: 700, px: 4 }}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const OrdersManagement = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filtros y Paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Ordenamiento
  const [dateOrder, setDateOrder] = useState<'asc' | 'desc'>('desc');
  const [idOrder, setIdOrder] = useState<'asc' | 'desc'>('desc');
  const [activeSort, setActiveSort] = useState<'date' | 'id'>('date');

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<any>(null);

  // Create wizard
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' });

      // Apply filters
      if (searchTerm) {
        // En orders no hay un campo name directo pero podemos buscar en customer_name
        query = query.or(`customer_name.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Sorting
      if (activeSort === 'id') {
        query = query.order('id', { ascending: idOrder === 'asc' });
      } else {
        query = query.order('created_at', { ascending: dateOrder === 'asc' });
      }

      // Pagination
      const { data, count, error } = await query
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1);

      if (error) throw error;
      setOrders(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchTerm, statusFilter, dateOrder, idOrder, activeSort]);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  // Soporte para link profundo desde el dashboard
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      const processDeepLink = async () => {
        // Primero buscamos en la lista local
        let order = orders.find(o => String(o.id).toLowerCase() === String(orderId).toLowerCase());

        // Si no está (puede que aún no cargue o esté fuera del filtro inicial)
        if (!order) {
          const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
          if (data) order = data;
        }

        if (order) {
          handleViewDetail(order);
        }
      };
      processDeepLink();
    }
  }, [orders, searchParams]);

  // Removed client-side filteredOrders and pagedOrders memos

  const handleStatusChange = async (id: string, newStatus: string) => {
    const ACTIVE_STATUSES = ['Pendiente', 'Enviado', 'Pagado', 'Entregado'];

    try {
      // 1. Obtener los datos actuales del pedido
      const { data: order, error: fetchErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !order) {
        console.error('Error al obtener pedido para cambiar estado:', fetchErr);
        return;
      }

      const oldStatus = order.status;
      const items = order.items || [];

      const isActive = (status: string) => ['Pendiente', 'Enviado', 'Pagado', 'Entregado'].includes(status);
      const oldIsActive = isActive(oldStatus);
      const newIsActive = isActive(newStatus);

      // Si pasa de un estado activo a 'Cancelado'
      if (oldIsActive && newStatus === 'Cancelado') {
        // Devolver stock
        for (const item of items) {
          const { data: product } = await supabase
            .from('products').select('stock').eq('id', item.id).single();
          if (product) {
            await supabase.from('products')
              .update({ stock: (product.stock || 0) + item.quantity })
              .eq('id', item.id);
          }
        }
      }
      // Si pasa de 'Cancelado' a un estado activo
      else if (oldStatus === 'Cancelado' && newIsActive) {
        // Reducir stock
        for (const item of items) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.id)
            .single();

          if (product) {
            const currentStock = product.stock || 0;
            const newStock = Math.max(0, currentStock - item.quantity);
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.id);
          }
        }
      }

      // Actualizar el estado en la base de datos
      const updateData: any = { status: newStatus };
      if (newStatus === 'Entregado') {
        updateData.delivered_at = new Date().toISOString();
      } else if (oldStatus === 'Entregado' && newStatus !== 'Entregado') {
        updateData.delivered_at = null;
      }

      const { error: updateErr } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id);

      if (updateErr) throw updateErr;

      fetchOrders();
    } catch (err) {
      console.error('Error al procesar el cambio de estado:', err);
    }
  };

  const handleViewDetail = (order: any) => {
    setSelectedOrder(order);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);

    // Limpiar orderId de la URL para evitar que se abra solo al recargar/navegar
    const params = new URLSearchParams(searchParams.toString());
    if (params.has('orderId')) {
      params.delete('orderId');
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    }
  };

  const handleEditClick = (order: any) => {
    setOrderToEdit(order);
    setEditOpen(true);
  };

  const handleDeleteClick = (order: any) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    // Si el pedido que se va a eliminar estaba en estado activo (no Cancelado),
    // devolvemos el stock de sus productos antes de eliminarlo.
    const isActive = (status: string) => ['Pendiente', 'Enviado', 'Pagado', 'Entregado'].includes(status);
    if (isActive(orderToDelete.status)) {
      const items = orderToDelete.items || [];
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (product) {
          const currentStock = product.stock || 0;
          const newStock = currentStock + item.quantity;
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.id);
        }
      }
    }

    await supabase.from('orders').delete().eq('id', orderToDelete.id);
    setDeleteDialogOpen(false);
    setOrderToDelete(null);
    fetchOrders();
  };

  const handleWhatsAppClient = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleaned || WHATSAPP_STORE_NUMBER}`, '_blank');
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        gap={{ xs: 2, sm: 0 }}
        sx={{ mb: 4 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Pedidos</Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => setCreateOpen(true)}
          sx={{ py: 1.5, px: 3, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
        >
          Nuevo Pedido
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden', mb: 4 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por cliente o ID..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setSearchTerm(''); setPage(0); }}>
                        <X size={16} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent={{ md: 'flex-end' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Estado:</Typography>
                <Select
                  size="small"
                  value={statusFilter}
                  onChange={(e: any) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="Pendiente">Pendiente</MenuItem>
                  <MenuItem value="Enviado">Enviado</MenuItem>
                  <MenuItem value="Pagado">Pagado</MenuItem>
                  <MenuItem value="Entregado">Entregado</MenuItem>
                  <MenuItem value="Cancelado">Cancelado</MenuItem>
                </Select>


              </Stack>
            </Grid>
          </Grid>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>
                  <TableSortLabel
                    active={activeSort === 'id'}
                    direction={idOrder}
                    onClick={() => { setActiveSort('id'); setIdOrder(o => o === 'asc' ? 'desc' : 'asc'); }}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Dirección</TableCell>
                <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>
                  <TableSortLabel
                    active={activeSort === 'date'}
                    direction={dateOrder}
                    onClick={() => { setActiveSort('date'); setDateOrder(d => d === 'asc' ? 'desc' : 'asc'); }}
                  >
                    Creado
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Entregado</TableCell>
                <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Estado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center">Cargando...</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay pedidos.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : orders.map((order) => (
                <Fragment key={order.id}>
                  <TableRow hover onClick={() => handleViewDetail(order)} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>#{order.id}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{order.customer_name}</Typography>
                        {/* Mobile: botón para expandir detalles */}
                        <Box
                          component="button"
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleRow(order.id); }}
                          sx={{
                            display: { xs: 'flex', md: 'none' },
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 0.5,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            p: 0,
                            color: 'text.secondary',
                            fontSize: '0.72rem',
                            fontWeight: 600
                          }}
                        >
                          {expandedRows.has(order.id) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                          {expandedRows.has(order.id) ? 'Ocultar detalles' : 'Ver detalles'}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, maxWidth: 180, display: { xs: 'none', md: 'table-cell' } }}>
                      {order.address ? (
                        <Tooltip title={`${order.address}, ${order.city || ''} ${order.zip_code ? `(CP: ${order.zip_code})` : ''}`}>
                          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.address}, {order.city || ''}
                          </Box>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.disabled">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, display: { xs: 'none', md: 'table-cell' } }}>
                      {new Date(order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, display: { xs: 'none', md: 'table-cell' } }}>
                      {order.delivered_at ? new Date(order.delivered_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '−'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, display: { xs: 'none', md: 'table-cell' } }}>${Number(order.total).toLocaleString('es-ES')}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }} onClick={(e) => e.stopPropagation()}>
                      <Select
                        size="small"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        sx={{
                          minWidth: 140,
                          fontWeight: 600,
                          '& .MuiSelect-select': {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            py: 0.5
                          }
                        }}
                        renderValue={(value) => (
                          <Chip
                            icon={statusIcons[value]}
                            label={value}
                            size="small"
                            color={statusColors[value]}
                            sx={{ fontWeight: 700, border: 'none' }}
                          />
                        )}
                      >
                        <MenuItem value="Pendiente"><Clock size={16} style={{ marginRight: 8 }} /> Pendiente</MenuItem>
                        <MenuItem value="Enviado"><Truck size={16} style={{ marginRight: 8 }} /> Enviado</MenuItem>
                        <MenuItem value="Pagado"><DollarSign size={16} style={{ marginRight: 8 }} /> Pagado</MenuItem>
                        <MenuItem value="Entregado"><CheckCircle size={16} style={{ marginRight: 8 }} /> Entregado</MenuItem>
                        <MenuItem value="Cancelado"><AlertCircle size={16} style={{ marginRight: 8 }} /> Cancelado</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton size="small" onClick={() => handleViewDetail(order)} aria-label="Ver detalles">
                          <Eye size={18} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleEditClick(order)} color="primary" aria-label="Editar">
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(order)} aria-label="Eliminar">
                          <Trash2 size={18} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                  {/* Mobile expandable details row */}
                  <TableRow sx={{ display: { xs: 'table-row', md: 'none' } }}>
                    <TableCell colSpan={3} sx={{ p: 0, border: 0 }}>
                      <Collapse in={expandedRows.has(order.id)} timeout="auto" unmountOnExit>
                        <Box sx={{ px: 2, pb: 2, pt: 1, bgcolor: 'rgba(0,0,0,0.015)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                          <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem', mt: 0.5 }}>Dirección</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right', maxWidth: '70%' }}>
                                {order.address ? `${order.address}, ${order.city || ''} ${order.zip_code ? `(CP: ${order.zip_code})` : ''}` : 'N/A'}
                              </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Creado</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {new Date(order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Entregado</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {order.delivered_at ? new Date(order.delivered_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '−'}
                              </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Total</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                ${Number(order.total).toLocaleString('es-ES')}
                              </Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Estado</Typography>
                              <Select
                                size="small"
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                sx={{
                                  minWidth: 140,
                                  fontWeight: 600,
                                  '& .MuiSelect-select': {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    py: 0.5
                                  }
                                }}
                                renderValue={(value) => (
                                  <Chip
                                    icon={statusIcons[value]}
                                    label={value}
                                    size="small"
                                    color={statusColors[value]}
                                    sx={{ fontWeight: 700, border: 'none' }}
                                  />
                                )}
                              >
                                <MenuItem value="Pendiente"><Clock size={16} style={{ marginRight: 8 }} /> Pendiente</MenuItem>
                                <MenuItem value="Enviado"><Truck size={16} style={{ marginRight: 8 }} /> Enviado</MenuItem>
                                <MenuItem value="Pagado"><DollarSign size={16} style={{ marginRight: 8 }} /> Pagado</MenuItem>
                                <MenuItem value="Entregado"><CheckCircle size={16} style={{ marginRight: 8 }} /> Entregado</MenuItem>
                                <MenuItem value="Cancelado"><AlertCircle size={16} style={{ marginRight: 8 }} /> Cancelado</MenuItem>
                              </Select>
                            </Stack>
                          </Stack>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Pedidos por página"
        />
      </Paper>

      {/* ── Order Detail Modal ── */}
      <Dialog open={openDetail} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ShoppingBag size={24} color="#cc0000" />
            Pedido #{selectedOrder?.id}
          </Box>
          <IconButton size="small" onClick={handleCloseDetail}>
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3} sx={{ py: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Información del Cliente</Typography>
              <Grid container spacing={3}>
                {/* Nombre */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={18} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Nombre</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedOrder?.customer_name}</Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Teléfono + botón WhatsApp */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#25d366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Phone size={18} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedOrder?.phone || 'N/A'}</Typography>
                    </Box>
                    {selectedOrder?.phone && (
                      <Tooltip title="Abrir WhatsApp">
                        <IconButton
                          size="small"
                          onClick={() => handleWhatsAppClient(selectedOrder.phone)}
                          sx={{
                            border: '1px solid #25d366',
                            color: '#25d366',
                            '&:hover': { bgcolor: 'rgba(37,211,102,0.08)' }
                          }}
                        >
                          <MessageCircle size={16} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Grid>

                {/* Email */}
                {selectedOrder?.email && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#3f51b5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Mail size={18} />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" color="text.secondary">Email</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedOrder.email}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                )}

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#ff9800', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Clock size={18} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Creado</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {selectedOrder?.created_at
                          ? new Date(selectedOrder.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'N/A'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: selectedOrder?.delivered_at ? '#4caf50' : 'rgba(0,0,0,0.08)', color: selectedOrder?.delivered_at ? 'white' : 'text.disabled', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle size={18} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Entregado</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: selectedOrder?.delivered_at ? 'success.main' : 'text.disabled' }}>
                        {selectedOrder?.delivered_at
                          ? new Date(selectedOrder.delivered_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#2196f3', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ShoppingBag size={18} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Estado</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {selectedOrder && (
                          <Select
                            size="small"
                            value={selectedOrder.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              handleStatusChange(selectedOrder.id, newStatus);
                              setSelectedOrder((prev: any) => {
                                if (!prev) return null;
                                const nowISO = new Date().toISOString();
                                return {
                                  ...prev,
                                  status: newStatus,
                                  delivered_at: newStatus === 'Entregado'
                                    ? nowISO
                                    : (prev.status === 'Entregado' ? null : prev.delivered_at)
                                };
                              });
                            }}
                            sx={{
                              minWidth: 140,
                              fontWeight: 600,
                              '& .MuiSelect-select': {
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                py: 0.5
                              }
                            }}
                            renderValue={(value) => (
                              <Chip
                                icon={statusIcons[value]}
                                label={value}
                                size="small"
                                color={statusColors[value]}
                                sx={{ fontWeight: 700, border: 'none' }}
                              />
                            )}
                          >
                            <MenuItem value="Pendiente"><Clock size={16} style={{ marginRight: 8 }} /> Pendiente</MenuItem>
                            <MenuItem value="Enviado"><Truck size={16} style={{ marginRight: 8 }} /> Enviado</MenuItem>
                            <MenuItem value="Pagado"><DollarSign size={16} style={{ marginRight: 8 }} /> Pagado</MenuItem>
                            <MenuItem value="Entregado"><CheckCircle size={16} style={{ marginRight: 8 }} /> Entregado</MenuItem>
                            <MenuItem value="Cancelado"><AlertCircle size={16} style={{ marginRight: 8 }} /> Cancelado</MenuItem>
                          </Select>
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </Grid>

                {/* Dirección */}
                {(selectedOrder?.address || selectedOrder?.city) && (
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1, borderStyle: 'dotted' }} />
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.05)', color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin size={18} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Dirección de Entrega</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {selectedOrder.address}
                          {selectedOrder.city ? `, ${selectedOrder.city}` : ''}
                          {selectedOrder.zip_code ? ` (CP: ${selectedOrder.zip_code})` : ''}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ mb: 2, display: 'block' }}>Productos</Typography>
              <Stack spacing={1}>
                {selectedOrder?.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item: any, idx: number) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.quantity}x {item.name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        ${(item.price * item.quantity).toLocaleString('es-ES')}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">Sin detalle de productos.</Typography>
                )}
              </Stack>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Total</Typography>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>
                ${Number(selectedOrder?.total).toLocaleString('es-ES')}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        {/* No footer/DialogActions — se cierra con la X */}
      </Dialog>

      {/* ── Delete Order Confirmation ── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que querés eliminar el pedido <strong>{orderToDelete?.id}</strong> de <strong>{orderToDelete?.customer_name}</strong>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" sx={{ fontWeight: 700 }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Create Order Wizard ── */}
      <CreateOrderWizard
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); fetchOrders(); }}
      />

      {/* ── Edit Order Wizard ── */}
      <EditOrderWizard
        open={editOpen}
        order={orderToEdit}
        onClose={() => setEditOpen(false)}
        onUpdated={() => { setEditOpen(false); fetchOrders(); }}
      />
    </Box>
  );
};

const OrdersPage = () => {
  return (
    <Suspense fallback={<div>Cargando pedidos...</div>}>
      <OrdersManagement />
    </Suspense>
  );
};

export default OrdersPage;
