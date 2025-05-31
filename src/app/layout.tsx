// src/app/layout.tsx

import React from 'react';
// Script ya no se importa directamente aquí si solo se usa en PayPalScriptLoader
import './globals.css';
// ----- TUS OTRAS IMPORTACIONES (descomenta las que uses) -----
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext'; 
import Navbar from '@/components/Navbar';
// import Footer from '@/components/Footer'; 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { Metadata } from 'next';


// --- NUEVA IMPORTACIÓN ---
import PayPalScriptLoader from '@/components/PayPalScriptLoader'; // Ajusta la ruta si es necesario

const inter = Inter({
  subsets: ['latin'], // Especifica los subconjuntos de caracteres que necesitas
  display: 'swap',    // Mejora el rendimiento de carga percibido
  variable: '--font-inter', // Define una variable CSS para Inter
});

// PAYPAL_CLIENT_ID ya no se necesita aquí directamente, se usa en PayPalScriptLoader

export const metadata: Metadata = {
  title: 'Génesis AI - Tu Co-Fundador para Ideas de Negocio Innovadoras', // Título principal de tu aplicación
  description: 'Utiliza Inteligencia Artificial para descubrir y desarrollar ideas de negocio. Comienza tu emprendimiento con Génesis AI.', // Descripción principal
  // Opcional: Puedes añadir más metadatos aquí
  // openGraph: {
  //   title: 'Génesis AI - Generador de Ideas de Negocio Innovadoras',
  //   description: 'Descubre ideas de negocio con IA.',
  //   images: ['/tu-imagen-og.png'], // URL absoluta o relativa a /public
  // },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Génesis AI - Generador de Ideas de Negocio Innovadoras',
  //   description: 'Descubre ideas de negocio con IA.',
  //   images: ['/tu-imagen-twitter.png'], // URL absoluta o relativa a /public
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El console.log de versión puede quedarse o quitarse
  console.log("RootLayout RENDERIZANDO - Usando PayPalScriptLoader - Timestamp:", new Date().toISOString());

  return (
    <html lang="es" className={`${inter.variable} font-sans`}>
      <body className="bg-gray-900 text-gray-100"> 
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen"> 
            {children}
          </main >
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </AuthProvider>

        {/* Usar el nuevo componente cliente para cargar el script de PayPal */}
        <PayPalScriptLoader />
      </body>
    </html>
  );
}
