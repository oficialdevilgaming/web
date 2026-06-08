"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Divider,
  Collapse,
  Stack,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import {
  ChevronRight,
  ChevronDown,
  Flame
} from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { supabase } from '../../lib/supabase';

interface CategorySidebarProps {
  onFilterChange?: () => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({ onFilterChange }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams?.get('category') || '';

  const minPrice = Number(searchParams?.get('minPrice')) || 0;
  const maxPrice = Number(searchParams?.get('maxPrice')) || 10000000;

  const [priceRange, setPriceRange] = React.useState<number[]>([minPrice, maxPrice]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [activeParent, setActiveParent] = useState<string | null>(null);

  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  // Fetch categories only once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (!error && data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  // Auto-expand parent category when selection changes
  useEffect(() => {
    if (categories.length > 0 && currentCategory) {
      const current = categories.find(c => c.name.toLowerCase() === currentCategory.toLowerCase());
      if (current?.parent_id) {
        setActiveParent(current.parent_id);
      } else if (current) {
        setActiveParent(current.id);
      }
    }
  }, [currentCategory, categories]);

  const { roots, childrenMap, isSpecialTree } = useMemo(() => {
    let roots = categories.filter(c => !c.parent_id);
    const childrenMap: Record<string, any[]> = {};
    let isSpecialTree = false;

    categories.forEach(c => {
      if (c.parent_id) {
        if (!childrenMap[c.parent_id]) childrenMap[c.parent_id] = [];
        childrenMap[c.parent_id].push(c);
      }
    });

    if (currentCategory) {
      const current = categories.find(c => c.name.toLowerCase() === currentCategory.toLowerCase());
      if (current) {
        let rootOfCurrent = current;
        while (rootOfCurrent.parent_id) {
          const parent = categories.find(c => c.id === rootOfCurrent.parent_id);
          if (parent) rootOfCurrent = parent;
          else break;
        }

        const lowerName = rootOfCurrent.name.toLowerCase();
        isSpecialTree = lowerName.includes('armada') || lowerName.includes('outlet');

        if (isSpecialTree) {
          roots = [rootOfCurrent];
        } else {
          roots = roots.filter(r => {
            const lowerR = r.name.toLowerCase();
            return !lowerR.includes('armada') && !lowerR.includes('outlet');
          });
        }
      } else {
        roots = roots.filter(r => {
          const lowerR = r.name.toLowerCase();
          return !lowerR.includes('armada') && !lowerR.includes('outlet');
        });
      }
    } else {
      roots = roots.filter(r => {
        const lowerR = r.name.toLowerCase();
        return !lowerR.includes('armada') && !lowerR.includes('outlet');
      });
    }

    return { roots, childrenMap, isSpecialTree };
  }, [categories, currentCategory]);

  const handleCategoryClick = (value: string, id?: string) => {
    const newParams = new URLSearchParams(searchParams?.toString() || '');
    if (value === '') {
      newParams.delete('category');
      setActiveParent(null);
    } else {
      newParams.set('category', value);
      if (id && !categories.find(c => c.id === id)?.parent_id) {
        setActiveParent(activeParent === id ? null : id);
      }
    }
    router.push(`${pathname}?${newParams.toString()}`);
    onFilterChange?.();
  };

  const handlePriceChange = (_event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as number[]);
  };

  const handlePriceChangeCommitted = (_event: React.SyntheticEvent | Event, newValue: number | number[]) => {
    const newParams = new URLSearchParams(searchParams?.toString() || '');
    const [min, max] = newValue as number[];
    newParams.set('minPrice', min.toString());
    newParams.set('maxPrice', max.toString());
    router.push(`${pathname}?${newParams.toString()}`);
    onFilterChange?.();
  };

  const currentStock = searchParams?.get('stock') || '';
  const currentFeatured = searchParams?.get('featured') === 'true';
  const currentDiscount = searchParams?.get('discount') === 'true';

  const handleStockClick = (value: string) => {
    const newParams = new URLSearchParams(searchParams?.toString() || '');
    if (currentStock === value) {
      newParams.delete('stock');
    } else {
      newParams.set('stock', value);
    }
    router.push(`${pathname}?${newParams.toString()}`);
    onFilterChange?.();
  };

  const handleFeaturedClick = () => {
    const newParams = new URLSearchParams(searchParams?.toString() || '');
    if (currentFeatured) {
      newParams.delete('featured');
    } else {
      newParams.set('featured', 'true');
    }
    router.push(`${pathname}?${newParams.toString()}`);
    onFilterChange?.();
  };

  const handleDiscountClick = () => {
    const newParams = new URLSearchParams(searchParams?.toString() || '');
    if (currentDiscount) {
      newParams.delete('discount');
    } else {
      newParams.set('discount', 'true');
    }
    router.push(`${pathname}?${newParams.toString()}`);
    onFilterChange?.();
  };

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', bgcolor: 'white' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, px: 1, letterSpacing: -0.5 }}>
        CATEGORÍAS
      </Typography>

      <List disablePadding>
        {/* All categories option */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            selected={currentCategory === ''}
            onClick={() => handleCategoryClick('')}
            sx={{
              borderRadius: 2,
              '&.Mui-selected': {
                bgcolor: 'rgba(204, 0, 0, 0.08)',
                color: 'primary.main',
                '&:hover': { bgcolor: 'rgba(204, 0, 0, 0.12)' }
              }
            }}
          >
            <ListItemText
              primary={"Todos los Productos"}
              primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }}
            />
          </ListItemButton>
        </ListItem>

        {roots.map((root) => {
          const hasChildren = (childrenMap[root.id] || []).length > 0;
          const isSelected = currentCategory.toLowerCase() === root.name.toLowerCase();
          const isOpen = activeParent === root.id;

          return (
            <React.Fragment key={root.id}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleCategoryClick(root.name, root.id)}
                  sx={{
                    borderRadius: 2,
                    py: 1.2,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(204, 0, 0, 0.08)',
                      color: 'primary.main',
                      fontWeight: 700,
                      '&:hover': { bgcolor: 'rgba(204, 0, 0, 0.12)' }
                    }
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                    <ListItemText
                      primary={root.name}
                      primaryTypographyProps={{
                        fontWeight: isSelected ? 800 : 700,
                        fontSize: '0.85rem'
                      }}
                    />
                    {hasChildren && (
                      <Box sx={{ opacity: 0.5 }}>
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </Box>
                    )}
                  </Stack>
                </ListItemButton>
              </ListItem>

              {hasChildren && (
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 2, mb: 1 }}>
                    {childrenMap[root.id].map((sub) => {
                      const isSubSelected = currentCategory.toLowerCase() === sub.name.toLowerCase();
                      return (
                        <ListItem key={sub.id} disablePadding sx={{ mb: 0.2 }}>
                          <ListItemButton
                            selected={isSubSelected}
                            onClick={() => handleCategoryClick(sub.name)}
                            sx={{
                              borderRadius: 1.5,
                              py: 0.5,
                              '&.Mui-selected': {
                                bgcolor: 'transparent',
                                color: 'primary.main',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                              }
                            }}
                          >
                            <ListItemText
                              primary={sub.name}
                              primaryTypographyProps={{
                                fontWeight: isSubSelected ? 700 : 600,
                                fontSize: '0.8rem',
                                color: isSubSelected ? 'primary.main' : 'text.secondary'
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
      </List>

      <Divider sx={{ my: 3, opacity: 0.5 }} />

      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, px: 1, letterSpacing: -0.5 }}>
        PRECIO
      </Typography>
      <Box sx={{ px: 1 }}>
        <Stack direction="column" spacing={1.5}>
          <TextField
            size="small"
            placeholder="Desde"
            type="number"
            value={priceRange[0] === 0 ? '' : priceRange[0]}
            onChange={(e) => {
              const val = e.target.value === '' ? 0 : Number(e.target.value);
              setPriceRange([val, priceRange[1]]);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePriceChangeCommitted(e as any, priceRange);
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start" sx={{ mr: 0.5 }}>$</InputAdornment>,
              inputProps: { min: 0 }
            }}
            sx={{
              '& input': { fontSize: '0.9rem', fontWeight: 600 },
              '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { display: 'none' },
              '& input[type=number]': { MozAppearance: 'textfield' }
            }}
          />
          <TextField
            size="small"
            placeholder="Hasta"
            type="number"
            value={priceRange[1] >= 10000000 ? '' : priceRange[1]}
            onChange={(e) => {
              const val = e.target.value === '' ? 10000000 : Number(e.target.value);
              setPriceRange([priceRange[0], val]);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePriceChangeCommitted(e as any, priceRange);
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start" sx={{ mr: 0.5 }}>$</InputAdornment>,
              inputProps: { min: 0 }
            }}
            sx={{
              '& input': { fontSize: '0.9rem', fontWeight: 600 },
              '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { display: 'none' },
              '& input[type=number]': { MozAppearance: 'textfield' }
            }}
          />
        </Stack>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          size="small"
          sx={{ mt: 1.5, mb: 1, fontWeight: 700, borderRadius: 2, borderColor: 'rgba(0,0,0,0.1)', '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(204,0,0,0.02)', color: 'primary.main' } }}
          onClick={(e) => handlePriceChangeCommitted(e as any, priceRange)}
        >
          Filtrar
        </Button>
      </Box>

      <Divider sx={{ my: 3, opacity: 0.5 }} />

      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, px: 1, letterSpacing: -0.5 }}>
        Productos Devil
      </Typography>
      <List disablePadding>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            selected={currentFeatured}
            onClick={handleFeaturedClick}
            sx={{
              borderRadius: 2,
              '&.Mui-selected': {
                bgcolor: 'rgba(204, 0, 0, 0.08)',
                color: 'primary.main',
                '&:hover': { bgcolor: 'rgba(204, 0, 0, 0.12)' }
              }
            }}
          >
            <ListItemText
              primary="Destacados"
              primaryTypographyProps={{
                fontSize: '0.85rem',
                fontWeight: currentFeatured ? 700 : 600,
                color: currentFeatured ? 'primary.main' : 'inherit'
              }}
            />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            selected={currentDiscount}
            onClick={handleDiscountClick}
            sx={{
              borderRadius: 2,
              '&.Mui-selected': {
                bgcolor: 'rgba(204, 0, 0, 0.08)',
                color: 'primary.main',
                '&:hover': { bgcolor: 'rgba(204, 0, 0, 0.12)' }
              }
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <ListItemText
                primary="Ofertas"
                primaryTypographyProps={{
                  fontSize: '0.85rem',
                  fontWeight: currentDiscount ? 700 : 600,
                  color: currentDiscount ? 'primary.main' : 'inherit'
                }}
              />
            </Stack>
          </ListItemButton>
        </ListItem>
      </List>
    </Paper>
  );
};

export default CategorySidebar;
