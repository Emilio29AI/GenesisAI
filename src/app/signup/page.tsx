// src/app/signup/page.tsx
"use client";

import React, { useState, FormEvent, Suspense } from 'react'; // Añadido React y Suspense
import Link from 'next/link';
import { useRouter, useSearchParams as useNextSearchParams } from 'next/navigation'; 
import { toast } from 'react-toastify'; // Para notificaciones

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function SignupPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // const [error, setError] = useState<string | null>(null); // Reemplazado por toast
  // const [successMessage, setSuccessMessage] = useState<string | null>(null); // Reemplazado por toast
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useNextSearchParams();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) { // Ejemplo de validación simple de longitud
        toast.error('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    setIsLoading(true);
    // setError(null); 
    // setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        // Intentar obtener un mensaje más específico del backend
        let errorMessage = 'Error al registrar usuario.';
        if (data && data.detail) {
            if (Array.isArray(data.detail) && data.detail.length > 0 && data.detail[0].msg) {
                // Error de validación de Pydantic
                errorMessage = data.detail.map((d: any) => `${d.loc.join('.')} - ${d.msg}`).join('; ');
            } else if (typeof data.detail === 'string') {
                errorMessage = data.detail;
            }
        }
        throw new Error(errorMessage);
      }
      
      toast.success('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta. Serás redirigido a inicio de sesión.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Redirigir a login, manteniendo el parámetro 'redirect' si existe,
      // para que después del login el usuario vaya a donde originalmente quería.
      const redirectParam = searchParams.get('redirect');
      const loginPath = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login';
      
      setTimeout(() => {
        router.push(loginPath);
      }, 3000); // Aumentado el tiempo para que el usuario lea el toast

    } catch (err: any) {
      // setError(err.message || 'Error desconocido al intentar registrar.');
      toast.error(err.message || 'Error desconocido al intentar registrar.');
      console.error("Signup error:", err);
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
            <h1 className="text-3xl font-bold text-center mb-8 text-purple-300">Crear Nueva Cuenta</h1>
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
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                />
            </div>
            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-1.5">Confirmar Contraseña</label>
                <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-gray-700/70 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 transition-colors focus:bg-gray-700"
                placeholder="Repite tu contraseña"
                required
                minLength={6}
                />
            </div>
            {/* Mensajes de error/éxito ahora se manejan con toast */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
            </form>
        </div>
        <p className="mt-8 text-center text-sm text-gray-400">
          ¿Ya tienes una cuenta?{' '}
          <Link
            href={searchParams.get('redirect') ? `/login?redirect=${searchParams.get('redirect')}` : "/login"}
            className="font-medium text-purple-400 hover:text-purple-300 hover:underline"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><p>Cargando página de registro...</p></div>}>
      <SignupPageContent />
    </Suspense>
  );
}