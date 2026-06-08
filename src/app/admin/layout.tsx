"use client";
import React, { useState } from 'react';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Divider, AppBar, Toolbar, Avatar, IconButton, useTheme, useMediaQuery, Collapse
} from '@mui/material';
import {
  LayoutDashboard, Package, ShoppingBag, LogOut, Store, Menu, Settings, Image, ChevronDown, ChevronUp, Tag
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

const drawerWidth = 240;

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [tiendaOpen, setTiendaOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(true);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const drawerContent = (
    <>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {"DEVIL"}
          <span style={{ color: 'white' }}>ADMIN</span>
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
      <List sx={{ px: 2, py: 1.5 }}>
        {/* General */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={Link}
            href="/admin"
            onClick={isMobile ? handleDrawerToggle : undefined}
            sx={{
              borderRadius: 2,
              bgcolor: pathname === '/admin' ? 'primary.main' : 'transparent',
              '&:hover': {
                bgcolor: pathname === '/admin' ? 'primary.main' : 'rgba(204, 0, 0, 0.1)'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              <LayoutDashboard size={20} />
            </ListItemIcon>
            <ListItemText
              primary="Lobby"
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
            />
          </ListItemButton>
        </ListItem>

        {/* Grupo Tienda */}
        <Box sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setTiendaOpen(!tiendaOpen)}
            sx={{
              borderRadius: 2,
              color: 'rgba(255, 255, 255, 0.7)',
              justifyContent: 'space-between',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>
                <Package size={20} />
              </ListItemIcon>
              <ListItemText
                primary="Tienda"
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}
              />
            </Box>
            {tiendaOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </ListItemButton>

          <Collapse in={tiendaOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2, mt: 0.5 }}>
              {[
                { text: 'Categorías', icon: <Tag size={18} />, path: '/admin/categories' },
                { text: 'Productos', icon: <Package size={18} />, path: '/admin/products' },
                { text: 'Pedidos', icon: <ShoppingBag size={18} />, path: '/admin/orders' },
              ].map((item) => {
                const isActive = pathname === item.path;
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      component={Link}
                      href={item.path}
                      onClick={isMobile ? handleDrawerToggle : undefined}
                      sx={{
                        borderRadius: 2,
                        bgcolor: isActive ? 'primary.main' : 'transparent',
                        '&:hover': {
                          bgcolor: isActive ? 'primary.main' : 'rgba(204, 0, 0, 0.1)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Collapse>
        </Box>

        {/* Grupo Personalizar */}
        <Box sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setConfigOpen(!configOpen)}
            sx={{
              borderRadius: 2,
              color: 'rgba(255, 255, 255, 0.7)',
              justifyContent: 'space-between',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>
                <Settings size={20} />
              </ListItemIcon>
              <ListItemText
                primary="Personalizar"
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}
              />
            </Box>
            {configOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </ListItemButton>

          <Collapse in={configOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2, mt: 0.5 }}>
              {[
                { text: 'Banners', icon: <Image size={18} />, path: '/admin/banners' },
                { text: 'Ajustes', icon: <Settings size={18} />, path: '/admin/settings' },
              ].map((item) => {
                const isActive = pathname === item.path;
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      component={Link}
                      href={item.path}
                      onClick={isMobile ? handleDrawerToggle : undefined}
                      sx={{
                        borderRadius: 2,
                        bgcolor: isActive ? 'primary.main' : 'transparent',
                        '&:hover': {
                          bgcolor: isActive ? 'primary.main' : 'rgba(204, 0, 0, 0.1)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Collapse>
        </Box>
      </List>
      <Box sx={{ mt: 'auto', p: 1.5 }}>
        <List>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton component={Link} href="/" sx={{ borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' } }}>
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.6)', minWidth: 40 }}>
                <Store size={20} />
              </ListItemIcon>
              <ListItemText primary="Ir a la Tienda" primaryTypographyProps={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.5)', minWidth: 40 }}>
                <LogOut size={20} />
              </ListItemIcon>
              <ListItemText primary="Cerrar Sesión" primaryTypographyProps={{ fontSize: '0.9rem' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </>
  );

  return (
    <ProtectedRoute adminOnly>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f4f4' }}>
        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                bgcolor: 'secondary.main',
                color: 'white',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              },
            }}
          >
            {drawerContent}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: '1px solid rgba(0,0,0,0.05)',
                bgcolor: 'secondary.main',
                color: 'white',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            maxWidth: '100vw'
          }}
        >
          <AppBar
            position="sticky"
            color="inherit"
            elevation={0}
            sx={{
              bgcolor: 'white',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              zIndex: (theme) => theme.zIndex.drawer - 1
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2, display: { md: 'none' }, color: 'secondary.main' }}
                >
                  <Menu />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user?.name || 'Admin'}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>{user?.name?.charAt(0) || 'A'}</Avatar>
              </Box>
            </Toolbar>
          </AppBar>
          <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, overflowX: 'hidden' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </ProtectedRoute>
  );
};

export default AdminLayout;
