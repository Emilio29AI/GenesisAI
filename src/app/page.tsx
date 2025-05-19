// src/app/page.tsx
"use client"; // Necesario para hooks y eventos del cliente

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react'; // Hooks de React

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // No necesitamos heroRef si el efecto se aplica a toda la ventana
  // const heroRef = useRef<HTMLDivElement>(null); 

  // Factor de movimiento (cuánto se moverá la imagen en relación al mouse)
  const parallaxFactorX = 0.015; // Ajusta estos valores para más o menos movimiento
  const parallaxFactorY = 0.02;
  const maxOffset = 15; // Límite máximo de desplazamiento en píxeles

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
  }, []); // Se ejecuta solo una vez al montar

  // Calcular los desplazamientos para la imagen de fondo
  const offsetX = Math.max(-maxOffset, Math.min(maxOffset, -mousePosition.x * parallaxFactorX));
  const offsetY = Math.max(-maxOffset, Math.min(maxOffset, -mousePosition.y * parallaxFactorY));

  return (
    // Contenedor principal ahora es solo un wrapper, el efecto se aplica a un div interno
    <div className="relative min-h-screen"> {/* overflow-hidden en el wrapper principal */}
      
      {/* Div para la imagen de fondo con efecto parallax */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-100 ease-out" // Usamos duration-100 de Tailwind para una transición rápida
        style={{
          backgroundImage: "url('/background-hero-2.jpg')", // Ajusta el nombre de tu imagen
          // Hacemos la imagen ligeramente más grande para que el movimiento no muestre bordes
          top: '-10%', 
          left: '-5%',
          width: '110%',
          height: '110%',
          zIndex: 0, // Detrás de todo
          transform: `translate(${offsetX}px, ${offsetY}px) scale(1)`, // scale(1) para asegurar que no haya problemas con otros transforms
        }}
      ></div>

      {/* Overlay oscuro para mejorar la legibilidad del texto */}
      <div className="absolute inset-0 bg-black opacity-70 z-1"></div> {/* z-1 para estar sobre el fondo, debajo del main */}

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
    </div>
  );
}