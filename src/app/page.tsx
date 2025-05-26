// src/app/page.tsx
"use client"; 

import React, { useState, useEffect, useRef } from 'react'; 
import Link from 'next/link';

function LandingPageContent() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const parallaxFactorX = 0.015; 
  const parallaxFactorY = 0.01;  
  const maxOffset = 10; 

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const deltaX = event.clientX - centerX;
      const deltaY = event.clientY - centerY;
      setMousePosition({ x: deltaX, y: deltaY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const offsetX = Math.max(-maxOffset, Math.min(maxOffset, mousePosition.x * parallaxFactorX));
  const offsetY = Math.max(-maxOffset, Math.min(maxOffset, mousePosition.y * parallaxFactorY));

  return (
    <>
      {/* Div para la imagen de fondo con efecto parallax y respiración */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-100 ease-out animate-pulse-opacity-slow" // <-- Añadida animate-pulse-opacity-slow
        style={{
          backgroundImage: "url('/background-hero-2.jpg')",
          zIndex: 0, 
          transform: `translate(${offsetX}px, ${offsetY}px) scale(1.05)`,
          // La opacidad base de la animación se controla en globals.css,
          // pero si quieres una opacidad base diferente a la animación,
          // podrías añadirla aquí (ej. opacity: 0.7) y la animación la modularía.
          // Por ahora, dejaremos que la animación controle la opacidad.
        }}
      ></div>
      {/* Overlay oscuro para mejorar la legibilidad del texto */}
      {/* Ajustamos la opacidad del overlay para que la animación del fondo sea más notoria si es necesario */}
      <div className="absolute inset-0 bg-black opacity-60 md:opacity-70 z-1"></div> {/* Reducida un poco la opacidad del overlay */}


      <main className="relative z-10 flex flex-col min-h-screen text-white pt-20 md:pt-15 pb-10 md:pb-16">
        <div className="w-full flex-grow flex items-center justify-center px-6"> {/* Añadido flex-grow aquí para el centrado */}
          <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            
            <div className="lg:w-2/3 text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
                Tu Co-Fundador IA para <span className="text-purple-400">Planes de Negocio Brillantes</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-5">
                Genera y valida conceptos de negocio únicos, adaptados a ti, con el poder de la inteligencia artificial. Descubre tu próximo gran proyecto con <span className="text-xl md:text-1xl font-bold text-purple-400" >GÉNESIS AI.</span>
              </p>
            </div>

            <div className="lg:w-1/3 flex lg:justify-end justify-center">
              <Link
                href="/generate-idea"
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full text-lg shadow-lg transform transition-transform duration-150 hover:scale-105 whitespace-nowrap"
              >
                Generar Conceptos Gratis
              </Link>
            </div>
          </div>
        </div>
        
        <section className="w-full max-w-4xl mx-auto px-6 mt-16 md:mt-24 pb-10"> {/* Añadido pb-10 para dar espacio al final */}
          <h2 className="text-3xl font-bold text-center mb-10">¿Cómo Funciona Génesis AI?</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-purple-400">1. DEFINE TU PERFIL EMPRENDEDOR PARA LA IA</h3>
              <p className="text-gray-300">Proporciona a nuestra IA los insumos clave —tus pasiones, experticia y metas— para catalizar ideas de negocio con precisión estratégica.</p>
            </div>
            <div className="p-6 bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-purple-400">2. EXPLORA IDEAS ÚNICAS DE ALTO POTENCIAL</h3>
              <p className="text-gray-300">Accede a un portafolio de conceptos de negocio, generados por IA a partir del análisis de tu perfil y la inteligencia de mercado global.</p>
            </div>
            <div className="p-6 bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-purple-400">3. RECIBE INFORMES EXHAUSTIVOS Y PLANES DE ACCIÓN</h3>
              <p className="text-gray-300">Obtendrás una evaluación de viabilidad inicial y un esquema de acción con los hitos clave para la materialización de tu concepto de negocio.</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <LandingPageContent />
    </div>
  );
}