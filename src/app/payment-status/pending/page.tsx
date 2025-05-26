// Ejemplo para src/app/payment-status/success/page.tsx
"use client";
import { useSearchParams } from 'next/navigation';
export default function PaymentPendingPage() {
  const searchParams = useSearchParams();
  const ideaId = searchParams.get('idea_id');
  const paymentId = searchParams.get('payment_id');
  return <div><h1>¡Pago Pendiente!</h1><p>Idea ID: {ideaId}</p><p>Payment ID: {paymentId}</p></div>;
}