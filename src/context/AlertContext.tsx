"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

interface AlertContextType {
  showAlert: (message: string, title?: string) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('Acción Denegada');

  const showAlert = (msg: string, t?: string) => {
    setMessage(msg);
    setTitle(t || 'Acción Denegada');
    setIsOpen(true);
  };

  const closeAlert = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAlert}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '440px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 11px 15px -7px rgba(0,0,0,0.2), 0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12)',
                color: '#1e1e1e',
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#d32f2f' }}>
                  {title}
                </span>
                <button
                  onClick={closeAlert}
                  style={{ background: 'none', border: 'none', color: 'rgba(0,0,0,0.4)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#d32f2f'; e.currentTarget.style.backgroundColor = 'rgba(211,47,47,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(0,0,0,0.4)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div style={{ fontSize: '1rem', lineHeight: '1.5', color: '#333333', fontWeight: 400, whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                {message}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button
                  onClick={closeAlert}
                  style={{ backgroundColor: '#d32f2f', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '8px 22px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)', transition: 'all 0.2s ease', textTransform: 'uppercase' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#b71c1c'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#d32f2f'; }}
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within an AlertProvider');
  return context;
};
