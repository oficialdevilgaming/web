"use client";

import { useMemo, useState, useEffect, Suspense } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Breadcrumbs,
  Link,
  IconButton,
  Paper,
  Button,
  CircularProgress,
  Drawer,
  TextField,
  InputAdornment,
  Chip
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { LayoutGrid, List as ListIcon, Filter, Search, X, Flame } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import NextLink from 'next/link';

import { supabase } from '../../../lib/supabase';
import { isAlwaysVisibleCategory } from '../../../lib/categoryConstants';
import CategorySidebar from '../../../components/layout/CategorySidebar';
import ProductCard from '../../../components/product/ProductCard';

const ShopContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const category = searchParams?.get('category') || '';
  const minPrice = Number(searchParams?.get('minPrice')) || 0;
  const maxPrice = Number(searchParams?.get('maxPrice')) || 10000000;
  const sortBy = searchParams?.get('sort') || 'newest';
  const stockFilter = searchParams?.get('stock') || '';
  const searchQuery = searchParams?.get('q') || '';
  const featuredFilter = searchParams?.get('featured') === 'true';
  const discountFilter = searchParams?.get('discount') === 'true';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const ITEMS_PER_PAGE = 12;

  // Sincronizar local con búsqueda externa (navbar)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce para el buscador del catálogo
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchQuery) {
        updateSearch(localSearch);
      }
    }, 500);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const fetchProducts = async (isNewSearch = true) => {
    if (isNewSearch) {
      setLoading(true);
      setPage(0);
    } else {
      setLoadingMore(true);
    }

    try {
      let query = supabase
        .from('products')
        .select('id, name, price, discount, final_price, stock, images, category_id, category:categories(name)', { count: 'exact' })
        .eq('is_hidden', false);

      // Apply Filters
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (category && categories.length > 0) {
        const selectedCat = categories.find(c => c.name.toLowerCase() === category.toLowerCase());
        if (selectedCat) {
          const allowedIds = getRecursiveIds(selectedCat.id, categories);
          query = query.in('category_id', allowedIds);
        } else {
          // Si se especificó una categoría pero no existe en la base de datos,
          // forzamos a que no traiga productos en vez de mostrar todo (por ej. consolas).
          query = query.eq('category_id', '00000000-0000-0000-0000-000000000000');
        }
      } else if (!category && categories.length > 0 && !featuredFilter && !discountFilter) {
        // Cuando no hay categoría seleccionada y NO se filtró por destacados,
        // excluir las categorías especiales (PC Armadas, Outlet) del listado general.
        // Si featuredFilter está activo, mostramos TODOS los productos marcados como
        // destacados sin importar su categoría.
        const specialCats = categories.filter(c => {
          const lower = c.name.toLowerCase();
          return lower.includes('armada') || lower.includes('outlet');
        });

        let forbiddenIds: string[] = [];
        specialCats.forEach(sc => {
          forbiddenIds = [...forbiddenIds, ...getRecursiveIds(sc.id, categories)];
        });

        if (forbiddenIds.length > 0) {
          query = query.not('category_id', 'in', `(${forbiddenIds.join(',')})`);
        }
      }

      if (minPrice > 0) query = query.gte('final_price', minPrice);
      if (maxPrice < 10000000) query = query.lte('final_price', maxPrice);

      if (stockFilter === 'in-stock') query = query.gt('stock', 0);
      else if (stockFilter === 'out-of-stock') query = query.eq('stock', 0);

      if (featuredFilter) query = query.eq('featured', true);
      if (discountFilter) query = query.gt('discount', 0);

      // Sorting
      switch (sortBy) {
        case 'price-low': query = query.order('final_price', { ascending: true }); break;
        case 'price-high': query = query.order('final_price', { ascending: false }); break;
        case 'newest': query = query.order('created_at', { ascending: false }); break;
        case 'oldest': query = query.order('created_at', { ascending: true }); break;
      }

      // Pagination
      const start = isNewSearch ? 0 : (page + 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await query.range(start, end);

      if (error) throw error;

      if (isNewSearch) {
        setProducts(data || []);
      } else {
        setProducts(prev => [...prev, ...(data || [])]);
        setPage(prev => prev + 1);
      }

      setHasMore(count ? (isNewSearch ? data.length : products.length + data.length) < count : false);

    } catch (error) {
      console.error("Error fetching shop data:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch categories only once
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { data: catsData, error: catsError } = await supabase.from('categories').select('id, name, parent_id');
        if (catsError) throw catsError;

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('category_id')
          .eq('is_hidden', false);

        if (productsError) throw productsError;

        if (catsData) {
          const activeSet = new Set(productsData?.map(p => p.category_id) || []);
          
          const isCategoryActive = (catId: string, allCats: any[]): boolean => {
            const cat = allCats.find(c => c.id === catId);
            if (cat && isAlwaysVisibleCategory(cat.name)) return true;
            if (activeSet.has(catId)) return true;
            const children = allCats.filter(c => c.parent_id === catId);
            return children.some(child => isCategoryActive(child.id, allCats));
          };

          const activeCatsData = catsData.filter(cat => isCategoryActive(cat.id, catsData));
          setCategories(activeCatsData);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setCategoriesLoaded(true);
      }
    };
    fetchCats();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    if (categoriesLoaded) {
      fetchProducts(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, category, minPrice, maxPrice, sortBy, stockFilter, featuredFilter, discountFilter, categoriesLoaded]);

  // Función para obtener IDs de categorías de forma recursiva (hijos, nietos, etc)
  const getRecursiveIds = (parentId: string, allCats: any[], visited = new Set<string>()): string[] => {
    if (visited.has(parentId)) return [];
    visited.add(parentId);
    let ids = [parentId];
    const children = allCats.filter(c => c.parent_id === parentId);
    children.forEach(child => {
      ids = [...ids, ...getRecursiveIds(child.id, allCats, visited)];
    });
    return ids;
  };

  // We removed client-side filteredProducts since it's now server-side

  const handleSortChange = (event: SelectChangeEvent) => {
    const newParams = new URLSearchParams(searchParams?.toString() || '');
    newParams.set('sort', event.target.value);
    router.push(`${pathname}?${newParams.toString()}`);
  };

  const updateSearch = (term: string) => {
    const newParams = new URLSearchParams(searchParams?.toString() || '');
    if (term) {
      newParams.set('q', term);
    } else {
      newParams.delete('q');
    }
    router.push(`${pathname}?${newParams.toString()}`);
  };

  const removeFilter = (key: string) => {
    const newParams = new URLSearchParams(searchParams?.toString() || '');
    if (key === 'price') {
      newParams.delete('minPrice');
      newParams.delete('maxPrice');
    } else if (key === 'q') {
      setLocalSearch('');
      newParams.delete('q');
    } else {
      newParams.delete(key);
    }
    router.push(`${pathname}?${newParams.toString()}`);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (category) count++;
    if (searchQuery) count++;
    if (minPrice > 0 || maxPrice < 10000000) count++;
    if (stockFilter) count++;
    if (featuredFilter) count++;
    if (discountFilter) count++;
    return count;
  }, [category, searchQuery, minPrice, maxPrice, stockFilter, featuredFilter, discountFilter]);

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', pb: 10 }}>
      {/* Header / Breadcrumbs */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid rgba(0,0,0,0.05)', py: { xs: 2, md: 2.5 }, mb: { xs: 2, md: 3 } }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1.5, sm: 2 } }}>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
              {searchQuery ? `Resultados para: "${searchQuery}"` : (category || 'Todos los Productos')}
            </Typography>
            <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ flexShrink: 0 }}>
              <Link component={NextLink} href="/" color="inherit" underline="hover">Inicio</Link>
              <Link component={NextLink} href="/shop" color="inherit" underline="hover">Tienda</Link>
              {category && <Typography color="text.secondary">{category}</Typography>}
              {searchQuery && <Typography color="primary" sx={{ fontWeight: 700 }}>Búsqueda: {searchQuery}</Typography>}
            </Breadcrumbs>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 3, lg: 2.5 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <CategorySidebar categoriesList={categories} />
          </Grid>

          {/* Product Grid */}
          <Grid size={{ xs: 12, md: 9, lg: 9.5 }}>
            {/* Contenedor Sticky en Mobile */}
            <Box
              sx={{
                position: { xs: 'sticky', md: 'static' },
                top: { xs: '120px', md: 'auto' }, // Posiciona la barra debajo del navbar móvil
                zIndex: 1000,
                bgcolor: '#f8f9fa',
                pt: { xs: 1.5, md: 0 },
                pb: { xs: 1, md: 0 },
                mx: { xs: -2, md: 0 },
                px: 0, // Sin padding horizontal en el contenedor sticky para scroll edge-to-edge
                mb: { xs: 2, md: 0 }
              }}
            >
              {/* Toolbar */}
              <Paper
                elevation={0}
                sx={{
                  mx: { xs: 2, md: 0 }, // Margen horizontal en mobile para mantenerlo centrado
                  p: { xs: 1.5, md: 2 },
                  mb: { xs: 1.5, md: 3 },
                  display: 'flex',
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.05)',
                  bgcolor: 'white',

                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'flex-start', md: 'center' },
                  justifyContent: { xs: 'flex-start', md: 'space-between' },
                  gap: { xs: 1, md: 0 }
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, width: { xs: '100%', md: 'auto' }, gap: { xs: 1, md: 2 } }}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 500, mr: 3 }}>
                    Mostrando <strong style={{ color: '#000' }}>{products.length}</strong> productos
                  </Typography>

                  <TextField
                    size="small"
                    placeholder="Buscar en el catálogo..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateSearch(localSearch)}
                    InputProps={{
                      sx: { borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)', fontSize: '0.85rem', width: { xs: '100%', md: 250 } },
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search size={16} />
                        </InputAdornment>
                      ),
                      endAdornment: localSearch ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => { setLocalSearch(''); updateSearch(''); }}>
                            <X size={14} />
                          </IconButton>
                        </InputAdornment>
                      ) : null
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'flex-start', md: 'space-between' } }}>
                  <Button
                    startIcon={<Filter size={16} />}
                    sx={{ display: { xs: 'flex', md: 'none' }, borderRadius: 2, fontWeight: 700, width: { xs: '45%', md: 'auto' } }}
                    onClick={() => setMobileFiltersOpen(true)}
                    variant="outlined"
                    size="small"
                  >
                    Filtros
                  </Button>

                  <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1, mr: 2 }}>
                    <IconButton
                      size="small"
                      color={viewMode === 'grid' ? 'primary' : 'default'}
                      onClick={() => setViewMode('grid')}
                      sx={{ bgcolor: viewMode === 'grid' ? 'rgba(204,0,0,0.05)' : 'transparent' }}
                    >
                      <LayoutGrid size={20} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color={viewMode === 'list' ? 'primary' : 'default'}
                      onClick={() => setViewMode('list')}
                      sx={{ bgcolor: viewMode === 'list' ? 'rgba(204,0,0,0.05)' : 'transparent' }}
                    >
                      <ListIcon size={20} />
                    </IconButton>
                  </Box>

                  <FormControl size="small"
                    sx={{
                      minWidth: { md: 200 },
                      width: { xs: '50%', md: 'auto' }
                    }}>
                    <InputLabel id="sort-label">Ordenar por</InputLabel>
                    <Select
                      labelId="sort-label"
                      value={sortBy}
                      label="Ordenar por"
                      onChange={handleSortChange}
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                      <MenuItem value="newest">Lo más nuevo</MenuItem>
                      <MenuItem value="oldest">Lo más viejo</MenuItem>
                      <MenuItem value="price-low">Precio: Menor a Mayor</MenuItem>
                      <MenuItem value="price-high">Precio: Mayor a Menor</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Paper>

              {/* Active Filters */}
              {(searchQuery || category || minPrice > 0 || maxPrice < 10000000 || stockFilter || featuredFilter || discountFilter || searchParams?.get('sort')) && (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    overflowX: 'auto',
                    pt: { xs: 0.5, md: 0 },
                    pb: { xs: 1, md: 0 },
                    px: { xs: 2, md: 0 }, // Padding horizontal para alinear los chips pero permitir scroll edge-to-edge
                    mb: { xs: 1.5, md: 3 },
                    '&::-webkit-scrollbar': { display: 'none' },
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    flexWrap: { xs: 'nowrap', md: 'wrap' }
                  }}
                >
                  {category && (
                    <Chip
                      label={`Categoría: ${category}`}
                      onDelete={() => removeFilter('category')}
                      sx={{ fontWeight: 600, borderRadius: 2, bgcolor: 'rgba(204,0,0,0.08)', color: 'primary.main', border: '1px solid rgba(204,0,0,0.2)', flexShrink: 0 }}
                    />
                  )}
                  {searchQuery && (
                    <Chip
                      label={`Búsqueda: "${searchQuery}"`}
                      onDelete={() => removeFilter('q')}
                      sx={{ fontWeight: 600, borderRadius: 2, bgcolor: 'rgba(204,0,0,0.08)', color: 'primary.main', border: '1px solid rgba(204,0,0,0.2)', flexShrink: 0 }}
                    />
                  )}
                  {(minPrice > 0 || maxPrice < 10000000) && (
                    <Chip
                      label={`Precio: $${minPrice.toLocaleString('es-ES')} - $${maxPrice.toLocaleString('es-ES')}`}
                      onDelete={() => removeFilter('price')}
                      sx={{ fontWeight: 600, borderRadius: 2, bgcolor: 'rgba(204,0,0,0.08)', color: 'primary.main', border: '1px solid rgba(204,0,0,0.2)', flexShrink: 0 }}
                    />
                  )}
                  {stockFilter === 'in-stock' && (
                    <Chip
                      label="En Stock"
                      onDelete={() => removeFilter('stock')}
                      sx={{ fontWeight: 600, borderRadius: 2, bgcolor: 'rgba(204,0,0,0.08)', color: 'primary.main', border: '1px solid rgba(204,0,0,0.2)', flexShrink: 0 }}
                    />
                  )}
                  {stockFilter === 'out-of-stock' && (
                    <Chip
                      label="Sin Stock"
                      onDelete={() => removeFilter('stock')}
                      sx={{ fontWeight: 600, borderRadius: 2, bgcolor: 'rgba(204,0,0,0.08)', color: 'primary.main', border: '1px solid rgba(204,0,0,0.2)', flexShrink: 0 }}
                    />
                  )}
                  {featuredFilter && (
                    <Chip
                      label="Destacados"
                      onDelete={() => removeFilter('featured')}
                      sx={{ fontWeight: 600, borderRadius: 2, bgcolor: 'rgba(204,0,0,0.08)', color: 'primary.main', border: '1px solid rgba(204,0,0,0.2)', flexShrink: 0 }}
                    />
                  )}
                  {discountFilter && (
                    <Chip
                      icon={<Flame size={14} color="#CC0000" style={{ color: '#CC0000' }} />}
                      label="Ofertas"
                      onDelete={() => removeFilter('discount')}
                      sx={{
                        fontWeight: 600,
                        borderRadius: 2,
                        bgcolor: 'rgba(204,0,0,0.08)',
                        color: 'primary.main',
                        border: '1px solid rgba(204,0,0,0.2)',
                        flexShrink: 0,
                        '& .MuiChip-icon': {
                          color: '#CC0000 !important'
                        }
                      }}
                    />
                  )}
                  {searchParams?.get('sort') && (
                    <Chip
                      label={
                        searchParams.get('sort') === 'price-low' ? 'Menor precio' :
                          searchParams.get('sort') === 'price-high' ? 'Mayor precio' :
                            searchParams.get('sort') === 'newest' ? 'Lo más nuevo' :
                              searchParams.get('sort') === 'oldest' ? 'Lo más antiguo' : 'Ordenamiento'
                      }
                      onDelete={() => removeFilter('sort')}
                      sx={{ fontWeight: 600, borderRadius: 2, bgcolor: 'rgba(204,0,0,0.08)', color: 'primary.main', border: '1px solid rgba(204,0,0,0.2)', flexShrink: 0 }}
                    />
                  )}
                  {activeFiltersCount > 1 && (
                    <Chip
                      label="Limpiar filtros"
                      onClick={() => {
                        const newParams = new URLSearchParams();
                        const currentSort = searchParams?.get('sort');
                        if (currentSort) {
                          newParams.set('sort', currentSort);
                        }
                        setLocalSearch('');
                        router.push(`${pathname}?${newParams.toString()}`);
                      }}
                      sx={{
                        fontWeight: 700,
                        borderRadius: 2,
                        bgcolor: 'primary.main',
                        color: 'white',
                        border: '1px solid',
                        borderColor: 'primary.main',
                        flexShrink: 0,
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        }
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>

            {/* Grid */}
            {loading ? (
              <Box sx={{ py: 10, textAlign: 'center' }}>
                <CircularProgress color="primary" thickness={5} />
                <Typography sx={{ mt: 2, fontWeight: 500 }} color="text.secondary">Cargando arsenal...</Typography>
              </Box>
            ) : products.length > 0 ? (
              <>
                <Grid container spacing={{ xs: 1.5, sm: 3 }}>
                  {products.map((product) => (
                    <Grid key={product.id} size={viewMode === 'grid' ? { xs: 6, sm: 6, md: 4, lg: 3 } : { xs: 12 }}>
                      <ProductCard product={product} layout={viewMode} />
                    </Grid>
                  ))}
                </Grid>

                {hasMore && (
                  <Box sx={{ mt: 6, textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      onClick={() => fetchProducts(false)}
                      disabled={loadingMore}
                      sx={{ borderRadius: 2, px: 6, py: 1.5, fontWeight: 800 }}
                    >
                      {loadingMore ? <CircularProgress size={24} /> : 'Cargar más productos'}
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Paper 
                elevation={0} 
                sx={{ 
                  py: 8, 
                  px: 4, 
                  textAlign: 'center', 
                  borderRadius: 4, 
                  border: '1px solid rgba(0,0,0,0.05)',
                  bgcolor: 'white',
                  boxShadow: '0 10px 30px -15px rgba(0,0,0,0.05)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Custom gaming SVG */}
                <svg viewBox="0 0 100 100" width="130" height="130" style={{ display: 'block', margin: '0 auto 24px', filter: 'drop-shadow(0px 8px 24px rgba(204,0,0,0.15))' }}>
                  {/* Glitch / Spark background effects */}
                  <path d="M 15 35 L 10 32 L 18 28 Z" fill="#E05A47" opacity="0.6" />
                  <path d="M 85 65 L 90 68 L 82 72 Z" fill="#E05A47" opacity="0.6" />
                  
                  {/* Broken wires / electric arc spark */}
                  <path d="M 50 25 L 48 35 L 53 45 L 49 55 L 51 65" fill="none" stroke="#CC0000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" opacity="0.9" />
                  
                  {/* Left Controller Half */}
                  <path d="M 22,40 C 22,28 44,28 46,34 L 44,68 C 38,68 30,76 24,70 C 18,64 22,40 22,40 Z" fill="#2D2D2D" stroke="#1A1A1A" strokeWidth="2" />
                  {/* D-Pad on Left Half */}
                  <path d="M 29,48 H 35 V 54 H 29 Z" fill="#CC0000" />
                  <path d="M 32,45 V 57" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 26,51 H 38" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" />
                  
                  {/* Left Analog Stick */}
                  <circle cx="37" cy="61" r="5" fill="#444" stroke="#111" strokeWidth="1" />
                  <circle cx="37" cy="61" r="2.5" fill="#CC0000" />

                  {/* Right Controller Half - tilted, cracked off */}
                  <g transform="translate(4, 3) rotate(8)">
                    <path d="M 50,36 C 52,30 74,30 74,42 C 74,42 78,66 72,72 C 66,78 54,68 50,68 Z" fill="#202020" stroke="#1A1A1A" strokeWidth="2" />
                    
                    {/* Buttons on Right Half */}
                    <circle cx="60" cy="46" r="2.5" fill="#888" />
                    <circle cx="66" cy="52" r="2.5" fill="#CC0000" />
                    
                    {/* Glitched Right Analog - Popped out / tilted away */}
                    <g transform="translate(52, 60) rotate(-20)">
                      <circle cx="0" cy="0" r="5" fill="#111" />
                      <circle cx="0" cy="0" r="2.5" fill="#555" />
                      <line x1="0" y1="0" x2="-2" y2="4" stroke="#555" strokeWidth="1.5" />
                    </g>
                  </g>
                  
                  {/* Detached button falling down */}
                  <circle cx="68" cy="85" r="2.5" fill="#CC0000" opacity="0.8" />
                  {/* Warning / Hazard Icon overlay in center/top */}
                  <g transform="translate(45, 12)">
                    <path d="M 5,0 L 10,9 L 0,9 Z" fill="#CC0000" />
                    <rect x="4.5" y="3" width="1" height="3" fill="#FFF" />
                    <circle cx="5" cy="7.5" r="0.6" fill="#FFF" />
                  </g>
                </svg>

                <Typography 
                  variant="h5" 
                  color="error" 
                  sx={{ 
                    fontWeight: 900, 
                    mb: 1, 
                    letterSpacing: -0.5, 
                    textTransform: 'uppercase',
                    fontFamily: 'inherit'
                  }}
                >
                  ¡GAME OVER!
                </Typography>
                
                <Typography 
                  variant="subtitle1"
                  color="text.primary" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 1 
                  }}
                >
                  {searchQuery ? `No encontramos loot para "${searchQuery}"` : "No se encontraron productos en este cuadrante."}
                </Typography>
                
                <Typography 
                  variant="body2"
                  color="text.secondary" 
                  sx={{ 
                    mb: 4,
                    maxWidth: 400,
                    mx: 'auto',
                    fontWeight: 500
                  }}
                >
                  Revisá los filtros, ajustá tu presupuesto o reiniciá la búsqueda para volver a la partida.
                </Typography>

                <Button
                  variant="contained"
                  onClick={() => router.push(pathname || '/')}
                  sx={{ 
                    borderRadius: 3, 
                    px: 5, 
                    py: 1.2,
                    fontWeight: 800,
                    boxShadow: '0 4px 14px 0 rgba(204,0,0,0.3)',
                    bgcolor: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      boxShadow: '0 6px 20px 0 rgba(204,0,0,0.4)',
                    }
                  }}
                >
                  Reiniciar Partida (Limpiar Filtros)
                </Button>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Mobile Filters Drawer */}
      <Drawer
        anchor="left"
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        PaperProps={{ sx: { width: 300, p: 3, bgcolor: '#f8f9fa' } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={900}>Filtros</Typography>
          <IconButton onClick={() => setMobileFiltersOpen(false)} size="small">
            <Filter size={20} />
          </IconButton>
        </Box>
        <CategorySidebar categoriesList={categories} onFilterChange={() => setMobileFiltersOpen(false)} />
      </Drawer>
    </Box>
  );
};

export default function ShopPage() {
  return (
    <Suspense fallback={
      <Box sx={{ py: 20, textAlign: 'center' }}>
        <CircularProgress color="primary" thickness={5} />
        <Typography sx={{ mt: 2, fontWeight: 500 }} color="text.secondary">Cargando tienda...</Typography>
      </Box>
    }>
      <ShopContent />
    </Suspense>
  );
}

