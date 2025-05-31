// src/app/layout.tsx

import React from 'react'; // Asegúrate de tener React importado
import Script from 'next/script';
// ... tus otras importaciones ...
// import { Inter } from 'next/font/google'; // Si la usas
// import AuthProvider from '@/context/AuthContext'; // Si la usas
// import Navbar from '@/components/Navbar'; // Si la usas
// import Footer from '@/components/Footer'; // Si la usas
// import { ToastContainer } from 'react-toastify'; // Si la usas
// import './globals.css'; // Si la usas
// import 'react-toastify/dist/ReactToastify.css'; // Si la usas

// const inter = Inter({ subsets: ['latin'] }); // Si la usas

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

// Función helper para renderizar el script de PayPal condicionalmente
const renderPayPalScript = (): React.ReactNode => {
  const shouldLoad = PAYPAL_CLIENT_ID && 
                     PAYPAL_CLIENT_ID !== "YOUR_SANDBOX_CLIENT_ID" && // Asegúrate que este placeholder sea correcto o ajústalo
                     PAYPAL_CLIENT_ID !== "";

  if (shouldLoad) {
    return (
      <Script 
        id="paypal-sdk-script-layout" // Darle un ID único
        src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}¤cy=USD&intent=capture`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log("RootLayout: PayPal SDK Script loaded successfully.");
          if (typeof window !== "undefined") {
            (window as any).__paypal_sdk_loaded_global = true;
          }
        }}
        onError={(e) => {
          console.error("RootLayout: Error loading PayPal SDK Script:", e);
          if (typeof window !== "undefined") {
            (window as any).__paypal_sdk_loaded_global = false;
          }
        }}
      />
    );
  } else {
    if (process.env.NODE_ENV === 'development' && !PAYPAL_CLIENT_ID) {
      console.warn("RootLayout: NEXT_PUBLIC_PAYPAL_CLIENT_ID no está configurado. El SDK de PayPal no se cargará.");
    } else if (process.env.NODE_ENV === 'development' && PAYPAL_CLIENT_ID === "YOUR_SANDBOX_CLIENT_ID") {
      console.warn("RootLayout: PAYPAL_CLIENT_ID es el valor placeholder. El SDK de PayPal no se cargará.");
    }
    return null; // Explícitamente devolver null si no se carga
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      {/* <body className={inter.className}> Asumo que tienes 'inter' definido si usas esto */}
      <body> {/* O un className genérico si no usas Inter */}
        {/* <AuthProvider> */}
          {/* <Navbar /> */}
          <main className="pt-16 min-h-screen"> 
            {children}
          </main>
          {/* <Footer /> */}
          {/* <ToastContainer
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
          /> */}
        {/* </AuthProvider> */}

        {/* Usar la función helper para renderizar el script */}
        {renderPayPalScript()}
      </body>
    </html>
  );
}
