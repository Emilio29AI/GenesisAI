// app/idea/[ideaId]/report/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify'; // Asumo que usas react-toastify globalmente

// html2pdf se importa dinámicamente en handleDownloadPdf

// --- Iconos SVG ---
const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "w-5 h-5" }) => (
  <span className={`${className} inline-block mr-2 align-middle`}>{children}</span>
);
const ArrowLeftIcon = () => ( <IconWrapper className="w-4 h-4"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /> </svg> </IconWrapper> );
const LightBulbIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a11.959 11.959 0 01-4.5 0m4.5 0a11.959 11.959 0 004.5 0M9.75 9.75c0-1.319.097-2.607.281-3.862a3.73 3.73 0 01.562-1.079m1.018.022c.297.06.599.134.907.218m-1.205-.24a3.75 3.75 0 00-2.066.07M12 6.375c-.629 0-1.244.042-1.85.121a3.75 3.75 0 00-1.612.442m3.462-.563a3.75 3.75 0 011.612.442c.217.102.422.21.615.324m-3.462-.888V3.75m0 2.625L12 3.75m0 0L11.034 3c-.866-1.079-2.05-1.875-3.384-2.258M12 3.75c.303 0 .595.024.879.068M12 3.75L12.966 3c.866-1.079 2.05-1.875 3.384-2.258m0 0A12.034 12.034 0 0112 1.5" /></svg> </IconWrapper> );
const ChartBarIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg> </IconWrapper> );
const PuzzlePieceIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v7.5M21 7.5H5.25M5.25 7.5L3 6.187M5.25 7.5v7.5m0-7.5H3M3 7.5L3 15m0 0L5.25 15M5.25 15v7.5M5.25 15H9.75m0 0L12 12.75M9.75 15L12 17.25M12 17.25v4.875M12 17.25L14.25 15m0 0L12 12.75m2.25 2.25L15 12.75M15 12.75L15 3.75M15 3.75L12 1.5M12 1.5L9 3.75M9 3.75L9 7.5M9 7.5L6.75 9M6.75 9L6.75 12.75M6.75 12.75L9 15m6-1.25l-2.25-1.313M15 13.75L17.25 15M15 13.75v-1.5m2.25 1.5L15 16.25M15 16.25v7.5M15 16.25l2.25-1.313M17.25 15l2.25 1.313M19.5 16.25L19.5 7.5M19.5 7.5L17.25 6.187M17.25 6.187L15 7.5M15 7.5L15 3.75M15 3.75L12 6M12 6L9 3.75" /></svg> </IconWrapper> );
const BuildingStorefrontIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A2.25 2.25 0 0011.25 11.25H6.75A2.25 2.25 0 004.5 13.5V21M4.5 10.5V7.5A2.25 2.25 0 016.75 5.25h10.5A2.25 2.25 0 0119.5 7.5v3M4.5 10.5a2.25 2.25 0 00-2.25 2.25v7.5A2.25 2.25 0 004.5 22.5h15A2.25 2.25 0 0021.75 20.25v-7.5a2.25 2.25 0 00-2.25-2.25H4.5z" /></svg> </IconWrapper> );
const MegaphoneIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9.75 0h4.875c.621 0 1.125-.504 1.125-1.125v-4.875c0-.621-.504-1.125-1.125-1.125H11.125c-.621 0-1.125.504-1.125 1.125v4.875c0 .621.504 1.125 1.125 1.125zM5.25 14.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v4.875c0 .621-.504 1.125-1.125 1.125H6.375a1.125 1.125 0 01-1.125-1.125V14.625zM6 18.75h.008v.008H6v-.008z" /></svg> </IconWrapper> );
const ClipboardDocumentListIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75c0-.231-.035-.454-.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5M6.75 7.5L7.5 3.75m0 0L8.25 3l1.264 1.264a.75.75 0 01-1.06 1.06L7.5 3.75z" /></svg> </IconWrapper> );
const LinkIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg> </IconWrapper> );
const DownloadIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"> <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /> </svg> </IconWrapper> );
const ThumbUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <IconWrapper className={className}> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H6.633a1.875 1.875 0 01-1.875-1.875V12.375c0-1.036.84-1.875 1.875-1.875z" /> </svg> </IconWrapper> );
const ThumbDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => ( <IconWrapper className={className}> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h3M7.5 18h3M3 16.5V12A2.25 2.25 0 015.25 9.75h5.052a2.25 2.25 0 012.042.607l2.148 2.685a2.25 2.25 0 002.042.607h4.71a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25h-4.71a2.25 2.25 0 00-2.042-.607l-2.148-2.685A2.25 2.25 0 017.302 12H5.25A2.25 2.25 0 003 14.25v2.25m19.5-3.375V3A2.25 2.25 0 0019.75.75H4.25A2.25 2.25 0 002 3v9.375m19.5 0a2.25 2.25 0 01-2.25 2.25H4.25a2.25 2.25 0 01-2.25-2.25m19.5 0M21 13.125c0 .621-.504 1.125-1.125 1.125H4.125C3.504 14.25 3 13.746 3 13.125M21 13.125V3.75M3 13.125V3.75m0 9.375c0 .621.504 1.125 1.125 1.125h13.5c.621 0 1.125-.504 1.125-1.125m0-9.375c0-.621-.504-1.125-1.125-1.125h-13.5c-.621 0-1.125.504-1.125 1.125" /> </svg> </IconWrapper> );
// --- FIN Iconos SVG ---

interface DetailedReportContent {
  resumen_ejecutivo_ia: string;
  concepto_central_expandido: string;
  propuesta_valor_unica: string[];
  problema_solucion: { problema_detectado: string; solucion_propuesta: string; };
  mercado_objetivo: { segmentos_principales: string[]; necesidades_clave_segmento: string; tamano_estimado_mercado?: string; };
  tendencias_relevantes_sector: string[];
  competidores_potenciales: Array<{ nombre: string; descripcion: string; tipo: string; url_ejemplo?: string; }>;
  foda: { fortalezas: string[]; debilidades: string[]; oportunidades: string[]; amenazas: string[]; };
  modelo_negocio_sugerido_detallado: { tipo_modelo: string; descripcion_flujo_ingresos: string; canales_distribucion_clave: string[]; socios_clave_potenciales?: string[]; };
  estrategias_monetizacion_alternativas?: string[];
  estrategias_marketing_iniciales: string[];
  identidad_marca_sugerida: { nombre_alternativos?: string[]; tono_comunicacion: string; valores_clave_marca: string[]; };
  canales_adquisicion_recomendados: string[];
  primeros_pasos_criticos: Array<{ paso: string; descripcion_breve: string; recursos_necesarios?: string; prioridad: string; }>;
  metricas_clave_exito_inicial: string[];
  riesgos_principales_mitigacion: Array<{ riesgo: string; estrategia_mitigacion_sugerida: string; }>;
  consideraciones_legales_basicas?: string[];
  herramientas_utiles_sugeridas?: Array<{ nombre_herramienta: string; categoria: string; url_referencia?: string; }>;
  comunidades_o_foros_relevantes?: Array<{ nombre_comunidad: string; url: string; }>;
}

interface FullReportData {
  idea_name: string;
  report_content: DetailedReportContent;
}

type TabName = "resumen" | "mercado" | "foda" | "modeloNegocio" | "marketing" | "planAccion" | "recursos";
interface TabConfig { id: TabName; label: string; icon: React.FC; }
type FeedbackRating = 'util' | 'no_util' | null;


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const TABS_CONFIG: TabConfig[] = [
  { id: "resumen", label: "Resumen y Concepto", icon: LightBulbIcon },
  { id: "mercado", label: "Análisis de Mercado", icon: ChartBarIcon },
  { id: "foda", label: "Análisis DAFO", icon: PuzzlePieceIcon },
  { id: "modeloNegocio", label: "Modelo de Negocio", icon: BuildingStorefrontIcon },
  { id: "marketing", label: "Estrategia y Marketing", icon: MegaphoneIcon },
  { id: "planAccion", label: "Plan de Acción", icon: ClipboardDocumentListIcon },
  { id: "recursos", label: "Recursos Adicionales", icon: LinkIcon },
];

function IdeaReportContent() {
  const params = useParams();
  const router = useRouter();
  const { session, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const ideaId = params.ideaId as string;

  const [fullReportData, setFullReportData] = useState<FullReportData | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [errorPage, setErrorPage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>(TABS_CONFIG[0].id);

  // Estados para el feedback
  const [feedbackRating, setFeedbackRating] = useState<FeedbackRating>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitSuccess, setFeedbackSubmitSuccess] = useState(false);
  const [feedbackSubmitError, setFeedbackSubmitError] = useState<string | null>(null);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const reportMainContentRef = useRef<HTMLDivElement>(null);
  const topControlsRef = useRef<HTMLDivElement>(null);

  const NAVBAR_HEIGHT_APPROX = 70;
  const EXTRA_SCROLL_PADDING = 20;

  const handleDownloadPdf = async () => {
    if (!fullReportData || !fullReportData.idea_name) {
      toast.error("Datos del informe no disponibles para la descarga.");
      setIsDownloadingPdf(false); // Asegurarse de resetear el estado si hay error temprano
      return;
    }
    if (!session?.access_token) {
      toast.error("No autenticado. No se puede descargar el informe.");
      setIsDownloadingPdf(false);
      return;
    }
    if (!API_BASE_URL) {
        toast.error("Error de configuración: URL de API no disponible.");
        setIsDownloadingPdf(false);
        return;
    }

    setIsDownloadingPdf(true);
    toast.info("Preparando la descarga de tu informe PDF...", { autoClose: 4000 });

    try {
      // El path debe coincidir con el definido en tu router de pdfreports.py
      const pdfEndpoint = `${API_BASE_URL}/api/v1/pdfreports/${ideaId}/download`;
      console.log("Intentando descargar PDF desde:", pdfEndpoint); // Log para depuración

      const response = await fetch(pdfEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        let errorDetail = `Error ${response.status} al descargar el PDF.`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorDetail;
        } catch (e) {
          errorDetail = `${errorDetail} (${response.statusText || 'Error desconocido del servidor'})`;
        }
        throw new Error(errorDetail);
      }

      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${fullReportData.idea_name.replace(/[\s\W]+/g, '_')}_GenesisAI_Report.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Limpieza
      setTimeout(() => { // Pequeño delay para asegurar que la descarga inicie en todos los navegadores
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Descarga del PDF iniciada.");
      }, 100);

    } catch (error: any) {
      console.error("Error al descargar el PDF:", error);
      toast.error(error.message || "Ocurrió un error al intentar descargar el PDF.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const fetchReportData = useCallback(async () => {
    const accessToken = session?.access_token;

    if (!ideaId || !isAuthenticated || !accessToken) {
      if (!authIsLoading) {
        if (!isAuthenticated) setErrorPage("Debes iniciar sesión para ver este informe.");
        else if (!ideaId) setErrorPage("ID de idea no encontrado.");
        else setErrorPage("No se pudo obtener un token de sesión válido. Por favor, intenta re-loguearte.");
        setIsLoadingPage(false);
      }
      return;
    }

    setIsLoadingPage(true);
    setErrorPage(null);

    try {
      const requestHeaders = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
      const response = await fetch(`${API_BASE_URL}/api/v1/ideas/${ideaId}/detailed-report`, { headers: requestHeaders });

      if (!response.ok) {
        let errorDetail = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData?.detail || errorDetail;
        } catch (e) {
          errorDetail = `${errorDetail} - ${response.statusText || 'Error de servidor'}`;
        }
        if (response.status === 401) throw new Error(`No se pudieron validar las credenciales. Detalle: ${errorDetail}`);
        if (response.status === 403) throw new Error(`No tienes permiso para acceder a este informe. Detalle: ${errorDetail}`);
        if (response.status === 404) throw new Error(`Informe no encontrado o no disponible. Detalle: ${errorDetail}`);
        throw new Error(errorDetail);
      }
      const data: FullReportData = await response.json();
      setFullReportData(data);
    } catch (err: any) {
      console.error("Error fetching detailed report:", err);
      const message = (err instanceof Error) ? err.message : "Ocurrió un error inesperado al cargar el informe.";
      setErrorPage(message);
    } finally {
      setIsLoadingPage(false);
    }
  }, [ideaId, session, isAuthenticated, authIsLoading]); // API_BASE_URL no cambia

  useEffect(() => {
    if (!authIsLoading) {
      if (isAuthenticated && session?.access_token && ideaId) {
        fetchReportData();
      } else {
        if (!isAuthenticated) setErrorPage("Debes iniciar sesión para ver este informe.");
        else if (!session?.access_token) setErrorPage("Error de sesión: Token no disponible. Intenta re-loguearte.");
        else if (!ideaId) setErrorPage("ID de idea no especificado para cargar el informe.");
        setIsLoadingPage(false);
      }
    }
  }, [authIsLoading, isAuthenticated, session, ideaId, fetchReportData]);

  useEffect(() => {
    if (fullReportData && topControlsRef.current) {
      const timer = setTimeout(() => {
        if (topControlsRef.current) {
            const rectTop = topControlsRef.current.getBoundingClientRect().top;
            const scrollAmount = rectTop - (NAVBAR_HEIGHT_APPROX + EXTRA_SCROLL_PADDING);
            const newScrollY = window.pageYOffset + scrollAmount;
            window.scrollTo({ top: newScrollY > 0 ? newScrollY : 0, behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [fullReportData]);

  const handleFeedbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!feedbackRating) {
      setFeedbackSubmitError("Por favor, selecciona una calificación (útil o no útil).");
      return;
    }
    if (!session?.access_token || !ideaId) {
        setFeedbackSubmitError("No se puede enviar el feedback: sesión o ID de idea no disponibles.");
        return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackSubmitError(null);
    setFeedbackSubmitSuccess(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ideas/${ideaId}/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: feedbackRating,
          comment: feedbackComment,
          report_type: 'detailed', // Podrías usar esto en el backend si tienes feedback para otros tipos de informes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Error ${response.status}` }));
        throw new Error(errorData.detail || `Error al enviar el feedback: ${response.statusText}`);
      }
      setFeedbackSubmitSuccess(true);
      toast.success("¡Gracias por tu feedback!");
      // Opcional: Resetear campos o deshabilitar formulario después de éxito
      // setFeedbackRating(null);
      // setFeedbackComment('');
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      const message = (error instanceof Error) ? error.message : "Ocurrió un error inesperado.";
      setFeedbackSubmitError(message);
      toast.error(`Error: ${message}`);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };


  const renderList = (items: string[] | undefined, title?: string, itemClassName: string = "text-gray-300") => {
    if (!items || items.length === 0) return <p className="text-sm text-gray-500 italic">{title ? `No hay ${title.toLowerCase()} disponibles.` : 'No hay elementos.'}</p>;
    return ( <div className="mb-6"> {title && <h4 className="text-lg font-semibold text-purple-300 mb-2">{title}</h4>} <ul className="list-disc list-inside space-y-1 pl-1"> {items.map((item, index) => <li key={index} className={`text-sm ${itemClassName}`}>{item}</li>)} </ul> </div> );
  };

  const renderKeyValueSection = (data: Record<string, any> | undefined, title: string, sectionClassName: string = "mb-6 p-4 bg-gray-700/30 rounded-lg shadow-md border border-gray-700") => {
    if (!data || Object.keys(data).length === 0) return <p className="text-sm text-gray-500 italic">{`No hay datos para ${title.toLowerCase()}.`}</p>;
    return ( <div className={sectionClassName}> <h4 className="text-xl font-semibold text-purple-300 mb-3">{title}</h4> {Object.entries(data).map(([key, value]) => { if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) return null; const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); return( <div key={key} className="mb-3"> <strong className="block text-sm font-medium text-gray-200 mb-1">{formattedKey}:</strong> {Array.isArray(value)  ? <ul className="list-disc list-inside ml-5 text-sm text-gray-300 space-y-0.5">{value.map((v, i) => <li key={i}>{String(v)}</li>)}</ul>  : <p className="text-sm text-gray-300">{String(value)}</p> } </div> ); })} </div> );
  };

  if (authIsLoading || isLoadingPage) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><p>Cargando informe detallado...</p></div>;
  }
  if (errorPage) {
    return ( <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6"> <h1 className="text-2xl font-semibold mb-4 text-red-400">Error al Cargar el Informe</h1> <p className="mb-6 text-gray-300">{errorPage}</p> <button onClick={() => router.back()} className="flex items-center px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold text-white"> <ArrowLeftIcon /> Volver </button> </div> );
  }
  if (!fullReportData || !fullReportData.report_content) {
    return ( <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6"> <h1 className="text-2xl font-semibold mb-4">Informe no Encontrado</h1> <p className="mb-6">No se pudo encontrar la información para este informe.</p> <button onClick={() => router.back()} className="flex items-center px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold text-white"> <ArrowLeftIcon /> Volver </button> </div> );
  }

  const reportContent = fullReportData.report_content;

  const renderTabContent = () => {
    if (!reportContent) return null;
    switch (activeTab) {
      case "resumen": return ( <> <h3 className="text-2xl font-semibold text-purple-300 mb-4 border-b border-gray-700 pb-2">Resumen y Concepto</h3> {renderKeyValueSection({ "Resumen Ejecutivo IA": reportContent.resumen_ejecutivo_ia, "Concepto Central Expandido": reportContent.concepto_central_expandido }, "Concepto Central de la Idea")} {renderList(reportContent.propuesta_valor_unica, "Propuesta de Valor Única", "text-green-300")} {renderKeyValueSection(reportContent.problema_solucion, "Problema Detectado y Solución Propuesta")} </> );
      case "mercado": return ( <> <h3 className="text-2xl font-semibold text-purple-300 mb-4 border-b border-gray-700 pb-2">Análisis de Mercado</h3> {renderKeyValueSection(reportContent.mercado_objetivo, "Mercado Objetivo")} {renderList(reportContent.tendencias_relevantes_sector, "Tendencias Relevantes del Sector")} <div className="mt-6"><h4 className="text-xl font-semibold text-purple-300 mb-3">Competidores Potenciales</h4> {reportContent.competidores_potenciales?.length > 0 ? reportContent.competidores_potenciales.map((comp, i) => ( <div key={i} className="mb-4 p-4 bg-gray-700/50 rounded-lg shadow-md border border-gray-600"> <strong className="text-lg text-gray-100 flex items-center">{comp.nombre} <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${comp.tipo === 'Directo' ? 'bg-red-500 text-red-100' : comp.tipo === 'Indirecto' ? 'bg-yellow-500 text-yellow-100' : 'bg-blue-500 text-blue-100'}`}>{comp.tipo}</span></strong> <p className="text-sm text-gray-300 mt-1.5">{comp.descripcion}</p> {comp.url_ejemplo && <a href={comp.url_ejemplo} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 hover:underline block mt-2">Visitar Referencia →</a>} </div> )) : <p className="text-sm text-gray-500 italic">No hay competidores listados.</p>} </div> </> );
      case "foda": return (<div className="space-y-6"><h3 className="text-2xl font-semibold text-purple-300 mb-6 border-b border-gray-700 pb-2">Análisis DAFO</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8"> <div className="bg-gray-700/40 p-6 rounded-lg shadow-lg border border-purple-500/30"><h4 className="text-xl font-semibold text-purple-300 mb-3">Fortalezas</h4>{renderList(reportContent.foda?.fortalezas, undefined, "text-gray-200")} </div><div className="bg-gray-700/40 p-6 rounded-lg shadow-lg border border-purple-500/30"><h4 className="text-xl font-semibold text-purple-300 mb-3">Oportunidades</h4> {renderList(reportContent.foda?.oportunidades, undefined, "text-gray-200")} </div> <div className="bg-gray-700/40 p-6 rounded-lg shadow-lg border border-gray-600/50"> <h4 className="text-xl font-semibold text-purple-400 mb-3">Debilidades</h4> {renderList(reportContent.foda?.debilidades, undefined, "text-gray-300")} </div> <div className="bg-gray-700/40 p-6 rounded-lg shadow-lg border border-gray-600/50"> <h4 className="text-xl font-semibold text-purple-400 mb-3">Amenazas</h4> {renderList(reportContent.foda?.amenazas, undefined, "text-gray-300")} </div> </div> </div> );
      case "modeloNegocio": return ( <> <h3 className="text-2xl font-semibold text-purple-300 mb-4 border-b border-gray-700 pb-2">Modelo de Negocio</h3> {renderKeyValueSection(reportContent.modelo_negocio_sugerido_detallado, "Modelo de Negocio Sugerido")} {renderList(reportContent.estrategias_monetizacion_alternativas, "Estrategias de Monetización Alternativas")} </> );
      case "marketing": return ( <> <h3 className="text-2xl font-semibold text-purple-300 mb-4 border-b border-gray-700 pb-2">Estrategia y Marketing</h3> {renderList(reportContent.estrategias_marketing_iniciales, "Estrategias de Marketing Iniciales")} {renderKeyValueSection(reportContent.identidad_marca_sugerida, "Identidad de Marca Sugerida")} {renderList(reportContent.canales_adquisicion_recomendados, "Canales de Adquisición Recomendados")} </> );
      case "planAccion": return ( <> <h3 className="text-2xl font-semibold text-purple-300 mb-4 border-b border-gray-700 pb-2">Plan de Acción y Viabilidad</h3> <div className="mb-6"><h4 className="text-xl font-semibold text-purple-300 mb-3">Primeros Pasos Críticos</h4> {reportContent.primeros_pasos_criticos?.length > 0 ? reportContent.primeros_pasos_criticos.map((paso, i) => ( <div key={i} className="mb-4 p-4 bg-gray-700/50 rounded-lg shadow-md border border-gray-600"> <strong className="text-lg text-gray-100 flex items-center">{paso.paso} <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${paso.prioridad === 'Alta' ? 'bg-red-500 text-red-100' : paso.prioridad === 'Media' ? 'bg-yellow-500 text-yellow-100' : 'bg-green-500 text-green-100'}`}>{paso.prioridad}</span></strong> <p className="text-sm text-gray-300 mt-1.5">{paso.descripcion_breve}</p> {paso.recursos_necesarios && <p className="text-xs text-gray-400 mt-1">Recursos: {paso.recursos_necesarios}</p>} </div> )) : <p className="text-sm text-gray-500 italic">No hay pasos críticos definidos.</p>} </div> {renderList(reportContent.metricas_clave_exito_inicial, "Métricas Clave de Éxito Inicial (KPIs)")} <div className="mt-6 mb-6"><h4 className="text-xl font-semibold text-purple-300 mb-3">Riesgos Principales y Mitigación</h4> {reportContent.riesgos_principales_mitigacion?.length > 0 ? reportContent.riesgos_principales_mitigacion.map((riesgo, i) => ( <div key={i} className="mb-4 p-4 bg-gray-700/50 rounded-lg shadow-md border border-gray-600"> <strong className="text-lg text-gray-100">Riesgo: {riesgo.riesgo}</strong> <p className="text-sm text-gray-300 mt-1.5">Mitigación: {riesgo.estrategia_mitigacion_sugerida}</p> </div> )) : <p className="text-sm text-gray-500 italic">No hay riesgos definidos.</p>} </div> {renderList(reportContent.consideraciones_legales_basicas, "Consideraciones Legales Básicas")} </> );
      case "recursos": return ( <> <h3 className="text-2xl font-semibold text-purple-300 mb-4 border-b border-gray-700 pb-2">Recursos Adicionales</h3> <div className="mb-6"><h4 className="text-xl font-semibold text-purple-300 mb-3">Herramientas Útiles Sugeridas</h4> {(reportContent.herramientas_utiles_sugeridas && reportContent.herramientas_utiles_sugeridas.length > 0) ? ( reportContent.herramientas_utiles_sugeridas.map((tool, i) => ( <div key={i} className="mb-3 p-4 bg-gray-700/50 rounded-lg shadow-md border border-gray-600"> <strong className="text-lg text-gray-100">{tool.nombre_herramienta} <span className="text-sm text-gray-400">({tool.categoria})</span></strong> {tool.url_referencia && <a href={tool.url_referencia} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 hover:underline block mt-1">Visitar Referencia →</a>} </div> )) ) : <p className="text-sm text-gray-500 italic">No hay herramientas sugeridas.</p>} </div> <div className="mb-6"><h4 className="text-xl font-semibold text-purple-300 mb-3">Comunidades o Foros Relevantes</h4> {(reportContent.comunidades_o_foros_relevantes && reportContent.comunidades_o_foros_relevantes.length > 0) ? ( reportContent.comunidades_o_foros_relevantes.map((comm, i) => ( <div key={i} className="mb-3 p-4 bg-gray-700/50 rounded-lg shadow-md border border-gray-600"> <strong className="text-lg text-gray-100">{comm.nombre_comunidad}</strong> <a href={comm.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 hover:underline block mt-1">Visitar Comunidad →</a> </div> )) ) : <p className="text-sm text-gray-500 italic">No hay comunidades sugeridas.</p>} </div> </> );
      default: return <p className="text-gray-400">Selecciona una pestaña para ver el contenido.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div ref={topControlsRef} className="mb-8 flex justify-between items-center">
            <button onClick={() => router.back()} className="inline-flex items-center px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"> <ArrowLeftIcon /> Volver </button>
            {fullReportData && ( <button 
                onClick={handleDownloadPdf} 
                disabled={isDownloadingPdf}
                className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed
                            ${isDownloadingPdf 
                                ? 'bg-yellow-500 text-yellow-900 focus:ring-yellow-400' 
                                : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'}`}
              >
                {isDownloadingPdf ? (
                  <>
                    <IconWrapper className="w-4 h-4 animate-spin mr-2"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> </IconWrapper>
                    Descargando...
                  </>
                ) : (
                  <> <DownloadIcon /> Descargar PDF </>
                )}
              </button>
            )}  
        </div>

        <header className="mb-10 p-6 bg-gradient-to-r from-gray-800 via-gray-800/90 to-purple-900/30 shadow-2xl rounded-xl border border-gray-700">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2"> {fullReportData?.idea_name || "Informe Detallado"} </h1>
          <p className="text-lg text-gray-400"> {(() => { const resumen = fullReportData?.report_content?.resumen_ejecutivo_ia; if (resumen && resumen.length > 10) { const primerPuntoIndex = resumen.indexOf('.'); if (primerPuntoIndex !== -1) { return resumen.substring(0, primerPuntoIndex + 1); } return resumen; } return "Un análisis exhaustivo de tu próxima gran idea de negocio."; })()} </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4 xl:w-1/5">
            <nav className="space-y-1.5 sticky top-24">
              {TABS_CONFIG.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ease-in-out group focus:outline-none focus:ring-2 focus:ring-purple-500 ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-800' : 'text-gray-400 hover:bg-gray-700/50 hover:text-purple-300' } `}>
                  <tab.icon /> {tab.label}
                  {activeTab === tab.id && <span className="ml-auto text-xs opacity-90 transform transition-transform duration-150 group-hover:translate-x-1">→</span>}
                </button>
              ))}
            </nav>
          </aside>

          <main ref={reportMainContentRef} id="report-content-to-print" className="lg:w-3/4 xl:w-4/5 bg-gray-800 shadow-xl rounded-xl border border-gray-700 p-6 md:p-10 min-h-[60vh]">
            {renderTabContent()}
          </main>
        </div>

        {/* --- SECCIÓN DE FEEDBACK --- */}
        {fullReportData && isAuthenticated && (
          <div className="mt-12 p-6 bg-gray-800 shadow-xl rounded-xl border border-gray-700">
            <h3 className="text-xl font-semibold text-purple-300 mb-1">¿Te resultó útil este informe?</h3>
            <p className="text-sm text-gray-400 mb-4">Tu opinión nos ayuda a mejorar la calidad de los informes generados.</p>
            
            {feedbackSubmitSuccess ? (
              <div className="p-4 bg-green-600/20 border border-green-500 rounded-md text-green-300">
                <p className="font-semibold">¡Gracias por tu feedback!</p>
                <p className="text-sm">Hemos recibido tus comentarios.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit}>
                <div className="mb-4 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setFeedbackRating('util')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all
                      ${feedbackRating === 'util' ? 'bg-green-500 text-white ring-2 ring-green-300 ring-offset-2 ring-offset-gray-800' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                  >
                    <ThumbUpIcon className="w-4 h-4" /> Sí, fue útil
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackRating('no_util')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all
                      ${feedbackRating === 'no_util' ? 'bg-red-500 text-white ring-2 ring-red-300 ring-offset-2 ring-offset-gray-800' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                  >
                     <ThumbDownIcon className="w-4 h-4" /> No mucho
                  </button>
                </div>

                <div className="mb-4">
                  <label htmlFor="feedbackComment" className="block text-sm font-medium text-gray-300 mb-1">
                    Comentarios adicionales (opcional):
                  </label>
                  <textarea
                    id="feedbackComment"
                    name="comment"
                    rows={3}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-500"
                    placeholder="¿Hay algo específico que te gustó, no te gustó, o que podríamos mejorar?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingFeedback || !feedbackRating}
                  className="inline-flex items-center px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white font-semibold rounded-md shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  {isSubmittingFeedback ? (
                    <> <IconWrapper className="w-4 h-4 animate-spin mr-2"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> </IconWrapper> Enviando... </>
                  ) : 'Enviar Feedback'}
                </button>

                {feedbackSubmitError && (
                  <p className="mt-3 text-sm text-red-400">{feedbackSubmitError}</p>
                )}
              </form>
            )}
          </div>
        )}
        {/* --- FIN SECCIÓN DE FEEDBACK --- */}

      </div>
    </div>
  );
}

export default function IdeaReportPage() {
  return (
      <IdeaReportContent />
  );
}
