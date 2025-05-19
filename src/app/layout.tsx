// src/app/layout.tsx
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar"; 

// Importaciones para react-toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1. Importar la fuente Inter desde next/font
import { Inter } from 'next/font/google';

// 2. Configurar la fuente Inter
const inter = Inter({
  subsets: ['latin'], // Especifica los subconjuntos de caracteres que necesitas
  display: 'swap',    // Mejora el rendimiento de carga percibido
  variable: '--font-inter', // Define una variable CSS para Inter
});

export const metadata = {
  title: "Génesis AI",
  description: "Tu Co-Fundador IA para ideas de negocio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 3. Aplicar la variable de la fuente y la clase 'font-sans' al tag html
    //    La clase `inter.variable` añade la variable CSS, y `font-sans` hará que Tailwind la use
    //    (después de configurar tailwind.config.js)
    <html lang="es" className={`${inter.variable} font-sans`}>
      <head>
        {/* 
          4. Eliminamos los <link> a Google Fonts para Inter y Montserrat.
             Next/font se encarga de Inter. Si necesitas Montserrat específicamente
             para algo, considera importarla también con next/font para mejor optimización.
             Si Inter será tu fuente principal, Montserrat podría no ser necesaria.
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet" />
        */}
      </head>
      {/* 
        No es necesario aplicar inter.className directamente al body si ya lo aplicas al html
        y configuras font-sans en Tailwind para usar la variable.
        Si no configuras Tailwind, podrías hacer: <body className={`${inter.className} bg-gray-900`}>
      */}
      <body className="bg-gray-900 text-gray-100"> {/* Añadido text-gray-100 para color de texto base */}
        <AuthProvider>
          <Navbar />
          <main>
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
      </body>
    </html>
  );
}