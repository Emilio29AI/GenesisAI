// src/app/idea/[ideaId]/checkout/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { initMercadoPago } from '@mercadopago/sdk-react';
import MercadoPagoCardPayment, { CardFormData } from '@/components/MercadoPagoCardPayment'; // Asumo que la ruta es correcta
import { useAuth } from '@/context/AuthContext'; // Asumo que la ruta es correcta
import { toast } from 'react-toastify';
import Image from 'next/image';

// --- Constantes de Configuración del Producto ---
const PRODUCT_TITLE = "Informe Detallado Génesis AI";
const PRODUCT_UNIT_PRICE_ARS = 10000.00; // Asegúrate que este sea el valor esperado por tu backend

// --- Lógica de Inicialización Global de Mercado Pago ---
// (Tu lógica de inicialización existente - SIN CAMBIOS)
const YOUR_MP_PUBLIC_KEY_TEST = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_TEST;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const backendUrl = `${API_BASE_URL}/api/v1/payments/process-checkout-api`;

if (typeof window !== 'undefined') {
  if (!API_BASE_URL) {
    console.error("CRÍTICO: NEXT_PUBLIC_API_BASE_URL no está configurado en .env.local.");
  }
  if (!(window as any).__mp_initialized_global_for_checkout_page && YOUR_MP_PUBLIC_KEY_TEST) {
    try {
      initMercadoPago(YOUR_MP_PUBLIC_KEY_TEST, { locale: 'es-AR' });
      (window as any).__mp_initialized_global_for_checkout_page = true;
      console.log("CheckoutPage (Módulo): initMercadoPago llamado globalmente con éxito.");
    } catch (error) {
      console.error("CheckoutPage (Módulo): Error en initMercadoPago global:", error);
    }
  } else if (!YOUR_MP_PUBLIC_KEY_TEST && typeof window !== 'undefined' && !(window as any).__mp_init_error_logged_checkout) {
    console.error("CheckoutPage (Módulo): Public Key no definida. No se puede inicializar MercadoPago.");
    (window as any).__mp_init_error_logged_checkout = true;
  }
}
// --- Fin Lógica de Inicialización Global ---

// --- NUEVO: Definición de estados para el polling ---
type ReportGenerationStatus = "idle" | "payment_processing" | "report_generating" | "report_ready" | "report_timeout" | "report_error";

function getFriendlyPaymentErrorMessage(statusDetail: string | null | undefined, mpMessage: string | null | undefined): string {
  const genericRejectedMessage = "Tu pago fue rechazado. Por favor, verifica los datos de tu tarjeta o intenta con otro medio de pago.";
  const contactSupportMessage = "Si el problema persiste, por favor, contacta a soporte.";

  if (!statusDetail) {
    return mpMessage || genericRejectedMessage;
  }

  // Puedes expandir este mapeo con más códigos de status_detail de MP
  // Consulta la documentación de Mercado Pago para los posibles valores de status_detail
  // https://www.mercadopago.com.ar/developers/es/reference/payments/_payments_id/get (busca "status_detail")
  switch (statusDetail) {
    case "cc_rejected_bad_filled_card_number":
    case "cc_rejected_bad_filled_date":
    case "cc_rejected_bad_filled_security_code":
    case "cc_rejected_bad_filled_other":
      return "Parece que hubo un error en los datos de la tarjeta ingresados. Por favor, revísalos e intenta nuevamente.";
    case "cc_rejected_insufficient_amount":
      return "Tu tarjeta no tiene fondos suficientes para completar la compra. Por favor, intenta con otra tarjeta o verifica tu saldo.";
    case "cc_rejected_call_for_authorize":
      return "Tu banco necesita que autorices este pago. Por favor, contáctalos y luego intenta nuevamente.";
    case "cc_rejected_card_disabled":
      return "Esta tarjeta se encuentra deshabilitada. Por favor, contacta a tu banco o utiliza otra tarjeta.";
    case "cc_rejected_card_error":
    case "cc_rejected_high_risk": // Podría ser un rechazo por sistema antifraude
    case "cc_rejected_other_reason":
      return `El pago fue rechazado por el procesador (${statusDetail}). Te recomendamos intentar con otra tarjeta o medio de pago. ${contactSupportMessage}`;
    // Añade más casos según la documentación de MP para 'status_detail'
    default:
      return mpMessage || genericRejectedMessage;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const { session, user, isLoading: authIsLoading } = useAuth();

  const [ideaId, setIdeaId] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  // MODIFICADO: isProcessingBackend ahora es parte de reportGenerationApiStatus
  // const [isProcessingBackend, setIsProcessingBackend] = useState(false); // Eliminaremos este y usaremos el nuevo estado
  const [isMpReadyForBrick, setIsMpReadyForBrick] = useState(false);

  // --- NUEVO: Estado para manejar el flujo de generación del informe ---
  const [reportGenerationApiStatus, setReportGenerationApiStatus] = useState<ReportGenerationStatus>("idle");
  const [reportErrorMessage, setReportErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (params.ideaId) {
      const currentIdeaId = Array.isArray(params.ideaId) ? params.ideaId[0] : params.ideaId;
      setIdeaId(currentIdeaId);
    }
    if (!authIsLoading && params.ideaId) {
      setIsPageLoading(false);
    }
    if (typeof window !== 'undefined' && (window as any).__mp_initialized_global_for_checkout_page) {
      setIsMpReadyForBrick(true);
    }
  }, [params, authIsLoading]);


  // --- NUEVO: useEffect para manejar el polling cuando el estado es 'report_generating' ---
  useEffect(() => {
    if (reportGenerationApiStatus !== "report_generating" || !ideaId || !session?.access_token) {
      return; // Solo pollear si estamos en el estado correcto y tenemos lo necesario
    }

    let attempts = 0;
    const maxAttempts = 15; // ej. 15 intentos (aprox 1 minuto 15 seg si el intervalo es 5s)
    const intervalTime = 5000; // 5 segundos
    let pollIntervalId: NodeJS.Timeout | null = null;

    const pollReport = async () => {
      attempts++;
      logger.log(`Polling attempt ${attempts}/${maxAttempts} for idea ${ideaId}`); //NUEVO
      if (attempts > maxAttempts) {
        logger.warn("Máximo de intentos de polling alcanzado para idea ${ideaId}."); //NUEVO
        setReportGenerationApiStatus("report_timeout");
        setReportErrorMessage("La generación de tu informe está tardando más de lo esperado. Estará disponible en 'Mis Ideas' o puedes intentar recargar la página del informe más tarde.");
        if (pollIntervalId) clearInterval(pollIntervalId); // Limpiar intervalo
        return;
      }

      try {
        const reportStatusUrl = `${API_BASE_URL}/api/v1/ideas/${ideaId}/detailed-report`;
        const response = await fetch(reportStatusUrl, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.status === 200) { // ¡Informe Listo!
          logger.log("Informe listo para idea ${ideaId}! Redirigiendo..."); //NUEVO
          if (pollIntervalId) clearInterval(pollIntervalId);
          setReportGenerationApiStatus("report_ready");
          toast.success("¡Tu informe detallado está listo!");
          router.push(`/idea/${ideaId}/report`);
        } else if (response.status === 202) { // Sigue procesando
          logger.log("Informe aún procesándose para idea ${ideaId}, reintentando..."); //NUEVO
          // El intervalo ya está configurado, simplemente esperamos la próxima ejecución
        } else { // Otro error (402, 403, 404, 500)
          if (pollIntervalId) clearInterval(pollIntervalId);
          const errorData = await response.json().catch(() => ({ detail: "Error desconocido al obtener estado del informe." }));
          logger.error("Error obteniendo el estado del informe para idea ${ideaId}:", response.status, errorData.detail); //NUEVO
          setReportErrorMessage(errorData.detail || `Error ${response.status} al verificar el informe.`);
          setReportGenerationApiStatus("report_error");
        }
      } catch (networkError: any) {
        if (pollIntervalId) clearInterval(pollIntervalId);
        logger.error("Error de red durante el polling para idea ${ideaId}:", networkError); //NUEVO
        setReportErrorMessage("Error de red al verificar el estado del informe. Revisa tu conexión.");
        setReportGenerationApiStatus("report_error");
      }
    };

    // Iniciar el polling
    pollIntervalId = setInterval(pollReport, intervalTime);
    pollReport(); // Ejecutar inmediatamente la primera vez también (o después de un breve delay inicial)

    return () => { // Función de limpieza
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
      }
    };
  }, [reportGenerationApiStatus, ideaId, session, router, API_BASE_URL]); // Dependencias del useEffect


  const handleProcessPaymentWithToken = useCallback(async (cardFormData: CardFormData) => {
  logger.log("handleProcessPaymentWithToken: INICIO. cardFormData recibida:", JSON.stringify(cardFormData, null, 2));

  if (!API_BASE_URL) {
      toast.error("Error de config: API_BASE_URL no definida.");
      logger.error("handleProcessPaymentWithToken: API_BASE_URL no definida.");
      return;
  }
  if (authIsLoading) {
      toast.info("Esperando verificación de sesión...");
      logger.log("handleProcessPaymentWithToken: authIsLoading es true, retornando.");
      return;
  }
  if (!session?.access_token || !user?.id) {
    toast.error("Sesión no válida. Por favor, inicia sesión e intenta de nuevo.");
    logger.error("handleProcessPaymentWithToken: Sesión o usuario no válidos. Redirigiendo a login.");
    router.push(`/login?redirect=/idea/${ideaId}/checkout`);
    return;
  }
  if (!ideaId) {
      toast.error("ID de idea no encontrado en el estado.");
      logger.error("handleProcessPaymentWithToken: ideaId es null o undefined.");
      return;
  }

  logger.log("handleProcessPaymentWithToken: Validaciones iniciales pasadas.");
  setReportGenerationApiStatus("payment_processing");
  setReportErrorMessage(null);
  
  const targetBackendUrl = `${API_BASE_URL}/api/v1/payments/process-checkout-api`;
  
  const payloadForBackend = {
      token: cardFormData.token,
      issuer_id: cardFormData.issuer_id,
      payment_method_id: cardFormData.payment_method_id,
      transaction_amount: PRODUCT_UNIT_PRICE_ARS, // Usar tu constante
      installments: cardFormData.installments,
      payer: {
        email: cardFormData.payer.email, 
        identification: {
            type: cardFormData.payer.identification.type,
            number: cardFormData.payer.identification.number,
        }
      },
      description: `${PRODUCT_TITLE} - Idea ID: ${ideaId}`,
      // Asegúrate que user.id e ideaId no sean null aquí
      external_reference: `genesisAI_idea_${ideaId}_user_${user.id}_${Date.now()}`, 
      idea_id: parseInt(ideaId, 10),
    };

  const fetchOptions: RequestInit = { // Añadir RequestInit para tipado más estricto
    method: 'POST', // MÉTODO POST EXPLÍCITO
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payloadForBackend),
  };

  logger.log("handleProcessPaymentWithToken: ANTES DE FETCH.");
  logger.log("URL:", targetBackendUrl);
  logger.log("Opciones (método):", fetchOptions.method);
  // Descomenta la siguiente línea para ver el payload y headers completos si es necesario, puede ser muy verboso
  // logger.log("Opciones (completo):", JSON.stringify(fetchOptions, null, 2)); 

  // alert(`DEBUG: Se va a hacer fetch POST a ${targetBackendUrl}. Revisa la consola para los detalles.`); // DESCOMENTA ESTO PARA DETENER AQUÍ

  try {
    logger.log("handleProcessPaymentWithToken: Realizando fetch...");
    const response = await fetch(targetBackendUrl, fetchOptions);
    logger.log("handleProcessPaymentWithToken: Fetch realizado. Status respuesta:", response.status);

    if (!response.ok) {
      let errorDetail = `Error del servidor: ${response.status}`;
      try {
          const errorResult = await response.json();
          errorDetail = errorResult.detail || errorResult.message || errorDetail;
          logger.error("handleProcessPaymentWithToken: Error de backend (JSON parseado):", errorResult);
      } catch (e) {
          const textError = await response.text(); // Intenta obtener texto si no es JSON
          logger.error("handleProcessPaymentWithToken: Error de backend (no JSON, texto):", textError);
          errorDetail = response.statusText || errorDetail;
      }
      throw new Error(errorDetail);
    }

    const paymentResult = await response.json();
    logger.log("CheckoutPage: Respuesta del backend (paymentResult):", paymentResult);

    if (paymentResult.status === "approved" || paymentResult.status === "in_process" || paymentResult.status === "pending") {
      toast.success("¡Pago procesado! Ahora estamos generando tu informe detallado.");
      logger.log(`CheckoutPage: Pago ${paymentResult.status}. Iniciando generación de informe para idea ${ideaId}.`);
      setReportGenerationApiStatus("report_generating");
    } else {
      const friendlyMessage = getFriendlyPaymentErrorMessage(paymentResult.status_detail, paymentResult.message);
      toast.error(friendlyMessage);
      logger.warn(`CheckoutPage: Pago no aprobado (${paymentResult.status}). Detalle: ${paymentResult.status_detail}. Mensaje MP: ${paymentResult.message}. Mensaje amigable: ${friendlyMessage}`);
      setReportGenerationApiStatus("idle");
    }
  } catch (error: any) {
    logger.error("CheckoutPage: CATCH GENERAL en handleProcessPaymentWithToken:", error);
    const errorMessage = error.message || "Ocurrió un error al procesar tu pago.";
    toast.error(errorMessage);
    setReportErrorMessage(errorMessage);
    setReportGenerationApiStatus("report_error"); 
  }
  // El 'finally' que podría poner isLoading a false se maneja con setReportGenerationApiStatus
}, [authIsLoading, session, user, ideaId, router, API_BASE_URL, reportGenerationApiStatus, setReportGenerationApiStatus, setReportErrorMessage]); // Añadí los setters a las dependencias
  // ... (tus renderizados condicionales existentes para 'payment_processing', 'report_generating', etc.) ...

  // Podrías añadir un renderizado para un estado 'payment_failed' si lo creas
  // if (reportGenerationApiStatus === "payment_failed") {
  //   return (
  //     <div>
  //       <p>Error en el Pago</p>
  //       <p>{reportErrorMessage}</p>
  //       <button onClick={() => setReportGenerationApiStatus("idle")}>Intentar de Nuevo</button>
  //     </div>
  //   );
  // }

  // ... (tus condiciones de carga, error de ideaId, no sesión, etc. - SIN CAMBIOS) ...
  if (isPageLoading || authIsLoading) { return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}><p>Cargando...</p></div>;}
  if (!ideaId) { return <div style={{ textAlign: 'center', marginTop: '50px' }}><p>Error: ID de idea no encontrado.</p><button onClick={() => router.back()}>Volver</button></div>;}
  if (!session) { return <div style={{ textAlign: 'center', marginTop: '50px' }}><p>Debes iniciar sesión.</p><button onClick={() => router.push(`/login?redirect=/idea/${ideaId}/checkout`)}>Iniciar Sesión</button></div>;}
  if (!YOUR_MP_PUBLIC_KEY_TEST) { return <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>Error de Configuración: Clave Pública de MP no encontrada.</div>;}
  if (typeof window !== 'undefined' && !(window as any).__mp_initialized_global_for_checkout_page) { return <div style={{ color: 'orange', padding: '20px', textAlign: 'center' }}>Error: Inicialización de MP falló. Revisa consola o recarga.</div>;}


  // --- NUEVO: Renderizado condicional basado en reportGenerationApiStatus ---
  if (reportGenerationApiStatus === "payment_processing") {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px', textAlign: 'center' }}>
        <div className="spinner mb-4"></div> {/* Necesitarás un CSS para este spinner */}
        <p className="text-lg font-semibold">Procesando tu pago...</p>
        <p className="text-sm text-gray-600">Por favor, espera un momento.</p>
      </div>
    );
  }
  
  if (reportGenerationApiStatus === "report_generating") {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px', textAlign: 'center' }}>
        <div className="spinner mb-4"></div> {/* Necesitarás un CSS para este spinner */}
        <p className="text-lg font-semibold text-purple-600">¡Pago exitoso!</p>
        <p className="text-md">Estamos generando tu informe detallado personalizado.</p>
        <p className="text-sm text-gray-600 mt-2">Esto puede tardar unos momentos. Te redirigiremos automáticamente cuando esté listo.</p>
      </div>
    );
  }

  if (reportGenerationApiStatus === "report_timeout") {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px', textAlign: 'center' }}>
        <p className="text-lg font-semibold text-orange-600">La generación está tardando un poco...</p>
        <p className ="text-md">Tu informe estará disponible en "Mis Ideas" en breve.</p>
        <p className="text-sm text-gray-600 mt-2">{reportErrorMessage}</p>
        <button onClick={() => router.push('/my-ideas')} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
          Ir a Mis Ideas
        </button>
        <button onClick={() => router.push(`/idea/${ideaId}/report`)} className="mt-2 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
          Intentar ver informe
        </button>
      </div>
    );
  }

  if (reportGenerationApiStatus === "report_error") {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px', textAlign: 'center' }}>
        <p className="text-lg font-semibold text-red-600">Error al procesar el informe</p>
        <p className="text-md mt-2">{reportErrorMessage || "Ocurrió un problema. Por favor, intenta más tarde o contacta a soporte."}</p>
        <button onClick={() => setReportGenerationApiStatus("idle")} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
          Intentar de Nuevo el Pago
        </button>
         <button onClick={() => router.push('/my-ideas')} className="mt-2 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
          Ir a Mis Ideas
        </button>
      </div>
    );
  }
  // --- FIN NUEVO RENDERIZADO ---

  // El return original solo se muestra si reportGenerationApiStatus es "idle"
  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Checkout Seguro</h1>
      <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Resumen del Pedido</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Producto:</strong> {PRODUCT_TITLE}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Referencia Idea ID:</strong> {ideaId}</p>
        <p className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-2"><strong>Monto a Pagar:</strong> ARS {PRODUCT_UNIT_PRICE_ARS.toFixed(2)}</p>
      </div>

      {isMpReadyForBrick ? ( // Eliminé la condición de isProcessingBackend aquí
        <>
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tus datos de pago son procesados de forma segura por <span className="font-semibold text-blue-600 dark:text-blue-400">Mercado Pago</span>.
            </p>
          </div>
          <MercadoPagoCardPayment
            amount={PRODUCT_UNIT_PRICE_ARS} // Usar la constante
            onSubmitPayment={handleProcessPaymentWithToken}
          />
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}><p>Inicializando formulario de pago...</p></div>
      )}
      <div className="text-center mt-6 text-xs text-gray-500 dark:text-gray-400">
        <p>🔒 Tus datos están protegidos. Usamos la plataforma de Mercado Pago para garantizar la seguridad de tu transacción.</p>
      </div>
    </div>
  );
}

// NUEVO: Un logger simple para el frontend (puedes hacerlo más sofisticado)
const logger = {
    log: (...args: any[]) => console.log("[CheckoutPage]", ...args),
    warn: (...args: any[]) => console.warn("[CheckoutPage]", ...args),
    error: (...args: any[]) => console.error("[CheckoutPage]", ...args),
}