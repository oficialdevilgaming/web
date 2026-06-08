"use client";

import { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Stack, 
  IconButton, 
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Grid
} from '@mui/material';
import { 
  ArrowLeft, 
  Trophy, 
  ChevronDown, 
  BarChart3, 
  PackageSearch 
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

const CategoriasDetail = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeMetric, setActiveMetric] = useState<'units' | 'revenue'>('units');

  useEffect(() => {
    const fetchData = async () => {
      const [ordRes, catRes, prodRes] = await Promise.all([
        supabase.from('orders').select('items').eq('status', 'Entregado'),
        supabase.from('categories').select('*'),
        supabase.from('products').select('id, name, category_id')
      ]);

      setOrders(ordRes.data || []);
      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const rankings = useMemo(() => {
    const productSales: Record<string, number> = {};
    const productRevenue: Record<string, number> = {};

    orders.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item: any) => {
          const qty = item.quantity || 0;
          const price = item.price || 0;
          productSales[item.name] = (productSales[item.name] || 0) + qty;
          productRevenue[item.name] = (productRevenue[item.name] || 0) + (qty * price);
        });
      }
    });

    const catStats: Record<string, { 
      totalUnits: number, 
      totalRevenue: number,
      topProduct: { name: string, count: number }, 
      allProducts: { name: string, units: number, revenue: number }[] 
    }> = {};
    
    categories.forEach(c => {
      catStats[c.id] = { totalUnits: 0, totalRevenue: 0, topProduct: { name: 'Ninguno', count: 0 }, allProducts: [] };
    });

    products.forEach(p => {
      const units = productSales[p.name] || 0;
      const revenue = productRevenue[p.name] || 0;

      if (p.category_id && catStats[p.category_id]) {
        catStats[p.category_id].totalUnits += units;
        catStats[p.category_id].totalRevenue += revenue;
        
        if (units > 0) {
            catStats[p.category_id].allProducts.push({ name: p.name, units, revenue });
        }
        if (units > catStats[p.category_id].topProduct.count) {
          catStats[p.category_id].topProduct = { name: p.name, count: units };
        }
      }
    });

    return categories.map(c => ({
      ...c,
      stats: {
          ...catStats[c.id],
          allProducts: catStats[c.id].allProducts.sort((a, b) => 
            activeMetric === 'units' ? b.units - a.units : b.revenue - a.revenue
          )
      }
    }))
    .filter(c => c.stats.totalUnits > 0)
    .sort((a, b) => 
        activeMetric === 'units' ? b.stats.totalUnits - a.stats.totalUnits : b.stats.totalRevenue - a.stats.totalRevenue
    );

  }, [categories, products, orders, activeMetric]);

  if (loading) return (
    <Box sx={{ p: 10, textAlign: 'center' }}>
      <CircularProgress />
    </Box>
  );

  const colors = ['#ffb300', '#9e9e9e', '#8d6e63', '#2196f3', '#4caf50'];

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton component={Link} href="/admin">
          <ArrowLeft />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Ranking de Categorías</Typography>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Gráfico Comparativo Principal */}
        <Grid size={12}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <BarChart3 size={20} color="#666" />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Comparativa Global</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ bgcolor: 'rgba(0,0,0,0.03)', p: 0.5, borderRadius: 2 }}>
                    <Box 
                        onClick={() => setActiveMetric('units')}
                        sx={{ 
                            px: 2, py: 0.5, borderRadius: 1.5, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                            bgcolor: activeMetric === 'units' ? 'white' : 'transparent',
                            boxShadow: activeMetric === 'units' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                            color: activeMetric === 'units' ? 'primary.main' : 'text.secondary',
                            transition: 'all 0.2s'
                        }}
                    >
                        Unidades
                    </Box>
                    <Box 
                        onClick={() => setActiveMetric('revenue')}
                        sx={{ 
                            px: 2, py: 0.5, borderRadius: 1.5, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                            bgcolor: activeMetric === 'revenue' ? 'white' : 'transparent',
                            boxShadow: activeMetric === 'revenue' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                            color: activeMetric === 'revenue' ? 'primary.main' : 'text.secondary',
                            transition: 'all 0.2s'
                        }}
                    >
                        Dinero ($)
                    </Box>
                </Stack>
            </Stack>
            <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={rankings}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                        <YAxis hide />
                        <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                            formatter={(value: any) => [
                                activeMetric === 'units' ? `${value} uds.` : `$${Number(value).toLocaleString('es-ES')}`, 
                                activeMetric === 'units' ? 'Vendidos' : 'IngresosTotal'
                            ]}
                        />
                        <Bar 
                            dataKey={activeMetric === 'units' ? "stats.totalUnits" : "stats.totalRevenue"} 
                            radius={[6, 6, 0, 0]} 
                        >
                            {rankings.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, ml: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PackageSearch size={22} /> Detalle por Categoría
      </Typography>

      <Stack spacing={2}>
        {rankings.map((cat, index) => (
          <Accordion 
            key={cat.id} 
            elevation={0} 
            sx={{ 
                borderRadius: '16px !important', 
                border: '1px solid rgba(0,0,0,0.05)',
                '&:before': { display: 'none' },
                overflow: 'hidden'
            }}
          >
            <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ px: 3, py: 1 }}>
                <Stack direction="row" alignItems="center" spacing={3} sx={{ width: '100%', pr: 2 }}>
                    <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 2, 
                        bgcolor: `${colors[index % colors.length]}15`, 
                        color: colors[index % colors.length],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800
                    }}>
                        {index + 1}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>{cat.name}</Typography>
                            {index < 3 && <Trophy size={16} color={colors[index]} />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                            {activeMetric === 'units' 
                                ? `Ventas totales: ${cat.stats.totalUnits} unidades` 
                                : `Ingresos totales: $${cat.stats.totalRevenue.toLocaleString('es-ES')}`
                            }
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">Producto Estrella</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{cat.stats.topProduct.name}</Typography>
                    </Box>
                </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 4, pb: 4, bgcolor: 'rgba(0,0,0,0.01)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Desglose de Productos
                </Typography>
                <Stack spacing={3}>
                    {cat.stats.allProducts.map((p: any, pIdx: number) => {
                        const val = activeMetric === 'units' ? p.units : p.revenue;
                        const total = activeMetric === 'units' ? cat.stats.totalUnits : cat.stats.totalRevenue;
                        const weight = total > 0 ? (val / total) * 100 : 0;
                        return (
                            <Box key={pIdx}>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                        {activeMetric === 'units' ? `${p.units} uds.` : `$${p.revenue.toLocaleString('es-ES')}`}
                                    </Typography>
                                </Stack>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={weight} 
                                    sx={{ 
                                        height: 8, 
                                        borderRadius: 4, 
                                        bgcolor: 'rgba(0,0,0,0.05)',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: colors[index % colors.length]
                                        }
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary">Representa el {weight.toFixed(0)}% del total de la categoría</Typography>
                            </Box>
                        );
                    })}
                </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Box>
  );
};

export default CategoriasDetail;
