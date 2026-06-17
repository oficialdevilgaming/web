"use client";

import { useState, useEffect, Suspense, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Stack,
  TablePagination,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  Tooltip,
  MenuItem
} from '@mui/material';
import { Plus, Search, Edit2, Trash2, Star, X, CheckCircle, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { Collapse } from '@mui/material';
import { supabase } from '../../../lib/supabase';
import { useAlert } from '../../../context/AlertContext';
import { FormControlLabel, Switch } from '@mui/material';
import { compressAndConvertToWebP } from '../../../lib/imageUtils';
import RichTextEditor from '../../../components/admin/RichTextEditor';

type Product = {
  id: string;
  name: string;
  price: number;
  cost_price?: number;
  images?: string[];
  description: string;
  category_id: string;
  category?: { name: string; parent_id?: string | null; parent?: { name: string } };
  stock: number;
  featured?: boolean;
  discount?: number;
};

type Category = {
  id: string;
  name: string;
  parent_id?: string | null;
  parent?: { name: string };
};

const ProductsManagement = () => {
  const { showAlert } = useAlert();
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [productForDetail, setProductForDetail] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  const handleOpenDetail = (product: Product) => {
    setProductForDetail(product);
    setActiveImageIndex(0);
    setDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setProductForDetail(null);
  };

  const [selectedParentId, setSelectedParentId] = useState<string>('');

  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    category_id: '',
    price: '' as number | string,
    cost_price: '' as number | string,
    stock: '' as number | string,
    featured: false,
    images: [] as string[],
    discount: '' as number | string
  });

  // Filtros y Paginación
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<string>('all');
  const [filterFeatured, setFilterFeatured] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const searchParams = useSearchParams();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build query for products
      let query = supabase
        .from('products')
        .select('*, category:categories(name, parent_id, parent:parent_id(name))', { count: 'exact' });

      // Apply Filters
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (selectedCategory !== 'all') {
        // Para categorías jerárquicas en server-side, necesitamos saber si es padre
        const cat = dbCategories.find(c => c.id === selectedCategory);
        if (cat && !cat.parent_id) {
          // Es padre, buscar hijos
          const childrenIds = dbCategories.filter(c => c.parent_id === selectedCategory).map(c => c.id);
          query = query.in('category_id', [selectedCategory, ...childrenIds]);
        } else {
          query = query.eq('category_id', selectedCategory);
        }
      }

      if (filterStock !== 'all') {
        if (filterStock === 'low') query = query.gt('stock', 0).lt('stock', 5);
        if (filterStock === 'out') query = query.eq('stock', 0);
        if (filterStock === 'critical') query = query.lt('stock', 5);
      }

      if (filterFeatured !== 'all') {
        query = query.eq('featured', filterFeatured === 'yes');
      }

      // Pagination & Order
      const { data: productsData, count, error: pError } = await query
        .order('created_at', { ascending: false })
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1);

      if (pError) throw pError;

      setAllProducts(productsData || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories once on mount (independent of pagination/filters)
  useEffect(() => {
    const fetchCategories = async () => {
      const { data: catsData, error: cError } = await supabase
        .from('categories')
        .select('id, name, parent_id, parent:parent_id(name)')
        .order('name');
      if (!cError && catsData) setDbCategories(catsData as unknown as Category[]);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const stockParam = searchParams.get('filter');
    if (stockParam === 'low_stock') {
      setFilterStock('low');
    } else if (stockParam === 'critical') {
      setFilterStock('critical');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar para parsear la URL inicial

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchTerm, selectedCategory, filterStock, filterFeatured]);

  const handleOpen = (product: Product | null = null) => {
    setSelectedProduct(product);
    setFormValues({
      name: product?.name || '',
      description: product?.description || '',
      category_id: product?.category_id || '',
      price: product ? product.price : '',
      cost_price: product?.cost_price != null ? product.cost_price : '',
      stock: product ? product.stock : '',
      featured: product?.featured || false,
      images: product?.images || [],
      discount: product?.discount != null ? product.discount : ''
    });
    setSelectedParentId(product?.category?.parent_id || '');
    setSelectedFiles([]);
    setImageError(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProduct(null);
    setSelectedParentId('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (formValues.images.length + selectedFiles.length + filesArray.length > 3) {
        setImageError('Máximo 3 imágenes permitidas en total.');
        return;
      }
      setSelectedFiles(prev => [...prev, ...filesArray]);
      setImageError(null);
    }
  };

  const handleParentChange = (parentId: string) => {
    setSelectedParentId(parentId);
    setFormValues(prev => ({ ...prev, category_id: parentId }));
  };

  const handleSubCategoryChange = (subId: string) => {
    setFormValues(prev => ({ ...prev, category_id: subId || selectedParentId }));
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (index: number) => {
    const imgUrl = formValues.images[index];
    // Borrar del bucket de Supabase si la imagen es del bucket 'products'
    if (imgUrl && imgUrl.includes('/products/')) {
      const marker = '/storage/v1/object/public/products/';
      const markerIdx = imgUrl.indexOf(marker);
      if (markerIdx !== -1) {
        const filePath = imgUrl.substring(markerIdx + marker.length);
        supabase.storage.from('products').remove([filePath])
          .then(({ error }) => {
            if (error) console.error('Error al borrar imagen del storage:', error);
          });
      }
    }
    setFormValues(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const uploadImagesToSupabase = async (files: File[]) => {
    const uploadedUrls: string[] = [];
    for (const file of files) {
      // Convertir a WebP y comprimir antes de subir
      const optimizedFile = await compressAndConvertToWebP(file);

      const originalKB = (file.size / 1024).toFixed(2);
      const optimizedKB = (optimizedFile.size / 1024).toFixed(2);
      const saving = (100 - (optimizedFile.size / file.size) * 100).toFixed(1);
      console.log(`[Optimización] ${file.name}: ${originalKB}KB -> ${optimizedKB}KB (Ahorro: ${saving}%)`);

      const fileExt = 'webp';
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `productImages/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, optimizedFile, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }
    return uploadedUrls;
  };

  const handleSave = async () => {
    if (formValues.images.length === 0 && selectedFiles.length === 0) {
      setImageError('Debés subir al menos una imagen para el producto.');
      return;
    }

    setImageError(null);
    setUploadingFiles(true);
    let finalImages = [...formValues.images];

    if (selectedFiles.length > 0) {
      const urls = await uploadImagesToSupabase(selectedFiles);
      finalImages = [...finalImages, ...urls];
    }

    if (formValues.cost_price === '' || formValues.cost_price === null || formValues.cost_price === undefined) {
      showAlert('El campo Costo base es obligatorio.');
      setUploadingFiles(false);
      return;
    }

    const dataToSave = {
      name: formValues.name,
      description: formValues.description,
      category_id: formValues.category_id,
      price: Number(formValues.price) || 0,
      cost_price: Number(formValues.cost_price),
      stock: Number(formValues.stock) || 0,
      featured: formValues.featured,
      images: finalImages,
      discount: formValues.discount !== '' ? Number(formValues.discount) : null
    };

    try {
      if (selectedProduct) {
        const { error } = await supabase.from('products').update(dataToSave).eq('id', selectedProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([dataToSave]);
        if (error) throw error;
      }
      fetchData();
      handleClose();
    } catch (err: any) {
      console.error('Error guardando producto:', err);
      showAlert('Error al guardar el producto: ' + (err.message || JSON.stringify(err)));
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    // 1. Borrar imágenes del bucket de Supabase Storage
    if (productToDelete.images && productToDelete.images.length > 0) {
      const marker = '/storage/v1/object/public/products/';
      const filePaths = productToDelete.images
        .filter(url => url && url.includes(marker))
        .map(url => url.substring(url.indexOf(marker) + marker.length));

      if (filePaths.length > 0) {
        const { error } = await supabase.storage.from('products').remove(filePaths);
        if (error) console.error('Error al borrar imágenes del storage:', error);
      }
    }

    // 2. Borrar el producto de la base de datos
    await supabase.from('products').delete().eq('id', productToDelete.id);
    setDeleteDialogOpen(false);
    setProductToDelete(null);
    fetchData();
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Productos</Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpen()}
          sx={{ py: 1.5, px: 3, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
        >
          Nuevo Producto
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ p: 0, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre o marca..."
              variant="outlined"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              size="small"
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
              sx={{ maxWidth: { xs: '100%', sm: 400 } }}
            />

            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel id="category-filter-label">Categoría</InputLabel>
              <MuiSelect
                labelId="category-filter-label"
                value={selectedCategory}
                label="Categoría"
                onChange={(e: any) => {
                  setSelectedCategory(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">Todas las categorías</MenuItem>
                {dbCategories.filter(cat => !cat.parent_id).map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
              <InputLabel id="stock-filter-label">Stock</InputLabel>
              <MuiSelect
                labelId="stock-filter-label"
                value={filterStock}
                label="Stock"
                onChange={(e: any) => {
                  setFilterStock(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">Todo el Stock</MenuItem>
                <MenuItem value="low">Bajo Stock</MenuItem>
                <MenuItem value="out">Sin Stock</MenuItem>
              </MuiSelect>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
              <InputLabel id="featured-filter-label">Destacados</InputLabel>
              <MuiSelect
                labelId="featured-filter-label"
                value={filterFeatured}
                label="Destacados"
                onChange={(e: any) => {
                  setFilterFeatured(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">Ver Todos</MenuItem>
                <MenuItem value="yes">Solo Destacados</MenuItem>
                <MenuItem value="no">No Destacados</MenuItem>
              </MuiSelect>
            </FormControl>


          </Stack>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Dest.</TableCell>
                <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Precio</TableCell>
                <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Stock / Estado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center">Cargando...</TableCell></TableRow>
              ) : allProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay productos
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : allProducts.map((product: Product) => (
                <Fragment key={product.id}>
                  <TableRow hover>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{product.name}</Typography>
                          {/* Mobile: botón para expandir detalles */}
                          <Box
                            component="button"
                            onClick={() => toggleRow(product.id)}
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
                            {expandedRows.has(product.id) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            {expandedRows.has(product.id) ? 'Ocultar detalles' : 'Ver detalles'}
                          </Box>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Chip label={product.category?.name || 'Sin categoría'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {product.featured && (
                        <Tooltip title="Producto Destacado">
                          <Star size={20} fill="#FFD700" color="#FFD700" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>${product.price.toLocaleString('es-ES')}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {product.stock} unid.
                        </Typography>
                        <Chip
                          label={
                            product.stock === 0 ? 'Sin Stock' :
                              product.stock < 5 ? 'Bajo Stock' :
                                'En Stock'
                          }
                          size="small"
                          color={
                            product.stock === 0 ? 'error' :
                              product.stock < 5 ? 'warning' :
                                'success'
                          }
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton size="small" color="primary" onClick={() => handleOpenDetail(product)} title="Ver Detalle">
                          <Eye size={18} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleOpen(product)} title="Editar">
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(product)} title="Eliminar">
                          <Trash2 size={18} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                  {/* Mobile expandable details row */}
                  <TableRow sx={{ display: { xs: 'table-row', md: 'none' } }}>
                    <TableCell colSpan={2} sx={{ p: 0, border: 0 }}>
                      <Collapse in={expandedRows.has(product.id)} timeout="auto" unmountOnExit>
                        <Box sx={{ px: 2, pb: 2, pt: 1, bgcolor: 'rgba(0,0,0,0.015)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                          <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Categoría</Typography>
                              <Chip label={product.category?.name || 'Sin categoría'} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.72rem' }} />
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Precio</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>${product.price.toLocaleString('es-ES')}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Stock</Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{product.stock} unid.</Typography>
                                <Chip
                                  label={product.stock === 0 ? 'Sin Stock' : product.stock < 5 ? 'Bajo Stock' : 'En Stock'}
                                  size="small"
                                  color={product.stock === 0 ? 'error' : product.stock < 5 ? 'warning' : 'success'}
                                  sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }}
                                />
                              </Stack>
                            </Stack>
                            {product.discount !== undefined && product.discount > 0 && (
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Descuento</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>{product.discount}% OFF</Typography>
                              </Stack>
                            )}
                            {product.featured && (
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Destacado</Typography>
                                <Star size={16} fill="#FFD700" color="#FFD700" />
                              </Stack>
                            )}
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
          labelRowsPerPage="Productos por página"
        />
      </Paper>

      {/* Product Modal */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {selectedProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}
        </DialogTitle>
        <DialogContent dividers sx={{ py: 4 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Nombre del Producto"
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                />
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>Descripción del producto</Typography>
                  <RichTextEditor
                    value={formValues.description}
                    onChange={(html: string) => setFormValues({ ...formValues, description: html })}
                    placeholder="Escribí la descripción del producto..."
                  />
                </Box>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <TextField
                      select
                      fullWidth
                      label="Categoría"
                      value={selectedParentId}
                      onChange={(e) => handleParentChange(e.target.value)}
                    >
                      <MenuItem value="">Seleccionar...</MenuItem>
                      {dbCategories.filter(c => !c.parent_id).map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  {/* Solo mostrar subcategoría si el padre tiene hijos */}
                  {selectedParentId && dbCategories.some(c => c.parent_id === selectedParentId) && (
                    <Grid size={6}>
                      <TextField
                        select
                        fullWidth
                        label="Subcategoría (Opcional)"
                        value={formValues.category_id === selectedParentId ? '' : formValues.category_id}
                        onChange={(e) => handleSubCategoryChange(e.target.value)}
                      >
                        <MenuItem value="">Ninguna / Usar Principal</MenuItem>
                        {dbCategories
                          .filter(c => c.parent_id === selectedParentId)
                          .map((option) => (
                            <MenuItem key={option.id} value={option.id}>
                              {option.name}
                            </MenuItem>
                          ))}
                      </TextField>
                    </Grid>
                  )}
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Precio de venta ($)"
                      type="number"
                      value={formValues.price}
                      onChange={(e) => setFormValues({ ...formValues, price: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      required
                      label="Costo base ($)"
                      type="number"
                      inputProps={{ min: 0, step: 'any' }}
                      value={formValues.cost_price}
                      onChange={(e) => setFormValues({ ...formValues, cost_price: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                      helperText="Lo que pagaste por el producto"
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Stock"
                      type="number"
                      value={formValues.stock}
                      onChange={(e) => setFormValues({ ...formValues, stock: e.target.value === '' ? '' : parseInt(e.target.value) })}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Descuento (%)"
                      type="number"
                      value={formValues.discount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length <= 3) {
                          setFormValues({ ...formValues, discount: val === '' ? '' : Math.max(0, parseInt(val)) });
                        }
                      }}
                      helperText="Opcional. Máximo 3 dígitos."
                      inputProps={{ min: 0, max: 999 }}
                    />
                  </Grid>

                </Grid>



              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={3}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,215,0,0.05)', borderRadius: 3, border: '1px solid rgba(255,215,0,0.2)' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formValues.featured}
                        onChange={(e) => setFormValues({ ...formValues, featured: e.target.checked })}
                        color="success"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 700 }}>Producto Destacado</Typography>
                        <Star size={16} fill={formValues.featured ? "#FFD700" : "none"} color="#FFD700" />
                      </Box>
                    }
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Aparecerá en la sección Productos Destacados de la tienda.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Imágenes (Max 3)</Typography>
                </Box>

                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: formValues.images.length + selectedFiles.length >= 3 ? 'success.main' : (imageError ? 'error.main' : '#ddd'),
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    cursor: formValues.images.length + selectedFiles.length >= 3 || uploadingFiles ? 'not-allowed' : 'pointer',
                    bgcolor: formValues.images.length + selectedFiles.length >= 3 ? 'rgba(76, 175, 80, 0.04)' : 'transparent',
                    '&:hover': {
                      borderColor: formValues.images.length + selectedFiles.length >= 3 ? 'success.main' : (imageError ? 'error.main' : 'primary.main'),
                      bgcolor: formValues.images.length + selectedFiles.length >= 3 ? 'rgba(76, 175, 80, 0.04)' : (imageError ? 'rgba(211,47,47,0.02)' : 'rgba(204,0,0,0.02)')
                    }
                  }}
                  component="label"
                  onClick={(e) => {
                    if (formValues.images.length + selectedFiles.length >= 3 || uploadingFiles) {
                      e.preventDefault();
                    }
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    hidden
                    onChange={handleFileChange}
                    disabled={formValues.images.length + selectedFiles.length >= 3 || uploadingFiles}
                  />
                  {formValues.images.length + selectedFiles.length >= 3 ? (
                    <Box>
                      <CheckCircle size={32} color="#4caf50" style={{ margin: '0 auto', opacity: 0.8 }} />
                      <Typography variant="caption" display="block" color="success.main" sx={{ fontWeight: 700, mt: 1 }}>
                        Límite de 3 imágenes alcanzado
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Plus size={32} opacity={0.5} style={{ margin: '0 auto' }} />
                      <Typography variant="caption" display="block" color="text.secondary">
                        Subí las fotos del producto
                      </Typography>
                    </>
                  )}
                </Box>
                {imageError && formValues.images.length + selectedFiles.length < 3 && (
                  <Typography variant="caption" color="error" sx={{ fontWeight: 700, mt: -2, display: 'block' }}>
                    {imageError}
                  </Typography>
                )}

                <Grid container spacing={1}>
                  {/* Existing Images */}
                  {formValues.images.map((img, idx) => (
                    <Grid size={6} key={`ext-${idx}`}>
                      <Box sx={{ position: 'relative', aspectRatio: '1/1', borderRadius: 1, overflow: 'hidden', border: '1px solid #eee' }}>
                        <Box component="img" src={img} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <IconButton size="small" color="error" sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }} onClick={() => removeExistingImage(idx)}>
                          <Trash2 size={14} />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                  {/* New Selected Files Preview */}
                  {selectedFiles.map((file, idx) => (
                    <Grid size={6} key={`new-${idx}`}>
                      <Box sx={{ position: 'relative', aspectRatio: '1/1', borderRadius: 1, overflow: 'hidden', border: '1px solid #eee' }}>
                        <Box component="img" src={URL.createObjectURL(file)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <IconButton size="small" color="error" sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }} onClick={() => removeSelectedFile(idx)}>
                          <Trash2 size={14} />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} color="inherit" sx={{ fontWeight: 600 }} disabled={uploadingFiles}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} sx={{ fontWeight: 800, px: 4 }} disabled={uploadingFiles}>
            {uploadingFiles ? 'Procesando...' : (selectedProduct ? 'Actualizar' : 'Crear Producto')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que querés eliminar <strong>{productToDelete?.name}</strong>? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={handleDeleteCancel} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" sx={{ fontWeight: 700 }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Detail Modal */}
      <Dialog open={detailDialogOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 850 }}>Detalle del Producto</Typography>
            {productForDetail?.featured && (
              <Chip
                icon={<Star size={14} fill="#FFD700" color="#FFD700" />}
                label="Destacado"
                size="small"
                sx={{ bgcolor: 'rgba(255, 215, 0, 0.15)', color: '#b89200', fontWeight: 700, border: '1px solid rgba(255, 215, 0, 0.3)' }}
              />
            )}
          </Box>
          <IconButton onClick={handleCloseDetail} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          {productForDetail && (
            <Grid container spacing={4}>
              {/* Left Column: Images */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={2}>
                  {productForDetail.images && productForDetail.images.length > 0 ? (
                    <>
                      {/* Main Image */}
                      <Box sx={{
                        position: 'relative',
                        aspectRatio: '1/1',
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(0,0,0,0.05)',
                        bgcolor: '#fafafa'
                      }}>
                        <Box
                          component="img"
                          src={productForDetail.images[activeImageIndex] || productForDetail.images[0]}
                          alt={productForDetail.name}
                          sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                        {productForDetail.discount && productForDetail.discount > 0 ? (
                          <Chip
                            label={`${productForDetail.discount}% OFF`}
                            color="error"
                            size="small"
                            sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 800, borderRadius: 1.5, px: 1 }}
                          />
                        ) : null}
                      </Box>
                      {/* Thumbnails */}
                      {productForDetail.images.length > 1 && (
                        <Grid container spacing={1}>
                          {productForDetail.images.map((img, idx) => (
                            <Grid size={4} key={idx}>
                              <Box
                                onClick={() => setActiveImageIndex(idx)}
                                sx={{
                                  position: 'relative',
                                  aspectRatio: '1/1',
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  border: '2px solid',
                                  borderColor: activeImageIndex === idx ? 'primary.main' : 'rgba(0,0,0,0.06)',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    borderColor: 'primary.main',
                                    transform: 'scale(1.02)'
                                  }
                                }}
                              >
                                <Box
                                  component="img"
                                  src={img}
                                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </>
                  ) : (
                    <Box sx={{
                      aspectRatio: '1/1',
                      borderRadius: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(0,0,0,0.02)',
                      border: '1px dashed rgba(0,0,0,0.1)'
                    }}>
                      <Box sx={{ opacity: 0.3, mb: 1, fontSize: '2rem' }}>📦</Box>
                      <Typography variant="body2" color="text.secondary">Sin imágenes</Typography>
                    </Box>
                  )}
                </Stack>
              </Grid>

              {/* Right Column: Info */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 850, mb: 1, color: '#111', lineHeight: 1.2 }}>
                      {productForDetail.name}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                      <Chip
                        label={productForDetail.category?.name || 'Sin Categoría'}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                      {productForDetail.category?.parent?.name && (
                        <Chip
                          label={`Padre: ${productForDetail.category.parent.name}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 500, color: 'text.secondary' }}
                        />
                      )}
                    </Stack>
                  </Box>

                  {/* Financial & Stock Metrics Panel */}
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#fbfbfb', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <Grid container spacing={{ xs: 1.75, sm: 3 }}>
                      {/* Price Info */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Stack direction={{ xs: 'row', sm: 'column' }} alignItems={{ xs: 'baseline', sm: 'flex-start' }} spacing={{ xs: 1, sm: 0 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: { xs: 0, sm: 0.5 }, flexShrink: 0 }}>
                            Precio de Venta:
                          </Typography>
                          {productForDetail.discount && productForDetail.discount > 0 ? (
                            <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 1, rowGap: 0.25 }}>
                              <Typography variant="h5" sx={{ fontWeight: 800, color: 'error.main', fontSize: { xs: '1.15rem', sm: '1.5rem' }, lineHeight: 1.15 }}>
                                ${(productForDetail.price * (1 - productForDetail.discount / 100)).toLocaleString('es-ES')}
                              </Typography>
                              <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary', whiteSpace: 'nowrap', fontSize: { xs: '0.82rem', sm: '0.9rem' } }}>
                                ${productForDetail.price.toLocaleString('es-ES')}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.15rem', sm: '1.5rem' }, lineHeight: 1.15 }}>
                              ${productForDetail.price.toLocaleString('es-ES')}
                            </Typography>
                          )}
                        </Stack>
                      </Grid>

                      {/* Discount */}
                      {productForDetail.discount && productForDetail.discount > 0 && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Stack direction={{ xs: 'row', sm: 'column' }} alignItems={{ xs: 'baseline', sm: 'flex-start' }} spacing={{ xs: 1, sm: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: { xs: 0, sm: 0.5 }, flexShrink: 0 }}>
                              Descuento:
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'error.main', fontSize: { xs: '1.08rem', sm: '1.25rem' }, lineHeight: 1.15 }}>
                              {productForDetail.discount}% OFF
                            </Typography>
                          </Stack>
                        </Grid>
                      )}

                      {/* Cost Price */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Stack direction={{ xs: 'row', sm: 'column' }} alignItems={{ xs: 'baseline', sm: 'flex-start' }} spacing={{ xs: 1, sm: 0 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: { xs: 0, sm: 0.5 }, flexShrink: 0 }}>
                            Costo Base:
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '1.15rem', sm: '1.5rem' }, lineHeight: 1.15 }}>
                            ${productForDetail.cost_price != null ? productForDetail.cost_price.toLocaleString('es-ES') : '0'}
                          </Typography>
                        </Stack>
                      </Grid>

                      {/* Margin / Profitability */}
                      {productForDetail.cost_price != null && productForDetail.cost_price > 0 && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Stack direction={{ xs: 'row', sm: 'column' }} alignItems={{ xs: 'baseline', sm: 'flex-start' }} spacing={{ xs: 1, sm: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: { xs: 0, sm: 0.5 }, flexShrink: 0 }}>
                              Ganancia:
                            </Typography>
                            {(() => {
                              const sellPrice = productForDetail.discount && productForDetail.discount > 0
                                ? productForDetail.price * (1 - productForDetail.discount / 100)
                                : productForDetail.price;
                              const profitAmt = sellPrice - productForDetail.cost_price;
                              const isNegative = profitAmt < 0;
                              return (
                                <Box>
                                  <Typography variant="h6" sx={{ fontWeight: 800, color: isNegative ? 'error.main' : 'success.main', fontSize: { xs: '1.08rem', sm: '1.25rem' }, lineHeight: 1.15 }}>
                                    {isNegative ? '-' : '+'}${Math.abs(profitAmt).toLocaleString('es-ES')}
                                  </Typography>
                                </Box>
                              );
                            })()}
                          </Stack>
                        </Grid>
                      )}

                      {/* Stock Info */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Stack direction={{ xs: 'row', sm: 'column' }} alignItems={{ xs: 'baseline', sm: 'flex-start' }} spacing={{ xs: 1, sm: 0 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: { xs: 0, sm: 0.5 }, flexShrink: 0 }}>
                            Stock:
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '1.08rem', sm: '1.25rem' }, lineHeight: 1.15 }}>
                              {productForDetail.stock} unid.
                            </Typography>
                            <Chip
                              label={
                                productForDetail.stock === 0 ? 'Sin Stock' :
                                  productForDetail.stock < 5 ? 'Bajo Stock' :
                                    'En Stock'
                              }
                              size="small"
                              color={
                                productForDetail.stock === 0 ? 'error' :
                                  productForDetail.stock < 5 ? 'warning' :
                                    'success'
                              }
                              sx={{ fontWeight: 700, height: 22 }}
                            />
                          </Box>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Description */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary' }}>
                      Descripción
                    </Typography>
                    {productForDetail.description ? (
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fff', maxHeight: 200, overflowY: 'auto' }}>
                        <Typography
                          variant="body2"
                          color="text.primary"
                          component="div"
                          dangerouslySetInnerHTML={{ __html: productForDetail.description }}
                          sx={{
                            '& p': { m: 0, mb: 1 },
                            '& ul, & ol': { pl: 2, m: 0, mb: 1 },
                            '& h1, & h2, & h3': { m: 0, mb: 1, fontWeight: 700 },
                          }}
                        />
                      </Paper>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Sin descripción provista.
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#fafafa', gap: 1 }}>
          <Button onClick={handleCloseDetail} variant="contained" color="primary" sx={{ fontWeight: 700, px: 4 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const ProductsPage = () => {
  return (
    <Suspense fallback={<div>Cargando productos...</div>}>
      <ProductsManagement />
    </Suspense>
  );
};

export default ProductsPage;
