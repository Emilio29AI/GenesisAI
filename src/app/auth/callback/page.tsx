// src/app/auth/callback/page.tsx
"use client";

import { useEffect, useState } from 'react'; // Añadir useState
import { useRouter } from 'next/navigation'; // No necesitas useNextSearchParams aquí si toda la lógica está en useEffect
import { useAuth } from '@/context/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, session } = useAuth();
  
  // Estado local para controlar si ya se intentó la redirección
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  console.log("[AuthCallback - page.tsx] Renderizando. isLoading:", isLoading, "isAuthenticated:", isAuthenticated);

  useEffect(() => {
    console.log("[AuthCallback - page.tsx] useEffect disparado. isLoading:", isLoading, "isAuthenticated:", isAuthenticated, "Session:", session ? "Presente" : "Ausente");

    // Solo ejecutar la lógica de redirección una vez y cuando el contexto de autenticación esté listo
    if (!isLoading && !redirectAttempted) { 
      setRedirectAttempted(true); // Marcar que ya intentamos redirigir para evitar bucles
      console.log("[AuthCallback - page.tsx] AuthContext ya no está cargando y no se ha intentado redirigir.");

      if (isAuthenticated && session) {
        console.log("[AuthCallback - page.tsx] Usuario AUTENTICADO. Procediendo con la redirección.");

        const intendedRedirectPath = sessionStorage.getItem('oauth_intended_redirect_path');
        const intendedAction = sessionStorage.getItem('oauth_intended_action');
        
        if (intendedRedirectPath) sessionStorage.removeItem('oauth_intended_redirect_path');
        if (intendedAction) sessionStorage.removeItem('oauth_intended_action');

        console.log(`[AuthCallback - page.tsx] Valores de sessionStorage: intendedRedirectPath='${intendedRedirectPath}', intendedAction='${intendedAction}'`);

        let finalRedirectTarget = intendedRedirectPath || '/generate-idea'; // Fallback
        
        // Construir URL con window.location.origin ASEGURÁNDOSE que window existe
        if (typeof window !== "undefined") {
            const finalRedirectParams = new URLSearchParams();
            finalRedirectParams.append('afterLogin', 'true');

            if (intendedAction) {
              finalRedirectParams.append('action', intendedAction);
            }
            
            const finalRedirectUrl = new URL(finalRedirectTarget, window.location.origin);
            finalRedirectUrl.search = finalRedirectParams.toString();

            console.log("[AuthCallback - page.tsx] Redirigiendo a:", finalRedirectUrl.toString());
            router.replace(finalRedirectUrl.toString());
        } else {
            console.error("[AuthCallback - page.tsx] 'window' no está definido. No se puede construir URL de redirección completa. Esto no debería pasar en un Client Component montado.");
            // Fallback muy genérico si window no está (altamente improbable en este punto del useEffect)
            router.replace('/my-ideas?afterLogin=true&error=window_undefined');
        }
        
      } else {
        console.warn("[AuthCallback - page.tsx] No autenticado después de la carga del contexto. Redirigiendo a login con error.");
        // Asegurarse de que window existe antes de usar window.location.origin
        const loginErrorUrl = typeof window !== "undefined" 
            ? new URL('/login', window.location.origin) 
            : new URL('/login', 'http://localhost:3000'); // Un fallback absoluto si window no está
        
        loginErrorUrl.searchParams.set('error', 'auth_callback_failure');
        router.replace(loginErrorUrl.toString());
      }
    } else if (isLoading) {
        console.log("[AuthCallback - page.tsx] AuthContext todavía está cargando. Esperando...");
    } else if (redirectAttempted) {
        console.log("[AuthCallback - page.tsx] Redirección ya intentada en una ejecución anterior de este efecto.");
    }
  }, [isLoading, isAuthenticated, session, router, redirectAttempted]); // Añadido redirectAttempted

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <p className="text-xl mb-4">Procesando autenticación...</p>
      <p className="text-sm text-gray-400">Serás redirigido en breve.</p>
      {/* 
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 text-xs text-gray-500 border p-2">
          <p>DEBUG INFO:</p>
          <p>isLoading: {String(isLoading)}</p>
          <p>isAuthenticated: {String(isAuthenticated)}</p>
          <p>Session: {session ? 'Presente' : 'Ausente'}</p>
          <p>Redirect Attempted: {String(redirectAttempted)}</p>
        </div>
      )}
      */}
    </div>
  );
}
