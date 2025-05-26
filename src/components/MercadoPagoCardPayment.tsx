// src/components/MercadoPagoCardPayment.tsx
"use client";

import React, { useState, memo } from 'react'; // useEffect ya no es necesario aquí para init
import { CardPayment } from '@mercadopago/sdk-react';

interface MercadoPagoCardPaymentProps {
  amount: number;
  onSubmitPayment: (cardFormData: CardFormData) => Promise<void>;
  // Añadimos una prop para saber si el SDK global está listo, opcionalmente
  isMpSdkInitialized?: boolean;
}

export interface CardFormData {
  token: string;
  issuer_id: string;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
  bin?: string;
}

const MercadoPagoCardPaymentComponent: React.FC<MercadoPagoCardPaymentProps> = ({
  amount,
  onSubmitPayment,
  isMpSdkInitialized = true, // Asumimos true por defecto, el padre controlará esto si es necesario
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initializationConfig = {
    amount: amount,
  };

  const handleSubmitFromBrick = async (cardFormData: CardFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    console.log("MercadoPagoCardPayment Component: Brick onSubmit disparado:", cardFormData);
    try {
      await onSubmitPayment(cardFormData);
    } catch (err: any) {
      console.error("MercadoPagoCardPayment Component: Error en onSubmitPayment (padre):", err);
      setErrorMessage(err.message || "Error procesando con servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleErrorFromBrick = (error: any) => {
    console.error("MercadoPagoCardPayment Component: Brick onError disparado:", error);
    let message = "Revise los campos.";
    if (error?.message) message = error.message;
    else if (error?.error_causes?.length) message = error.error_causes.map((c: any) => c.description).join(' ');
    setErrorMessage(message);
    setIsLoading(false);
  };

  const handleBrickReady = () => {
    console.log("MercadoPagoCardPayment Component: Brick onReady.");
  };

  if (!isMpSdkInitialized) {
    // Esto es por si el padre explícitamente nos dice que no está listo.
    // Normalmente, el padre no renderizará este componente si no está listo.
    return <div style={{ textAlign: 'center', padding: '20px' }}>Esperando inicialización de Mercado Pago...</div>;
  }

  console.log("MercadoPagoCardPayment Component: Renderizando <CardPayment /> Brick.");
  return (
    <div className="mercadopago-card-payment-container">
      <CardPayment
        initialization={initializationConfig}
        onSubmit={handleSubmitFromBrick}
        onError={handleErrorFromBrick}
        onReady={handleBrickReady}
        customization={{ visual: { style: { theme: 'bootstrap' } } }}
      />
      {isLoading && <div style={{ marginTop: '10px' }}><p>Procesando...</p></div>}
      {errorMessage && <div style={{ marginTop: '10px', color: 'red' }}><p>Error: {errorMessage}</p></div>}
    </div>
  );
};

const MercadoPagoCardPayment = memo(MercadoPagoCardPaymentComponent);
export default MercadoPagoCardPayment;