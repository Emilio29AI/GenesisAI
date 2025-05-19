// src/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface AuthUser {
  id: string;
  email: string | undefined;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean; // Para que los componentes sepan si la carga inicial de auth terminó
  isAuthenticated: boolean;
  login: (accessToken: string, userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Comienza como true
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Efecto para cargar el estado desde localStorage SOLO en el cliente y UNA VEZ
  useEffect(() => {
    console.log("AuthContext (Con localStorage): useEffect[] - Cargando desde localStorage...");
    try {
      const storedToken = localStorage.getItem('accessToken');
      const storedUserString = localStorage.getItem('authUser');
      if (storedToken && storedUserString) {
        const parsedUser = JSON.parse(storedUserString);
        setUser(parsedUser);
        setToken(storedToken);
        console.log("AuthContext (Con localStorage): useEffect[] - Usuario cargado:", parsedUser);
      } else {
        console.log("AuthContext (Con localStorage): useEffect[] - No hay datos en localStorage.");
        // Asegurarse de que user y token sean null si no hay nada en localStorage
        setUser(null);
        setToken(null);
      }
    } catch (e) {
      console.error("AuthContext (Con localStorage): useEffect[] - Error parseando localStorage", e);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');
      setUser(null);
      setToken(null);
    }
    setIsLoading(false); // Marcar la carga inicial como completada
    console.log("AuthContext (Con localStorage): useEffect[] - Carga inicial terminada, isLoading: false");
  }, []); // Array de dependencias vacío, se ejecuta solo una vez al montar


  const login = useCallback((accessToken: string, userDataSupabase: any) => {
    const appUser: AuthUser = { id: userDataSupabase.id, email: userDataSupabase.email };
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('authUser', JSON.stringify(appUser));
    setToken(accessToken);
    setUser(appUser);
    const redirectPath = searchParams.get('redirect');
    const action = searchParams.get('action');
    let finalRedirectUrl = redirectPath || '/generate-idea';
    if (redirectPath) {
      const paramsForRedirect = new URLSearchParams();
      paramsForRedirect.set('afterLogin', 'true');
      if (action) paramsForRedirect.set('action', action);
      finalRedirectUrl = `${redirectPath}?${paramsForRedirect.toString()}`;
    }
    console.log("AuthContext (Con localStorage): Usuario logueado, redirigiendo a:", finalRedirectUrl);
    router.push(finalRedirectUrl); 
  }, [router, searchParams]); 


  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    console.log("AuthContext (Con localStorage): Usuario deslogueado, redirigiendo a /login");
    router.push('/login');
  }, [router]);

  // Reintroducimos el useEffect de protección de rutas
  useEffect(() => {
    console.log("AuthContext (Con localStorage) (Route Guard): isLoading:", isLoading, "User:", !!user, "Path:", pathname);
    if (isLoading) {
      console.log("AuthContext (Con localStorage) (Route Guard): Aún cargando, no se toman acciones.");
      return; 
    }
    
    const protectedRoutes = ['/my-ideas']; // '/generate-idea' es pública
    const isProtectedRoute = protectedRoutes.includes(pathname);
    
    if (isProtectedRoute && !user) {
      console.log(`AuthContext (Con localStorage) (Route Guard): En ruta protegida (${pathname}) sin usuario. Redirigiendo.`);
      router.push(`/login?redirect=${pathname}`); 
    }
  }, [user, isLoading, pathname, router]);

  const isAuthenticated = !!user;
  
  // AuthProvider SIEMPRE renderiza children.
  // Los componentes hijos (como Navbar o las páginas) deben usar 'isLoading'
  // del contexto para decidir si muestran un loader o el contenido real.
  console.log("AuthContext (Con localStorage): Renderizando children. isLoading:", isLoading, "isAuthenticated:", isAuthenticated, "User:", !!user);
  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
};