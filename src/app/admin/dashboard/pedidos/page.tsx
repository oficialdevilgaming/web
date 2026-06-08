"use client";

import { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Stack, IconButton, CircularProgress, Grid } from '@mui/material';
import { ArrowLeft, Clock, Truck, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabase';

const PedidosDetail = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase.from('orders').select('id, status, created_at, customer_name, total');
      setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const stats = useMemo(() => {
    const list = {
      Pendiente: { count: 0, sum: 0 },
      Enviado: { count: 0, sum: 0 },
      Pagado: { count: 0, sum: 0 },
      Entregado: { count: 0, sum: 0 },
      Cancelado: { count: 0, sum: 0 }
    };
    orders.forEach(o => {
      if (list[o.status as keyof typeof list]) {
         list[o.status as keyof typeof list].count += 1;
         list[o.status as keyof typeof list].sum += (parseFloat(o.total) || 0);
      }
    });
    return list;
  }, [orders]);

  if (loading) return (
    <Box sx={{ p: 10, textAlign: 'center' }}>
      <CircularProgress />
    </Box>
  );

  const cards = [
    { key: 'Pendiente', label: 'Pendientes de Procesamiento', color: '#ff9800', icon: <Clock /> },
    { key: 'Enviado', label: 'En Ruta / Enviados', color: '#2196f3', icon: <Truck /> },
    { key: 'Pagado', label: 'Pagados', color: '#9c27b0', icon: <CreditCard /> },
    { key: 'Entregado', label: 'Finalizados (Éxito)', color: '#4caf50', icon: <CheckCircle /> },
    { key: 'Cancelado', label: 'Cancelados', color: '#f44336', icon: <AlertCircle /> },
  ];

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton component={Link} href="/admin">
          <ArrowLeft />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Resumen Completo de Pedidos</Typography>
      </Stack>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Estos son los acumulados históricos de pedidos según su estado final.
      </Typography>

      <Grid container spacing={3}>
        {cards.map(c => {
          const s = stats[c.key as keyof typeof stats];
          return (
            <Grid size={{ xs: 12, sm: 6 }} key={c.key}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 0, left: 0, height: 4, width: '100%', bgcolor: c.color }} />
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  <Box sx={{ color: c.color }}>{c.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{c.label}</Typography>
                </Stack>
                
                <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                  <Box>
                    <Typography variant="body2" color="text.secondary">Cantidad</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{s.count}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">Valor Retenido</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: c.color }}>
                      ${s.sum.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  );
};
export default PedidosDetail;
