// src/app/layout.tsx

import React from 'react';
// Script ya no se importa directamente aquí si solo se usa en PayPalScriptLoader

// ----- TUS OTRAS IMPORTACIONES (descomenta las que uses) -----
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext'; 
import Navbar from '@/components/Navbar';
// import Footer from '@/components/Footer'; 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';

// --- NUEVA IMPORTACIÓN ---
import PayPalScriptLoader from '@/components/PayPalScriptLoader'; // Ajusta la ruta si es necesario

const inter = Inter({ subsets: ['latin'] });

// PAYPAL_CLIENT_ID ya no se necesita aquí directamente, se usa en PayPalScriptLoader

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // El console.log de versión puede quedarse o quitarse
  console.log("RootLayout RENDERIZANDO - Usando PayPalScriptLoader - Timestamp:", new Date().toISOString());

  return (
    <html lang="es">
      <body className={inter.className}> 
        <AuthProvider>
          <Navbar />
          <main className="pt-16 min-h-screen"> 
            {children}
          </main>
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
