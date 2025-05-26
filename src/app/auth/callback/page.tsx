// src/app/auth/callback/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Asumiendo que tu contexto maneja onAuthStateChange

export default function AuthCallbackPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, session } = useAuth(); // Obtén el estado de autenticación del contexto

  useEffect(() => {
    // El listener onAuthStateChange en AuthContext debería manejar la sesión
    // y el estado isAuthenticated. Aquí solo esperamos a que se resuelva.
    
    // Si después de un tiempo isLoading sigue true y no hay sesión, podría haber un problema.
    // Si isAuthenticated se vuelve true, AuthContext debería redirigir o 
    // el componente que renderiza esta página condicionalmente debería cambiar.

    // Redirección básica: si después de que el estado de carga del contexto se resuelva
    // el usuario está autenticado, llévalo a 'my-ideas'.
    // Si no, llévalo a 'login'.
    // Tu AuthContext podría tener una lógica de redirección más sofisticada.

    if (!isLoading) { // Solo actuar cuando el estado de carga del contexto se haya resuelto
      if (isAuthenticated && session) {
        // Puedes verificar si hay un redirectPath en localStorage o sessionStorage
        // que se haya guardado antes de iniciar el flujo OAuth.
        const intendedRedirect = localStorage.getItem('supabase_intended_redirect');
        localStorage.removeItem('supabase_intended_redirect'); // Limpiar después de usar
        
        const action = localStorage.getItem('supabase_intended_action');
        localStorage.removeItem('supabase_intended_action');

        if (intendedRedirect) {
            if (action === 'acquireFullReport') {
                router.replace(`${intendedRedirect}?action=acquireFullReport`);
            } else {
                router.replace(intendedRedirect);
            }
        } else {
            router.replace('/my-ideas');
        }
        
      } else {
        // Si no está autenticado después del callback, podría ser un error o el usuario canceló.
        // Enviar a login como fallback.
        console.warn("Auth callback: No se pudo autenticar al usuario, redirigiendo a login.");
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <p className="text-xl">Procesando autenticación...</p>
      {/* Puedes añadir un spinner aquí */}
    </div>
  );
}