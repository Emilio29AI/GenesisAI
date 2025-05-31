// src/app/auth/callback/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams as useNextSearchParams } from 'next/navigation'; // Importar useNextSearchParams
import { useAuth } from '@/context/AuthContext'; 

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useNextSearchParams(); // Usar para leer query params en Client Components
  const { isLoading, isAuthenticated, session, supabase } = useAuth(); // Añadir supabase de useAuth

  console.log("[AuthCallback - page.tsx] Renderizando. isLoading:", isLoading, "isAuthenticated:", isAuthenticated);

  useEffect(() => {
    console.log("[AuthCallback - page.tsx] useEffect [isLoading, session] disparado. isLoading:", isLoading, "isAuthenticated:", isAuthenticated, "Session:", session ? "Presente" : "Ausente");

    // Paso 1: Intercambiar el código por una sesión si aún no se ha hecho
    // Esto usualmente lo maneja el onAuthStateChange de Supabase automáticamente
    // cuando la URL tiene el code y otros params de OAuth, pero podemos ser explícitos
    // o simplemente esperar a que AuthContext lo resuelva.
    // Por ahora, confiamos en que AuthContext (via onAuthStateChange) establece la sesión.

    if (!isLoading) { 
      console.log("[AuthCallback - page.tsx] AuthContext ya no está cargando.");
      if (isAuthenticated && session) {
        console.log("[AuthCallback - page.tsx] Usuario AUTENTICADO. Procediendo con la redirección.");

        // Leer los parámetros 'next' y 'original_action' que DEBERÍAN haber llegado aquí
        // desde la redirección de Google (si los configuramos en login/page.tsx)
        const nextPath = searchParams.get('next');
        const originalAction = searchParams.get('original_action');
        console.log(`[AuthCallback - page.tsx] Query params leídos: nextPath='${nextPath}', originalAction='${originalAction}'`);

        let finalRedirectTarget = nextPath || '/my-ideas'; // Fallback si 'next' no está
        const finalRedirectParams = new URLSearchParams();
        finalRedirectParams.append('afterLogin', 'true');

        if (originalAction) {
          finalRedirectParams.append('action', originalAction);
        }
        
        const finalRedirectUrl = new URL(finalRedirectTarget, window.location.origin);
        finalRedirectUrl.search = finalRedirectParams.toString();

        console.log("[AuthCallback - page.tsx] Redirigiendo a:", finalRedirectUrl.toString());
        router.replace(finalRedirectUrl.toString());
        
      } else {
        console.warn("[AuthCallback - page.tsx] No autenticado después de la carga del contexto, o no hay sesión. Redirigiendo a login con error.");
        router.replace('/login?error=auth_callback_failed_or_no_session');
      }
    } else {
        console.log("[AuthCallback - page.tsx] AuthContext todavía está cargando (isLoading es true). Esperando...");
    }
  //}, [isLoading, isAuthenticated, session, router, searchParams]); // Añadir searchParams a las dependencias
  // Para evitar bucles, y dado que searchParams no debería cambiar mientras esta página está activa,
  // podemos intentar ejecutar esto una vez que isLoading es false.
  // Sin embargo, si isAuthenticated o session cambian DESPUÉS de que isLoading es false, queremos reaccionar.
  // Una dependencia más segura podría ser solo [isLoading, isAuthenticated, session, router, searchParams]
  // y asegurar que la lógica interna sea idempotente o maneje bien los re-disparos.
  // Vamos a probar con un array de dependencias más simple para ver si AuthContext actualiza el estado
  // y este efecto reacciona una vez.
  }, [isLoading, isAuthenticated, session, router, searchParams]);
  // Si esto causa bucles, podríamos necesitar un ref para 'hasRedirected'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <p className="text-xl mb-4">Procesando autenticación...</p>
      <p className="text-sm text-gray-400">Serás redirigido en breve.</p>
      {/* Puedes añadir un spinner aquí */}
      {/* DEBUG INFO:
      <div className="mt-4 text-xs text-gray-500">
        <p>isLoading: {String(isLoading)}</p>
        <p>isAuthenticated: {String(isAuthenticated)}</p>
        <p>Session: {session ? 'Presente' : 'Ausente'}</p>
        <p>URL Query Params: {searchParams.toString()}</p>
      </div>
      */}
    </div>
  );
}
