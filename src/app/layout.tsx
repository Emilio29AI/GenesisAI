// src/app/layout.tsx

import React from 'react';
import Script from 'next/script';
// ----- TUS OTRAS IMPORTACIONES (descomenta las que uses) -----
// import { Inter } from 'next/font/google';
// import AuthProvider from '@/context/AuthContext';
// import Navbar from '@/components/Navbar';
// import Footer from '@/components/Footer';
// import { ToastContainer } from 'react-toastify';
// import './globals.css';
// import 'react-toastify/dist/ReactToastify.css';

// const inter = Inter({ subsets: ['latin'] });

// Obtener el Client ID de las variables de entorno
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

// Función helper para renderizar el script de PayPal condicionalmente
const renderPayPalScript = (): React.ReactNode => {
  // Condición simplificada: cargar si PAYPAL_CLIENT_ID tiene un valor válido (no undefined, no null, no cadena vacía)
  const shouldLoad = PAYPAL_CLIENT_ID && PAYPAL_CLIENT_ID.trim() !== "";

  if (shouldLoad) {
    return (
      <Script 
        id="paypal-sdk-script-layout" // ID único para el script
        src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}¤cy=USD&intent=capture`} // Corregido: ¤cy
        strategy="afterInteractive" // Cargar después de que la página sea interactiva
        onLoad={() => {
          console.log("RootLayout: PayPal SDK Script loaded successfully.");
          if (typeof window !== "undefined") {
            (window as any).__paypal_sdk_loaded_global = true; // Bandera global
          }
        }}
        onError={(e) => {
          console.error("RootLayout: Error loading PayPal SDK Script:", e);
          if (typeof window !== "undefined") {
            (window as any).__paypal_sdk_loaded_global = false; // Indicar fallo
          }
        }}
      />
    );
  } else {
    // Loguear solo en desarrollo si el ID no está configurado o está vacío
    if (process.env.NODE_ENV === 'development') {
      if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID.trim() === "") {
        console.warn("RootLayout: NEXT_PUBLIC_PAYPAL_CLIENT_ID no está configurado o está vacío. El SDK de PayPal no se cargará.");
      }
    }
    return null; // Explícitamente devolver null si no se carga
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Log para verificar qué versión del layout se está usando en el build/runtime
  console.log("RootLayout RENDERIZANDO - Version con helper 'renderPayPalScript' y corrección de currency - Timestamp:", new Date().toISOString());

  return (
    <html lang="es">
      {/* ----- USA TU className DE FUENTE AQUÍ ----- */}
      {/* <body className={inter.className}> */}
      <body> 
        {/* ----- DESCOMENTA TUS PROVIDERS Y COMPONENTES GLOBALES ----- */}
        {/* <AuthProvider> */}
          {/* <Navbar /> */}
          <main className="pt-16 min-h-screen"> {/* Ajusta pt-16 si es necesario */}
            {children}
          </main>
          {/* <Footer /> */}
          {/* <ToastContainer
            position="bottom-right"
            autoClose={5000}
            // ... otras props ...
            theme="dark"
          /> */}
        {/* </AuthProvider> */}

        {/* Usar la función helper para renderizar el script */}
        {renderPayPalScript()}
      </body>
    </html>
  );
}
