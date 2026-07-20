"use client";

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Skeleton,
} from '@mui/material';
import { ShoppingCart, Check, Star } from 'lucide-react';
import Link from 'next/link';

import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getCDNUrl } from '../../lib/imageUtils';

// Placeholder de número de WhatsApp de la tienda
const WHATSAPP_NUMBER = '5491155099149';

interface ProductCardProps {
  product: any;
  layout?: 'grid' | 'list';
  small?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, layout = 'grid', small = false }) => {
  const { state, dispatch } = useCart();
  const [isAdded, setIsAdded] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const isOutOfStock = product.stock === 0;

  const existingCartItem = state.items.find(item => item.id === product.id);
  const isMaxStockReached = existingCartItem ? existingCartItem.quantity >= product.stock : false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isMaxStockReached) return;
    dispatch({ type: 'ADD_TO_CART', payload: product });
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const finalPrice = product.discount > 0
      ? product.price * (1 - product.discount / 100)
      : product.price;

    const priceDetails = product.discount > 0
      ? `(Precio: $${finalPrice.toLocaleString('es-ES', { maximumFractionDigits: 0 })} con ${product.discount}% OFF, antes $${product.price.toLocaleString('es-ES')})`
      : `(Precio: $${product.price.toLocaleString('es-ES')})`;

    const msg = encodeURIComponent(`Hola! Me gustaría consultar la disponibilidad del producto: ${product.name} ${priceDetails}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  };

  const displayPrice = product.price;
  const rawImage = product.image || (product.images && product.images[0]) || '/default-gaming-product.png';
  const imageToShow = getCDNUrl(rawImage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{ height: '100%' }}
    >
      <Card
        component={Link}
        href={`/product/${product.id}`}
        sx={{
          height: '100%',
          maxWidth: small ? { xs: '290px', sm: '100%' } : '100%',
          mx: 'auto',
          display: 'flex',
          flexDirection: layout === 'list' ? { xs: 'column', sm: 'row' } : 'column',
          textDecoration: 'none',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: small ? 2 : 3,
          border: '1px solid rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease-in-out',
          transform: 'translateZ(0)',
          '&:hover': {
            borderColor: 'rgba(235, 8, 8, 0.3)',
            boxShadow: '0 0 15px rgba(235, 8, 8, 0.61)'
          }
        }}
      >
        <Box sx={{
          position: 'relative',
          width: layout === 'list' ? { xs: '100%', sm: '30%' } : '100%',
          minWidth: layout === 'list' ? { sm: '200px' } : 'auto',
          aspectRatio: '1/1',
          overflow: 'hidden',
          borderBottom: small ? '1px solid #000000' : '1.5px solid #000000',
        }}>
          {!imageLoaded && (
            <Skeleton
              variant="rectangular"
              animation="wave"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                bgcolor: 'rgba(0,0,0,0.06)',
                zIndex: 1
              }}
            />
          )}
          <Image
            src={imageToShow}
            alt={product.name}
            fill
            sizes={layout === 'list' ? "(max-width: 600px) 100vw, 30vw" : "(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 25vw"}
            style={{
              objectFit: 'cover',
              transition: 'transform 0.5s ease, opacity 0.3s ease-in-out',
              opacity: imageLoaded ? 1 : 0,
              filter: isOutOfStock ? 'grayscale(40%)' : 'none',
              zIndex: 2
            }}
            onLoad={() => setImageLoaded(true)}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
          {/* Descuento badge (Top-Left) */}
          {product.discount > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: small ? { xs: 3, sm: 6 } : { xs: 4, sm: 8 },
                left: small ? { xs: 3, sm: 6 } : { xs: 4, sm: 8 },
                zIndex: 3,
                bgcolor: '#cc0000',
                color: '#fff',
                fontSize: small ? { xs: '0.52rem', sm: '0.62rem' } : { xs: '0.6rem', sm: '0.72rem' },
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: small ? { xs: '2px 6px', sm: '4px 9px' } : { xs: '3px 8px', sm: '5px 12px' },
                borderRadius: '100px',
                boxShadow: '0 2px 8px rgba(204, 0, 0, 0.25)',
              }}
            >
              -{product.discount}%
            </Box>
          )}

          {/* Top-Right badge stack: Destacado + Sin Stock (stacked so they never overlap) */}
          <Box
            sx={{
              position: 'absolute',
              top: small ? { xs: 3, sm: 6 } : { xs: 4, sm: 8 },
              right: small ? { xs: 3, sm: 6 } : { xs: 4, sm: 8 },
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: small ? '4px' : '6px',
            }}
          >
            {product.featured && (
              <Star
                size={20}
                fill="#FFD700"
                color="#FFD700"
                strokeWidth={1.5}
                style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}
              />
            )}
            {isOutOfStock && (
              <Box
                sx={{
                  bgcolor: '#111',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: small ? { xs: '0.52rem', sm: '0.6rem' } : { xs: '0.6rem', sm: '0.7rem' },
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: small ? { xs: '2px 6px', sm: '4px 9px' } : { xs: '3px 8px', sm: '5px 12px' },
                  borderRadius: '100px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Sin Stock</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Agotado</Box>
              </Box>
            )}
          </Box>
        </Box>

        <CardContent sx={{
          flexGrow: 1,
          p: small ? { xs: 0.75, sm: 1.1 } : { xs: 1, sm: 1.5 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, fontSize: small ? { xs: '0.5rem', sm: '0.55rem' } : { xs: '0.6rem', sm: '0.65rem' } }}>
            {product.category?.name || 'Sin Categoría'}
          </Typography>
          <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1.2, height: layout === 'list' ? 'auto' : '2.4em', overflow: 'hidden', color: '#333', fontSize: small ? { xs: '0.65rem', sm: '0.75rem' } : { xs: '0.75rem', sm: '0.85rem' } }}>
            {product.name}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: small ? { xs: 0.35, sm: 1 } : { xs: 0.5, sm: 1.5 }, width: '100%', mb: small ? { xs: 0.75, sm: 1.1 } : { xs: 1, sm: 1.5 }, flexWrap: 'wrap' }}>
            {product.discount > 0 ? (
              <>
                <Typography variant="h6" color={isOutOfStock ? 'text.secondary' : 'primary.main'} sx={{ fontWeight: 900, fontSize: small ? { xs: '0.8rem', sm: '1rem' } : { xs: '0.95rem', sm: '1.25rem' }, lineHeight: 1 }}>
                  ${(product.price * (1 - product.discount / 100)).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                </Typography>
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: '#8c8c8c', fontWeight: 600, fontSize: small ? { xs: '0.6rem', sm: '0.75rem' } : { xs: '0.7rem', sm: '0.9rem' }, lineHeight: 1 }}>
                  ${product.price.toLocaleString('es-ES')}
                </Typography>
              </>
            ) : (
              <Typography variant="h6" color={isOutOfStock ? 'text.secondary' : 'primary.main'} sx={{ fontWeight: 900, fontSize: small ? { xs: '0.8rem', sm: '1rem' } : { xs: '0.95rem', sm: '1.25rem' }, lineHeight: 1 }}>
                ${displayPrice.toLocaleString('es-ES')}
              </Typography>
            )}
          </Box>

          {isOutOfStock ? (
            <Button
              fullWidth={layout !== 'list'}
              variant="outlined"
              onClick={handleWhatsApp}
              startIcon={
                <svg viewBox="0 0 24 24" width={small ? "12" : "14"} height={small ? "12" : "14"} fill="#25d366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              }
              sx={{
                width: '100%',
                height: small ? { xs: '26px', sm: '30px' } : { xs: '32px', sm: '38px' },
                py: 0.5,
                px: layout === 'list' ? 4 : undefined,
                fontWeight: 800,
                borderRadius: small ? '8px' : '12px',
                borderColor: '#25d366',
                color: '#25d366',
                fontSize: small ? { xs: '0.58rem', sm: '0.65rem' } : { xs: '0.68rem', sm: '0.75rem' },
                '&:hover': {
                  bgcolor: 'rgba(37,211,102,0.06)',
                  borderColor: '#1da851',
                }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Consultar</Box>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Consultar</Box>
            </Button>
          ) : (
            <motion.div
              animate={isAdded ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.3 }}
              style={{ width: layout === 'list' ? 'fit-content' : '100%', marginTop: layout === 'list' ? 8 : 'auto' }}
            >
              <Button
                fullWidth={layout !== 'list'}
                variant="contained"
                color={isAdded ? "success" : "primary"}
                startIcon={
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isAdded ? 'check' : 'cart'}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isAdded ? <Check size={small ? 11 : 14} /> : <ShoppingCart size={small ? 11 : 14} />}
                    </motion.div>
                  </AnimatePresence>
                }
                onClick={handleAddToCart}
                disabled={isAdded || isMaxStockReached}
                sx={{
                  width: '100%',
                  height: small ? { xs: '26px', sm: '30px' } : { xs: '32px', sm: '38px' },
                  py: 0.5,
                  px: layout === 'list' ? 4 : undefined,
                  fontWeight: 800,
                  fontSize: small ? { xs: '0.58rem', sm: '0.65rem' } : { xs: '0.68rem', sm: '0.75rem' },
                  borderRadius: small ? '8px' : '12px',
                  boxShadow: 'none',
                  transition: 'all 0.3s ease',
                  ...(isAdded ? {
                    bgcolor: '#111',
                    color: 'white',
                    '&:hover': { bgcolor: '#111', boxShadow: 'none' },
                    '&.Mui-disabled': {
                      bgcolor: '#111',
                      color: 'white',
                      opacity: 1
                    }
                  } : isMaxStockReached ? {
                    bgcolor: '#ccc',
                    color: '#666',
                    '&:hover': { bgcolor: '#ccc', boxShadow: 'none' },
                    '&.Mui-disabled': {
                      bgcolor: '#ccc',
                      color: '#666',
                      opacity: 1
                    }
                  } : {
                    '&:hover': { boxShadow: '0 4px 12px rgba(204, 0, 0, 0.2)' }
                  })
                }}
              >
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  {isAdded ? 'Agregado' : isMaxStockReached ? 'Sin Stock' : 'Añadir'}
                </Box>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {isAdded ? 'Agregado al carrito' : isMaxStockReached ? 'Sin Stock' : 'Añadir al Carrito'}
                </Box>
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProductCard;
