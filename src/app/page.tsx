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

  const flujoEtapas = [
    // Eliminamos la propiedad 'Icon' ya que no la usaremos
    { id: "perfilar", titulo: "1. PERFILAR", descripcion: "Define tu visión y parámetros clave para la IA.", actual: true },
    { id: "idear", titulo: "2. IDEAR", descripcion: "Recibe conceptos de negocio únicos generados por IA.", actual: true },
    { id: "analizar", titulo: "3. ANALIZAR", descripcion: "Explora cada idea con un informe básico y DAFO inicial.", actual: true },
    { id: "profundizar", titulo: "4. PROFUNDIZAR", descripcion: "Adquiere Informes Detallados con estrategias y planes de acción.", actual: true },
    { id: "validar", titulo: "5. VALIDAR", descripcion: "Utiliza nuestro Kit de Validación para probar tus hipótesis.", actual: false },
    { id: "acelerar", titulo: "6. ACELERAR", descripcion: "Accede a módulos avanzados para impulsar tu proyecto.", actual: false },
  ];

  return (
    <>
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-100 ease-out animate-pulse-opacity-slow"
        style={{
          backgroundImage: "url('/background-hero-2.jpg')",
          zIndex: 0,
          transform: `translate(${offsetX}px, ${offsetY}px) scale(1.05)`,
        }}
      ></div>
      <div className="absolute inset-0 bg-black opacity-60 md:opacity-70 z-1"></div>

      <main className="relative z-10 flex flex-col min-h-screen text-white pt-20 md:pt-15 pb-10 md:pb-16">
        <div className="w-full flex-grow flex items-center justify-center px-6">
          {/* ... (Hero section sin cambios) ... */}
          <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            <div className="lg:w-2/3 text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
                <span className="text-purple-600">GENESIS IA.</span>Inteligencia Estratégica para Emprender<span className="text-purple-400"></span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-5">
                Convierte tu visión en conceptos de negocio viables. Genera ideas personalizadas, recibe análisis detallados y planifica tus próximos pasos con el poder de la IA.
              </p>
            </div>
            <div className="lg:w-1/3 flex lg:justify-end justify-center">
              <Link
                href="/generate-idea"
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full text-lg shadow-lg transform transition-transform duration-150 hover:scale-105 whitespace-nowrap"
              >
                Iniciar Análisis Gratuito
              </Link>
            </div>
          </div>
        </div>

        {/* ----- SECCIÓN DIAGRAMA DE FLUJO AJUSTADA ----- */}
        <section className="w-full mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24 pb-10">
          <h2 className="text-2xl font-bold text-center mb-12 md:mb-12 text-purple-300">TU RUTA ESTRATÉGICA CON GENESIS IA:</h2>
          
          {/* Contenedor del diagrama con un ancho máximo más restringido */}
          <div className="max-w-5xl mx-auto"> {/* <--- AJUSTE: Ancho máximo para el diagrama */}
            <div className="flex flex-col md:flex-row items-start md:items-stretch md:justify-center"> {/* md:items-stretch para igualar alturas en desktop */}
              {flujoEtapas.map((etapa, index) => (
                <React.Fragment key={etapa.id}>
                  {/* Nodo de Etapa */}
                  {/* AJUSTE: md:max-w-[160px] lg:max-w-[180px] para limitar ancho de cada "globo" */}
                  {/* AJUSTE: md:flex-shrink-0 para que no se encojan demasiado si hay muchos */}
                  <div className={`group flex flex-col items-center text-center p-3 md:p-4 rounded-lg md:flex-1 md:max-w-[180px] lg:max-w-[200px] md:flex-shrink-0 transition-all duration-300 ease-in-out transform hover:scale-105 ${etapa.actual ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}>
                    <div className={`relative w-16 h-16 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center mb-3 shadow-md group-hover:shadow-lg transition-all duration-300 ease-in-out
                                    ${etapa.actual ? 'border-purple-500 bg-purple-600/20 group-hover:bg-purple-500/30 group-hover:border-purple-300' 
                                                  : 'border-gray-600 bg-gray-700/30 group-hover:bg-gray-600/40 group-hover:border-gray-500'}`}>
                      <span className={`text-2xl md:text-3xl font-bold transition-colors duration-300
                                      ${etapa.actual ? 'text-purple-300 group-hover:text-purple-200' 
                                                    : 'text-gray-500 group-hover:text-gray-400'}`}>
                        {index + 1}
                      </span>
                      {etapa.actual && <div className="absolute inset-0 rounded-full border-2 border-purple-500 opacity-50 animate-ping-slow group-hover:animate-none"></div>}
                    </div>
                    <h3 className={`text-sm font-semibold mb-1 uppercase tracking-normal md:tracking-wider transition-colors duration-300
                                  ${etapa.actual ? 'text-purple-300 group-hover:text-purple-200' 
                                                : 'text-gray-500 group-hover:text-gray-400'}`}>
                      {etapa.titulo.substring(3)}
                    </h3>
                    <p className={`text-xs leading-snug transition-colors duration-300
                                 ${etapa.actual ? 'text-gray-300 group-hover:text-gray-200' 
                                               : 'text-gray-600 group-hover:text-gray-500'}`}>
                      {etapa.descripcion}
                    </p>
                    {!etapa.actual && (
                       <span className="mt-2 text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full opacity-80 group-hover:opacity-100 transition-opacity">PRÓXIMAMENTE</span>
                    )}
                  </div>

                  {/* Conector */}
                  {index < flujoEtapas.length - 1 && (
                     // AJUSTE: md:flex-grow-0 md:flex-shrink para que el conector no fuerce demasiado el ancho
                     // AJUSTE: md:min-w-[40px] lg:min-w-[60px] para asegurar un espacio mínimo para la línea
                    <div className="flex-shrink-0 w-full md:w-auto md:flex-grow-0 md:flex-shrink flex items-center justify-center my-3 md:my-0 md:min-w-[40px] lg:min-w-[50px] xl:min-w-[60px]">
                      {/* Línea para móvil (vertical) */}
                      <div className={`md:hidden w-0.5 h-8 mx-auto ${etapa.actual && flujoEtapas[index+1].actual ? 'bg-purple-400' : 'bg-gray-600'}`}></div>
                      {/* Línea para desktop (horizontal) */}
                      <div className={`hidden md:block h-0.5 w-full ${etapa.actual && flujoEtapas[index+1].actual ? 'bg-purple-400' : 'bg-gray-600'}`}></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>
        {/* ----- FIN DIAGRAMA DE FLUJO AJUSTADA ----- */}
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
