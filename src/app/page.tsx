// src/app/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// --- IMPORTAR ICONOS DE HEROICONS ---
import {
  UserIcon, // Para Emprendedores
  UsersIcon, // Para Consultores (o UserGroupIcon)
  LightBulbIcon, // Alternativa para Emprendedores o Innovadores
  BuildingOffice2Icon, // Para Innovadores Corporativos
  AcademicCapIcon, // Alternativa para Consultores
  PuzzlePieceIcon, // Alternativa para Innovadores
  ChartBarIcon, // Alternativa para Consultores
  RocketLaunchIcon // Alternativa para Emprendedores o Acelerar
} from '@heroicons/react/24/outline'; // O usa /24/solid para la versión sólida

// --- Icono para el Diagrama de Flujo (el de números que te gustó) ---
const IconNumeroEtapa = ({ numero, esActual }: { numero: number, esActual: boolean }) => (
  <div className={`relative w-16 h-16 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center mb-3 shadow-md group-hover:shadow-lg transition-all duration-300 ease-in-out
                  ${esActual ? 'border-purple-500 bg-purple-600/20 group-hover:bg-purple-500/30 group-hover:border-purple-300' 
                              : 'border-gray-600 bg-gray-700/30 group-hover:bg-gray-600/40 group-hover:border-gray-500'}`}>
    <span className={`text-2xl md:text-3xl font-bold transition-colors duration-300
                    ${esActual ? 'text-purple-300 group-hover:text-purple-200' 
                                : 'text-gray-500 group-hover:text-gray-400'}`}>
      {numero}
    </span>
    {esActual && <div className="absolute inset-0 rounded-full border-2 border-purple-500 opacity-50 animate-ping-slow group-hover:animate-none"></div>}
  </div>
);


function LandingPageContent() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const parallaxFactorX = 0.015;
  const parallaxFactorY = 0.01;
  const maxOffset = 10;

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Calcula la posición del mouse relativa al centro de la ventana
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const deltaX = event.clientX - centerX;
      const deltaY = event.clientY - centerY;
      setMousePosition({ x: deltaX, y: deltaY });
    };

    // Añade el listener cuando el componente se monta
    window.addEventListener('mousemove', handleMouseMove);

    // Limpia el listener cuando el componente se desmonta
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  const offsetX = Math.max(-maxOffset, Math.min(maxOffset, mousePosition.x * parallaxFactorX));
  const offsetY = Math.max(-maxOffset, Math.min(maxOffset, mousePosition.y * parallaxFactorY));


  const flujoEtapas = [ /* ... tu array flujoEtapas sin cambios ... */
    { id: "perfilar", titulo: "1. PERFILAR", descripcion: "Define tu visión y parámetros clave como punto de partida para la IA.", actual: true },
    { id: "idear", titulo: "2. IDEAR", descripcion: "Recibe conceptos de negocio personalizados y un resumen de viabilidad inicial de forma gratuita.", actual: true },
    { id: "analizar", titulo: "3. ANALIZAR", descripcion: "Explora cada idea con un Informe Detallado, DAFO y Análisis de Mercado.", actual: true },
    { id: "profundizar", titulo: "4. VALIDAR", descripcion: "Verifica la solidez de tu proyecto con módulos de Validación y Diagnóstico", actual: true },
    { id: "validar", titulo: "5. PROFUNDIZAR ", descripcion: "Adquiere Informes Exhaustivos con estrategias y planes de acción.", actual: false },
    { id: "acelerar", titulo: "6. ACELERAR", descripcion: "Accede a módulos avanzados para impulsar tu proyecto.", actual: false },
  ];

  // --- Array de Casos de Uso con Iconos de Heroicons ---
  const casosDeUso = [
    { 
      id: "emprendedores", 
      Icono: RocketLaunchIcon, // Ejemplo, puedes cambiarlo
      titulo: "EMPRENDEDORES INDIVIDUALES", 
      texto: "Transforma tu pasión en un plan. Desde la idea personalizada hasta tu estrategia de validación, somos tu co-piloto estratégico." 
    },
    { 
      id: "consultores", 
      Icono: UsersIcon, // Ejemplo
      titulo: "COACHES Y CONSULTORES", 
      texto: "Potencia tus asesorías. Ofrece a tus clientes análisis instantáneos y hojas de ruta a medida con nuestra inteligencia artificial." 
    },
    { 
      id: "innovadores", 
      Icono: LightBulbIcon, // Ejemplo
      titulo: "INNOVADORES CORPORATIVOS", 
      texto: "Cataliza la innovación interna. Explora nuevas líneas de negocio o productos con análisis de mercado ágiles y evaluación de potencial." 
    },
  ];

  return (
    <>
      {/* ... (fondo y overlay sin cambios) ... */}
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat -z-10 animate-pulse-opacity-slow" style={{
          backgroundImage: "url('/background-hero-2.jpg')",
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
                <span className="text-purple-600">GENESIS IA. </span>Inteligencia Estratégica para Emprender<span className="text-purple-400"></span>
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

        {/* ... (Sección Diagrama de Flujo con números, sin cambios) ... */}
        <section className="w-full mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-15 pb-10">
          <h2 className="text-3xl font-bold text-center mb-5 md:mb-5 text-purple-300">Tu Ruta Estratégica con Génesis AI</h2>
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-stretch md:justify-center">
              {flujoEtapas.map((etapa, index) => (
                <React.Fragment key={etapa.id}>
                  <div className={`group w-full md:flex md:max-w-[180px] lg:max-w-[200px] xl:max-w-[220px] md:flex-none flex flex-col items-center text-center p-3 md:p-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 ${etapa.actual ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}>
                    <IconNumeroEtapa numero={index + 1} esActual={etapa.actual} />
                    <h3 className={`text-sm font-semibold mb-1 uppercase tracking-normal md:tracking-wider transition-colors duration-300 ${etapa.actual ? 'text-purple-300 group-hover:text-purple-200' : 'text-gray-500 group-hover:text-gray-400'}`}>
                      {etapa.titulo} 
                    </h3>
                    <p className={`text-xs leading-snug transition-colors duration-300 ${etapa.actual ? 'text-gray-300 group-hover:text-gray-200' : 'text-gray-600 group-hover:text-gray-500'}`}>
                      {etapa.descripcion}
                    </p>
                    {!etapa.actual && (
                       <span className="mt-2 text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full opacity-80 group-hover:opacity-100 transition-opacity">PRÓXIMAMENTE</span>
                    )}
                  </div>
                  {index < flujoEtapas.length - 1 && (
                    <div className="flex-shrink-0 w-full md:w-auto md:flex-grow-0 md:flex-shrink flex items-center justify-center my-3 md:my-0 md:min-w-[40px] lg:min-w-[50px] xl:min-w-[60px]">
                      <div className={`md:hidden w-0.5 h-10 mx-auto ${etapa.actual && flujoEtapas[index+1].actual ? 'bg-purple-400' : 'bg-gray-600'}`}></div>
                      <div className={`hidden md:block h-0.5 w-full ${etapa.actual && flujoEtapas[index+1].actual ? 'bg-purple-400' : 'bg-gray-600'}`}></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>


        {/* ----- SECCIÓN CASOS DE USO CON HEROICONS ----- */}
        <section className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-10 bg-gray-800/20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-5 md:mb-5 text-purple-300">Potenciando Múltiples Visiones Estratégicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {casosDeUso.map((caso) => {
                // Renombramos Icono a ComponenteIcono para usarlo como componente JSX
                const ComponenteIcono = caso.Icono; 
                return (
                  <div key={caso.id} className="group bg-gray-800/70 backdrop-blur-sm p-6 rounded-xl shadow-xl hover:shadow-purple-500/40 transition-all duration-300 ease-in-out flex flex-col items-center text-center transform hover:-translate-y-1">
                    {/* Aplicamos clases de Tailwind al icono de Heroicons */}
                    <ComponenteIcono className="w-10 h-10 text-purple-400 mb-4 group-hover:text-purple-300 transition-colors" aria-hidden="true" />
                    <h3 className="text-xl font-semibold text-purple-300 mb-3 group-hover:text-purple-200 transition-colors">
                      {caso.titulo}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors">
                      {caso.texto}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        {/* ----- FIN NUEVA SECCIÓN: CASOS DE USO ----- */}
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
