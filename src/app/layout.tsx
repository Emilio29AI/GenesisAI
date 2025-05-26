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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="es" className={`${inter.variable} font-sans`}>
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