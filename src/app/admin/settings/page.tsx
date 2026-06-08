"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Stack, Switch, 
  TextField, Button, CircularProgress, Alert, Snackbar
} from '@mui/material';
import { Settings, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('settings')
          .select('maintenance_mode, maintenance_message')
          .eq('id', 1)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // No rows found, the table is empty or missing
            setError('La tabla "settings" no tiene configuración por defecto o no ha sido creada. Ejecuta el script SQL proporcionado en el plan.');
          } else {
            throw fetchError;
          }
        } else if (data) {
          setMaintenanceMode(data.maintenance_mode || false);
          setMaintenanceMessage(data.maintenance_message || '');
        }
      } catch (err: any) {
        console.error('Error fetching settings:', err);
        setError(err.message || 'Error al cargar la configuración.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleToggleMode = async () => {
    setSaving(true);
    setError(null);
    try {
      const newMode = !maintenanceMode;
      const { error: updateError } = await supabase
        .from('settings')
        .upsert({ id: 1, maintenance_mode: newMode, maintenance_message: maintenanceMessage });

      if (updateError) throw updateError;
      setMaintenanceMode(newMode);
      setSuccessMessage(newMode ? 'Modo mantenimiento activado' : 'Modo mantenimiento desactivado');
      setSnackbarOpen(true);
    } catch (err: any) {
      console.error('Error toggling maintenance:', err);
      setError(err.message || 'Error al cambiar el estado.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMessage = async () => {
    setSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('settings')
        .upsert({ id: 1, maintenance_mode: maintenanceMode, maintenance_message: maintenanceMessage });

      if (updateError) throw updateError;
      setSuccessMessage('Mensaje actualizado correctamente');
      setSnackbarOpen(true);
    } catch (err: any) {
      console.error('Error saving message:', err);
      setError(err.message || 'Error al guardar el mensaje.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 10, textAlign: 'center' }}>
        <CircularProgress color="primary" />
        <Typography sx={{ mt: 2 }} color="text.secondary">Cargando configuración...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Box sx={{ p: 1.5, bgcolor: 'primary.main', borderRadius: 2, color: 'white', display: 'flex' }}>
          <Settings size={24} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Ajustes del Sistema</Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertTriangle size={20} color="#ff9800" />
          Modo Mantenimiento
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Al activar el modo mantenimiento, todos los usuarios que intenten acceder a la tienda serán redirigidos a una página de espera. Como administrador, podrás seguir navegando por la web y este panel con normalidad.
        </Typography>

        <Stack spacing={4}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            p: 4, 
            bgcolor: maintenanceMode ? 'rgba(211,47,47,0.08)' : '#f9f9f9', 
            borderRadius: 3, 
            border: '2px solid', 
            borderColor: maintenanceMode ? '#d32f2f' : 'rgba(0,0,0,0.05)', 
            transition: 'all 0.3s' 
          }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: maintenanceMode ? '#d32f2f' : 'text.primary', mb: 0.5 }}>
                {maintenanceMode ? 'MODO MANTENIMIENTO ACTIVO' : 'Mantenimiento Desactivado'}
              </Typography>
              <Typography variant="body2" color={maintenanceMode ? '#d32f2f' : 'text.secondary'} sx={{ opacity: 0.8 }}>
                {maintenanceMode 
                  ? 'Los clientes no pueden acceder a la tienda en este momento.' 
                  : 'La tienda está visible y funcionando normalmente para el público.'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color={maintenanceMode ? "inherit" : "error"}
              onClick={handleToggleMode}
              disabled={saving}
              sx={{ 
                px: 3, 
                py: 1, 
                fontWeight: 800, 
                borderRadius: 2,
                boxShadow: 'none',
                '&:hover': { boxShadow: 'none' }
              }}
            >
              {maintenanceMode ? 'Desactivar' : 'Activar'}
            </Button>
          </Box>

          <Box>
            <TextField
              fullWidth
              label="Mensaje para los clientes"
              multiline
              rows={3}
              variant="outlined"
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              helperText="Este mensaje se mostrará en la pantalla de mantenimiento."
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 2 }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
                onClick={handleSaveMessage}
                disabled={saving}
                sx={{ px: 3, fontWeight: 700, borderRadius: 2 }}
              >
                Guardar Mensaje
              </Button>
            </Box>
          </Box>
        </Stack>
      </Paper>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
