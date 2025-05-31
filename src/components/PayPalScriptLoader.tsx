// src/components/PayPalScriptLoader.tsx
"use client"; // MUY IMPORTANTE: Esto lo marca como un Client Component

import Script from 'next/script';
import { useEffect } from 'react';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

const PayPalScriptLoader = () => {
  const shouldLoad = PAYPAL_CLIENT_ID && PAYPAL_CLIENT_ID.trim() !== "";

  useEffect(() => {
    // Loguear solo en desarrollo si el ID no está configurado
    if (!shouldLoad && process.env.NODE_ENV === 'development') {
      if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID.trim() === "") {
        console.warn("PayPalScriptLoader: NEXT_PUBLIC_PAYPAL_CLIENT_ID no está configurado o está vacío. El SDK de PayPal no se cargará.");
      }
    }
  }, [shouldLoad]); // Se ejecuta cuando shouldLoad cambia

  if (!shouldLoad) {
    return null; // No renderizar nada si no se debe cargar
  }

  return (
    <Script 
      id="paypal-sdk-script-component" // ID único
      src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`}
      strategy="afterInteractive" // O "lazyOnload" si prefieres
      onLoad={() => {
        console.log("PayPalScriptLoader: PayPal SDK Script loaded successfully.");
        if (typeof window !== "undefined") {
          (window as any).__paypal_sdk_loaded_global = true;
        }
      }}
      onError={(e) => {
        console.error("PayPalScriptLoader: Error loading PayPal SDK Script:", e);
        if (typeof window !== "undefined") {
          (window as any).__paypal_sdk_loaded_global = false;
        }
      }}
    />
  );
};

export default PayPalScriptLoader;
