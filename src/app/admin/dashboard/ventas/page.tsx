"use client";

import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  Select,
  MenuItem,
  IconButton,
  Grid
} from '@mui/material';
import {
  ArrowLeft,
  TrendingUp,
  Box as BoxIcon
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabase';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const VentasDetail = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'hoy' | '7dias' | '30dias'>('30dias');

  useEffect(() => {
    const fetchData = async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'Entregado')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      setOrders(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysToSubtract = filter === 'hoy' ? 0 : filter === '7dias' ? 7 : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToSubtract);
    startDate.setHours(0, 0, 0, 0);

    const filteredOrders = orders.filter(o => new Date(o.created_at) >= startDate);

    const total = filteredOrders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
    const totalItems = filteredOrders.reduce((acc, o) => acc + (o.items ? o.items.reduce((sum: number, i: any) => sum + i.quantity, 0) : 0), 0);
    const avgTicket = filteredOrders.length > 0 ? total / filteredOrders.length : 0;

    const chartDataMap = new Map();

    if (filter === 'hoy') {
      for (let i = 0; i < 24; i++) {
        chartDataMap.set(`${i}:00`, 0);
      }
      filteredOrders.forEach(o => {
        const h = new Date(o.created_at).getHours();
        const key = `${h}:00`;
        chartDataMap.set(key, chartDataMap.get(key) + (parseFloat(o.total) || 0));
      });
    } else {
      for (let i = daysToSubtract; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        chartDataMap.set(d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }), 0);
      }
      filteredOrders.forEach(o => {
        const dateStr = new Date(o.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        if (chartDataMap.has(dateStr)) {
          chartDataMap.set(dateStr, chartDataMap.get(dateStr) + (parseFloat(o.total) || 0));
        }
      });
    }

    const chartData = Array.from(chartDataMap, ([date, value]) => ({ date, value }));

    return { total, chartData, count: filteredOrders.length, totalItems, avgTicket };
  }, [orders, filter]);

  if (loading) {
    return (
      <Box sx={{ p: 10, textAlign: 'center' }}>
        <CircularProgress color="primary" />
        <Typography sx={{ mt: 2 }} color="text.secondary">Cargando detalles de ventas...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton component={Link} href="/admin" sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
          <ArrowLeft />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Análisis de Ventas</Typography>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: 'primary.main', color: 'white', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 600 }}>Total Facturado</Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, my: 1 }}>
              ${metrics.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TrendingUp size={16} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>{metrics.count} pedidos entregados</Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, bgcolor: '#2196f3' }} />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, mt: 1 }}>
              <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: '#2196f315', color: '#2196f3' }}>
                <TrendingUp />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Ticket Promedio</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              ${metrics.avgTicket.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" color="text.secondary">Venta media por cliente</Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, bgcolor: '#9c27b0' }} />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, mt: 1 }}>
              <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: '#9c27b015', color: '#9c27b0' }}>
                <BoxIcon />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Items Vendidos</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{metrics.totalItems}</Typography>
            <Typography variant="caption" color="text.secondary">Total de productos entregados</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Evolución Facturación</Typography>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            sx={{ minWidth: 150, borderRadius: 2, fontWeight: 700, bgcolor: 'rgba(0,0,0,0.02)' }}
            size="small"
          >
            <MenuItem value="hoy">Hoy</MenuItem>
            <MenuItem value="7dias">Últimos 7 días</MenuItem>
            <MenuItem value="30dias">Últimos 30 días</MenuItem>
          </Select>
        </Stack>

        <Box sx={{ height: 400, width: '100%' }}>
          {metrics.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={metrics.chartData}>
                <defs>
                  <linearGradient id="colorValueSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4caf50" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4caf50" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 'Facturación']}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#4caf50"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValueSales)"
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ p: 10, textAlign: 'center' }}>
              <Typography color="text.secondary">No hay datos disponibles para este periodo.</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default VentasDetail;
