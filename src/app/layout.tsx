// src/app/layout.tsx
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar"; 
import Script from 'next/script'; // <--- NUEVO IMPORT para el SDK de PayPal

// Importaciones para react-toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1. Importar la fuente Inter desde next/font
import { Inter } from 'next/font/google';

// 2. Configurar la fuente Inter
const inter = Inter({
  subsets: ['latin'], 
  display: 'swap',    
  variable: '--font-inter', 
});

export const metadata = {
  title: "Génesis AI",
  description: "Tu Co-Fundador IA para ideas de negocio.",
};

// Reemplaza esto con tu Client ID de PayPal Sandbox
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "YOUR_SANDBOX_CLIENT_ID";
// Es MUY RECOMENDABLE usar una variable de entorno para esto: NEXT_PUBLIC_PAYPAL_CLIENT_ID
// Y añadirla a tu archivo .env.local (ej: NEXT_PUBLIC_PAYPAL_CLIENT_ID=AbCdEfGhIjKlMnOpQrStUvWxYz...)


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="es" className={`${inter.variable} font-sans`}>
      <head>
        {/* El Script de PayPal se cargará asíncronamente y no bloqueará el renderizado */}
        {/* Asegúrate de que PAYPAL_CLIENT_ID esté definido */}
        {PAYPAL_CLIENT_ID && PAYPAL_CLIENT_ID !== "YOUR_SANDBOX_CLIENT_ID" ? (
          <Script 
            src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`}
            strategy="afterInteractive" // Carga después de que la página sea interactiva
          />
        ) : (
          // Loguear un error o advertencia si el Client ID no está configurado
          // Esto es solo para desarrollo, en producción querrías que falle o no cargue.
          process.env.NODE_ENV === 'development' && 
          console.warn("RootLayout: PAYPAL_CLIENT_ID no está configurado. El SDK de PayPal no se cargará.")
        )}
      </head>
      <body className="bg-gray-900 text-gray-100">
          <AuthProvider>
            <Navbar />
            <main>
              {children}
            </main>
            <ToastContainer /* ... */ />
          </AuthProvider>
      </body>
    </html>
  );
}
