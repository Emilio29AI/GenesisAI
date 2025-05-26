// app/faq/page.tsx
"use client";

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link'; 

// Icono para el acordeón (Chevron Abajo/Arriba)
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 transition-transform duration-200 ease-in-out ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

interface FAQItem {
  question: string;
  answer: string | React.ReactNode; 
}

const faqData: FAQItem[] = [
  {
    question: "¿Qué es Génesis AI?",
    answer: "Génesis AI es tu co-fundador virtual, una herramienta que utiliza inteligencia artificial para ayudarte a generar ideas de negocio innovadoras, analizar su viabilidad preliminar y obtener hojas de ruta detalladas para llevarlas a la realidad."
  },
  {
    question: "¿Qué obtengo gratis?",
    answer: (
      <>
        <p className="mb-2">Puedes generar tandas de 3 ideas de negocio básicas. Cada idea incluye:</p>
        <ul className="list-disc list-inside ml-4 text-gray-300 space-y-1 text-sm">
          <li>Nombre de la idea</li>
          <li>Descripción detallada del concepto</li>
          <li>Justificación de por qué es adecuada para tu perfil</li>
          <li>Modelo de negocio sugerido</li>
          <li>Análisis preliminar de viabilidad (oportunidad y riesgo clave)</li>
        </ul>
        <p className="mt-3 text-sm">Los usuarios no registrados tienen un límite de 2 generaciones. Al registrarte, accedes a 3 generaciones diarias y 15 mensuales, la capacidad de guardar tus ideas y la opción de adquirir Informes Detallados.</p>
      </>
    )
  },
  {
    question: "¿Qué es el Informe Detallado?",
    answer: "El Informe Detallado es un análisis exhaustivo y profesional de una idea de negocio específica, diseñado para darte una comprensión profunda y pasos accionables. Incluye secciones como: Análisis DAFO completo, estudio de mercado (público objetivo, tendencias, competidores), modelo de negocio detallado, estrategias de marketing y adquisición, identidad de marca sugerida, métricas clave (KPIs), análisis de riesgos y mitigación, y un plan de primeros pasos críticos."
  },
  {
    question: "¿Necesito registrarme para usar Génesis AI?",
    answer: "Puedes probar la generación de ideas básicas sin registrarte, aunque con un límite de 2 generaciones. Registrarte es gratuito y te otorga más generaciones gratuitas, la capacidad de guardar tus ideas favoritas para acceder a ellas más tarde, y la opción de adquirir Informes Detallados para las ideas que más te interesen."
  },
  {
    question: "¿Mis ideas son privadas?",
    answer: "Sí, la privacidad de tus ideas es fundamental para nosotros. Las ideas que generas y, especialmente, las que guardas en tu cuenta, son confidenciales y no se comparten. Estamos trabajando en una Política de Privacidad detallada que podrás consultar pronto."
  },
];

const FAQItemComponent: React.FC<{ item: FAQItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-700 py-5 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left text-lg font-medium text-purple-300 hover:text-purple-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 rounded-md p-1 -m-1"
        aria-expanded={isOpen}
      >
        <span>{item.question}</span>
        <ChevronDownIcon className={isOpen ? 'transform rotate-180' : ''} />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen mt-3 opacity-100' : 'max-h-0 mt-0 opacity-0'}`}
      >
        <div className="pb-2 pr-6 text-gray-400 text-sm leading-relaxed">
          {typeof item.answer === 'string' ? <p>{item.answer}</p> : item.answer}
        </div>
      </div>
    </div>
  );
};


export default function FAQPage() {
  return (
    <>
      <Head>
        <title>Preguntas Frecuentes - Génesis AI</title>
        <meta name="description" content="Encuentra respuestas a las preguntas más comunes sobre Génesis AI." />
      </Head>
      {/* MODIFICADO: Contenedor principal ahora es relativo para el fondo */}
      <div className="relative min-h-screen bg-gray-900/20 text-white"> {/* Ligera transparencia al bg-gray-900 */}
        {/* --- NUEVO: Div para la imagen de fondo con animación --- */}
        <div 
            className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat -z-10 opacity-10 animate-pulse-opacity-slow"
            style={{ backgroundImage: "url('/background-faq.png')" }} // Nombre de imagen actualizado
        ></div>
        <div className="fixed inset-0 w-full h-full bg-black/20 -z-10"></div> {/* Overlay oscuro */}
        {/* --- FIN NUEVO --- */}
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10"> {/* z-10 para el contenido principal */}
          <header className="text-center mb-12 md:mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 pb-2">
              Preguntas Frecuentes
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Aquí encontrarás respuestas a las dudas más comunes sobre Génesis AI.
            </p>
          </header>

          <div className="max-w-3xl mx-auto bg-gray-800/70 backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-10 border border-gray-700/60">
            {faqData.map((item, index) => (
              <FAQItemComponent key={index} item={item} />
            ))}
          </div>

           <div className="text-center mt-12 md:mt-16">
            <Link href="/generate-idea" className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition-transform hover:scale-105">
              Empezar a Generar Ideas
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}