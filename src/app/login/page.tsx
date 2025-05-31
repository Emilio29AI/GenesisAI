// src/app/login/page.tsx
"use client";

import React, { useState, FormEvent, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext'; 
import { useRouter, useSearchParams as useNextSearchParams } from 'next/navigation';
import { toast } from 'react-toastify'; 
import { FaGoogle } from 'react-icons/fa';
import { User as SupabaseUser } from '@supabase/supabase-js'; // Importar User de supabase-js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface EmailLoginApiResponse {
    access_token: string;
    refresh_token: string;
    user: SupabaseUser;
    token_type: string;
    expires_in?: number;
}

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { loginWithEmail, isAuthenticated, supabase } = useAuth(); 
  const router = useRouter();
  const nextSearchParams = useNextSearchParams(); 

  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = nextSearchParams.get('redirect') || '/generate-idea';
      router.replace(redirectPath);
    }
  }, [isAuthenticated, router, nextSearchParams]);

  if (isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><p>Redirigiendo...</p></div>;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), // Asegúrate que tu backend espera email/pass en JSON
                                                  // o ajusta a application/x-www-form-urlencoded si es necesario
      });
      
      const data: EmailLoginApiResponse = await response.json(); // Castear al tipo esperado

      // Log para depuración
      console.log("LOGIN PAGE - API Response data:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        const errorDetail = (data as any).detail || 'Error al iniciar sesión. Verifica tus credenciales.';
        throw new Error(errorDetail);
      }

      if (data.access_token && data.refresh_token && data.user) {
        const redirectPath = nextSearchParams.get('redirect');
        const action = nextSearchParams.get('action'); 
        
        console.log("LOGIN PAGE - Calling loginWithEmail with data object:", JSON.stringify(data, null, 2));
        // MODIFICADO: Pasar el objeto 'data' completo a loginWithEmail
        await loginWithEmail(data, redirectPath, action); 
        
        toast.success('¡Inicio de sesión exitoso!');
      } else {
        console.error("LOGIN PAGE - API Response missing required session fields (access_token, refresh_token, or user):", data);
        throw new Error('Respuesta de login incompleta del servidor (se esperaba sesión completa de Supabase).');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error desconocido al intentar iniciar sesión.');
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      toast.error('Error de configuración: cliente Supabase no disponible.');
      console.error("Supabase client is not available in AuthContext for Google login.");
      return;
    }
    setIsGoogleLoading(true);
    try {
      // 1. Obtener los parámetros originales de la URL de /login
      //    (ej. si la URL actual es /login?redirect=/generate-idea&action=pendingGeneration)
      const originalRedirectPath = nextSearchParams.get('redirect'); 
      const originalAction = nextSearchParams.get('action');       

      console.log(`[Login Page] Google Login - originalRedirectPath: ${originalRedirectPath}, originalAction: ${originalAction}`);

      // 2. Construir la URL para el callback de Supabase, incluyendo los parámetros originales
      //    La base es tu URL de callback de Supabase Auth.
      let supabaseCallbackRedirectTo = `${window.location.origin}/auth/callback`; 
      
      const callbackExtraParams = new URLSearchParams();
      // Solo añadir 'next' si originalRedirectPath tiene un valor.
      // Si no, /auth/callback usará su propio fallback (ej. /my-ideas o /).
      if (originalRedirectPath) { 
        callbackExtraParams.append('next', originalRedirectPath); 
      }
      if (originalAction) {
        callbackExtraParams.append('original_action', originalAction);
      }

      if (callbackExtraParams.size > 0) {
        supabaseCallbackRedirectTo += `?${callbackExtraParams.toString()}`;
      }
      
      console.log("[Login Page] Google Login - redirectTo para Supabase OAuth será:", supabaseCallbackRedirectTo);

      // 3. Iniciar el flujo OAuth con la redirectTo modificada
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: supabaseCallbackRedirectTo, 
        },
      });

      if (error) {
        throw error; 
      }
      // Si no hay error, el navegador ya está redirigiendo a Google.
      // setIsLoading(false) no se alcanzará aquí si la redirección es exitosa.
    } catch (err: any) {
      toast.error(err.message || 'Error al intentar iniciar sesión con Google.');
      console.error("Google login error:", err);
      setIsGoogleLoading(false); 
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900/20 text-white flex flex-col justify-center items-center p-4">
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat -z-10 opacity-10 animate-pulse-opacity-slow"
        style={{ backgroundImage: "url('/background-login.png')" }}
      ></div>
      <div className="fixed inset-0 w-full h-full bg-black/70 -z-10"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
            <Link href="/" className="text-purple-400 hover:text-purple-300 inline-block transition-colors text-sm">
                ← Volver a la página principal
            </Link>
        </div>
        <div className="bg-gray-800/80 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-gray-700/60">
            <h1 className="text-3xl font-bold text-center mb-8 text-purple-300">Iniciar Sesión</h1>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full mb-6 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md flex items-center justify-center transform transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FaGoogle className="mr-3 text-xl" />
              {isGoogleLoading ? 'Conectando con Google...' : 'Continuar con Google'}
            </button>

            <div className="flex items-center my-6">
              <hr className="flex-grow border-gray-600" />
              <span className="mx-4 text-gray-400 text-sm">O</span>
              <hr className="flex-grow border-gray-600" />
            </div>

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
            <button 
                type="submit" 
                disabled={isLoading || isGoogleLoading} 
                className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
            </form>
        </div>
        <p className="mt-8 text-center text-sm text-gray-400">
          ¿No tienes una cuenta?{' '}
          <Link 
            href={nextSearchParams.get('redirect') ? `/signup?redirect=${nextSearchParams.get('redirect')}` : "/signup"}
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
