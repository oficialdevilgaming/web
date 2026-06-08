"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Timeout de seguridad: Si en 5s no hay respuesta de auth, liberamos el loading
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) setLoading(false);
    }, 5000);

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (mounted) {
          if (session) {
            await verifyAdminProfile(session.user);
          } else {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log(`[Auth Event]: ${event}`, { userId: session?.user?.id });
      
      if (session) {
        // TOKEN_REFRESHED: El usuario sigue siendo el mismo. No hace falta re-verificar perfil.
        // Si no hay usuario en el estado, lo cargamos.
        if (event === 'SIGNED_IN' || !user) {
          verifyAdminProfile(session.user); // NO usar await aquí para evitar deadlocks de Supabase
        } else {
          // Para TOKEN_REFRESHED, el estado ya debería estar bien, solo liberamos
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const verifyAdminProfile = async (supabaseUser: any) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', supabaseUser.id)
        .single();

      if (error || !profile || !profile.is_admin) {
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return false;
      }

      const appUser: User = {
        id: supabaseUser.id,
        username: supabaseUser.email?.split('@')[0] || 'admin',
        name: supabaseUser.user_metadata?.full_name || 'Admin',
        email: supabaseUser.email || '',
        role: 'admin'
      };
      
      setUser(appUser);
      setLoading(false);
      return true;
    } catch (err) {
      setLoading(false);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password: password 
      });

      if (error || !data?.user) {
        setLoading(false);
        return false;
      }

      return await verifyAdminProfile(data.user);
    } catch (err) {
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
