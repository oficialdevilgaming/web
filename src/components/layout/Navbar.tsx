"use client";

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  InputBase,
  Menu,
  MenuItem,
  Container,
  useScrollTrigger,
  Slide,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  TextField,
  Collapse,
  Avatar,
  ListItemAvatar,
  ClickAwayListener,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Search,
  ShoppingCart,
  Menu as MenuIcon,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  X,
  Zap,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Loader2,
  User,
  MessageSquare
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { useCart } from '../../context/CartContext';
import { alpha, styled } from '@mui/material/styles';
import { supabase } from '../../lib/supabase';
import CartDrawer from '../cart/CartDrawer';
import { useAuth } from '../../context/AuthContext';
import { getCDNUrl } from '../../lib/imageUtils';

const SearchWrapper = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  border: '1px solid rgba(0,0,0,0.05)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  alignItems: 'center',
  maxWidth: '400px',
  '&:focus-within': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    borderColor: theme.palette.primary.main,
    maxWidth: '450px',
  },
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(255, 255, 255, 0.7)',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    fontSize: '0.9rem',
    fontWeight: 500,
    [theme.breakpoints.up('md')]: {
      width: '25ch',
      '&:focus': {
        width: '30ch',
      },
    },
  },
}));

const WHATSAPP_NUMBER = '5491155099149';

const Navbar = () => {
  const { state } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Búsqueda en vivo
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Categorías
  type CategoryType = { id: string, name: string, path: string, subcategories: CategoryType[] };
  const [dbCategories, setDbCategories] = useState<CategoryType[]>([]);
  const [armadaPath, setArmadaPath] = useState('/shop?category=PCs%20Armadas');
  const [outletPath, setOutletPath] = useState('/shop?category=Placas%20de%20Video%20Outlet');
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  // Desktop Menu states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  const fetchCategories = async () => {
    if (categoriesLoaded || loadingCategories) return;

    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, parent_id')
        .order('name');

      if (error) throw error;

      if (data) {
        const catMap = new Map();
        let newArmadaPath = '/shop?category=PCs%20Armadas';
        let newOutletPath = '/shop?category=Placas%20de%20Video%20Outlet';

        data.forEach((c: any) => {
          const path = `/shop?category=${encodeURIComponent(c.name)}`;
          catMap.set(c.id, {
            ...c,
            path,
            subcategories: []
          });
        });

        const parentCats: CategoryType[] = [];
        data.forEach((c: any) => {
          const lowerName = c.name.toLowerCase();
          const isSpecial = lowerName.includes('armada') || lowerName.includes('outlet');

          if (isSpecial) {
            if (lowerName.includes('armada')) newArmadaPath = catMap.get(c.id).path;
            if (lowerName.includes('outlet')) newOutletPath = catMap.get(c.id).path;
          }

          if (c.parent_id && catMap.has(c.parent_id)) {
            if (!isSpecial) {
              catMap.get(c.parent_id).subcategories.push(catMap.get(c.id));
            }
          } else if (!c.parent_id && !isSpecial) {
            parentCats.push(catMap.get(c.id));
          }
        });

        setDbCategories(parentCats);
        setArmadaPath(newArmadaPath);
        setOutletPath(newOutletPath);
        setCategoriesLoaded(true);
      }
    } catch (err) {
      console.error('Error fetching categories for navbar:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const cartCount = state.items.reduce((acc, item) => acc + item.quantity, 0);

  const handleMobileCatToggle = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const activeHoverCategory = hoveredCat ? dbCategories.find(c => c.id === hoveredCat) : undefined;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSearch = async () => {
      if (searchQuery.trim().length >= 3) {
        setIsSearching(true);
        setShowDropdown(true);

        const { data, error } = await supabase
          .from('products')
          .select('id, name, images, price, discount')
          .ilike('name', `%${searchQuery.trim()}%`)
          .limit(5);

        if (data && !error) {
          setSearchResults(data);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    };

    const timeoutId = setTimeout(fetchSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (event.type === 'keydown' && ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')) {
      return;
    }
    setMobileOpen(open);
    if (open) fetchCategories();
    if (!open) setOpenCats({});
  };

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: '#000000',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.3s ease-in-out',
          color: 'white'
        }}
      >
        <Container maxWidth="xl">

          {/* TOP TIER */}
          <Toolbar disableGutters sx={{ minHeight: { xs: 70, md: 80 }, justifyContent: 'space-between' }}>
            {/* Mobile Menu Icon (align left on mobile) */}
            <Box sx={{ flex: 1, display: { xs: 'flex', md: 'none' }, justifyContent: 'flex-start' }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={toggleDrawer(true)}
                sx={{ p: 1 }}
              >
                <MenuIcon />
              </IconButton>
            </Box>

            {/* Left: Search (Desktop only) */}
            <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-start' }}>
              <ClickAwayListener onClickAway={() => setShowDropdown(false)}>
                <SearchWrapper>
                  <SearchIconWrapper>
                    <Search size={18} />
                  </SearchIconWrapper>
                  <StyledInputBase
                    placeholder="Buscar hardware..."
                    inputProps={{ 'aria-label': 'search' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 3) setShowDropdown(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchSubmit(e);
                        setShowDropdown(false);
                      }
                    }}
                    endAdornment={
                      searchQuery ? (
                        <InputAdornment position="end" sx={{ mr: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSearchQuery('');
                              setSearchResults([]);
                              setShowDropdown(false);
                            }}
                            sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}
                          >
                            <X size={16} />
                          </IconButton>
                        </InputAdornment>
                      ) : null
                    }
                  />
                  <AnimatePresence>
                    {showDropdown && searchQuery.trim().length >= 3 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                          zIndex: 1000,
                          overflow: 'hidden',
                          border: '1px solid rgba(0,0,0,0.1)',
                          color: 'black'
                        }}
                      >
                        {isSearching ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <Loader2 className="animate-spin" size={24} color="#cc0000" />
                          </Box>
                        ) : searchResults.length > 0 ? (
                          <List disablePadding>
                            {searchResults.map((product) => (
                              <ListItem
                                key={product.id}
                                disablePadding
                                sx={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                              >
                                <ListItemButton
                                  onClick={() => {
                                    router.push(`/product/${product.id}`);
                                    setShowDropdown(false);
                                    setSearchQuery('');
                                  }}
                                  sx={{ py: 1.5, px: 2, '&:hover': { bgcolor: 'rgba(204,0,0,0.04)' } }}
                                >
                                  <ListItemAvatar>
                                    <Avatar
                                      src={getCDNUrl(product.images?.[0])}
                                      variant="rounded"
                                      sx={{ width: 40, height: 40, bgcolor: '#f4f4f4', objectFit: 'contain' }}
                                    />
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={product.name}
                                    secondary={
                                      product.discount && product.discount > 0 ? (
                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                          <Typography component="span" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.8rem' }}>
                                            ${(product.price * (1 - product.discount / 100)).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                                          </Typography>
                                          <Typography component="span" sx={{ textDecoration: 'line-through', color: 'text.secondary', fontWeight: 500, fontSize: '0.75rem' }}>
                                            ${product.price.toLocaleString('es-ES')}
                                          </Typography>
                                          <Typography component="span" sx={{ fontWeight: 700, color: 'error.main', fontSize: '0.75rem' }}>
                                            {product.discount}% OFF
                                          </Typography>
                                        </Box>
                                      ) : (
                                        <Typography component="span" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.8rem' }}>
                                          ${product.price.toLocaleString('es-ES')}
                                        </Typography>
                                      )
                                    }
                                    primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem', color: 'text.primary', noWrap: true }}
                                  />
                                </ListItemButton>
                              </ListItem>
                            ))}
                            <ListItem disablePadding>
                              <ListItemButton
                                onClick={(e) => {
                                  handleSearchSubmit(e as any);
                                  setShowDropdown(false);
                                }}
                                sx={{ py: 1.5, justifyContent: 'center', bgcolor: '#fafafa', '&:hover': { bgcolor: '#f0f0f0' } }}
                              >
                                <Typography variant="caption" fontWeight={800} color="secondary.main">
                                  Ver todos los resultados
                                </Typography>
                              </ListItemButton>
                            </ListItem>
                          </List>
                        ) : (
                          <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                              No se encontraron productos para "{searchQuery}"
                            </Typography>
                          </Box>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SearchWrapper>
              </ClickAwayListener>
            </Box>

            {/* Center: Logo (Centered on mobile and desktop) */}
            <Box sx={{ display: 'flex', flex: { xs: 'none', md: 0 }, justifyContent: 'center', alignItems: 'center', mx: 'auto', gap: 1 }}>
              <Typography
                variant="h6"
                noWrap
                component={Link}
                href="/"
                sx={{
                  display: 'flex',
                  fontWeight: 900,
                  color: 'primary.main', // DEVIL in red
                  textDecoration: 'none',
                  fontSize: { xs: '1.2rem', md: '1.5rem' },
                  letterSpacing: '-0.02em',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                  '& span': {
                    color: 'white', // GAMING in white
                    ml: 0.5
                  }
                }}
              >
                DEVIL<span>GAMING</span>
              </Typography>
            </Box>

            {/* Right: Icons */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: { xs: 1, md: 4 } }}>
              {/* Admin & Cart */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {user?.role === 'admin' && (
                  <Button
                    component={Link}
                    href="/admin"
                    size="small"
                    variant="outlined"
                    startIcon={<LayoutDashboard size={16} />}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      display: { xs: 'none', sm: 'flex' },
                      '&:hover': {
                        bgcolor: 'rgba(204,0,0,0.06)',
                        borderColor: 'primary.dark',
                      }
                    }}
                  >
                    Admin
                  </Button>
                )}

                <IconButton
                  color="inherit"
                  sx={{ ml: 0.5, '&:hover': { color: 'primary.main' } }}
                  onClick={() => setCartOpen(true)}
                >
                  <Badge badgeContent={cartCount} color="primary">
                    <motion.div
                      key={cartCount}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                    >
                      <ShoppingCart size={22} />
                    </motion.div>
                  </Badge>
                </IconButton>
              </Box>
            </Box>
          </Toolbar>

          {/* Mobile Search Bar */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, px: 2, pb: 1.5 }}>
            <ClickAwayListener onClickAway={() => setShowDropdown(false)}>
              <Box sx={{ position: 'relative' }}>
                <SearchWrapper sx={{ maxWidth: '100%', ml: 0, mr: 0 }}>
                  <SearchIconWrapper>
                    <Search size={16} />
                  </SearchIconWrapper>
                  <StyledInputBase
                    placeholder="Buscar productos..."
                    inputProps={{ 'aria-label': 'search' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 3) setShowDropdown(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchSubmit(e);
                        setShowDropdown(false);
                      }
                    }}
                    endAdornment={
                      searchQuery ? (
                        <InputAdornment position="end" sx={{ mr: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSearchQuery('');
                              setSearchResults([]);
                              setShowDropdown(false);
                            }}
                            sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}
                          >
                            <X size={16} />
                          </IconButton>
                        </InputAdornment>
                      ) : null
                    }
                  />
                </SearchWrapper>
                <AnimatePresence>
                  {showDropdown && searchQuery.trim().length >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                        zIndex: 1000,
                        overflow: 'hidden',
                        border: '1px solid rgba(0,0,0,0.1)',
                        color: 'black'
                      }}
                    >
                      {isSearching ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                          <Loader2 className="animate-spin" size={24} color="#cc0000" />
                        </Box>
                      ) : searchResults.length > 0 ? (
                        <List disablePadding>
                          {searchResults.map((product) => (
                            <ListItem
                              key={product.id}
                              disablePadding
                              sx={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                            >
                              <ListItemButton
                                onClick={() => {
                                  router.push(`/product/${product.id}`);
                                  setShowDropdown(false);
                                  setSearchQuery('');
                                }}
                                sx={{ py: 1.5, px: 2, '&:hover': { bgcolor: 'rgba(204,0,0,0.04)' } }}
                              >
                                <ListItemAvatar>
                                  <Avatar
                                    src={getCDNUrl(product.images?.[0])}
                                    variant="rounded"
                                    sx={{ width: 40, height: 40, bgcolor: '#f4f4f4', objectFit: 'contain' }}
                                  />
                                </ListItemAvatar>
                                <ListItemText
                                  primary={product.name}
                                  secondary={
                                    product.discount && product.discount > 0 ? (
                                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <Typography component="span" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.8rem' }}>
                                          ${(product.price * (1 - product.discount / 100)).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                                        </Typography>
                                        <Typography component="span" sx={{ textDecoration: 'line-through', color: 'text.secondary', fontWeight: 500, fontSize: '0.75rem' }}>
                                          ${product.price.toLocaleString('es-ES')}
                                        </Typography>
                                        <Typography component="span" sx={{ fontWeight: 700, color: 'error.main', fontSize: '0.75rem' }}>
                                          {product.discount}% OFF
                                        </Typography>
                                      </Box>
                                    ) : (
                                      <Typography component="span" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.8rem' }}>
                                        ${product.price.toLocaleString('es-ES')}
                                      </Typography>
                                    )
                                  }
                                  primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem', color: 'text.primary', noWrap: true }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                          <ListItem disablePadding>
                            <ListItemButton
                              onClick={(e) => {
                                handleSearchSubmit(e as any);
                                setShowDropdown(false);
                              }}
                              sx={{ py: 1.5, justifyContent: 'center', bgcolor: '#fafafa', '&:hover': { bgcolor: '#f0f0f0' } }}
                            >
                              <Typography variant="caption" fontWeight={800} color="secondary.main">
                                Ver todos los resultados
                              </Typography>
                            </ListItemButton>
                          </ListItem>
                        </List>
                      ) : (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            No se encontraron productos para &quot;{searchQuery}&quot;
                          </Typography>
                        </Box>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </ClickAwayListener>
          </Box>

          {/* BOTTOM TIER */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, borderTop: '1px solid rgba(255,255,255,0.08)', py: 0, justifyContent: 'center', alignItems: 'center', minHeight: 48 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Box
                component={Link}
                href="/"
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  transition: 'all 0.3s',
                  color: 'rgba(255,255,255,0.9)',
                  position: 'relative',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '0%',
                    height: '2px',
                    bottom: -4,
                    left: 0,
                    backgroundColor: 'primary.main',
                    transition: 'width 0.3s'
                  },
                  '&:hover': {
                    color: 'primary.main',
                    '&::after': {
                      width: '100%'
                    }
                  }
                }}
              >
                INICIO
              </Box>

              <Box
                onMouseEnter={() => { fetchCategories(); setIsMenuOpen(true); }}
                onMouseLeave={() => { setIsMenuOpen(false); setHoveredCat(null); }}
                sx={{ height: '100%', display: 'flex', alignItems: 'center', py: 1.5 }}
              >
                <Box
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    transition: 'all 0.3s',
                    color: isMenuOpen ? 'primary.main' : 'rgba(255,255,255,0.9)',
                    position: 'relative',
                    textTransform: 'uppercase',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: isMenuOpen ? '100%' : '0%',
                      height: '2px',
                      bottom: -4,
                      left: 0,
                      backgroundColor: 'primary.main',
                      transition: 'width 0.3s'
                    },
                    '&:hover::after': { width: '100%' }
                  }}
                >
                  CATEGORÍAS
                  <motion.div
                    animate={{ rotate: isMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', alignItems: 'center', marginLeft: 4 }}
                  >
                    <ChevronDown size={14} />
                  </motion.div>
                </Box>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1400,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          width: '100%',
                          backgroundColor: 'rgba(10, 10, 10, 0.95)',
                          backdropFilter: 'blur(20px)',
                          borderTop: '1px solid rgba(255,255,255,0.08)',
                          borderBottom: '1px solid rgba(255,255,255,0.08)',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                          overflow: 'hidden',
                          py: 4
                        }}
                      >
                        <Container maxWidth="xl" sx={{ display: 'flex', flex: 1 }}>
                          {loadingCategories ? (
                            <Box sx={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                              <CircularProgress size={30} thickness={4} sx={{ color: 'primary.main' }} />
                            </Box>
                          ) : (
                            <Box sx={{ 
                              columnWidth: { xs: '150px', md: '180px' }, 
                              columnGap: { xs: '32px', md: '64px' }, 
                              width: '100%' 
                            }}>
                              {dbCategories.map((cat, idx) => (
                                <Box
                                  key={cat.id}
                                  sx={{
                                    breakInside: 'avoid',
                                    pageBreakInside: 'avoid',
                                    mb: { xs: 4, md: 6 },
                                    display: 'inline-block',
                                    width: '100%'
                                  }}
                                >
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                  >
                                    <Box>
                                      <Typography 
                                        variant="subtitle1" 
                                        sx={{ 
                                          fontWeight: 900, 
                                          color: 'white', 
                                          mb: (cat.subcategories && cat.subcategories.length > 0) ? 2 : 0, 
                                          fontSize: '0.95rem',
                                          letterSpacing: '0.02em',
                                          cursor: 'pointer',
                                          '&:hover': { color: 'primary.main' }
                                        }}
                                      onClick={() => {
                                        router.push(cat.path);
                                        setIsMenuOpen(false);
                                      }}
                                    >
                                      {cat.name}
                                    </Typography>
                                    {cat.subcategories && cat.subcategories.length > 0 && (
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {cat.subcategories.map(sub => (
                                          <Typography
                                            key={sub.id}
                                            onClick={() => {
                                              router.push(sub.path);
                                              setIsMenuOpen(false);
                                            }}
                                            sx={{
                                              color: 'rgba(255,255,255,0.7)',
                                              fontSize: '0.85rem',
                                              fontWeight: 500,
                                              cursor: 'pointer',
                                              transition: 'all 0.2s',
                                              '&:hover': {
                                                color: 'primary.main',
                                                transform: 'translateX(4px)'
                                              }
                                            }}
                                          >
                                            {sub.name}
                                          </Typography>
                                        ))}
                                      </Box>
                                    )}
                                    </Box>
                                  </motion.div>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Container>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>

              <Box
                component={Link}
                href={armadaPath}
                onClick={() => setIsMenuOpen(false)}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  transition: 'all 0.3s',
                  color: 'rgba(255,255,255,0.9)',
                  position: 'relative',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '0%',
                    height: '2px',
                    bottom: -4,
                    left: 0,
                    backgroundColor: 'primary.main',
                    transition: 'width 0.3s'
                  },
                  '&:hover': {
                    color: 'primary.main',
                    '&::after': {
                      width: '100%'
                    }
                  }
                }}
              >
                PC GAMER ARMADAS
              </Box>

              <Box
                component={Link}
                href={outletPath}
                onClick={() => setIsMenuOpen(false)}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  transition: 'all 0.3s',
                  color: 'rgba(255,255,255,0.9)',
                  position: 'relative',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '0%',
                    height: '2px',
                    bottom: -4,
                    left: 0,
                    backgroundColor: 'primary.main',
                    transition: 'width 0.3s'
                  },
                  '&:hover': {
                    color: 'primary.main',
                    '&::after': {
                      width: '100%'
                    }
                  }
                }}
              >
                PLACAS OUTLET
              </Box>


            </Box>
          </Box>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: 300,
            background: '#121212',
            color: 'white',
          }
        }}
      >
        <Box
          sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          role="presentation"
        >
          {/* Drawer Header */}
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: 'primary.main', // DEVIL in red
                  fontSize: '1.2rem',
                  textDecoration: 'none',
                  '& span': { color: 'white', ml: 0.5 } // GAMING in white
                }}
              >
                DEVIL<span>GAMING</span>
              </Typography>
              <IconButton onClick={toggleDrawer(false)} sx={{ color: 'white' }}>
                <X size={20} />
              </IconButton>
            </Box>

          </Box>

          {/* Drawer Categories */}
          <Box sx={{ flexGrow: 1, py: 2, overflowY: 'auto' }}>
            <List>
              {/* Inicio */}
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  href="/"
                  onClick={toggleDrawer(false)}
                  sx={{
                    py: 1.5,
                    px: 3,
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(204,0,0,0.06)', color: 'primary.main' }
                  }}
                >
                  <ListItemText
                    primary="Inicio"
                    primaryTypographyProps={{ fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  />
                </ListItemButton>
              </ListItem>

              {/* PCs Gamer Armadas */}
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  href={armadaPath}
                  onClick={toggleDrawer(false)}
                  sx={{
                    py: 1.5,
                    px: 3,
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(204,0,0,0.06)', color: 'primary.main' }
                  }}
                >
                  <ListItemText
                    primary="PC Gamer Armadas"
                    primaryTypographyProps={{ fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  />
                </ListItemButton>
              </ListItem>

              {/* Placas Outlet */}
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  href={outletPath}
                  onClick={toggleDrawer(false)}
                  sx={{
                    py: 1.5,
                    px: 3,
                    color: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: 'rgba(204,0,0,0.06)', color: 'primary.main' }
                  }}
                >
                  <ListItemText
                    primary="Placas Outlet"
                    primaryTypographyProps={{ fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  />
                </ListItemButton>
              </ListItem>

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }} />

              {/* Categorías Title */}
              <Box sx={{ px: 3, py: 1 }}>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '1px' }}>
                  Categorías
                </Typography>
              </Box>

              {loadingCategories ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={24} color="primary" />
                </Box>
              ) : dbCategories.map((cat, index) => {
                const hasSub = cat.subcategories && cat.subcategories.length > 0;
                return (
                  <Box key={cat.id}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ListItem disablePadding>
                        <ListItemButton
                          {...(hasSub ? {} : { component: Link, href: cat.path })}
                          onClick={(e) => {
                            if (hasSub) {
                              handleMobileCatToggle(cat.id, e);
                            } else {
                              toggleDrawer(false)(e as any);
                            }
                          }}
                          sx={{
                            py: 1.5,
                            px: 3,
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(204,0,0,0.06)', color: 'primary.main' }
                          }}
                        >
                          <ListItemText
                            primary={cat.name}
                            primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}
                          />
                          {hasSub && (
                            <Box sx={{ color: openCats[cat.id] ? 'primary.main' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
                              <motion.div
                                animate={{ rotate: openCats[cat.id] ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ display: 'flex' }}
                              >
                                <ChevronRight size={18} />
                              </motion.div>
                            </Box>
                          )}
                        </ListItemButton>
                      </ListItem>
                    </motion.div>

                    {hasSub && (
                      <Collapse in={openCats[cat.id]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                          {cat.subcategories.map((sub, subIdx) => (
                            <motion.div
                              key={sub.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: subIdx * 0.03 }}
                            >
                              <ListItemButton
                                component={Link}
                                href={sub.path}
                                onClick={toggleDrawer(false)}
                                sx={{
                                  py: 1.2,
                                  pl: 5,
                                  pr: 3,
                                  color: 'rgba(255,255,255,0.6)',
                                  '&:hover': { bgcolor: 'rgba(204,0,0,0.06)', color: 'primary.main' }
                                }}
                              >
                                <ListItemText
                                  primary={sub.name}
                                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.8rem' }}
                                />
                              </ListItemButton>
                            </motion.div>
                          ))}
                        </List>
                      </Collapse>
                    )}
                  </Box>
                );
              })}
            </List>
          </Box>

          {/* Admin Button - only for admins */}
          {user?.role === 'admin' && (
            <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Button
                component={Link}
                href="/admin"
                fullWidth
                variant="outlined"
                startIcon={<LayoutDashboard size={16} />}
                onClick={toggleDrawer(false)}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  borderRadius: 2,
                  py: 1,
                  '&:hover': {
                    bgcolor: 'rgba(204,0,0,0.08)',
                    borderColor: 'primary.light',
                  }
                }}
              >
                Panel de Administración
              </Button>
            </Box>
          )}

        </Box>
      </Drawer>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Navbar;
