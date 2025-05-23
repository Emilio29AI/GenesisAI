// src/app/page.tsx
"use client"; // Necesario para hooks y eventos del cliente

import React, { useState, useEffect, useRef } from 'react'; // Hooks de React
import Link from 'next/link';

// Componente separado para la lógica interactiva (parallax)
function LandingPageContent() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const parallaxFactorX = 0.015;
  const parallaxFactorY = 0.02;
  const maxOffset = 15;

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

  const offsetX = Math.max(-maxOffset, Math.min(maxOffset, -mousePosition.x * parallaxFactorX));
  const offsetY = Math.max(-maxOffset, Math.min(maxOffset, -mousePosition.y * parallaxFactorY));

  return (
    <>
      {/* Div para la imagen de fondo con efecto parallax */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-100 ease-out"
        style={{
          backgroundImage: "url('/background-hero-2.jpg')",
          top: '-10%',
          left: '-5%',
          width: '110%',
          height: '110%',
          zIndex: 0,
          transform: `translate(${offsetX}px, ${offsetY}px) scale(1)`,
        }}
      ></div>

      {/* Overlay oscuro para mejorar la legibilidad del texto */}
      <div className="absolute inset-0 bg-black opacity-70 z-1"></div>

      {/* Contenido de la página, ahora relativo al overlay */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-white">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            Tu Co-Fundador IA para <span className="text-purple-400">Planes de Negocio Brillantes</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-10">
            Genera y valida conceptos de negocio únicos, adaptados a ti, con el poder de la inteligencia artificial. Descubre tu próximo gran proyecto con <span className="text-xl md:text-1xl font-bold text-purple-400" >GÉNESIS AI.</span>
          </p>
          <Link
            href="/generate-idea"
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full text-lg shadow-lg transform transition-transform duration-150 hover:scale-105"
          >
            Generar Conceptos Gratis
          </Link>
        </div>

        {/* Sección "Cómo Funciona" */}
        <section className="mt-5 py-10 w-full max-w-4xl">
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
              <h3 className="text-xl font-semibold mb-3 text-purple-400">3. RECIBE UN INFORME DE VIABILIDAD Y HOJA DE RUTA</h3>
              <p className="text-gray-300">Obtendrás una evaluación de viabilidad inicial y un esquema de acción con los hitos clave para la materialización de tu concepto de negocio.</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

// El componente HomePage simplemente renderiza el contenido
export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <LandingPageContent />
    </div>
  );
}