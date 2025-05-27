// src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useAuth, UserGenerationLimits } from '@/context/AuthContext'; // UserGenerationLimits del contexto
import React from 'react'; // useEffect, useState, useCallback ya no son necesarios para fetchUserLimits aquí

// API_BASE_URL no se usa aquí si fetchUserLimits está en el contexto
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// --- Iconos ---
const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={`${className || "w-4 h-4"} inline-block align-middle`}>{children}</span>
);

const UserCircleIcon = () => (
  <IconWrapper className="w-5 h-5 mr-1.5 text-gray-300 group-hover:text-purple-300 transition-colors">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  </IconWrapper>
);

const LightBulbLimitIcon = () => ( 
  <IconWrapper className="w-4 h-4 ml-1.5 text-yellow-400">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a11.959 11.959 0 01-4.5 0m4.5 0a11.959 11.959 0 004.5 0M9.75 9.75c0-1.319.097-2.607.281-3.862a3.73 3.73 0 01.562-1.079m1.018.022c.297.06.599.134.907.218m-1.205-.24a3.75 3.75 0 00-2.066.07M12 6.375c-.629 0-1.244.042-1.85.121a3.75 3.75 0 00-1.612.442m3.462-.563a3.75 3.75 0 011.612.442c.217.102.422.21.615.324m-3.462-.888V3.75m0 2.625L12 3.75m0 0L11.034 3c-.866-1.079-2.05-1.875-3.384-2.258M12 3.75c.303 0 .595.024.879.068M12 3.75L12.966 3c.866-1.079 2.05-1.875 3.384-2.258m0 0A12.034 12.034 0 0112 1.5" />
    </svg>
  </IconWrapper> 
);
// --- FIN Iconos ---

export default function Navbar() {
  const { 
    user, 
    isAuthenticated, 
    isLoading: authIsLoading, // Renombrado de isLoading del contexto
    logout, 
    userLimits,         // Obtenido del contexto
    isLoadingLimits     // Obtenido del contexto
  } = useAuth(); 

  // ELIMINADO: El useEffect que llamaba a fetchUserLimits, ya que AuthContext lo maneja.

  const getTooltipText = () => {
    // Considerar authIsLoading para el estado general de "cargando" antes de que los límites puedan ser siquiera solicitados.
    if (authIsLoading || isLoadingLimits) return "Actualizando límites...";
    if (!userLimits) return "Límites de generación no disponibles.";
    // Verificar que userLimits.daily_remaining sea un número antes de usarlo
    if (typeof userLimits.daily_remaining !== 'number' || typeof userLimits.monthly_remaining !== 'number') {
        return "Error al cargar datos de límites.";
    }
    const dailyText = `Hoy: ${userLimits.daily_remaining}/${userLimits.daily_limit}`;
    const monthlyText = `Mes: ${userLimits.monthly_remaining}/${userLimits.monthly_limit}`;
    return `${dailyText} | ${monthlyText}`;
  };

  return (
    <nav 
      className="text-white p-4 sticky top-0 z-50 bg-gray-800/75 backdrop-blur-sm shadow-2xl"
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-extrabold text-purple-400 hover:text-purple-300 transition-colors">
          GENESIS<span className="text-2xl font-extrabold text-purple-600 hover:text-purple-500 transition-colors">IA</span>
        </Link>
        <div className="space-x-2 sm:space-x-4 flex items-center">
          <Link href="/generate-idea" className="text-sm sm:text-base text-purple-400 hover:text-purple-300 transition-colors">
            ¡Generar ideas!
          </Link>
          <Link href="/faq" className="text-sm sm:text-base hover:text-purple-300 transition-colors">
            FAQ
          </Link>
          
          {authIsLoading && !user ? ( // Mostrar "Verificando..." solo si está cargando y aún no hay usuario
            <span className="text-sm text-gray-400">Verificando...</span>
          ) : isAuthenticated && user ? (
            <>
              <Link href="/my-ideas" className="text-sm sm:text-base hover:text-purple-300 transition-colors">
                Mis Ideas
              </Link>
              
              <div className="relative group flex items-center cursor-default">
                <UserCircleIcon />
                <span className="text-xs sm:text-sm text-gray-300 hidden md:inline">{user.email}</span>
                
                {/* Mostrar contador o mensaje de carga de límites */}
                {isLoadingLimits ? (
                    <span className="text-xs text-gray-400 ml-1 md:ml-2 animate-pulse">(...)</span>
                ) : userLimits && typeof userLimits.daily_remaining === 'number' ? (
                  <div className="flex items-center text-xs text-gray-400 ml-1 md:ml-2" title={getTooltipText()}>
                    <LightBulbLimitIcon />
                    <span className="ml-0.5">
                        ({userLimits.daily_remaining}/{userLimits.monthly_remaining})
                    </span>
                  </div>
                ) : null } {/* No mostrar nada si no hay userLimits y no está cargando */}

                {/* El Tooltip se muestra si userLimits está disponible */}
                {userLimits && typeof userLimits.daily_remaining === 'number' && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 
                                    min-w-max px-3 py-1.5
                                    bg-gray-900 text-white text-xs rounded-md shadow-lg 
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
                                    whitespace-nowrap z-10">
                        {getTooltipText()}
                        <svg className="absolute text-gray-900 h-2 w-full left-0 bottom-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve">
                           <polygon className="fill-current" points="0,255 127.5,127.5 255,255"/>
                        </svg>
                    </div>
                )}
              </div>

              <button
                onClick={() => logout({ redirect: true })}
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
