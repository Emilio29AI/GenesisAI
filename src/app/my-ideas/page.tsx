// src/app/my-ideas/page.tsx
"use client";

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PayPalButtonWrapper from '@/components/PayPalButtonWrapper';

// --- INICIO Iconos SVG ---
const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "w-4 h-4" }) => ( <span className={`${className} inline-block align-middle`}>{children}</span> );
const LockIcon = () => ( <IconWrapper className="w-4 h-4 mr-1.5"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /> </svg> </IconWrapper> );
const CheckIcon = () => ( <IconWrapper className="w-4 h-4 mr-1.5"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /> </svg> </IconWrapper> );
const PlusIcon = () => ( <IconWrapper className="w-4 h-4 mr-1.5"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /> </svg> </IconWrapper> );
const EyeIcon = () => ( <IconWrapper className="w-4 h-4 mr-1.5"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> </svg> </IconWrapper> );
const TrashIcon = () => ( <IconWrapper className="w-5 h-5"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /> </svg> </IconWrapper> );
// --- FIN Iconos SVG ---

interface IdeaFromDB {
    id: number; user_id: string; created_at: string; updated_at: string; idea_name: string; idea_description: string;
    personalization_justification: string; suggested_business_model: string;
    preliminary_viability_analysis: { oportunidad_disruptiva: string; riesgo_clave_no_obvio: string; };
    suggested_next_steps: string[]; is_detailed_report_purchased: boolean; detailed_report_content?: any; payment_provider?: 'mercadopago' | 'paypal';
    _productType?: 'detailed_report' | 'extended_viability'; is_extended_viability_purchased?: boolean; extended_viability_content?: any;
}  
interface ApiError { detail: string; }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DETAILED_REPORT_PRICE_DISPLAY_ARS = "ARS 10.000";
const DETAILED_REPORT_PRICE_USD_PAYPAL = "10.00"; // Modificado para que sea solo el número

const EXTENDED_VIABILITY_PRICE_DISPLAY_ARS = "ARS 5.000"; 
const EXTENDED_VIABILITY_PRICE_USD_PAYPAL = "5.00";  

function MyIdeasContent() {
  const { user, session, isLoading: authIsLoading, isAuthenticated } = useAuth();
  const [myIdeas, setMyIdeas] = useState<IdeaFromDB[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<IdeaFromDB | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<IdeaFromDB | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isPaymentConfirmModalOpen, setIsPaymentConfirmModalOpen] = useState(false);
  const [ideaForPaymentConfirmation, setIdeaForPaymentConfirmation] = useState<IdeaFromDB | null>(null);
  
  const [isProcessingExtendedViaMP, setIsProcessingExtendedViaMP] = useState<number | null>(null);
  const [isPreparingPayPalForExtended, setIsPreparingPayPalForExtended] = useState<number | null>(null);
  const [showPayPalButtonsForExtended, setShowPayPalButtonsForExtended] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const openModalWithIdea = (idea: IdeaFromDB) => { setSelectedIdea(idea); setIsModalOpen(true); };
  const closeModal = useCallback(() => { setIsModalOpen(false); setSelectedIdea(null); }, []);
  const closeDeleteModal = useCallback(() => { setIsDeleteModalOpen(false); setIdeaToDelete(null); }, []);
  
  const openPaymentConfirmModal = useCallback((idea: IdeaFromDB, productType: 'detailed_report' | 'extended_viability') => {
    console.log(`[MyIdeas] Abriendo modal de confirmación de pago para idea ID: ${idea.id}, producto: ${productType}`);
    setIdeaForPaymentConfirmation({ ...idea, _productType: productType });
    setIsPaymentConfirmModalOpen(true);
    
    setShowPayPalButtonsForExtended(false);
    setIsPreparingPayPalForExtended(null);
    if (productType === 'extended_viability') {
      setIsProcessingExtendedViaMP(null);
    }
  }, []);

  const closePaymentConfirmModal = useCallback(() => {
    setIsPaymentConfirmModalOpen(false);
    setIdeaForPaymentConfirmation(null); 
    
    setShowPayPalButtonsForExtended(false);
    setIsPreparingPayPalForExtended(null);
    setIsProcessingExtendedViaMP(null);
  }, []);

  const handleAcquireExtendedModule = (idea: IdeaFromDB) => {
    if (!idea.id) {
        toast.error("La idea no tiene un ID válido para adquirir el módulo.");
        return;
    }
    if (idea.is_extended_viability_purchased) {
        toast.info("Ya has adquirido el Análisis Extendido para esta idea.");
        return;
    }
    if (!idea.is_detailed_report_purchased) {
        toast.warn("Debes adquirir primero el Informe Detallado para poder comprar el Análisis Extendido.");
        return;
    }
    if (authIsLoading) {
        toast.info("Verificando tu sesión...");
        return;
    }
    if (!isAuthenticated || !session?.access_token) {
        toast.warn("Debes iniciar sesión para adquirir módulos adicionales.");
        try {
            sessionStorage.setItem('pendingAction_myIdeas', JSON.stringify({ 
                type: 'acquireExtendedModule', 
                ideaId: idea.id,
            }));
             if (myIdeas.length > 0) {
                sessionStorage.setItem('myIdeas_tempState', JSON.stringify(myIdeas));
            }
        } catch (e) {
            console.error("Error guardando pendingAction_myIdeas en sessionStorage:", e);
        }
        router.push(`/login?redirect=${pathname}&action=pendingExtendedModule_myIdeas`);
        return;
    }
    openPaymentConfirmModal(idea, 'extended_viability');
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => { 
        if (event.key === 'Escape') { 
            if (isModalOpen) closeModal(); 
            if (isDeleteModalOpen) closeDeleteModal();
            if (isPaymentConfirmModalOpen) closePaymentConfirmModal();
        } 
    };
    if (isModalOpen || isDeleteModalOpen || isPaymentConfirmModalOpen) {
        document.body.style.overflow = 'hidden'; 
        window.addEventListener('keydown', handleEsc); 
        return () => { 
            document.body.style.overflow = 'unset'; 
            window.removeEventListener('keydown', handleEsc); 
        }; 
    }
  }, [isModalOpen, closeModal, isDeleteModalOpen, closeDeleteModal, isPaymentConfirmModalOpen, closePaymentConfirmModal]);
  
  const fetchMyIdeas = useCallback(async () => {
    if (isAuthenticated && session?.access_token) { 
        setPageLoading(true); 
        setError(null); 
        try { 
            const response = await fetch(`${API_BASE_URL}/api/v1/ideas/me`, { 
                method: 'GET', 
                headers: { 
                    'Authorization': `Bearer ${session.access_token}`, 
                    'Content-Type': 'application/json' 
                }, 
            }); 
            if (!response.ok) { 
                let errorDetail = `Error ${response.status}`; 
                try { 
                    const errorData: ApiError = await response.json(); 
                    errorDetail = errorData.detail || errorDetail; 
                } catch (e) {} 
                throw new Error(errorDetail); 
            } 
            const data: IdeaFromDB[] = await response.json(); 
            setMyIdeas(data); 
        } catch (err: any) { 
            const errorMessage = err.message || "No se pudieron cargar tus ideas."; 
            setError(errorMessage); 
            toast.error(errorMessage); 
        } finally { 
            setPageLoading(false); 
        } 
    } else { 
        setMyIdeas([]); 
        setPageLoading(false); 
    }
  }, [isAuthenticated, session, API_BASE_URL]);

  useEffect(() => {
    if (!authIsLoading) { 
        if (isAuthenticated && session?.access_token) { 
            fetchMyIdeas(); 
        } else { 
            setMyIdeas([]); 
            setPageLoading(false); 
        } 
    }
  }, [authIsLoading, isAuthenticated, session, fetchMyIdeas]);

  const openDeleteModal = (idea: IdeaFromDB) => { setIdeaToDelete(idea); setIsDeleteModalOpen(true); };
  const confirmDeleteIdea = useCallback(async () => {
    if (!ideaToDelete || !ideaToDelete.id || !session?.access_token) { 
        toast.error("No se puede borrar."); 
        closeDeleteModal(); 
        return; 
    } 
    setIsDeleting(true); 
    try { 
        const response = await fetch(`${API_BASE_URL}/api/v1/ideas/${ideaToDelete.id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${session.access_token}` }, 
        }); 
        if (response.status === 204) { 
            toast.success(`Idea eliminada.`); 
            setMyIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== ideaToDelete.id)); 
        } else { 
            const errorData = await response.json().catch(() => null); 
            throw new Error(errorData?.detail || `Error al eliminar.`); 
        } 
    } catch (err: any) { 
        toast.error(err.message); 
    } finally { 
        setIsDeleting(false); 
        closeDeleteModal(); 
    }
  }, [ideaToDelete, session, closeDeleteModal, API_BASE_URL, setMyIdeas]);

  if (authIsLoading) { return <div className="min-h-screen flex items-center justify-center"><p>Verificando...</p></div>; }
  if (!isAuthenticated) { return <div className="min-h-screen flex flex-col items-center justify-center"><h1 className="text-2xl">Acceso Denegado</h1><Link href={`/login?redirect=${pathname}`}>Iniciar Sesión</Link></div>; }
  if (pageLoading && myIdeas.length === 0 && !error) { return <div className="min-h-screen flex items-center justify-center"><p>Cargando ideas...</p></div>; }

  return (
    <div className="relative min-h-screen bg-gray-900/20 text-white p-6 md:p-10">
      <div className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat -z-10 opacity-10 animate-pulse-opacity-slow" style={{ backgroundImage: "url('/background-mis-ideas.png')" }}></div>
      <div className="fixed inset-0 w-full h-full bg-black/70 -z-10"></div>
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8"> <h1 className="text-3xl md:text-4xl font-bold text-purple-400">Mis Ideas Guardadas</h1> <Link href="/generate-idea" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md shadow-md text-sm flex items-center justify-center"> <PlusIcon /> Generar Nueva Idea </Link> </div>
        {error && ( <div className="text-center py-10 bg-red-800/30 rounded-lg p-6 text-red-300"> <p className="text-xl">Error</p> <p>{error}</p> <button onClick={() => fetchMyIdeas()} className="mt-4 px-4 py-2 bg-purple-600 rounded-md">Reintentar</button> </div> )}
        {!error && myIdeas.length === 0 && !pageLoading && ( <div className="text-center py-10 bg-gray-800/50 rounded-lg p-6"> <p className="text-xl text-gray-400 mb-4">No has guardado ideas.</p> <Link href="/generate-idea" className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-md"> <PlusIcon /> Generar Primera Idea </Link> </div> )}

        {!error && myIdeas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myIdeas.map((idea) => (
              <div key={idea.id} className="flex flex-col bg-gray-800/80 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-700/60 hover:border-purple-500/70 transition-all duration-300 relative">
                <button onClick={() => openDeleteModal(idea)} disabled={isDeleting && ideaToDelete?.id === idea.id} className="absolute top-3 right-3 p-1.5 bg-red-500/30 hover:bg-red-500/60 rounded-full text-red-300 hover:text-red-100 transition-colors z-10 flex items-center justify-center" aria-label="Eliminar idea" style={{ width: '2rem', height: '2rem' }}> {isDeleting && ideaToDelete?.id === idea.id ? <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span> : <TrashIcon />} </button>
                <h3 className="text-xl font-semibold text-purple-300 mb-2 pr-10">{idea.idea_name}</h3>
                <p className="text-gray-400 text-sm mb-1 flex-grow"> <strong className="text-gray-200">Descripción:</strong> {idea.idea_description.substring(0, 80)}{idea.idea_description.length > 80 ? "..." : ""} </p>
                <p className="text-xs text-gray-500 mb-4"> Guardada el: {idea.created_at ? new Date(idea.created_at).toLocaleDateString() : 'N/A'} </p>
                <div className="mt-auto space-y-2">
                  <button onClick={() => openModalWithIdea(idea)} className="w-full text-sm text-purple-400 hover:text-purple-300 py-2 px-3 rounded-md border border-purple-500 hover:bg-purple-500/20 transition-colors flex items-center justify-center"> <EyeIcon /> Ver Resumen Básico </button>
                  <button
                      onClick={() => {
                        if (idea.is_detailed_report_purchased) {
                          if (idea.id) {
                            router.push(`/idea/${idea.id}/report`);
                          } else {
                            toast.error("Error: Idea sin ID para ver el informe.");
                          }
                        } else {
                          if (idea.id) {
                            openPaymentConfirmModal(idea, 'detailed_report'); 
                          } else {
                            toast.error("Error: Idea sin ID para adquirir informe."); 
                          }
                        }
                      }}
                      className={`w-full text-sm py-2 px-3 rounded-md border transition-colors disabled:opacity-50 flex items-center justify-center ${
                        idea.is_detailed_report_purchased
                          ? 'text-green-400 border-green-600 bg-green-600/20 cursor-pointer hover:bg-green-600/30'
                          : 'text-blue-400 hover:text-blue-300 border-blue-600 hover:bg-blue-600/20'
                      }`}
                  >
                      { idea.is_detailed_report_purchased
                          ? <><CheckIcon /> Ver Informe Detallado</>
                          : <><LockIcon /> Adquirir Informe Detallado <span className="ml-1.5 text-xs font-medium text-purple-300">({DETAILED_REPORT_PRICE_DISPLAY_ARS})</span></>
                      }
                  </button>
                  <button 
                      onClick={() => handleAcquireExtendedModule(idea)}
                      disabled={
                          !idea.is_detailed_report_purchased || 
                          idea.is_extended_viability_purchased || 
                          isProcessingExtendedViaMP === idea.id ||
                          isPreparingPayPalForExtended === idea.id 
                      }
                      className={`w-full text-sm py-2 px-3 rounded-md border transition-colors flex items-center justify-center
                          ${!idea.is_detailed_report_purchased 
                              ? 'text-gray-500 border-gray-600 bg-gray-700/30 cursor-not-allowed opacity-60' 
                              : idea.is_extended_viability_purchased
                                  ? 'text-teal-400 border-teal-600 bg-teal-600/20 hover:bg-teal-600/30 cursor-pointer'
                                  : 'text-amber-400 hover:text-amber-300 border-amber-600 hover:bg-amber-600/20'
                          }
                          ${(isProcessingExtendedViaMP === idea.id && !idea.is_extended_viability_purchased) || (isPreparingPayPalForExtended === idea.id && !idea.is_extended_viability_purchased) ? 'opacity-70 cursor-wait' : ''}
                      `}
                      title={
                          !idea.is_detailed_report_purchased 
                          ? "Primero debes adquirir el Informe Detallado" 
                          : (idea.is_extended_viability_purchased 
                              ? "Ya tienes este análisis avanzado" 
                              : `Adquirir Análisis Avanzado (${EXTENDED_VIABILITY_PRICE_DISPLAY_ARS})`)
                      }
                  >
                      {(isProcessingExtendedViaMP === idea.id && !idea.is_extended_viability_purchased) || (isPreparingPayPalForExtended === idea.id && !idea.is_extended_viability_purchased) ? (
                          <> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Procesando...</>
                      ) : idea.is_extended_viability_purchased ? (
                          <><CheckIcon /> Análisis Avanzado Adquirido</>
                      ) : (
                          <><PlusIcon /> Adquirir Análisis Avanzado</> 
                      )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && selectedIdea && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in-up scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"> <h2 className="text-2xl md:text-3xl font-bold text-purple-400">{selectedIdea.idea_name}</h2> <button onClick={closeModal} className="text-gray-400 hover:text-white text-3xl leading-none p-1 -mr-2" aria-label="Cerrar modal">×</button> </div>
            <div className="space-y-3 text-gray-300">
              <p><strong className="text-gray-100">Descripción:</strong> {selectedIdea.idea_description}</p>
              <p><strong className="text-gray-100">Justificación Personal:</strong> {selectedIdea.personalization_justification}</p>
              <p><strong className="text-gray-100">Modelo de Negocio Sugerido:</strong> {selectedIdea.suggested_business_model}</p>
              <div className="p-3 bg-gray-700/50 rounded mt-2"><strong className="text-gray-100 block mb-1 text-sm">Análisis de Viabilidad:</strong><p className="text-xs md:text-sm"><span className="font-medium text-purple-300">Oportunidad:</span> {selectedIdea.preliminary_viability_analysis.oportunidad_disruptiva}</p><p className="text-xs md:text-sm"><span className="font-medium text-purple-300">Riesgo:</span> {selectedIdea.preliminary_viability_analysis.riesgo_clave_no_obvio}</p></div>
              {selectedIdea.is_detailed_report_purchased && ( <div className="mt-6 pt-4 border-t border-gray-700"> <h3 className="text-sm font-semibold text-green-400 mb-1">Informe Detallado Adquirido</h3> <p className="text-xs text-gray-400">Puedes ver el informe completo.</p> </div> )}
              
              <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                    onClick={() => {
                        if (selectedIdea?.is_detailed_report_purchased) {
                            if (selectedIdea.id) {
                                closeModal();
                                router.push(`/idea/${selectedIdea.id}/report`);
                            } else {
                                toast.error("Error: Idea sin ID para ver el informe.");
                            }
                        } else { 
                            if (selectedIdea?.id) {
                                closeModal(); 
                                console.log(`MyIdeasPage MODAL: Redirecting to checkout for idea ID: ${selectedIdea.id}`);
                                router.push(`/idea/${selectedIdea.id}/checkout`);
                            } else {
                                toast.error("Error: Idea sin ID para adquirir informe.");
                            }
                        }
                    }}
                    className={`w-full sm:w-auto px-5 py-2.5 font-semibold rounded-md shadow-md disabled:opacity-50 flex items-center justify-center ${
                        selectedIdea?.is_detailed_report_purchased
                        ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                    { selectedIdea?.is_detailed_report_purchased
                        ? <><CheckIcon /> Ver Informe Detallado</>
                        : <><LockIcon /> Adquirir Informe Detallado <span className="ml-1.5 text-xs font-medium text-purple-300">({DETAILED_REPORT_PRICE_DISPLAY_ARS})</span></>
                    }
                </button>
                <button onClick={closeModal} className="w-full sm:w-auto px-5 py-2.5 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md shadow-md flex items-center justify-center">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPaymentConfirmModalOpen && ideaForPaymentConfirmation && (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" 
            onClick={closePaymentConfirmModal}
        >
            <div
                className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-purple-400">
                        Confirmar Adquisición: {ideaForPaymentConfirmation._productType === 'extended_viability' 
                            ? 'Análisis Extendido de Viabilidad' 
                            : 'Informe Detallado'}
                    </h2>
                    <button 
                        onClick={closePaymentConfirmModal} 
                        className="text-gray-400 hover:text-white text-3xl leading-none p-1 -mr-2"
                        aria-label="Cerrar modal"
                    >×</button>
                </div>

                <div className="space-y-4 text-gray-300">
                    <p>
                    Estás a punto de adquirir el <strong className="text-purple-300">{
                        ideaForPaymentConfirmation._productType === 'extended_viability' 
                            ? 'Análisis Extendido de Viabilidad' 
                            : 'Informe Detallado'
                    }</strong> para la idea:
                    </p>
                    <p className="text-lg font-semibold text-white bg-gray-700/50 p-3 rounded-md break-words">
                        {ideaForPaymentConfirmation.idea_name}
                    </p>
                    <p className="text-sm">
                        {ideaForPaymentConfirmation._productType === 'extended_viability' 
                            ? "Este módulo profundiza en la viabilidad, validación de hipótesis y estrategias de mitigación de riesgos para complementar tu informe detallado."
                            : "Este informe te proporcionará un análisis exhaustivo, incluyendo estrategias de mercado, modelo de negocio detallado, plan de acción paso a paso, y mucho más."
                        }
                    </p>
                    
                    {!showPayPalButtonsForExtended && (
                        <div className="text-center my-4 space-y-2">
                            <div>
                                <p className="text-sm text-gray-400">Precio (Mercado Pago):</p>
                                <p className="text-2xl font-bold text-green-400">
                                    {ideaForPaymentConfirmation._productType === 'extended_viability' 
                                        ? EXTENDED_VIABILITY_PRICE_DISPLAY_ARS 
                                        : DETAILED_REPORT_PRICE_DISPLAY_ARS}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">o Precio (PayPal):</p>
                                <p className="text-2xl font-bold text-green-400">
                                    USD {ideaForPaymentConfirmation._productType === 'extended_viability' 
                                        ? EXTENDED_VIABILITY_PRICE_USD_PAYPAL 
                                        : DETAILED_REPORT_PRICE_USD_PAYPAL}
                                </p>
                            </div>
                        </div>
                    )}

                     {(isPreparingPayPalForExtended === ideaForPaymentConfirmation.id) && !showPayPalButtonsForExtended && ideaForPaymentConfirmation && (
                         <p className="text-center text-sm text-gray-400 py-2">Preparando pago con PayPal...</p>
                    )}

                    <p className="text-xs text-gray-500">
                        Al confirmar, serás redirigido a la pasarela de pago.
                    </p>
                </div>

                <div className="mt-8 flex flex-col space-y-3">
                    {!showPayPalButtonsForExtended && (
                        <>
                            <button
                                onClick={async () => {
                                    if (ideaForPaymentConfirmation && ideaForPaymentConfirmation.id) {
                                        if (ideaForPaymentConfirmation._productType === 'extended_viability') {
                                            setIsProcessingExtendedViaMP(ideaForPaymentConfirmation.id);
                                            console.log(`[MyIdeasModal] Iniciando checkout MP para Módulo Extendido, idea ID: ${ideaForPaymentConfirmation.id}`);
                                            toast.info("Checkout de Mercado Pago para Módulo Extendido (a implementar).");
                                        } else if (ideaForPaymentConfirmation._productType === 'detailed_report') {
                                            console.log(`[MyIdeasModal] Iniciando checkout MP para Informe Detallado, idea ID: ${ideaForPaymentConfirmation.id}`);
                                            router.push(`/idea/${ideaForPaymentConfirmation.id}/checkout`);
                                        }
                                    }
                                }}
                                disabled={
                                    (ideaForPaymentConfirmation && isProcessingExtendedViaMP === ideaForPaymentConfirmation.id) || 
                                    (ideaForPaymentConfirmation && isPreparingPayPalForExtended === ideaForPaymentConfirmation.id)
                                }
                                className="w-full px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-60 flex items-center justify-center"
                            >
                                { (ideaForPaymentConfirmation && isProcessingExtendedViaMP === ideaForPaymentConfirmation.id) 
                                    ? (<> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Procesando MP...</>)
                                    : ( "Pagar con Mercado Pago" )
                                }
                            </button>

                            <button
                                onClick={() => {
                                    if (ideaForPaymentConfirmation && ideaForPaymentConfirmation.id && ideaForPaymentConfirmation._productType) {
                                        setIsPreparingPayPalForExtended(ideaForPaymentConfirmation.id);
                                        console.log(`[MyIdeasModal] Preparando PayPal para ${ideaForPaymentConfirmation._productType}, idea ID: ${ideaForPaymentConfirmation.id}`);
                                        setTimeout(() => {
                                            setShowPayPalButtonsForExtended(true); 
                                        }, 500);
                                    }
                                }}
                                disabled={
                                    (ideaForPaymentConfirmation && isProcessingExtendedViaMP === ideaForPaymentConfirmation.id) || 
                                    (ideaForPaymentConfirmation && isPreparingPayPalForExtended === ideaForPaymentConfirmation.id)
                                }
                                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-60 flex items-center justify-center"
                            >
                                { (ideaForPaymentConfirmation && isPreparingPayPalForExtended === ideaForPaymentConfirmation.id && !showPayPalButtonsForExtended) 
                                    ? (<> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Preparando PayPal...</>)
                                    : ( "Pagar con PayPal" )
                                }
                            </button>
                        </>
                    )}

                    {showPayPalButtonsForExtended && ideaForPaymentConfirmation && ideaForPaymentConfirmation.id && ideaForPaymentConfirmation._productType && (
                        <PayPalButtonWrapper
                            key={`paypal-myideas-${ideaForPaymentConfirmation.id}-${ideaForPaymentConfirmation._productType}`} 
                            ideaName={ideaForPaymentConfirmation.idea_name}
                            ideaId={ideaForPaymentConfirmation.id}
                            priceUSD={
                                ideaForPaymentConfirmation._productType === 'extended_viability' 
                                    ? EXTENDED_VIABILITY_PRICE_USD_PAYPAL 
                                    : DETAILED_REPORT_PRICE_USD_PAYPAL
                            }
                            sessionAccessToken={session?.access_token}
                            apiBaseUrl={API_BASE_URL}
                            onPaymentSuccess={(paidIdeaId: number) => { // <--- CAMBIO AQUÍ: Solo un argumento
                                const currentProductType = ideaForPaymentConfirmation?._productType; // Obtener de la idea en el modal

                                if (!currentProductType) {
                                    console.error("[MyIdeasModal-PayPalSuccess] No se pudo determinar el productType para la idea ID:", paidIdeaId);
                                    toast.error("Error al procesar el tipo de producto después del pago.");
                                    closePaymentConfirmModal();
                                    setIsPreparingPayPalForExtended(null);
                                    return;
                                }
                                
                                toast.success(`¡${currentProductType === 'extended_viability' ? 'Análisis Extendido' : 'Informe Detallado'} adquirido con PayPal para idea ID ${paidIdeaId}!`);
                                
                                setMyIdeas(prevIdeas => prevIdeas.map(i => {
                                    if (i.id === paidIdeaId) {
                                        const updatedIdea = currentProductType === 'extended_viability'
                                            ? { ...i, is_extended_viability_purchased: true, payment_provider: 'paypal' as const }
                                            : { ...i, is_detailed_report_purchased: true, payment_provider: 'paypal' as const };
                                        console.log("[MyIdeasModal-PayPalSuccess] Actualizando idea en myIdeas:", updatedIdea);
                                        return updatedIdea;
                                    }
                                    return i;
                                }));

                                if(selectedIdea?.id === paidIdeaId) {
                                    setSelectedIdea(prev => {
                                        if (!prev) return null;
                                        return currentProductType === 'extended_viability'
                                            ? {...prev, is_extended_viability_purchased: true, payment_provider: 'paypal'}
                                            : {...prev, is_detailed_report_purchased: true, payment_provider: 'paypal'};
                                    });
                                }
                                
                                try {
                                    const signalKey = 'genesisAI_action_completed_v1'; 
                                    const purchaseUpdateSignal = { 
                                        actionCompletedForIdeaId: paidIdeaId.toString(),
                                        is_detailed_report_purchased: currentProductType === 'detailed_report',
                                        is_extended_viability_purchased: currentProductType === 'extended_viability',
                                        payment_provider: 'paypal',
                                        timestamp: Date.now() 
                                    };
                                    sessionStorage.setItem(signalKey, JSON.stringify(purchaseUpdateSignal));
                                    console.log(`[MyIdeasModal-PayPalSuccess] Señal guardada en sessionStorage para idea ID ${paidIdeaId}`);
                                } catch (e) { console.error("[MyIdeasModal-PayPalSuccess] Error guardando señal:", e); }

                                closePaymentConfirmModal();
                                setIsPreparingPayPalForExtended(null);

                                if (currentProductType === 'extended_viability') {
                                    // Considerar si se redirige o no
                                } else {
                                    router.push(`/idea/${paidIdeaId}/report`);
                                }
                            }}
                            onPaymentError={(errorMessage, orderId) => {
                                let finalMessage = `Error con PayPal: ${errorMessage}`;
                                if (orderId) finalMessage += ` (Pedido ID: ${orderId})`;
                                toast.error(finalMessage);
                                setIsPreparingPayPalForExtended(null);
                            }}
                            onPaymentCancel={() => {
                                toast.info("Has cancelado el pago con PayPal.");
                                setIsPreparingPayPalForExtended(null);
                                setShowPayPalButtonsForExtended(false);
                            }}
                            onProcessingEnd={() => {
                                setIsPreparingPayPalForExtended(null);
                                setShowPayPalButtonsForExtended(false); 
                            }}
                        />
                    )}
                    
                    { (!showPayPalButtonsForExtended || (showPayPalButtonsForExtended && !(isPreparingPayPalForExtended === ideaForPaymentConfirmation?.id)) ) && (
                        <button
                            onClick={closePaymentConfirmModal}
                            disabled={isPreparingPayPalForExtended === ideaForPaymentConfirmation?.id || isProcessingExtendedViaMP === ideaForPaymentConfirmation?.id}
                            className="w-full sm:w-auto mt-2 px-6 py-2.5 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-70"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>
        </div>
    )}

      {isDeleteModalOpen && ideaToDelete && ( <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={closeDeleteModal} > <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up" onClick={(e) => e.stopPropagation()}> <h2 className="text-xl font-semibold text-red-400 mb-4">Confirmar Eliminación</h2> <p className="text-gray-300 mb-6"> ¿Seguro quieres eliminar la idea <strong className="text-purple-300">"{ideaToDelete.idea_name}"</strong>? Esta acción no se puede deshacer. </p> <div className="flex justify-end space-x-3"> <button onClick={closeDeleteModal} disabled={isDeleting} className="px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-md shadow-md disabled:opacity-50" > Cancelar </button> <button onClick={confirmDeleteIdea} disabled={isDeleting} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-md disabled:opacity-50 flex items-center justify-center" > {isDeleting ? ( <> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Eliminando...</> ) : ( "Eliminar Idea" )} </button> </div> </div> </div> )}
    </div>
  );
}

export default function MyIdeasPage() {
  return ( <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Cargando...</p></div>}> <MyIdeasContent /> </Suspense> );
}
