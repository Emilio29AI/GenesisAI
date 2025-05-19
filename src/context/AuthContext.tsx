// src/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // No necesitamos useSearchParams aquí si los pasamos como args

interface AuthUser {
  id: string;
  email: string | undefined;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean; 
  isAuthenticated: boolean;
  // MODIFICADO: Añadimos redirectPath y action como parámetros opcionales
  login: (accessToken: string, userData: any, redirectPath?: string | null, action?: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  
  const router = useRouter();
  const pathname = usePathname();
  // const searchParams = useSearchParams(); // Ya no es necesario leerlo aquí para el login

  useEffect(() => {
    console.log("AuthContext: useEffect[] - Cargando desde localStorage...");
    try {
      const storedToken = localStorage.getItem('accessToken');
      const storedUserString = localStorage.getItem('authUser');
      if (storedToken && storedUserString) {
        const parsedUser = JSON.parse(storedUserString);
        setUser(parsedUser);
        setToken(storedToken);
        console.log("AuthContext: useEffect[] - Usuario cargado:", parsedUser);
      } else {
        console.log("AuthContext: useEffect[] - No hay datos en localStorage.");
        setUser(null);
        setToken(null);
      }
    } catch (e) {
      console.error("AuthContext: useEffect[] - Error parseando localStorage", e);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');
      setUser(null);
      setToken(null);
    }
    setIsLoading(false); 
    console.log("AuthContext: useEffect[] - Carga inicial terminada, isLoading: false");
  }, []); 


  // MODIFICADO: La función login ahora acepta redirectPath y action
  const login = useCallback(
    (accessToken: string, userDataSupabase: any, redirectPath?: string | null, action?: string | null) => {
      const appUser: AuthUser = { id: userDataSupabase.id, email: userDataSupabase.email };
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('authUser', JSON.stringify(appUser));
      setToken(accessToken);
      setUser(appUser);

      console.log("AuthContext: Login - redirectPath recibido:", redirectPath, "action recibido:", action);

      let finalRedirectUrl = redirectPath || '/generate-idea'; // Ruta por defecto si no hay redirectPath

      if (redirectPath) {
        // Si tenemos un redirectPath, lo usamos.
        // Si además tenemos una acción, construimos los parámetros para la URL de redirección.
        if (action) {
          try {
            // Usamos el redirectPath como base. Si es relativo, se resolverá correctamente.
            const url = new URL(redirectPath, window.location.origin); 
            url.searchParams.set('afterLogin', 'true');
            url.searchParams.set('action', action);
            
            // Aquí podrías añadir más lógica si la acción necesita parámetros adicionales
            // que se hayan pasado a esta función 'login' (ej. ideaId, ideaName).
            // Por ahora, solo usamos 'action'.
            
            finalRedirectUrl = `${url.pathname}${url.search}`;
            console.log("AuthContext: Login - URL de redirección construida con acción:", finalRedirectUrl);
          } catch(e) {
            console.error("AuthContext: Login - Error construyendo URL de redirección con acción:", e, "Usando redirectPath simple:", redirectPath);
            finalRedirectUrl = redirectPath; // Fallback al redirectPath simple
          }
        } else {
          // Si hay redirectPath pero no action, usamos el redirectPath tal cual.
          finalRedirectUrl = redirectPath;
        }
      }
      
      console.log("AuthContext: Login - Usuario logueado, redirigiendo a:", finalRedirectUrl);
      router.push(finalRedirectUrl); 
    }, 
    [router] // Solo router como dependencia, ya que los otros son argumentos
  ); 


  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    console.log("AuthContext: Logout - Usuario deslogueado, redirigiendo a /login");
    // Al hacer logout, es bueno limpiar cualquier estado de redirección pendiente.
    // Podríamos forzar una redirección simple a /login sin query params.
    router.push('/login'); 
  }, [router]);

  useEffect(() => {
    // console.log("AuthContext (Route Guard): isLoading:", isLoading, "User:", !!user, "Path:", pathname);
    if (isLoading) {
      // console.log("AuthContext (Route Guard): Aún cargando, no se toman acciones.");
      return; 
    }
    
    const protectedRoutes = ['/my-ideas', '/idea']; // Añadido /idea como genérico para informes
    // Comprobar si el pathname COMIENZA con alguna de las rutas protegidas
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    
    if (isProtectedRoute && !user) {
      console.log(`AuthContext (Route Guard): En ruta protegida (${pathname}) sin usuario. Redirigiendo a login.`);
      // Cuando redirigimos a login desde una ruta protegida, pasamos el pathname actual como redirect.
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`); 
    }
  }, [user, isLoading, pathname, router]);

  const isAuthenticated = !!user && !!token; // Podrías considerar el token también para isAuthenticated
  
  // console.log("AuthContext: Renderizando children. isLoading:", isLoading, "isAuthenticated:", isAuthenticated, "User:", !!user);
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