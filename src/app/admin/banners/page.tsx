"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  InputAdornment,
  Tooltip,
  Switch,
  FormControlLabel,
  Grid,
  CircularProgress,
  Chip
} from '@mui/material';
import { Plus, Edit2, Trash2, Search, X, CheckCircle, ExternalLink, Image as ImageIcon, ArrowUpDown, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { compressAndConvertToWebP } from '../../../lib/imageUtils';
import { useAlert } from '../../../context/AlertContext';

type HeroBanner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  button_text: string | null;
  button_link: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

const BannersManagement = () => {
  const { showAlert } = useAlert();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedBanner, setSelectedBanner] = useState<HeroBanner | null>(null);
  const [formValues, setFormValues] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    button_text: '',
    button_link: '',
    is_active: true,
    sort_order: 0
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<HeroBanner | null>(null);

  const [videoBannerEnabled, setVideoBannerEnabled] = useState(true);
  const [updatingVideoBanner, setUpdatingVideoBanner] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('show_video_banner')
        .eq('id', 1)
        .single();
      if (!error && data && data.show_video_banner !== undefined) {
        setVideoBannerEnabled(data.show_video_banner !== false);
      }
    } catch (error) {
      console.error('Error fetching video banner setting:', error);
    }
  };

  const handleToggleVideoBanner = async () => {
    setUpdatingVideoBanner(true);
    try {
      const newValue = !videoBannerEnabled;
      const { error } = await supabase
        .from('settings')
        .update({ show_video_banner: newValue })
        .eq('id', 1);

      if (error) {
        showAlert(
          'Error al guardar el ajuste.'
        );
      } else {
        setVideoBannerEnabled(newValue);
      }
    } catch (err: any) {
      console.error('Error in handleToggleVideoBanner:', err);
      showAlert('Error al actualizar el estado del video banner.');
    } finally {
      setUpdatingVideoBanner(false);
    }
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchSettings();
  }, []);

  const filteredBanners = useMemo(() => {
    if (!searchTerm.trim()) return banners;
    return banners.filter(b => {
      const search = searchTerm.toLowerCase();
      const titleMatch = b.title?.toLowerCase().includes(search) || false;
      const subtitleMatch = b.subtitle?.toLowerCase().includes(search) || false;
      return titleMatch || subtitleMatch;
    });
  }, [banners, searchTerm]);

  const handleOpen = (banner: HeroBanner | null = null) => {
    setSelectedBanner(banner);
    if (banner) {
      setFormValues({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        image_url: banner.image_url || '',
        button_text: banner.button_text || '',
        button_link: banner.button_link || '',
        is_active: banner.is_active,
        sort_order: banner.sort_order
      });
      setFilePreview(banner.image_url);
    } else {
      setFormValues({
        title: '',
        subtitle: '',
        image_url: '',
        button_text: '',
        button_link: '',
        is_active: true,
        sort_order: banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) + 10 : 0
      });
      setFilePreview(null);
    }
    setSelectedFile(null);
    setImageError(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedBanner(null);
    setSelectedFile(null);
    setFilePreview(null);
    setImageError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setImageError(null);
    }
  };

  const handleToggleActive = async (banner: HeroBanner) => {
    try {
      const { error } = await supabase
        .from('hero_banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);

      if (error) throw error;
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b));
    } catch (error) {
      console.error('Error toggling banner status:', error);
      showAlert('Error al cambiar el estado del banner.');
    }
  };

  const handleSave = async () => {
    if (!filePreview && !formValues.image_url) {
      setImageError('Debes seleccionar una imagen para el banner.');
      return;
    }

    setUploading(true);
    setImageError(null);

    let finalImageUrl = formValues.image_url;

    try {
      if (selectedFile) {
        // Optimizar imagen usando compressAndConvertToWebP
        const optimizedFile = await compressAndConvertToWebP(selectedFile);
        const fileExt = 'webp';
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `banners/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('hero-banners')
          .upload(filePath, optimizedFile, {
            contentType: 'image/webp',
            cacheControl: '31536000', // Cache-Control: max-age=31536000 (1 year)
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('hero-banners')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrl;

        // Limpiar imagen vieja en storage si existía y es del mismo bucket
        if (selectedBanner && selectedBanner.image_url) {
          const oldUrl = selectedBanner.image_url;
          if (oldUrl.includes('/hero-banners/')) {
            const pathParts = oldUrl.split('/hero-banners/');
            if (pathParts.length > 1) {
              const oldPath = pathParts[1];
              const { error } = await supabase.storage.from('hero-banners').remove([oldPath]);
              if (error) {
                console.error('Error cleaning old banner image:', error);
              }
            }
          }
        }
      }

      const dataToSave = {
        title: formValues.title.trim() || null,
        subtitle: formValues.subtitle.trim() || null,
        image_url: finalImageUrl,
        button_text: formValues.button_text.trim() || null,
        button_link: formValues.button_link.trim() || null,
        is_active: formValues.is_active,
        sort_order: Number(formValues.sort_order) || 0
      };

      if (selectedBanner) {
        const { data: updated, error } = await supabase
          .from('hero_banners')
          .update(dataToSave)
          .eq('id', selectedBanner.id)
          .select();

        if (error) throw error;

        // Si no devuelve filas, fue bloqueado silenciosamente por RLS
        if (!updated || updated.length === 0) {
          throw new Error(
            'Sin permiso para actualizar. Agregá la política "update" en Supabase:\n\n' +
            'create policy "Admins can update hero banners" on hero_banners for update to authenticated using (true) with check (true);'
          );
        }
      } else {
        const { error } = await supabase
          .from('hero_banners')
          .insert([dataToSave]);

        if (error) throw error;
      }

      fetchBanners();
      handleClose();
    } catch (err: any) {
      console.error('Error saving banner:', err);
      showAlert('Error al guardar el banner: ' + (err.message || JSON.stringify(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (banner: HeroBanner) => {
    setBannerToDelete(banner);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bannerToDelete) return;

    try {
      // 1. Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from('hero_banners')
        .delete()
        .eq('id', bannerToDelete.id);

      if (dbError) throw dbError;

      // 2. Eliminar del storage de Supabase si corresponde
      const imageUrl = bannerToDelete.image_url;
      if (imageUrl.includes('/hero-banners/')) {
        const pathParts = imageUrl.split('/hero-banners/');
        if (pathParts.length > 1) {
          const filePath = pathParts[1];
          const { error: storageError } = await supabase.storage
            .from('hero-banners')
            .remove([filePath]);

          if (storageError) {
            console.error('Error deleting image from Supabase Storage:', storageError);
          }
        }
      }

      fetchBanners();
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    } catch (err: any) {
      console.error('Error deleting banner:', err);
      showAlert('Error al eliminar banner: ' + (err.message || JSON.stringify(err)));
    }
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
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Banners Devil</Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpen()}
          sx={{ py: 1.5, px: 3, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
        >
          Nuevo Banner
        </Button>
      </Stack>

      {/* Default Video Banner Status Card */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 4, 
          border: '1px solid rgba(0,0,0,0.05)',
          bgcolor: 'rgba(0,0,0,0.01)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box 
            sx={{ 
              p: 1.5, 
              bgcolor: videoBannerEnabled ? 'rgba(46, 125, 50, 0.1)' : 'rgba(204, 0, 0, 0.1)', 
              borderRadius: 3,
              color: videoBannerEnabled ? '#2e7d32' : '#cc0000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {videoBannerEnabled ? <Eye size={24} /> : <EyeOff size={24} />}
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Video Banner por Defecto
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="outlined"
          color={videoBannerEnabled ? "error" : "success"}
          startIcon={videoBannerEnabled ? <EyeOff size={18} /> : <Eye size={18} />}
          onClick={handleToggleVideoBanner}
          disabled={updatingVideoBanner}
          sx={{ 
            fontWeight: 700, 
            borderRadius: 2.5,
            px: 3,
            py: 1,
            alignSelf: { xs: 'stretch', sm: 'center' },
            borderColor: videoBannerEnabled ? 'rgba(204, 0, 0, 0.2)' : 'rgba(46, 125, 50, 0.2)',
            '&:hover': {
              borderColor: videoBannerEnabled ? '#cc0000' : '#2e7d32',
              bgcolor: videoBannerEnabled ? 'rgba(204, 0, 0, 0.04)' : 'rgba(46, 125, 50, 0.04)'
            }
          }}
        >
          {updatingVideoBanner ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            videoBannerEnabled ? 'Ocultar Video Banner' : 'Mostrar Video Banner'
          )}
        </Button>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por título o subtítulo..."
              value={searchTerm}
              onChange={(e) => {
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
              sx={{ maxWidth: 400 }}
            />
          </Stack>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 140 }}>Imagen</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Detalles</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 120 }} align="center">Orden</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 120 }} align="center">Estado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: 140 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={30} />
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>Cargando banners...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredBanners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">No se encontraron banners. Creá uno nuevo para empezar.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBanners.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((banner) => (
                  <TableRow key={banner.id} hover>
                    <TableCell>
                      <Box
                        component="img"
                        src={banner.image_url}
                        alt={banner.title || "Banner"}
                        sx={{
                          width: 120,
                          height: 50,
                          objectFit: 'cover',
                          borderRadius: 2,
                          border: '1px solid rgba(0,0,0,0.08)',
                          bgcolor: '#f5f5f5'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {banner.title || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Sin título</span>}
                        </Typography>
                        {banner.subtitle && (
                          <Typography variant="caption" color="text.secondary">
                            {banner.subtitle}
                          </Typography>
                        )}
                        {(banner.button_text || banner.button_link) && (
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <Chip
                              label={banner.button_text || 'Ver más'}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.72rem', fontWeight: 600 }}
                            />
                            {banner.button_link && (
                              <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textDecoration: 'none' }} component="a" href={banner.button_link} target="_blank">
                                {banner.button_link} <ExternalLink size={10} />
                              </Typography>
                            )}
                          </Stack>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`# ${banner.sort_order}`}
                        size="small"
                        sx={{ fontWeight: 700, bgcolor: 'rgba(0,0,0,0.04)', color: 'text.secondary' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={banner.is_active ? "Desactivar" : "Activar"}>
                        <Switch
                          checked={banner.is_active}
                          onChange={() => handleToggleActive(banner)}
                          color="success"
                          size="small"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton size="small" onClick={() => handleOpen(banner)}>
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(banner)}>
                          <Trash2 size={18} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredBanners.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Banners por página"
        />
      </Paper>

      {/* Banner Dialog Modal */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {selectedBanner ? 'Editar Banner Hero' : 'Nuevo Banner Hero'}
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  width: '100%',
                  height: 180,
                  border: '2px dashed',
                  borderColor: filePreview ? 'success.main' : (imageError ? 'error.main' : '#ddd'),
                  borderRadius: 3,
                  bgcolor: filePreview ? 'rgba(76, 175, 80, 0.02)' : 'rgba(0,0,0,0.01)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  '&:hover': {
                    borderColor: uploading ? '#ddd' : (filePreview ? 'success.main' : 'primary.main'),
                    bgcolor: filePreview ? 'rgba(76, 175, 80, 0.02)' : 'rgba(204,0,0,0.02)'
                  }
                }}
                component="label"
              >
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                {filePreview ? (
                  <>
                    <Box
                      component="img"
                      src={filePreview}
                      alt="Preview"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        borderRadius: '50%',
                        p: 0.5,
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' }
                      }}
                      component="span"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedFile(null);
                        setFilePreview(selectedBanner ? selectedBanner.image_url : null);
                      }}
                    >
                      <X size={16} />
                    </Box>
                  </>
                ) : (
                  <Stack spacing={1} alignItems="center">
                    <ImageIcon size={36} color="#aaa" />
                    <Typography variant="body2" sx={{ fontWeight: 700 }} color="text.secondary">
                      Hacé click para seleccionar la foto del banner
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Resolución recomendada: 1920x600 o similar
                    </Typography>
                  </Stack>
                )}
              </Box>
              {imageError && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', fontWeight: 700 }}>
                  {imageError}
                </Typography>
              )}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Título Principal (Opcional)"
                placeholder="Ej. OUTLET"
                value={formValues.title}
                onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                disabled={uploading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Subtítulo (Opcional)"
                placeholder="Ej. DE PLACAS DE VIDEO"
                value={formValues.subtitle}
                onChange={(e) => setFormValues({ ...formValues, subtitle: e.target.value })}
                disabled={uploading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Texto del Botón (Opcional)"
                placeholder="Ej. Ver Ofertas"
                value={formValues.button_text}
                onChange={(e) => setFormValues({ ...formValues, button_text: e.target.value })}
                disabled={uploading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Link del Botón (Opcional)"
                placeholder="Ej. /shop?category=placas"
                value={formValues.button_link}
                onChange={(e) => setFormValues({ ...formValues, button_link: e.target.value })}
                disabled={uploading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Orden de Aparición"
                type="number"
                value={formValues.sort_order}
                onChange={(e) => setFormValues({ ...formValues, sort_order: parseInt(e.target.value, 10) || 0 })}
                disabled={uploading}
                helperText="Número menor se muestra primero"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <Paper variant="outlined" sx={{ p: 1, px: 2, width: '100%', bgcolor: 'rgba(0,0,0,0.01)' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formValues.is_active}
                      onChange={(e) => setFormValues({ ...formValues, is_active: e.target.checked })}
                      color="success"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>Banner Activo</Typography>
                      <Typography variant="caption" color="text.secondary">¿Mostrar en la página de inicio?</Typography>
                    </Box>
                  }
                  disabled={uploading}
                />
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose} color="inherit" disabled={uploading}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={uploading}
            sx={{ px: 4, fontWeight: 800 }}
          >
            {uploading ? <CircularProgress size={24} color="inherit" /> : (selectedBanner ? 'Actualizar' : 'Crear Banner')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que querés eliminar este banner? Esta acción no se puede deshacer y borrará la imagen de la base de datos y de storage.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" sx={{ fontWeight: 700 }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BannersManagement;
