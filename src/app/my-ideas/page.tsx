// src/app/my-ideas/page.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext'; 
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; // useRouter importado
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- INICIO Iconos SVG (Reutilizados y nuevos si es necesario) ---
const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "w-4 h-4" }) => (
  <span className={`${className} inline-block mr-1.5 align-middle`}>{children}</span>
);
const LockIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /> </svg> </IconWrapper> );
const CheckIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /> </svg> </IconWrapper> );
const PlusIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /> </svg> </IconWrapper> );
const EyeIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> </svg> </IconWrapper> );
const ArrowLeftIcon = () => ( <IconWrapper className="w-4 h-4"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /> </svg> </IconWrapper> );
// --- FIN Iconos SVG ---

interface IdeaFromDB {
  id: number; 
  user_id: string; 
  created_at: string; 
  updated_at: string;
  idea_name: string;
  idea_description: string;
  personalization_justification: string;
  suggested_business_model: string;
  preliminary_viability_analysis: {
    oportunidad_disruptiva: string;
    riesgo_clave_no_obvio: string;
  };
  suggested_next_steps: string[];
  is_detailed_report_purchased: boolean; 
  detailed_report_content?: any; // Podrías usar DetailedReportContentSchema aquí si lo importas
}

interface ApiError { detail: string; }

export default function MyIdeasPage() {
  const { user, token, isLoading: authIsLoading, isAuthenticated } = useAuth();
  const [myIdeas, setMyIdeas] = useState<IdeaFromDB[]>([]);
  const [pageLoading, setPageLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const [unlockingIdeaId, setUnlockingIdeaId] = useState<number | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null); 
  const [unlockSuccess, setUnlockSuccess] = useState<string | null>(null); 

  const [selectedIdea, setSelectedIdea] = useState<IdeaFromDB | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter(); // <--- Hook de router
  const pathname = usePathname();

  const openModalWithIdea = (idea: IdeaFromDB) => { setSelectedIdea(idea); setIsModalOpen(true); };
  const closeModal = useCallback(() => { setIsModalOpen(false); setSelectedIdea(null); }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape' && isModalOpen) closeModal(); };
    if (isModalOpen) { 
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleEsc); 
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc); 
        }; 
    }
  }, [isModalOpen, closeModal]);

  const fetchMyIdeas = useCallback(async () => {
    if (!authIsLoading && isAuthenticated && token) {
      setPageLoading(true); setError(null);
      try {
        const response = await fetch('http://localhost:8000/api/v1/ideas/me', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!response.ok) { 
          let errorDetail = `Error ${response.status} al cargar ideas`;
          try { const errorData: ApiError = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) { /* no-op */ }
          throw new Error(errorDetail); 
        }
        const data: IdeaFromDB[] = await response.json();
        setMyIdeas(data);
      } catch (err: any) { setError(err.message || "No se pudieron cargar tus ideas."); } 
      finally { setPageLoading(false); }
    } else if (!authIsLoading && !isAuthenticated) {
      setPageLoading(false); 
    }
  }, [isAuthenticated, token, authIsLoading]); 

  useEffect(() => {
    fetchMyIdeas(); 
  }, [fetchMyIdeas]);

  // --- MODIFICADO handleUnlockReport ---
  const handleUnlockReport = useCallback(async (ideaToUnlock: IdeaFromDB | null) => {
    if (!ideaToUnlock || !ideaToUnlock.id) {
      toast.error("Error: ID de idea no válido para desbloquear.");
      return;
    }

    // Si ya está comprado, NAVEGAR a la página del informe
    if (ideaToUnlock.is_detailed_report_purchased) {
      console.log(`Navegando a informe detallado para idea ID: ${ideaToUnlock.id} desde Mis Ideas`);
      router.push(`/idea/${ideaToUnlock.id}/report`);
      return; 
    }

    setUnlockError(null); setUnlockSuccess(null);
    if (authIsLoading) { alert("Verificando sesión..."); return; } // Podrías usar toast aquí también
    if (!isAuthenticated || !token) {
      alert("Debes iniciar sesión para desbloquear informes."); // Podrías usar toast aquí también
      router.push(`/login?redirect=${pathname}`); // Considera añadir ?action=unlockPending&ideaId=${ideaToUnlock.id} si quieres auto-desbloqueo post-login
      return;
    }
    
    const confirmUnlock = window.confirm(
      `Estás a punto de desbloquear el informe detallado para "${ideaToUnlock.idea_name}".\n(Simulación de pago)\n\n¿Deseas continuar?`
    );
    if (!confirmUnlock) {
      // toast.info("Desbloqueo cancelado."); // Opcional: usar toast
      return;
    }

    setUnlockingIdeaId(ideaToUnlock.id);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/ideas/${ideaToUnlock.id}/unlock-report`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
      });
      const updatedIdeaDataFromServer = await response.json(); // El backend devuelve la idea completa actualizada
      if (!response.ok) { const apiError = updatedIdeaDataFromServer as ApiError; throw new Error(apiError.detail || `Error ${response.status}`);}
      
      // setUnlockSuccess(`¡Informe para "${updatedIdeaDataFromServer.idea_name}" desbloqueado!`); // Quitar o reemplazar con toast
      // setTimeout(() => setUnlockSuccess(null), 4000);
      alert(`¡Informe para "${updatedIdeaDataFromServer.idea_name}" desbloqueado! Serás redirigido.`); // Usar toast sería mejor

      const finalUpdatedIdea: IdeaFromDB = { 
        ...ideaToUnlock, 
        ...updatedIdeaDataFromServer, // El backend devuelve la idea con el informe y el flag
        is_detailed_report_purchased: true // Asegurar que el flag esté explícitamente
      };
      
      // Actualizar el estado local
      setMyIdeas(prev => prev.map(i => i.id === ideaToUnlock.id ? finalUpdatedIdea : i));
      if (selectedIdea?.id === ideaToUnlock.id) {
        // Si el modal está abierto, actualiza su contenido también
        // O cierra el modal antes de navegar
        setSelectedIdea(finalUpdatedIdea); 
      }
      
      // NAVEGAR después de desbloqueo exitoso
      console.log(`Desbloqueo exitoso en Mis Ideas, navegando a informe para idea ID: ${finalUpdatedIdea.id}`);
      router.push(`/idea/${finalUpdatedIdea.id}/report`);

    } catch (err: any) {
      console.error("Error al desbloquear informe:", err);
      setUnlockError(err.message || "Error al desbloquear."); // Usar toast sería mejor
      setTimeout(() => setUnlockError(null), 4000);
    } finally {
      setUnlockingIdeaId(null);
    }
  }, [authIsLoading, isAuthenticated, token, router, pathname, selectedIdea, isModalOpen, openModalWithIdea, closeModal]);


  if (authIsLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><p>Verificando tu sesión...</p></div>;
  
  if (!isAuthenticated) {
    return ( 
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6"> 
        <h1 className="text-2xl font-semibold mb-4">Acceso Denegado</h1> 
        <p className="mb-6">Debes iniciar sesión para ver tus ideas guardadas.</p> 
        <Link href={`/login?redirect=${pathname}`} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold"> Iniciar Sesión </Link> 
      </div> 
    );
  }

  if (pageLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><p>Cargando tus ideas guardadas...</p></div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-purple-400">Mis Ideas Guardadas</h1>
            <Link href="/generate-idea" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md shadow-md text-sm flex items-center justify-center">
                <PlusIcon /> Generar Nueva Idea
            </Link>
        </div>

        {error && <p className="my-4 text-center text-red-400">Error al cargar ideas: {error}</p>}
        {/* Considera usar toasts para unlockError y unlockSuccess en lugar de estos <p> */}
        {unlockError && <p className="my-4 text-center text-red-400">Error al desbloquear: {unlockError}</p>}
        {unlockSuccess && <p className="my-4 text-center text-green-400">{unlockSuccess}</p>}


        {myIdeas.length === 0 && !pageLoading && !error && (
          <div className="text-center py-10">
            <p className="text-xl text-gray-400 mb-4">Aún no has guardado ninguna idea.</p>
            <Link href="/generate-idea" className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-md flex items-center justify-center">
              <PlusIcon /> ¡Genera tu Primera Idea!
            </Link>
          </div>
        )}

        {myIdeas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myIdeas.map((idea) => (
              <div key={idea.id} className="flex flex-col bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300">
                <h3 className="text-xl font-semibold text-purple-300 mb-2">{idea.idea_name}</h3>
                <p className="text-gray-400 text-sm mb-1 flex-grow">
                    <strong className="text-gray-200">Descripción:</strong> {idea.idea_description.substring(0, 80)}{idea.idea_description.length > 80 ? "..." : ""}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                    Guardada el: {idea.created_at ? new Date(idea.created_at).toLocaleDateString() : 'N/A'}
                </p>
                <div className="mt-auto space-y-2">
                  <button
                    onClick={() => openModalWithIdea(idea)} // Este abre el modal con el resumen básico
                    className="w-full text-sm text-purple-400 hover:text-purple-300 py-2 px-3 rounded-md border border-purple-500 hover:bg-purple-500/20 transition-colors flex items-center justify-center"
                  >
                    <EyeIcon /> Ver Resumen Básico {/* Texto actualizado */}
                  </button>
                  
                  {/* --- BOTÓN MODIFICADO --- */}
                  <button 
                      onClick={() => handleUnlockReport(idea)} // handleUnlockReport ahora maneja la navegación
                      disabled={unlockingIdeaId === idea.id && !idea.is_detailed_report_purchased}
                      className={`w-full text-sm py-2 px-3 rounded-md border transition-colors disabled:opacity-50 flex items-center justify-center ${
                        idea.is_detailed_report_purchased 
                          ? 'text-green-400 border-green-600 bg-green-600/20 cursor-pointer' 
                          : 'text-blue-400 hover:text-blue-300 border-blue-600 hover:bg-blue-600/20'
                      }`}
                  >
                      {unlockingIdeaId === idea.id && !idea.is_detailed_report_purchased ? (
                          <> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" role="status" aria-label="loading"></span> Desbloqueando...</>
                      ) : (
                          idea.is_detailed_report_purchased 
                              ? <><CheckIcon /> Ver Informe Detallado</> // Texto actualizado
                              : <><LockIcon /> Desbloquear Informe</>
                      )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL (Sigue mostrando el resumen básico y acciones del informe) */}
      {isModalOpen && selectedIdea && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in-up scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-purple-400">{selectedIdea.idea_name}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white text-3xl leading-none p-1 -mr-2" aria-label="Cerrar modal">×</button>
            </div>
            <div className="space-y-3 text-gray-300">
              {/* Contenido del resumen básico ... */}
              <p><strong className="text-gray-100">Descripción:</strong> {selectedIdea.idea_description}</p>
              <p><strong className="text-gray-100">Justificación Personal:</strong> {selectedIdea.personalization_justification}</p>
              <p><strong className="text-gray-100">Modelo de Negocio Sugerido:</strong> {selectedIdea.suggested_business_model}</p>
              <div className="p-3 bg-gray-700/50 rounded mt-2">
                <strong className="text-gray-100 block mb-1 text-sm">Análisis de Viabilidad:</strong>
                <p className="text-xs md:text-sm"><span className="font-medium text-purple-300">Oportunidad:</span> {selectedIdea.preliminary_viability_analysis.oportunidad_disruptiva}</p>
                <p className="text-xs md:text-sm"><span className="font-medium text-purple-300">Riesgo:</span> {selectedIdea.preliminary_viability_analysis.riesgo_clave_no_obvio}</p>
              </div>
              <div>
                <strong className="text-gray-100 block mb-1 text-sm">Siguientes Pasos:</strong>
                <ul className="list-disc list-inside ml-4 space-y-1 text-xs md:text-sm">
                  {selectedIdea.suggested_next_steps.map((step, i) => (<li key={i}>{step}</li>))}
                </ul>
              </div>
              
              {/* Si el informe está comprado, podríamos mostrar un pequeño aviso o directamente el botón para ir al informe completo */}
              {selectedIdea.is_detailed_report_purchased && selectedIdea.detailed_report_content && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <h3 className="text-sm font-semibold text-green-400 mb-1">Informe Detallado Adquirido</h3>
                  <p className="text-xs text-gray-400">Puedes ver el informe completo haciendo clic en el botón "Ver Informe Detallado".</p>
                  {/* Aquí NO mostramos el contenido detallado, solo el aviso y el botón */}
                </div>
              )}

              <div className="mt-6 flex flex-row justify-end space-x-3">
                {/* --- BOTÓN MODIFICADO EN MODAL --- */}
                <button 
                    onClick={() => {
                        if (selectedIdea) handleUnlockReport(selectedIdea); // Llama a la función que ahora navega
                        // closeModal(); // Considera si cerrar el modal antes o después de la navegación.
                                      // Si navega, el modal desaparecerá de todas formas.
                    }}
                    disabled={unlockingIdeaId === selectedIdea.id && !selectedIdea.is_detailed_report_purchased}
                    className={`px-5 py-2 font-semibold rounded-md shadow-md disabled:opacity-50 flex items-center justify-center ${
                        selectedIdea.is_detailed_report_purchased 
                        ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                    {unlockingIdeaId === selectedIdea.id && !selectedIdea.is_detailed_report_purchased ? (
                        <> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Desbloqueando...</>
                    ) : (
                        selectedIdea.is_detailed_report_purchased 
                            ? <><CheckIcon /> Ver Informe Detallado</>
                            : <><LockIcon /> Desbloquear Informe</>
                    )}
                </button>
                <button onClick={closeModal} className="px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md shadow-md flex items-center justify-center">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}