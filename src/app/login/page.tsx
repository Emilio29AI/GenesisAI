// src/app/login/page.tsx
"use client";

import React, { useState, FormEvent, Suspense } from 'react'; // Añadido React y Suspense
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; 
import { useRouter, useSearchParams as useNextSearchParams } from 'next/navigation'; // Para redirección
import { toast } from 'react-toastify'; // Para notificaciones más amigables

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [error, setError] = useState<string | null>(null); // Reemplazado por toast
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useNextSearchParams(); // Hook para leer query params

  // Si ya está autenticado, redirigir (ej. a 'my-ideas' o a la home)
  // Esto se podría hacer en un useEffect, pero también en el AuthContext
  if (isAuthenticated) {
    const redirectPath = searchParams.get('redirect') || '/my-ideas'; // O '/' para la home
    router.replace(redirectPath);
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><p>Redirigiendo...</p></div>; // Placeholder mientras redirige
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    // setError(null); // Ya no se usa

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al iniciar sesión. Verifica tus credenciales.');
      }

      if (data.access_token && data.user) {
        const redirectPath = searchParams.get('redirect');
        const action = searchParams.get('action'); // Para manejar acciones post-login
        
        // Pasar redirectPath y action al método login del context
        // El context se encargará de la navegación
        login(data.access_token, data.user, redirectPath, action);
        toast.success('¡Inicio de sesión exitoso!');
        // La redirección se manejará en el AuthContext o en un useEffect observando isAuthenticated
        // Por ejemplo, si el AuthContext actualiza el estado y luego redirige
        // O podrías hacerlo aquí directamente después de que 'login' complete su trabajo (si no navega internamente)
        // router.push(redirectPath || '/my-ideas'); // Ejemplo de redirección directa

      } else {
        throw new Error('Respuesta de login incompleta del servidor.');
      }
    } catch (err: any) {
      // setError(err.message || 'Error desconocido al intentar iniciar sesión.');
      toast.error(err.message || 'Error desconocido al intentar iniciar sesión.');
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <Link href="/" className="text-purple-400 hover:text-purple-300 inline-block transition-colors">
                ← Volver a la página principal
            </Link>
        </div>
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700/60">
            <h1 className="text-3xl font-bold text-center mb-8 text-purple-300">Iniciar Sesión</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1.5">Correo Electrónico</label>
                <input 
                type="email" 
                name="email" 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-3 bg-gray-700/70 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 transition-colors focus:bg-gray-700" 
                placeholder="tu@email.com" 
                required 
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1.5">Contraseña</label>
                <input 
                type="password" 
                name="password" 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-3 bg-gray-700/70 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 transition-colors focus:bg-gray-700" 
                placeholder="••••••••" 
                required 
                />
            </div>
            {/* Quitado el <p> de error, se usará toast */}
            <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
            </form>
        </div>
        <p className="mt-8 text-center text-sm text-gray-400">
          ¿No tienes una cuenta?{' '}
          <Link 
            href={searchParams.get('redirect') ? `/signup?redirect=${searchParams.get('redirect')}` : "/signup"}
            className="font-medium text-purple-400 hover:text-purple-300 hover:underline"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><p>Cargando página de inicio de sesión...</p></div>}>
      <LoginPageContent />
    </Suspense>
  );
}