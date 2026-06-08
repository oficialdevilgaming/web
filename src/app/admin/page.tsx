"use client";

import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  TextField,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';

import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  History,
  Calendar,
  ShoppingBag,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  ChevronDown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { GraphicEq } from '@mui/icons-material';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { esES } from '@mui/x-date-pickers/locales';
import { es as esLocale } from 'date-fns/locale';

const getDaysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
};

const Dashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [metricType, setMetricType] = useState<'revenue' | 'units'>('revenue');
  const formatDisplay = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES');
  };

  const parseDisplay = (value: string) => {
    // Expect DD/MM/YYYY
    const parts = value.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    const iso = new Date(`${year}-${month}-${day}`).toISOString().split('T')[0];
    return iso;
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Filtros de fecha (Default: Últimos 30 días)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const pickerSx = {
    '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.5, cursor: 'pointer' },
    width: { xs: '100%', sm: 180 }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const historicalDate = new Date(startDate);
        historicalDate.setDate(historicalDate.getDate() - 30);

        // Optimizamos: No traemos TODOS los productos, solo los necesarios para las métricas
        // y un count aparte para el stock bajo.
        const [ordRes, catRes, lowStockRes] = await Promise.all([
          supabase.from('orders').select('*').gte('created_at', historicalDate.toISOString()).order('created_at', { ascending: true }),
          supabase.from('categories').select('*'),
          supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 5)
        ]);

        const ordersData = ordRes.data || [];
        setOrders(ordersData);
        setCategories(catRes.data || []);
        setLowStockCount(lowStockRes.count || 0);

        // Traer solo productos que aparecen en las órdenes para el Top 5
        const productNamesInOrders = new Set<string>();
        ordersData.forEach(o => {
          if (o.items) {
            o.items.forEach((item: any) => productNamesInOrders.add(item.name));
          }
        });

        if (productNamesInOrders.size > 0) {
          const { data: neededProducts } = await supabase
            .from('products')
            .select('id, name, category_id, stock, cost_price')
            .in('name', Array.from(productNamesInOrders));
          setProducts(neededProducts || []);
        } else {
          setProducts([]);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [startDate]); // Recarga si la fecha de inicio cambia significativamente

  const metrics = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Filtrar órdenes por rango
    const rangeOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= start && d <= end;
    });

    const completedOrdersInRange = orders.filter(o => {
      if (o.status !== 'Entregado') return false;
      const d = new Date(o.delivered_at || o.created_at);
      return d >= start && d <= end;
    });
    const revenueInRange = completedOrdersInRange.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    const totalOrdersInRange = rangeOrders.length;

    // Ganancia Neta: (precio_venta - cost_price) * cantidad por cada item entregado
    let netProfitInRange = 0;
    completedOrdersInRange.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item: any) => {
          const product = products.find(p => p.name === item.name);
          const costPrice = product?.cost_price ?? 0;
          netProfitInRange += (Number(item.price) - costPrice) * (item.quantity || 1);
        });
      }
    });
    const pendingOrdersInRange = rangeOrders.filter(o => o.status === 'Pendiente');

    // Chart Data logic (dinámico según el rango)
    const chartDataMap = new Map();
    const tempDate = new Date(start);
    while (tempDate <= end) {
      chartDataMap.set(tempDate.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }), 0);
      tempDate.setDate(tempDate.getDate() + 1);
    }

    completedOrdersInRange.forEach(o => {
      const dateStr = new Date(o.delivered_at || o.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      if (chartDataMap.has(dateStr)) {
        if (metricType === 'revenue') {
          chartDataMap.set(dateStr, chartDataMap.get(dateStr) + (parseFloat(o.total) || 0));
        } else {
          const itemsCount = o.items ? o.items.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0;
          chartDataMap.set(dateStr, chartDataMap.get(dateStr) + itemsCount);
        }
      }
    });

    const chartData = Array.from(chartDataMap, ([date, value]) => ({ date, value }));

    // Top 5 Productos Global con Categoría
    const productStats: Record<string, { quantity: number, category: string }> = {};
    completedOrdersInRange.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item: any) => {
          if (!productStats[item.name]) {
            const product = products.find(p => p.name === item.name);
            const category = categories.find(c => c.id === product?.category_id)?.name || 'Sin categoría';
            productStats[item.name] = { quantity: 0, category };
          }
          productStats[item.name].quantity += item.quantity;
        });
      }
    });

    const top5Products = Object.entries(productStats)
      .map(([name, data]) => ({ name, quantity: data.quantity, category: data.category }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Stock Crítico (Usamos el count traído de la DB)
    const lowStock = lowStockCount;

    // Pedidos Pendientes (Últimos 5 creados en el rango)
    const lastPendingOrders = rangeOrders
      .filter(o => o.status === 'Pendiente')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return {
      revenueInRange,
      netProfitInRange,
      totalOrdersInRange,
      pendingTotalCount: rangeOrders.filter(o => o.status === 'Pendiente').length,
      lastPendingOrders,
      chartData,
      top5Products,
      lowStockCount: lowStock
    };
  }, [orders, products, metricType, startDate, endDate]);

  if (loading) {
    return (
      <Box sx={{ p: 10, textAlign: 'center' }}>
        <CircularProgress color="primary" />
        <Typography sx={{ mt: 2 }} color="text.secondary">Buffeando el lobby</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 4, gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Lobby</Typography>

        <Paper elevation={0} sx={{
          p: { xs: 2, sm: 1 },
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1.5, sm: 2 },
          width: { xs: '100%', sm: 'auto' }
        }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1 }}>
            <Calendar size={18} color="#666" />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>RANGO:</Typography>
          </Stack>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale} localeText={esES.components.MuiLocalizationProvider.defaultProps.localeText}>
            <DatePicker
              label="Desde"
              value={startDate ? new Date(startDate) : null}
              onChange={(newValue) => setStartDate(newValue ? newValue.toISOString().split('T')[0] : '')}
              format="dd/MM/yyyy"
              slotProps={{ textField: { size: 'small', sx: pickerSx } }}
            />
            <DatePicker
              label="Hasta"
              value={endDate ? new Date(endDate) : null}
              onChange={(newValue) => setEndDate(newValue ? newValue.toISOString().split('T')[0] : '')}
              format="dd/MM/yyyy"
              slotProps={{ textField: { size: 'small', sx: pickerSx } }}
            />
          </LocalizationProvider>
        </Paper>
      </Stack>

      {/* ─── Mobile: Acordeón de Métricas ─── */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4 }}>
        <Accordion
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.08)',
            '&:before': { display: 'none' },
            overflow: 'hidden',
          }}
        >
          <AccordionSummary
            expandIcon={<ChevronDown size={20} />}
            sx={{ px: 3, py: 1.5, bgcolor: 'rgba(0,0,0,0.01)' }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: '#cc000010', color: '#cc0000', display: 'flex' }}>
                <DollarSign size={16} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>Resumen del Período</Typography>
                <Typography variant="caption" color="text.secondary">Facturación, ganancias y estado de pedidos</Typography>
              </Box>
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Stack divider={<Divider sx={{ borderColor: 'rgba(0,0,0,0.08)' }} />}>
              {/* Facturación */}
              <Box sx={{ px: 2, py: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>Facturación</Typography>
                </Stack>
                <Typography sx={{ fontWeight: 800, fontSize: '1.4rem' }}>${metrics.revenueInRange.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</Typography>
              </Box>
              {/* Ganancia Neta */}
              <Box sx={{ px: 3, py: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: '#00bfa508', color: '#00bfa5', display: 'flex' }}><Banknote size={16} /></Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>Ganancia Neta</Typography>
                </Stack>
                <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: metrics.netProfitInRange >= 0 ? '#00796b' : '#f44336' }}>
                  ${metrics.netProfitInRange.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="text.secondary">Utilidad real del periodo</Typography>
              </Box>
              {/* Pedidos */}
              <Box component={Link} href="/admin/orders" sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none' }}>
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: '#2196f308', color: '#2196f3', display: 'flex' }}><ShoppingBag size={16} /></Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>Pedidos</Typography>
                  </Stack>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.4rem' }}>{metrics.totalOrdersInRange}</Typography>
                  <Typography variant="caption" color="text.secondary">Total periodo</Typography>
                </Box>
                <ArrowUpRight size={18} color="#bbb" />
              </Box>
              {/* Pendientes */}
              <Box component={Link} href="/admin/orders?status=Pendiente" sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none' }}>
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: metrics.pendingTotalCount > 0 ? '#ff980008' : '#f5f5f5', color: metrics.pendingTotalCount > 0 ? '#ff9800' : 'text.disabled', display: 'flex' }}><Clock size={16} /></Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>Pendientes</Typography>
                  </Stack>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: metrics.pendingTotalCount > 0 ? '#ff9800' : 'text.primary' }}>{metrics.pendingTotalCount}</Typography>
                  <Typography variant="caption" color="text.secondary">Por preparar</Typography>
                </Box>
                <ArrowUpRight size={18} color="#bbb" />
              </Box>
              {/* Bajo Stock */}
              <Box component={Link} href="/admin/products?filter=critical" sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none' }}>
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: metrics.lowStockCount > 0 ? '#f4433608' : '#f5f5f5', color: metrics.lowStockCount > 0 ? '#f44336' : 'text.disabled', display: 'flex' }}><AlertTriangle size={16} /></Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem' }}>Bajo Stock</Typography>
                  </Stack>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: metrics.lowStockCount > 0 ? '#f44336' : 'text.primary' }}>{metrics.lowStockCount}</Typography>
                  <Typography variant="caption" color="text.secondary">Críticos</Typography>
                </Box>
                <ArrowUpRight size={18} color="#bbb" />
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* ─── Desktop: Grid de Métricas ─── */}
      <Grid container spacing={3} sx={{ mb: 4, display: { xs: 'none', md: 'flex' } }}>
        {/* Facturación */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }} sx={{ display: 'flex' }}>
          <Paper elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: 'white',
              border: '1px solid rgba(0,0,0,0.08)',
              height: '100%',
              width: '100%',
              position: 'relative'
            }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#4caf5008', color: '#4caf50', display: 'flex' }}><DollarSign size={18} /></Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>Facturación</Typography>
            </Stack>
            <Typography sx={{ fontWeight: 800, mb: 0.5, fontSize: 'clamp(1rem, 2vw, 1.6rem)', lineHeight: 1.2, wordBreak: 'break-word' }}>
              ${metrics.revenueInRange.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </Typography>
          </Paper>
        </Grid>

        {/* Ganancia Neta */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }} sx={{ display: 'flex' }}>
          <Paper elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: 'white',
              border: '1px solid rgba(0,0,0,0.08)',
              height: '100%',
              width: '100%',
              position: 'relative',
              background: metrics.netProfitInRange > 0
                ? 'linear-gradient(135deg, #fff 60%, rgba(0,191,165,0.04) 100%)'
                : 'white',
              borderColor: metrics.netProfitInRange > 0 ? 'rgba(0,191,165,0.25)' : 'rgba(0,0,0,0.08)'
            }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#00bfa508', color: '#00bfa5', display: 'flex' }}><Banknote size={18} /></Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>Ganancia Neta</Typography>
            </Stack>
            <Typography sx={{ fontWeight: 800, mb: 0.5, fontSize: 'clamp(1rem, 2vw, 1.6rem)', lineHeight: 1.2, wordBreak: 'break-word', color: metrics.netProfitInRange >= 0 ? '#00796b' : '#f44336' }}>
              ${metrics.netProfitInRange.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </Typography>
          </Paper>
        </Grid>

        {/* Pedidos del Periodo */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }} sx={{ display: 'flex' }}>
          <Paper elevation={0}
            component={Link}
            href="/admin/orders"
            sx={{
              p: 3, borderRadius: 3, bgcolor: 'white',
              border: '1px solid rgba(0,0,0,0.08)',
              height: '100%',
              width: '100%',
              position: 'relative',
              textDecoration: 'none',
              transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: '#fafafa',
                borderColor: '#2196f3',
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.04)',
                '& .nav-arrow': { transform: 'translate(2px, -2px)', opacity: 1 }
              }
            }}>
            <Box className="nav-arrow" sx={{ position: 'absolute', top: 20, right: 20, color: 'text.disabled', opacity: 0.5, transition: '0.3s' }}>
              <ArrowUpRight size={18} />
            </Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#2196f308', color: '#2196f3', display: 'flex' }}><ShoppingBag size={18} /></Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>Pedidos</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>{metrics.totalOrdersInRange}</Typography>
          </Paper>
        </Grid>

        {/* Pedidos Pendientes */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }} sx={{ display: 'flex' }}>
          <Paper elevation={0}
            component={Link}
            href="/admin/orders?status=Pendiente"
            sx={{
              p: 3, borderRadius: 3, bgcolor: 'white',
              border: '1px solid rgba(0,0,0,0.08)',
              height: '100%',
              width: '100%',
              position: 'relative',
              textDecoration: 'none',
              transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: '#fafafa',
                borderColor: '#ff9800',
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.04)',
                '& .nav-arrow': { transform: 'translate(2px, -2px)', opacity: 1 }
              }
            }}>
            <Box className="nav-arrow" sx={{ position: 'absolute', top: 20, right: 20, color: 'text.disabled', opacity: 0.5, transition: '0.3s' }}>
              <ArrowUpRight size={18} />
            </Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: metrics.pendingTotalCount > 0 ? '#ff980008' : '#f5f5f5', color: metrics.pendingTotalCount > 0 ? '#ff9800' : 'text.disabled', display: 'flex' }}><Clock size={18} /></Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>Pendientes</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, color: metrics.pendingTotalCount > 0 ? '#ff9800' : 'text.primary', mb: 0.5 }}>
              {metrics.pendingTotalCount}
            </Typography>
          </Paper>
        </Grid>

        {/* Stock Bajo */}
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }} sx={{ display: 'flex' }}>
          <Paper elevation={0}
            component={Link}
            href="/admin/products?filter=critical"
            sx={{
              p: 3, borderRadius: 3, bgcolor: 'white',
              border: '1px solid rgba(0,0,0,0.08)',
              height: '100%',
              width: '100%',
              position: 'relative',
              textDecoration: 'none',
              transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: '#fafafa',
                borderColor: '#f44336',
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.04)',
                '& .nav-arrow': { transform: 'translate(2px, -2px)', opacity: 1 }
              }
            }}>
            <Box className="nav-arrow" sx={{ position: 'absolute', top: 20, right: 20, color: 'text.disabled', opacity: 0.5, transition: '0.3s' }}>
              <ArrowUpRight size={18} />
            </Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: metrics.lowStockCount > 0 ? '#f4433608' : '#f5f5f5', color: metrics.lowStockCount > 0 ? '#f44336' : 'text.disabled', display: 'flex' }}><AlertTriangle size={18} /></Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}>Bajo Stock</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, color: metrics.lowStockCount > 0 ? '#f44336' : 'text.primary', mb: 0.5 }}>
              {metrics.lowStockCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Próximos Envíos (Pendientes) */}
        <Grid size={{ xs: 12, lg: 8 }} sx={{ display: 'flex' }}>
          <Paper elevation={0} sx={{ p: 0, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden', height: '100%', width: '100%' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <History size={20} color="#666" />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Últimos Pendientes</Typography>
              </Stack>
            </Box>
            <Box sx={{ p: 0 }}>
              {metrics.lastPendingOrders.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: 'rgba(0,0,0,0.02)', textAlign: 'left' }}>
                    <tr>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#666' }}>FECHA</th>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#666' }}>CLIENTE</th>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#666' }}>TOTAL</th>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#666' }}>ACCION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.lastPendingOrders.map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <td style={{ padding: '16px 24px', fontSize: '0.8rem', color: '#666' }}>{formatDisplay(order.created_at)}</td>
                        <td style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600 }}>{order.customer_name}</td>
                        <td style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 700 }}>${order.total}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <IconButton size="small" component={Link} href={`/admin/orders?orderId=${encodeURIComponent(order.id)}`} color="primary"><ArrowRight size={18} /></IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No hay pedidos pendientes en este rango.</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Top 5 Ventas */}
        <Grid size={{ xs: 12, lg: 4 }} sx={{ display: 'flex' }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', height: '100%', width: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <TrendingUp size={20} color="#888" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Top 5 Vendidos</Typography>
            </Stack>

            <Stack spacing={2.5}>
              {metrics.top5Products.map((prod, idx) => (
                <Box key={idx} sx={{ position: 'relative' }}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}
                    >
                      {prod.name}
                    </Typography>
                    {prod.category && (
                      <Chip
                        label={prod.category}
                        size="small"
                        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', bgcolor: 'rgba(204,0,0,0.08)', color: '#cc0000', border: 'none', flexShrink: 0 }}
                      />
                    )}
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Box sx={{ width: '100%', height: 6, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1, overflow: 'hidden', mr: 2 }}>
                      <Box sx={{
                        width: `${(prod.quantity / metrics.top5Products[0].quantity) * 100}%`,
                        height: '100%',
                        bgcolor: '#cc0000',
                        borderRadius: 1
                      }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', flexShrink: 0 }}>{prod.quantity} ud.</Typography>
                  </Stack>
                </Box>
              ))}
              {metrics.top5Products.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>Sin ventas en el periodo.</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper elevation={0} sx={{
          px: { xs: 1.5, sm: 4 },
          py: { xs: 2.5, sm: 4 },
          borderRadius: 4,
          border: '1px solid rgba(0,0,0,0.05)',
          height: { xs: 'auto', sm: 380 }
        }}>
          {/* Mobile: título arriba, tabs abajo — Desktop: fila */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={{ xs: 1.5, sm: 0 }}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Grafico Devil</Typography>
            </Box>

            <ToggleButtonGroup
              value={metricType}
              exclusive
              onChange={(e, val) => val && setMetricType(val)}
              size="small"
              sx={{ bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}
            >
              <ToggleButton value="revenue" sx={{ textTransform: 'none', px: 2, fontWeight: 700 }}>
                Facturación
              </ToggleButton>
              <ToggleButton value="units" sx={{ textTransform: 'none', px: 2, fontWeight: 700 }}>
                Unidades
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Box sx={{ height: { xs: 240, sm: 260 }, width: '100%', overflow: 'hidden' }}>
            {mounted && metrics.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={metrics.chartData} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#cc0000" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#cc0000" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 12 }}
                    dy={10}
                    minTickGap={30}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(val) => metricType === 'revenue' ? `$${val}` : `${val}`}
                    width={35}
                  />
                  <RechartsTooltip
                    formatter={(value: any) => [
                      metricType === 'revenue'
                        ? `$${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
                        : `${value} unidades`,
                      metricType === 'revenue' ? 'Facturación' : 'Unidades'
                    ]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#cc0000"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Sin datos registrados recientemente.</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
