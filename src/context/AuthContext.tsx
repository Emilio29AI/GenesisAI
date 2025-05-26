// src/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient, Session, User as SupabaseUser } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient, AuthChangeEvent } from '@supabase/supabase-js';
// toast ya no se usa directamente aquí si los errores se manejan en los componentes que llaman
// import { toast } from 'react-toastify'; 

export interface UserGenerationLimits {
  daily_remaining: number;
  daily_limit: number;
  monthly_remaining: number;
  monthly_limit: number;
  can_generate_today: boolean;
  can_generate_this_month: boolean;
}
export interface AuthUser { id: string; email: string | undefined; }
interface EmailLoginApiResponse { access_token: string; refresh_token: string; user: SupabaseUser; token_type: string; expires_in?: number; }

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  supabase: SupabaseClient;
  isLoading: boolean;
  isAuthenticated: boolean;
  userLimits: UserGenerationLimits | null;
  isLoadingLimits: boolean;
  fetchUserLimits: () => Promise<void>; // Firma sin argumentos
  loginWithEmail: (apiResponse: EmailLoginApiResponse, redirectPath?: string | null, action?: string | null) => Promise<void>;
  logout: (options?: { redirect?: boolean }) => Promise<void>;
  triggerAuthCheck: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null); // Estado para la sesión actual
  const [isLoading, setIsLoading] = useState(true);
  const [userLimits, setUserLimits] = useState<UserGenerationLimits | null>(null);
  const [isLoadingLimits, setIsLoadingLimits] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const supabaseFrontendClient = createClientComponentClient();

  const mapSupabaseUserToAuthUser = (supabaseUser: SupabaseUser | null): AuthUser | null => {
    if (!supabaseUser) return null;
    return { id: supabaseUser.id, email: supabaseUser.email };
  };

  // Renombrar a _fetchUserLimitsInternal para indicar que es una implementación interna
  const _fetchUserLimitsInternal = useCallback(async (currentSessionForFetch: Session | null) => {
    if (currentSessionForFetch?.access_token) {
      setIsLoadingLimits(true);
      setUserLimits(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/me/generation-status`, {
          headers: { 'Authorization': `Bearer ${currentSessionForFetch.access_token}` },
        });
        if (response.ok) {
          const limitsData: UserGenerationLimits = await response.json();
          setUserLimits(limitsData);
        } else {
          // Los errores de fetch se manejan mejor donde se consume el contexto o se loguean aquí si es un error inesperado
          console.error("AuthContext: Error fetching user limits:", response.status, await response.text().catch(()=>"Failed to get error text"));
          setUserLimits(null);
        }
      } catch (error) {
        console.error("AuthContext: Network error fetching user limits:", error);
        setUserLimits(null);
      } finally {
        setIsLoadingLimits(false);
      }
    } else {
      setUserLimits(null);
    }
  }, [API_BASE_URL]); // API_BASE_URL es estable

  useEffect(() => {
    setIsLoading(true);

    const { data: authListenerData } = supabaseFrontendClient.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession); // Actualizar el estado 'session'
        setUser(mapSupabaseUserToAuthUser(newSession?.user ?? null));
        
        // Ya no se necesita setIsLoading(false) aquí si initializeAuth lo hace
        // setIsLoading(false); 

        if (newSession?.access_token) {
            localStorage.setItem('supabaseAccessToken', newSession.access_token); // Opcional, si usas esto en otro lado
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                 _fetchUserLimitsInternal(newSession); // Usar la sesión del evento
            }
        } else {
            localStorage.removeItem('supabaseAccessToken'); // Opcional
            setUserLimits(null);
        }
        
        if (event === 'SIGNED_OUT') {
            // Limpieza de estados relacionados con el usuario y datos
            setUser(null); 
            // setSession(null); // ya lo hace onAuthStateChange
            setUserLimits(null);
            localStorage.removeItem('supabaseAccessToken'); // Opcional
            
            // Limpieza de sessionStorage de ideas temporales
            // (idealmente esto se haría en un lugar más centralizado o como parte de la lógica de logout)
            // Por ahora, lo dejamos aquí para consistencia con tu lógica previa si la tenías así
            // pero considera si esto es lo mejor.
            // sessionStorage.removeItem('tempGeneratedIdeas_v3'); 
            // sessionStorage.removeItem('lastUsedFormDataForGeneration_v3');
            // sessionStorage.removeItem('pendingFormDataForAction_v3');
            // sessionStorage.removeItem('pendingSaveIdeaName');
            // sessionStorage.removeItem('pendingUnlockIdeaName');
            
            // Redirección
            // La redirección general por ruta protegida en el Route Guard debería manejar esto
            // pero una redirección explícita aquí para SIGNED_OUT es común.
            if (pathname !== '/login' && pathname !== '/signup' && !pathname.startsWith('/auth/callback')) {
                router.push('/login');
            }
        }
      }
    );

    const initializeAuth = async () => {
        const { data: { session: initialSession } } = await supabaseFrontendClient.auth.getSession();
        setSession(initialSession); // Actualizar el estado 'session'
        setUser(mapSupabaseUserToAuthUser(initialSession?.user ?? null));
        if (initialSession?.access_token) {
            localStorage.setItem('supabaseAccessToken', initialSession.access_token); // Opcional
            await _fetchUserLimitsInternal(initialSession);
        } else {
            localStorage.removeItem('supabaseAccessToken'); // Opcional
            setUserLimits(null);
        }
        setIsLoading(false); // La carga inicial de auth termina aquí
    };
    initializeAuth();

    return () => {
      authListenerData?.subscription?.unsubscribe();
    };
  }, [supabaseFrontendClient, _fetchUserLimitsInternal, router, pathname]);


  const loginWithEmail = useCallback(
    async (apiResponse: EmailLoginApiResponse, redirectPath?: string | null, action?: string | null) => {
      if (!apiResponse.access_token || !apiResponse.refresh_token || !apiResponse.user) {
        // En lugar de toast, podríamos propagar el error o dejar que el componente que llama maneje el toast
        console.error("AuthContext: Respuesta de autenticación inválida.");
        throw new Error("Respuesta de autenticación inválida."); // Propagar error
      }
      const { error } = await supabaseFrontendClient.auth.setSession({
        access_token: apiResponse.access_token,
        refresh_token: apiResponse.refresh_token
      });
      if (error) {
        console.error("AuthContext: Error al procesar la sesión:", error.message);
        throw new Error("Error al procesar la sesión: " + error.message); // Propagar error
      }
      // onAuthStateChange y el _fetchUserLimitsInternal se encargarán de actualizar estados y límites.

      let finalRedirectUrl = redirectPath || '/my-ideas';
      if (redirectPath && action) {
        try {
          const url = new URL(redirectPath, window.location.origin);
          url.searchParams.set('afterLogin', 'true');
          url.searchParams.set('action', action);
          finalRedirectUrl = `${url.pathname}${url.search}`;
        } catch(e) {
          console.error("AuthContext: Login - Error construyendo URL de redirección:", e);
          // Seguir con el redirectPath o /my-ideas si la construcción de URL falla
        }
      }
      router.push(finalRedirectUrl);
    }, [supabaseFrontendClient, router]
  );

  const logout = useCallback(async (options?: { redirect?: boolean }) => {
    // No es necesario setIsLoading(true) aquí si la UI se actualiza por el cambio de `isAuthenticated`
    await supabaseFrontendClient.auth.signOut();
    // `onAuthStateChange` se encargará de:
    // - Poner `session` y `user` a `null`.
    // - Poner `userLimits` a `null`.
    // - Redirigir (si se configura allí o por el Route Guard).
    // Limpieza adicional de localStorage si es necesario:
    localStorage.removeItem('supabaseAccessToken'); // Si lo usas consistentemente

    // Limpiar sessionStorage de forma más explícita aquí es una opción
    // para asegurar que no queden datos de sesión de la app al hacer logout.
    // Esto puede ayudar con el "micro-fallo".
    sessionStorage.clear(); 

    if(options?.redirect !== false && pathname !== '/login' && pathname !== '/signup') {
        // Aunque el Route Guard debería actuar, una redirección explícita aquí es más directa.
        router.push('/login');
    }
    // setIsLoading(false); // No necesario si la UI reacciona a isAuthenticated
  }, [supabaseFrontendClient, router, pathname]);

  const triggerAuthCheck = useCallback(async () => {
    setIsLoading(true); // Indicar que estamos recargando/verificando
    const { data: { session: currentSession } } = await supabaseFrontendClient.auth.getSession();
    setSession(currentSession);
    setUser(mapSupabaseUserToAuthUser(currentSession?.user ?? null));
    if (currentSession?.access_token) {
      localStorage.setItem('supabaseAccessToken', currentSession.access_token); // Opcional
      await _fetchUserLimitsInternal(currentSession);
    } else {
      localStorage.removeItem('supabaseAccessToken'); // Opcional
      setUserLimits(null);
    }
    setIsLoading(false);
  }, [supabaseFrontendClient, _fetchUserLimitsInternal]);

  const isAuthenticated = !isLoading && !!session && !!session.user;

  // Route Guard (mantenido como estaba, ya que funcionaba para la protección)
  useEffect(() => {
    if (isLoading) return;
    const publicPaths = ['/login', '/signup', '/', '/auth/callback', '/faq', '/generate-idea'];
    const isCurrentPathPublic = publicPaths.some(p => pathname === p || (p === '/' && pathname === '/'));
    
    if (!isAuthenticated && !isCurrentPathPublic) {
      const redirectUrl = new URL('/login', window.location.origin);
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      router.push(redirectUrl.toString());
    }
  }, [isAuthenticated, isLoading, pathname, router]);
  
  // Función wrapper para fetchUserLimits que usa la sesión actual del estado
  const exposedFetchUserLimits = useCallback(async () => {
    // Aquí 'session' es el estado actual del AuthProvider
    await _fetchUserLimitsInternal(session); 
  }, [_fetchUserLimitsInternal, session]); // Depende de la 'session' del estado y de la función interna

  return (
    <AuthContext.Provider
      value={{
        user,
        session, // Exponer la sesión actual
        supabase: supabaseFrontendClient,
        isLoading,
        isAuthenticated,
        userLimits,
        isLoadingLimits,
        fetchUserLimits: exposedFetchUserLimits, // *** CORREGIDO AQUÍ ***
        loginWithEmail,
        logout,
        triggerAuthCheck
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
};