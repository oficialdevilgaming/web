"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Check,
  MessageCircle,
  Plus,
  Minus,
  ChevronRight,
  Zap,
  Star,
  Headphones,
} from 'lucide-react';

import { supabase } from '../../../../lib/supabase';
import { useCart } from '../../../../context/CartContext';
import ProductCard from '../../../../components/product/ProductCard';
import { getCDNUrl } from '../../../../lib/imageUtils';

/* ─── helpers ─── */
const fmt = (n: number) =>
  n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/* ─── CSS ─── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .pd * { box-sizing: border-box; font-family: 'Inter', sans-serif; }

  /* Shell */
  .pd {
    background: #f5f5f5;
    min-height: 100vh;
    padding-bottom: 100px;
    color: #111;
  }

  /* Red top stripe */
  .pd-stripe {
    height: 5px;
    background: #cc0000;
    width: 100%;
  }

  /* Container */
  .pd-wrap {
    max-width: 1320px;
    margin: 0 auto;
    padding: 40px 32px 0;
  }
  @media (max-width: 768px) { .pd-wrap { padding: 24px 16px 0; } }

  /* Mobile Header */
  .pd-mobile-header {
    display: none;
  }
  @media (max-width: 900px) {
    .pd-mobile-header {
      display: block;
      margin-bottom: 24px;
    }
    .pd-info .pd-bc,
    .pd-info .pd-cat,
    .pd-info .pd-name {
      display: none;
    }
  }

  /* Breadcrumbs */
  .pd-bc {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    padding: 0 0 16px;
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #999;
    flex-wrap: wrap;
  }
  .pd-bc a { color: #999; text-decoration: none; transition: color 0.15s; }
  .pd-bc a:hover { color: #cc0000; }
  .pd-bc .cur { color: #111; }
  .pd-bc-sep { color: #ccc; font-size: 0.7rem; }

  /* Main 2-col grid */
  .pd-grid {
    display: grid;
    grid-template-columns: 56% 44%;
    gap: 0;
    align-items: start;
  }
  @media (max-width: 900px) {
    .pd-grid { grid-template-columns: 1fr; }
  }

  /* ── Gallery ── */
  .pd-gallery { position: sticky; top: 80px; padding-right: 48px; }
  @media (max-width: 900px) {
    .pd-gallery {
      position: relative;
      top: 0;
      padding-right: 0;
      padding-bottom: 32px;
    }
  }

  .pd-gallery-inner {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  @media (max-width: 900px) {
    .pd-gallery-inner {
      flex-direction: column-reverse;
      gap: 12px;
    }
  }

  .pd-main-img-box {
    position: relative;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 16px;
    aspect-ratio: 1/1;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
    width: 100%;
  }
  .pd-main-img-box img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .pd-main-img-box:hover img { transform: scale(1.06); }

  /* Discount overlay */
  .pd-img-flag {
    position: absolute;
    top: 16px;
    left: 16px;
    background: #cc0000;
    color: #fff;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 6px 14px;
    border-radius: 100px;
    z-index: 2;
  }

  /* Thumbnails strip */
  .pd-thumbs-left {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
  }
  @media (max-width: 900px) {
    .pd-thumbs-left {
      flex-direction: row;
      width: 100%;
      overflow-x: auto;
      padding-bottom: 4px;
    }
  }
  .pd-thumb {
    width: 76px;
    height: 76px;
    background: #fff;
    border: 2px solid #e8e8e8;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.15s;
    flex-shrink: 0;
  }
  .pd-thumb:hover { border-color: #aaa; }
  .pd-thumb.active { border-color: #cc0000; }
  .pd-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

  /* ── Info panel ── */
  .pd-info {
    padding-left: 16px;
    padding-top: 4px;
  }
  @media (max-width: 900px) { .pd-info { padding-left: 0; border-top: 1px solid #e8e8e8; padding-top: 32px; } }

  /* Category label */
  .pd-cat {
    display: inline-block;
    background: #cc0000;
    color: #fff;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 100px;
    margin-bottom: 18px;
  }

  /* Product name */
  .pd-name {
    font-size: clamp(1.8rem, 3.5vw, 2.8rem);
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -0.03em;
    text-transform: uppercase;
    color: #111;
    margin: 0 0 28px;
  }

  /* Price area */
  .pd-prices {
    display: flex;
    align-items: baseline;
    gap: 14px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
  .pd-price-was {
    font-size: 1.1rem;
    font-weight: 500;
    color: #bbb;
    text-decoration: line-through;
  }
  .pd-price-now {
    font-size: 2.6rem;
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1;
    color: #cc0000;
  }
  .pd-price-regular {
    font-size: 2.6rem;
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1;
    color: #111;
  }
  .pd-off-tag {
    font-size: 0.75rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: #111;
    color: #fff;
    padding: 5px 12px;
    border-radius: 100px;
    align-self: center;
  }

  /* Divider */
  .pd-rule { border: none; border-top: 1px solid #e8e8e8; margin: 24px 0; }

  .pd-no-stock-label {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 800;
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.06);
    padding: 6px 12px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Qty row */
  .pd-qty-row {
    display: flex;
    gap: 12px;
    align-items: stretch;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }

  .pd-qty-ctrl {
    display: flex;
    align-items: center;
    border: 1.5px solid #ddd;
    border-radius: 12px;
    height: 56px;
    flex-shrink: 0;
    overflow: hidden;
  }
  .pd-qty-btn {
    width: 48px;
    height: 100%;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111;
    transition: background 0.15s;
  }
  .pd-qty-btn:hover:not(:disabled) { background: #f0f0f0; }
  .pd-qty-btn:disabled { color: #ccc; cursor: not-allowed; }
  .pd-qty-num {
    min-width: 44px;
    text-align: center;
    font-size: 1rem;
    font-weight: 800;
    color: #111;
    user-select: none;
    border-left: 1.5px solid #ddd;
    border-right: 1.5px solid #ddd;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* CTA button */
  .pd-btn-cart {
    flex: 1;
    min-width: 180px;
    height: 56px;
    background: #cc0000;
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 0.88rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: background 0.2s, color 0.2s;
  }
  .pd-btn-cart:hover:not(:disabled) {
    background: #a80000;
    border-color: #a80000;
  }
  .pd-btn-cart.added {
    background: #111;
    border-color: #111;
    cursor: not-allowed;
  }

  /* WhatsApp CTA */
  .pd-btn-wa {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: 56px;
    border: 1.5px solid #25d366;
    border-radius: 12px;
    background: none;
    color: #25d366;
    font-size: 0.88rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    text-decoration: none;
    margin-bottom: 16px;
    transition: background 0.15s;
  }
  .pd-btn-wa:hover { background: #f0fff5; }

  /* Trust strip */
  .pd-trust {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-top: 1px solid #e8e8e8;
    margin-top: 24px;
  }
  @media (max-width: 480px) { .pd-trust { grid-template-columns: 1fr 1fr; } }
  .pd-trust-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 20px 16px;
    border-right: 1px solid #e8e8e8;
  }
  .pd-trust-item:last-child { border-right: none; }
  .pd-trust-item svg { color: #cc0000; }
  .pd-trust-item .tl {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #111;
  }
  .pd-trust-item .ts {
    font-size: 0.68rem;
    color: #999;
    font-weight: 500;
    line-height: 1.3;
  }

  /* ── Description ── */
  .pd-desc-section {
    margin-top: 80px;
    border-top: 4px solid #111;
    padding-top: 40px;
  }
  .pd-desc-heading {
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #cc0000;
    margin: 0 0 24px;
  }
  .pd-desc-body {
    font-size: 1rem;
    line-height: 1.85;
    color: #444;
    max-width: 100%;
  }
  .pd-desc-body b, .pd-desc-body strong { color: #111; font-weight: 700; }
  .pd-desc-body ul, .pd-desc-body ol { padding-left: 20px; margin: 12px 0; }
  .pd-desc-body li { margin-bottom: 6px; }
  .pd-desc-body p { margin-bottom: 14px; }
  .pd-desc-body h2, .pd-desc-body h3, .pd-desc-body h4 { color: #111; margin: 20px 0 8px; }

  /* ── Related ── */
  .pd-related-section { margin-top: 60px; }
  .pd-related-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 4px solid #111;
    padding-top: 32px;
    margin-bottom: 32px;
  }
  .pd-related-title {
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #111;
    margin: 0;
  }
  .pd-related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 10px;
  }

  /* ── Mobile carousel ── */
  .pd-related-carousel-wrap {
    display: none;
  }
  @media (max-width: 768px) {
    .pd-related-grid { display: none; }
    .pd-related-carousel-wrap { display: block; }
  }
  .pd-related-carousel {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    gap: 0;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .pd-related-carousel::-webkit-scrollbar { display: none; }
  .pd-related-carousel-item {
    flex: 0 0 100%;
    scroll-snap-align: center;
    padding: 0 4px;
  }
  /* Dots */
  .pd-carousel-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 20px;
  }
  .pd-carousel-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ddd;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background 0.2s, transform 0.2s;
  }
  .pd-carousel-dot.active {
    background: #cc0000;
    transform: scale(1.3);
  }

  /* Loading */
  .pd-loading {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    background: #f5f5f5;
  }
  .pd-spinner {
    width: 44px; height: 44px;
    border: 3px solid #e8e8e8;
    border-top-color: #cc0000;
    border-radius: 50%;
    animation: pd-spin 0.7s linear infinite;
  }
  @keyframes pd-spin { to { transform: rotate(360deg); } }
  .pd-loading p {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #999;
    margin: 0;
  }

  /* Pulse Animation & Skeleton */
  @keyframes pd-pulse {
    0% { background-color: #f5f5f5; }
    50% { background-color: #e8e8e8; }
    100% { background-color: #f5f5f5; }
  }
  .pd-skeleton-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    animation: pd-pulse 1.5s infinite ease-in-out;
    z-index: 1;
  }

  /* Fade in */
  @keyframes pd-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pd-fade-up { animation: pd-fade-up 0.45s ease forwards; }
`;

/* ─── Page Component ─── */
export default function ProductDetailPage() {
  const { id } = useParams() as { id: string };
  const { state, dispatch } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    setImageLoaded(false);
  }, [selectedImage]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setQuantity(1);

      const { data: pData } = await supabase
        .from('products')
        .select('*, category:categories(name)')
        .eq('id', id)
        .single();

      if (pData) {
        setProduct(pData);
        setSelectedImage(
          pData.images?.[0] ?? pData.image ?? '/default-gaming-product.png'
        );

        const { data: rel } = await supabase
          .from('products')
          .select('id, name, price, discount, stock, images, category_id, category:categories(name)')
          .eq('category_id', pData.category_id)
          .neq('id', id)
          .limit(4);

        setRelated(rel ?? []);
      }

      setLoading(false);
    })();
  }, [id]);

  const existingCartItem = state.items.find((i: any) => i.id === product?.id);
  const remainingStock = product ? (product.stock - (existingCartItem ? existingCartItem.quantity : 0)) : 0;
  const isCartLimitReached = remainingStock <= 0;

  useEffect(() => {
    if (product) {
      const existing = state.items.find((i: any) => i.id === product.id);
      const remaining = product.stock - (existing ? existing.quantity : 0);
      if (remaining <= 0) {
        setQuantity(1);
      } else if (quantity > remaining) {
        setQuantity(remaining);
      }
    }
  }, [state.items, product, quantity]);

  const handleAddToCart = () => {
    if (isAdded || isCartLimitReached) return;
    const existing = state.items.find(i => i.id === product.id);
    if (existing) {
      dispatch({
        type: 'UPDATE_QUANTITY',
        payload: { id: product.id, quantity: Math.min(product.stock, existing.quantity + quantity) },
      });
    } else {
      dispatch({ type: 'ADD_TO_CART', payload: product });
      if (quantity > 1) dispatch({ type: 'UPDATE_QUANTITY', payload: { id: product.id, quantity } });
    }
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2200);
  };

  /* ── States ── */
  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="pd-loading">
          <div className="pd-spinner" />
          <p>Cargando producto</p>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <style>{css}</style>
        <div className="pd-loading">
          <Zap size={40} color="#cc0000" />
          <p>Producto no encontrado</p>
          <NextLink
            href="/shop"
            style={{
              background: '#cc0000', color: '#fff',
              padding: '14px 28px',
              fontWeight: 900, fontSize: '0.8rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Volver a la tienda
          </NextLink>
        </div>
      </>
    );
  }

  const catName = product.category?.name ?? 'Varios';
  const allImages =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image ?? '/default-gaming-product.png'];

  const finalPrice =
    product.discount > 0
      ? product.price * (1 - product.discount / 100)
      : product.price;

  const priceDetails = product.discount > 0
    ? `(Precio: $${finalPrice.toLocaleString('es-ES', { maximumFractionDigits: 0 })} con ${product.discount}% OFF, antes $${product.price.toLocaleString('es-ES')})`
    : `(Precio: $${product.price.toLocaleString('es-ES')})`;

  const whatsappLink = `https://wa.me/5491155099149?text=${encodeURIComponent(`Hola! Quiero consultar la disponibilidad del producto: ${product.name} ${priceDetails}`)}`;

  const trustItems = [
    { icon: <Star size={20} />, label: 'Catálogo Premium', sub: 'Lo mejor para tu setup' },
    { icon: <Headphones size={20} />, label: 'Asistencia', sub: 'Te asesoramos por WhatsApp' },
    { icon: <Zap size={20} />, label: 'Gaming Experts', sub: 'Sabemos lo que necesitás' },
  ];

  return (
    <>
      <style>{css}</style>

      <div className="pd">
        {/* Red stripe */}
        <div className="pd-stripe" />

        <div className="pd-wrap">

          {/* Mobile Header */}
          <div className="pd-mobile-header">
            <nav className="pd-bc">
              <NextLink href="/">Inicio</NextLink>
              <ChevronRight size={11} className="pd-bc-sep" />
              <NextLink href="/shop">Tienda</NextLink>
              <ChevronRight size={11} className="pd-bc-sep" />
              <NextLink href={`/shop?category=${catName}`}>{catName}</NextLink>
              <ChevronRight size={11} className="pd-bc-sep" />
              <span className="cur">{product.name}</span>
            </nav>
            <div className="pd-cat">{catName}</div>
            <h1 className="pd-name">{product.name}</h1>
          </div>

          {/* ── Main grid ── */}
          <div className="pd-grid pd-fade-up">

            {/* Gallery */}
            <div className="pd-gallery">
              <div className="pd-gallery-inner">
                {allImages.length > 1 && (
                  <div className="pd-thumbs-left">
                    {allImages.map((img: string, idx: number) => (
                      <div
                        key={idx}
                        className={`pd-thumb ${selectedImage === img ? 'active' : ''}`}
                        onClick={() => setSelectedImage(img)}
                      >
                        <img src={getCDNUrl(img)} alt={`Vista ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="pd-main-img-box">
                  {product.discount > 0 && (
                    <div className="pd-img-flag" style={{ zIndex: 3 }}>−{product.discount}%</div>
                  )}
                  {!imageLoaded && <div className="pd-skeleton-bg" />}
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedImage}
                      src={getCDNUrl(selectedImage)}
                      alt={product.name}
                      style={{ zIndex: 2 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: imageLoaded ? 1 : 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      onLoad={() => setImageLoaded(true)}
                    />
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="pd-info">

              {/* Breadcrumbs */}
              <nav className="pd-bc">
                <NextLink href="/">Inicio</NextLink>
                <ChevronRight size={11} className="pd-bc-sep" />
                <NextLink href="/shop">Tienda</NextLink>
                <ChevronRight size={11} className="pd-bc-sep" />
                <NextLink href={`/shop?category=${catName}`}>{catName}</NextLink>
                <ChevronRight size={11} className="pd-bc-sep" />
                <span className="cur">{product.name}</span>
              </nav>

              {/* Category label */}
              <div className="pd-cat">{catName}</div>

              {/* Name */}
              <h1 className="pd-name">{product.name}</h1>

              {/* Price */}
              <div className="pd-prices">
                {product.discount > 0 ? (
                  <>
                    <span className="pd-price-was">${fmt(product.price)}</span>
                    <span className="pd-price-now">${fmt(finalPrice)}</span>
                    <span className="pd-off-tag">{product.discount}% off</span>
                  </>
                ) : (
                  <span className="pd-price-regular">${fmt(product.price)}</span>
                )}
              </div>

              <hr className="pd-rule" />

              {remainingStock <= 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <span className="pd-no-stock-label">Sin stock</span>
                </div>
              )}

              {/* Actions */}
              {product.stock > 0 ? (
                <div className="pd-qty-row">
                  {/* Qty */}
                  <div className="pd-qty-ctrl">
                    <button
                      className="pd-qty-btn"
                      onClick={() => setQuantity(p => Math.max(1, p - 1))}
                      disabled={quantity <= 1 || isCartLimitReached}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="pd-qty-num">{isCartLimitReached ? 0 : quantity}</span>
                    <button
                      className="pd-qty-btn"
                      onClick={() => setQuantity(p => Math.min(remainingStock, p + 1))}
                      disabled={quantity >= remainingStock || isCartLimitReached}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Add to cart */}
                  <motion.button
                    className={`pd-btn-cart ${isAdded ? 'added' : ''}`}
                    onClick={handleAddToCart}
                    disabled={isAdded || isCartLimitReached}
                    animate={isAdded ? { scale: [1, 1.03, 1] } : {}}
                    transition={{ duration: 0.25 }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={isAdded ? 'ok' : isCartLimitReached ? 'limit' : 'add'}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        {isAdded
                          ? <><Check size={18} /> Agregado al carrito</>
                          : isCartLimitReached
                            ? <><ShoppingCart size={18} /> Límite de stock en carrito</>
                            : <><ShoppingCart size={18} /> Agregar al carrito</>
                        }
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </div>
              ) : (
                <a
                  className="pd-btn-wa"
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={18} />
                  Consultar por WhatsApp
                </a>
              )}

              {/* Trust */}
              <div className="pd-trust" style={{ marginTop: '40px' }}>
                {trustItems.map((t, i) => (
                  <div className="pd-trust-item" key={i}>
                    {t.icon}
                    <span className="tl">{t.label}</span>
                    <span className="ts">{t.sub}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="pd-desc-section pd-fade-up">
              <p className="pd-desc-heading">Descripción del producto</p>
              {product.description.includes('<') ? (
                <div
                  className="pd-desc-body"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <div className="pd-desc-body" style={{ whiteSpace: 'pre-line' }}>
                  {product.description}
                </div>
              )}
            </div>
          )}

          {/* Related products */}
          {related.length > 0 && (
            <div className="pd-related-section pd-fade-up">
              <div className="pd-related-header">
                <p className="pd-related-title">Productos relacionados</p>
              </div>

              {/* Desktop grid */}
              <div className="pd-related-grid">
                {related.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Mobile carousel */}
              <div className="pd-related-carousel-wrap">
                <div
                  className="pd-related-carousel"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const idx = Math.round(el.scrollLeft / el.clientWidth);
                    setCarouselIndex(idx);
                  }}
                >
                  {related.map((p: any) => (
                    <div className="pd-related-carousel-item" key={p.id}>
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
                {/* Dots */}
                <div className="pd-carousel-dots">
                  {related.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      className={`pd-carousel-dot ${carouselIndex === idx ? 'active' : ''}`}
                      onClick={() => {
                        const carousel = document.querySelector('.pd-related-carousel') as HTMLElement;
                        if (carousel) {
                          carousel.scrollTo({ left: idx * carousel.clientWidth, behavior: 'smooth' });
                          setCarouselIndex(idx);
                        }
                      }}
                      aria-label={`Producto ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
