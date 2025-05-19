// src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, isLoading: authIsLoading, logout } = useAuth(); 
  
  // El console.log es útil para depuración, puedes mantenerlo o quitarlo para producción
  // console.log("Navbar (Con Lógica Auth): Renderizando. isAuthenticated:", isAuthenticated, "authIsLoading:", authIsLoading, "User:", user);

  return (
    <nav 
      className="text-white p-4 
                 sticky top-0 z-50 
                 bg-gray-800/75  // Fondo gris 800 con 80% de opacidad
                 backdrop-blur-sm // Efecto de desenfoque en lo que está detrás
                 shadow-2xl"       // Sombra para darle profundidad
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-purple-400 hover:text-purple-300 transition-colors">
          GENESIS<span className="text-2xl font-extrabold text-purple-500 hover:text-purple-400 transition-colors">AI</span>
        </Link>
        <div className="space-x-2 sm:space-x-4 flex items-center">
          <Link href="/generate-idea" className="text-sm sm:text-base hover:text-purple-300 transition-colors">
          Generar Ideas
          </Link>
          
          {authIsLoading ? (
            <span className="text-sm text-gray-400">Verificando...</span>
          ) : isAuthenticated && user ? (
            <>
              <Link href="/my-ideas" className="text-sm sm:text-base hover:text-purple-300 transition-colors">
                Mis Ideas
              </Link>
              <span className="text-xs sm:text-sm text-gray-300 hidden md:inline">{user.email}</span>
              <button
                onClick={logout}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm sm:text-base hover:text-purple-300 transition-colors">
                Login
              </Link>
              <Link href="/signup" className="bg-purple-600 hover:bg-purple-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors">
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}