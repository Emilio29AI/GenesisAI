// src/app/my-ideas/page.tsx
"use client";

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    suggested_next_steps: string[]; is_detailed_report_purchased: boolean; detailed_report_content?: any;
}
interface ApiError { detail: string; }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const DETAILED_REPORT_PRICE_DISPLAY = "ARS 10.000"; // Usar esta constante para mostrar el precio

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

  const router = useRouter();
  const pathname = usePathname();

  const openModalWithIdea = (idea: IdeaFromDB) => { setSelectedIdea(idea); setIsModalOpen(true); };
  const closeModal = useCallback(() => { setIsModalOpen(false); setSelectedIdea(null); }, []);
  const closeDeleteModal = useCallback(() => { setIsDeleteModalOpen(false); setIdeaToDelete(null); }, []);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') { if (isModalOpen) closeModal(); if (isDeleteModalOpen) closeDeleteModal(); } };
    if (isModalOpen || isDeleteModalOpen) { document.body.style.overflow = 'hidden'; window.addEventListener('keydown', handleEsc); return () => { document.body.style.overflow = 'unset'; window.removeEventListener('keydown', handleEsc); }; }
  }, [isModalOpen, closeModal, isDeleteModalOpen, closeDeleteModal]);

  const fetchMyIdeas = useCallback(async () => {
    if (isAuthenticated && session?.access_token) { setPageLoading(true); setError(null); try { const response = await fetch(`${API_BASE_URL}/api/v1/ideas/me`, { method: 'GET', headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, }); if (!response.ok) { let errorDetail = `Error ${response.status}`; try { const errorData: ApiError = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) {} throw new Error(errorDetail); } const data: IdeaFromDB[] = await response.json(); setMyIdeas(data); } catch (err: any) { const errorMessage = err.message || "No se pudieron cargar tus ideas."; setError(errorMessage); toast.error(errorMessage); } finally { setPageLoading(false); } } else { setMyIdeas([]); setPageLoading(false); }
  }, [isAuthenticated, session, API_BASE_URL]);

  useEffect(() => {
    if (!authIsLoading) { if (isAuthenticated && session?.access_token) { fetchMyIdeas(); } else { setMyIdeas([]); setPageLoading(false); } }
  }, [authIsLoading, isAuthenticated, session, fetchMyIdeas]);

  // YA NO SE USA handleUnlockReportFlow porque el botón redirige directamente.
  // Se elimina esta función o se comenta si se piensa reusar de otra forma.
  /*
  const handleUnlockReportFlow = useCallback((ideaId: number) => {
    if (!ideaId) {
        toast.error("ID de idea no válido.");
        return;
    }
    console.log(`Redirigiendo al checkout para idea ID: ${ideaId} desde handleUnlockReportFlow`);
    router.push(`/idea/${ideaId}/checkout`);
  }, [router]);
  */

const openDeleteModal = (idea: IdeaFromDB) => { setIdeaToDelete(idea); setIsDeleteModalOpen(true); };
  const confirmDeleteIdea = useCallback(async () => {
    if (!ideaToDelete || !ideaToDelete.id || !session?.access_token) { toast.error("No se puede borrar."); closeDeleteModal(); return; } setIsDeleting(true); try { const response = await fetch(`${API_BASE_URL}/api/v1/ideas/${ideaToDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${session.access_token}`, }, }); if (response.status === 204) { toast.success(`Idea eliminada.`); setMyIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== ideaToDelete.id)); } else { const errorData = await response.json().catch(() => null); throw new Error(errorData?.detail || `Error al eliminar.`); } } catch (err: any) { toast.error(err.message); } finally { setIsDeleting(false); closeDeleteModal(); }
  }, [ideaToDelete, session, closeDeleteModal, API_BASE_URL]);
    
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

                  {/* --- BOTÓN MODIFICADO EN LA TARJETA --- */}
                  <button
                      onClick={() => {
                        if (idea.is_detailed_report_purchased) {
                          if (idea.id) {
                            router.push(`/idea/${idea.id}/report`);
                          } else {
                            toast.error("Error: Idea sin ID para ver el informe."); // Caso improbable aquí
                          }
                        } else {
                          if (idea.id) { // Si no está comprado, y tiene ID, ir a checkout
                            console.log(`MyIdeasPage CARD: Redirecting to checkout for idea ID: ${idea.id}`);
                            router.push(`/idea/${idea.id}/checkout`);
                          } else {
                            toast.error("Error: Idea sin ID para adquirir informe."); // Caso improbable aquí
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
                          : <><LockIcon /> Adquirir Informe Detallado <span className="ml-1.5 text-xs font-medium text-purple-300">({DETAILED_REPORT_PRICE_DISPLAY})</span></>
                      }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Modal para Resumen Básico --- */}
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
                {/* --- BOTÓN MODIFICADO EN EL MODAL --- */}
                <button
                    onClick={() => {
                        if (selectedIdea?.is_detailed_report_purchased) {
                            if (selectedIdea.id) {
                                closeModal();
                                router.push(`/idea/${selectedIdea.id}/report`);
                            } else {
                                toast.error("Error: Idea sin ID para ver el informe.");
                            }
                        } else { // Si no está comprado, ir a checkout
                            if (selectedIdea?.id) {
                                closeModal(); // Cerrar modal antes de navegar
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
                        : <><LockIcon /> Adquirir Informe Detallado <span className="ml-1.5 text-xs font-medium text-purple-300">({DETAILED_REPORT_PRICE_DISPLAY})</span></>
                    }
                </button>
                <button onClick={closeModal} className="w-full sm:w-auto px-5 py-2.5 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md shadow-md flex items-center justify-center">Cerrar</button>
              </div>
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
