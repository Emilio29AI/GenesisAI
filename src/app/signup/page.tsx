// src/app/signup/page.tsx
"use client";

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Para redirigir a login después del signup

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    setIsLoading(true); setError(null); setSuccessMessage(null);
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Error al registrar usuario');
      setSuccessMessage('¡Registro exitoso! Redirigiendo a inicio de sesión...');
      setEmail(''); setPassword(''); setConfirmPassword('');
      setTimeout(() => router.push('/login'), 2000); // Redirigir después de 2 seg
    } catch (err: any) {
      setError(err.message || 'Error desconocido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="text-purple-400 hover:text-purple-300 mb-8 block text-center">← Volver</Link>
        <h1 className="text-3xl font-bold text-center mb-8 text-purple-400">Crear Cuenta</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-8 rounded-lg shadow-xl">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input type="email" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400" placeholder="tu@email.com" required />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
            <input type="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400" placeholder="Mínimo 6 caracteres" required />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">Confirmar Contraseña</label>
            <input type="password" name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400" placeholder="" required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md shadow-md disabled:opacity-50">
            {isLoading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
          {error && <p className="text-center text-red-400 text-sm">{error}</p>}
          {successMessage && <p className="text-center text-green-400 text-sm">{successMessage}</p>}
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
          ¿Ya tienes cuenta? <Link href="/login" className="font-medium text-purple-400 hover:text-purple-300">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}