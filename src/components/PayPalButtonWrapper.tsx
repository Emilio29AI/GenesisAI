// src/components/PayPalButtonWrapper.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

interface PayPalButtonWrapperProps {
  ideaName: string;
  ideaId: number;
  priceUSD: string;
  sessionAccessToken: string | undefined;
  apiBaseUrl: string;
  onPaymentSuccess: (ideaId: number) => void; // Callback para cuando el backend confirma
  onPaymentError: (errorMessage: string, orderId?: string) => void; // Callback para errores de verificación o SDK
  onPaymentCancel: () => void; // Callback si el usuario cancela
  onProcessingEnd: () => void; // Callback para limpiar estados de carga
}

const PayPalButtonWrapper: React.FC<PayPalButtonWrapperProps> = ({
  ideaName,
  ideaId,
  priceUSD,
  sessionAccessToken,
  apiBaseUrl,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
  onProcessingEnd,
}) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const buttonsInstance = useRef<any>(null); // Para guardar la instancia de botones

  useEffect(() => {
    if (!window.paypal || !window.paypal.Buttons) {
      onPaymentError("SDK de PayPal no está listo.");
      return;
    }
    if (!paypalRef.current) {
      onPaymentError("Contenedor de PayPal no encontrado.");
      return;
    }

    // Limpiar el contenedor antes de renderizar, por si acaso.
    paypalRef.current.innerHTML = '';

    console.log(`Renderizando botones de PayPal para Idea ID: ${ideaId}`);
    buttonsInstance.current = window.paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: priceUSD,
              currency_code: 'USD'
            },
            description: `Informe Detallado para idea: ${ideaName}`,
            // custom_id: ideaId.toString(), // Podrías usar esto para tracking
          }]
        });
      },
      onApprove: async (data: any, actions: any) => {
        console.log("PayPal onApprove data:", data); // data.orderID
        try {
          const response = await fetch(`${apiBaseUrl}/api/v1/payments/paypal/verify-and-unlock`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionAccessToken}`,
            },
            body: JSON.stringify({ 
              order_id: data.orderID, 
              idea_id: ideaId 
            }),
          });
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.detail || `Falló la verificación del pago PayPal: ${response.status}`);
          }
          onPaymentSuccess(ideaId); // Llamar al callback de éxito
        } catch (verificationError: any) {
          onPaymentError(`Error al verificar el pago: ${verificationError.message}`, data.orderID);
        } finally {
          onProcessingEnd(); // Limpiar estados de carga independientemente del resultado de la verificación
        }
      },
      onError: (err: any) => {
        console.error("Error con los botones de PayPal SDK:", err);
        onPaymentError("Ocurrió un error con el proceso de pago de PayPal.");
        onProcessingEnd();
      },
      onCancel: (data: any) => {
        console.log("Pago con PayPal cancelado por el usuario:", data);
        onPaymentCancel();
        onProcessingEnd();
      }
    });

    if (buttonsInstance.current && paypalRef.current) {
      buttonsInstance.current.render(paypalRef.current)
        .catch((renderErr: any) => {
          console.error("Error al renderizar botones de PayPal con .render():", renderErr);
          onPaymentError("No se pudieron cargar las opciones de pago de PayPal.");
          onProcessingEnd();
        });
    }

    // Función de limpieza para cuando el componente se desmonte
    return () => {
      console.log(`Desmontando PayPalButtonWrapper para Idea ID: ${ideaId}`);
      if (buttonsInstance.current && typeof buttonsInstance.current.close === 'function') {
        buttonsInstance.current.close().catch((closeErr: any) => {
          console.error("Error al intentar cerrar botones de PayPal en desmontaje:", closeErr);
        });
      }
      buttonsInstance.current = null;
      // No limpiar innerHTML aquí, dejar que React lo haga al desmontar el div.
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaId, ideaName, priceUSD, sessionAccessToken, apiBaseUrl]); // No añadir los callbacks aquí para evitar re-renders si no cambian de referencia

  return <div ref={paypalRef} id={`paypal-button-container-${ideaId}`} className="w-full"></div>;
};

export default PayPalButtonWrapper;
