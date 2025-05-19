// src/app/generate-idea/page.tsx
"use client"; 

import React, { useState, FormEvent, useEffect, useRef, useCallback, Suspense } from 'react'; // Añadido React y Suspense
import { useAuth } from '@/context/AuthContext'; 
import { useRouter, usePathname, useSearchParams as useNextSearchParams } from 'next/navigation'; 
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- INICIO Iconos SVG ---
const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => ( <span className="w-4 h-4 inline-block mr-1.5 align-middle">{children}</span> );
const LockIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /> </svg> </IconWrapper> );
const SaveIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /> </svg> </IconWrapper> );
const CheckIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /> </svg> </IconWrapper> );
// --- FIN Iconos SVG ---

// Interfaz FormData actualizada con los nuevos campos
interface FormData {
  interests: string;
  skills: string;
  resources_time: string;
  resources_capital: string;
  risk_aversion: string;
  target_audience?: string;
  problem_to_solve?: string;
  core_business_values?: string[];
  innovation_level?: string;
  preferred_business_model?: string;
}
interface GeneratedIdea { id?: number; idea_name: string; idea_description: string; personalization_justification: string; suggested_business_model: string; preliminary_viability_analysis: { oportunidad_disruptiva: string; riesgo_clave_no_obvio: string; }; suggested_next_steps: string[]; isSaved?: boolean; is_detailed_report_purchased?: boolean; detailed_report_content?: any; }
interface ApiError { detail: string; }

const SESSION_STORAGE_KEY = 'tempGeneratedIdeas';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; // Usar variable de entorno para la URL del API

const CORE_VALUES_OPTIONS = [
  "Innovación", "Sostenibilidad", "Impacto Social", "Eficiencia", 
  "Calidad Premium", "Accesibilidad", "Comunidad"
];

// Componente interno que contiene la lógica y UI principal
function GenerateIdeaInteractiveContent() {
  const [formData, setFormData] = useState<FormData>({
    interests: '',
    skills: '',
    resources_time: 'No especificado',
    resources_capital: 'No especificado',
    risk_aversion: 'No especificada',
    target_audience: '',
    problem_to_solve: '',
    core_business_values: [],
    innovation_level: 'No especificado',
    preferred_business_model: 'No especificado',
  });
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false); 
  const [isSavingIdeaName, setIsSavingIdeaName] = useState<string | null>(null);
  const [isUnlockingReportIdeaName, setIsUnlockingReportIdeaName] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const { user, token, isLoading: authIsLoading, isAuthenticated } = useAuth(); 
  const router = useRouter();
  const pathname = usePathname();
  const pageSearchParams = useNextSearchParams(); // Este hook necesita Suspense

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prevState => {
      const currentValues = prevState.core_business_values || [];
      if (checked) {
        if (currentValues.length < 3) {
          return { ...prevState, core_business_values: [...currentValues, value] };
        } else {
          toast.warn("Puedes seleccionar hasta 3 valores fundamentales.");
          e.target.checked = false; 
          return prevState;
        }
      } else {
        return { ...prevState, core_business_values: currentValues.filter(v => v !== value) };
      }
    });
  };
  
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setIsLoading(true); setPageError(null); 
    setSelectedIdea(null); setIsModalOpen(false); 
    const interestsArray = formData.interests.split(',').map(item => item.trim()).filter(item => item !== '');
    const skillsArray = formData.skills.split(',').map(item => item.trim()).filter(item => item !== '');
    if (interestsArray.length === 0 || skillsArray.length === 0) { toast.error("Por favor, ingresa al menos un interés y una habilidad."); setIsLoading(false); return; }
    
    const payload: any = {
      interests: interestsArray,
      skills: skillsArray,
      resources_time: formData.resources_time,
      resources_capital: formData.resources_capital,
      risk_aversion: formData.risk_aversion,
    };

    if (formData.target_audience && formData.target_audience.trim() !== '') payload.target_audience = formData.target_audience.trim();
    if (formData.problem_to_solve && formData.problem_to_solve.trim() !== '') payload.problem_to_solve = formData.problem_to_solve.trim();
    if (formData.core_business_values && formData.core_business_values.length > 0) payload.core_business_values = formData.core_business_values;
    if (formData.innovation_level && formData.innovation_level !== 'No especificado') payload.innovation_level = formData.innovation_level;
    if (formData.preferred_business_model && formData.preferred_business_model !== 'No especificado') payload.preferred_business_model = formData.preferred_business_model;
    
    console.log("Payload a enviar al backend:", payload);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ideas/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), });
      if (!response.ok) { const errorData = await response.json().catch(() => ({ detail: "Error desconocido" })); throw new Error(errorData.detail || `Error: ${response.status}`); }
      const data = await response.json();
      const ideasWithInitialState = (data.generated_ideas || []).map((idea: any) => ({ ...idea, id: undefined, isSaved: false, is_detailed_report_purchased: false, detailed_report_content: null }));
      setGeneratedIdeas(ideasWithInitialState);
      if (ideasWithInitialState.length > 0) {
        try { sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(ideasWithInitialState)); console.log("Nuevas ideas generadas y guardadas en sessionStorage."); }
        catch (e) { console.error("Error guardando nuevas ideas en sessionStorage:", e); toast.warn("No se pudieron guardar temporalmente las ideas en la sesión del navegador."); }
        if (data.generated_ideas?.length > 0) { setTimeout(() => resultsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); }
      } else { sessionStorage.removeItem(SESSION_STORAGE_KEY); setGeneratedIdeas([]); }
    } catch (err: any) { toast.error(err.message || "Error al generar ideas."); setPageError(err.message); 
    } finally { setIsLoading(false); }
  };

  const openModalWithIdea = (idea: GeneratedIdea) => { setSelectedIdea(idea); setIsModalOpen(true); };
  const closeModal = useCallback(() => { setIsModalOpen(false); setSelectedIdea(null); }, []);
  
  const handleSaveIdea = useCallback(async (ideaToSave: GeneratedIdea | null, triggeredFromUnlock: boolean = false) => { 
    if (!ideaToSave) return;
    if (ideaToSave.isSaved && !triggeredFromUnlock) { 
      if(!triggeredFromUnlock) toast.info(`La idea "${ideaToSave.idea_name}" ya está guardada.`);
      return; 
    }
    if (authIsLoading) { toast.info("Verificando sesión..."); return; }
    if (!isAuthenticated || !token) {
      toast.warn("Debes iniciar sesión para guardar esta idea."); 
      try {
        if (generatedIdeas.length > 0) sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(generatedIdeas));
        sessionStorage.setItem('pendingSaveIdeaName', ideaToSave.idea_name); 
      } catch (e) { console.error("Error sessionStorage (save):", e); }
      router.push(`/login?redirect=${pathname}&action=savePending`); 
      return;
    }
    setIsSavingIdeaName(ideaToSave.idea_name); 
    try {
      const payloadForSave = { idea_name: ideaToSave.idea_name, idea_description: ideaToSave.idea_description, personalization_justification: ideaToSave.personalization_justification, suggested_business_model: ideaToSave.suggested_business_model, preliminary_viability_analysis: ideaToSave.preliminary_viability_analysis, suggested_next_steps: ideaToSave.suggested_next_steps };
      const response = await fetch(`${API_BASE_URL}/api/v1/ideas/save`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(payloadForSave) });
      const data = await response.json();
      if (!response.ok) { const apiError = data as ApiError; throw new Error(apiError.detail || `Error al guardar: ${response.status}`); }
      const updatedIdeaFromDB = data as GeneratedIdea; 
      const ideaConEstadoCompleto: GeneratedIdea = { ...ideaToSave, id: updatedIdeaFromDB.id, isSaved: true, is_detailed_report_purchased: updatedIdeaFromDB.is_detailed_report_purchased !== undefined ? updatedIdeaFromDB.is_detailed_report_purchased : ideaToSave.is_detailed_report_purchased, detailed_report_content: updatedIdeaFromDB.detailed_report_content !== undefined ? updatedIdeaFromDB.detailed_report_content : ideaToSave.detailed_report_content, }; 
      if (!triggeredFromUnlock) { toast.success(`¡Idea "${ideaToSave.idea_name}" guardada con éxito!`); } else { toast.info(`Idea "${ideaToSave.idea_name}" guardada. Procediendo a desbloquear informe...`); }
      setGeneratedIdeas(prev => prev.map(i => i.idea_name === ideaToSave.idea_name ? ideaConEstadoCompleto : i));
      if (selectedIdea?.idea_name === ideaToSave.idea_name) setSelectedIdea(ideaConEstadoCompleto);
    } catch (err: any) { 
      if (!triggeredFromUnlock) toast.error(err.message || "Error al guardar."); 
      else toast.error(`Error al auto-guardar para desbloqueo: ${err.message || "Error desconocido"}`);
      console.error("Error al guardar idea:", err); 
    } finally { setIsSavingIdeaName(null); }
  }, [authIsLoading, isAuthenticated, token, router, pathname, generatedIdeas, selectedIdea /*, closeModal removed as it's not used here and to simplify deps */]);

  const handleUnlockReport = useCallback(async (ideaToUnlock: GeneratedIdea | null) => { 
    if (!ideaToUnlock) return;
    if (ideaToUnlock.is_detailed_report_purchased) { 
      if (ideaToUnlock.id) { console.log(`Navegando a informe detallado para idea ID: ${ideaToUnlock.id}`); router.push(`/idea/${ideaToUnlock.id}/report`); } 
      else { toast.error("Error: El informe está comprado pero la idea no tiene un ID para mostrarlo."); openModalWithIdea(ideaToUnlock); }
      return; 
    }
    if (authIsLoading) { toast.info("Verificando sesión..."); return; }
    if (!isAuthenticated || !token) {
      toast.warn("Debes iniciar sesión para desbloquear informes.");
      try {
        if (generatedIdeas.length > 0) sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(generatedIdeas));
        sessionStorage.setItem('pendingUnlockIdeaName', ideaToUnlock.idea_name);
      } catch (e) { console.error("Error sessionStorage (unlock):", e); }
      router.push(`/login?redirect=${pathname}&action=unlockPending`);
      return;
    }
    if (!ideaToUnlock.id) { 
      // Lógica mejorada: Si la idea no está guardada (no tiene ID), guardarla primero
      const confirmSaveFirst = window.confirm(`La idea "${ideaToUnlock.idea_name}" debe guardarse primero para desbloquear el informe.\n¿Deseas guardarla ahora?`);
      if (confirmSaveFirst) {
        await handleSaveIdea(ideaToUnlock, true); // Guardar la idea, marcando que es para desbloqueo
        // Volver a intentar desbloquear DESPUÉS de que se actualice el estado de la idea (con ID)
        // Esto requiere que handleSaveIdea actualice generatedIdeas y que este componente re-renderice
        // O, pasar el ID devuelto por el guardado directamente, pero es más complejo con el estado.
        // Por ahora, le pedimos al usuario que reintente el desbloqueo manualmente tras el guardado.
        toast.info(`Idea "${ideaToUnlock.idea_name}" guardada. Por favor, intenta desbloquear el informe de nuevo.`);
      } else {
        toast.info("Guardado cancelado. No se puede desbloquear el informe sin guardar la idea.");
      }
      return; 
    }
    const confirmUnlock = window.confirm(`Desbloquear informe detallado para "${ideaToUnlock.idea_name}"?\n(Esto es una simulación de pago)`);
    if (!confirmUnlock) { toast.info("Desbloqueo cancelado."); return; }
    setIsUnlockingReportIdeaName(ideaToUnlock.idea_name);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ideas/${ideaToUnlock.id}/unlock-report`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'}, });
      const updatedIdeaDataFromServer = await response.json();
      if (!response.ok) { const apiError = updatedIdeaDataFromServer as ApiError; throw new Error(apiError.detail || `Error ${response.status}`);}
      toast.success(`¡Informe para "${updatedIdeaDataFromServer.idea_name}" desbloqueado!`);
      const finalUpdatedIdea: GeneratedIdea = { ...ideaToUnlock, ...updatedIdeaDataFromServer, is_detailed_report_purchased: true }; 
      setGeneratedIdeas(prev => prev.map(i => i.id === ideaToUnlock.id ? finalUpdatedIdea : i));
      if (selectedIdea?.id === ideaToUnlock.id) setSelectedIdea(finalUpdatedIdea);
      if (finalUpdatedIdea.id) { console.log(`Desbloqueo exitoso, navegando a informe para idea ID: ${finalUpdatedIdea.id}`); router.push(`/idea/${finalUpdatedIdea.id}/report`); } 
      else { console.error("Error: Informe desbloqueado pero la idea no tiene ID para la navegación."); toast.warn("Informe desbloqueado, pero hubo un problema al ir a la página del reporte."); }
    } catch (err: any) { toast.error(err.message || "Error al desbloquear."); console.error("Error al desbloquear:", err);
    } finally { setIsUnlockingReportIdeaName(null); }
  }, [authIsLoading, isAuthenticated, token, router, pathname, generatedIdeas, selectedIdea, handleSaveIdea /*, isModalOpen, openModalWithIdea, closeModal removed as they are not directly used or are covered by selectedIdea change */]);

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

  useEffect(() => { 
    if (generatedIdeas.length > 0) {
      const afterLogin = pageSearchParams.get('afterLogin');
      if (afterLogin !== 'true') { // Solo guardar si no estamos en el flujo post-login
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(generatedIdeas));
          console.log("SessionStorage actualizado con generatedIdeas.");
        } catch (e) {
          console.error("Error actualizando sessionStorage tras cambio en generatedIdeas:", e);
        }
      }
    }
  }, [generatedIdeas, pageSearchParams]);

  useEffect(() => { 
    const afterLogin = pageSearchParams.get('afterLogin');
    const action = pageSearchParams.get('action');
    
    if (afterLogin === 'true' && !authIsLoading && isAuthenticated && token) {
      let ideasFromSession = generatedIdeas; // Usar las ideas ya en estado si existen
      
      if (ideasFromSession.length === 0) { // Si no hay ideas en estado, intentar cargar de sessionStorage
        const tempIdeasString = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (tempIdeasString) { 
          try { 
            ideasFromSession = JSON.parse(tempIdeasString); 
            setGeneratedIdeas(ideasFromSession); // Actualizar estado si se cargaron
            console.log("Post-login: Ideas restauradas de sessionStorage para acción pendiente.", ideasFromSession);
          } catch (e) { 
            console.error("Error parsing ideasFromSession post-login:", e); 
            ideasFromSession = []; 
          } 
        }
      }
      
      const pendingSaveIdeaName = sessionStorage.getItem('pendingSaveIdeaName');
      const pendingUnlockIdeaName = sessionStorage.getItem('pendingUnlockIdeaName');
      
      let ideaToProcess: GeneratedIdea | undefined;

      if (action === 'savePending' && pendingSaveIdeaName) { 
        ideaToProcess = ideasFromSession.find(i => i.idea_name === pendingSaveIdeaName);
        if (ideaToProcess) { 
          console.log("Post-login: Auto-guardando idea", pendingSaveIdeaName); 
          handleSaveIdea(ideaToProcess, false); 
        } else {
          console.warn("Post-login: No se encontró la idea para guardar:", pendingSaveIdeaName);
        }
      } else if (action === 'unlockPending' && pendingUnlockIdeaName) { 
        ideaToProcess = ideasFromSession.find(i => i.idea_name === pendingUnlockIdeaName);
        if (ideaToProcess) { 
          if (ideaToProcess.id) {
            console.log("Post-login: Auto-desbloqueando informe para", pendingUnlockIdeaName); 
            handleUnlockReport(ideaToProcess); 
          } else {
            toast.info(`La idea "${pendingUnlockIdeaName}" debe guardarse primero. Intenta guardarla y luego desbloquea el informe.`); 
            console.log("Post-login: Intento de desbloquear idea no guardada", pendingUnlockIdeaName);
          }
        } else {
          console.warn("Post-login: No se encontró la idea para desbloquear:", pendingUnlockIdeaName);
        }
      }
      
      // Limpiar sessionStorage y parámetros de URL solo si se procesó una acción
      // O si 'afterLogin' está presente, para evitar bucles.
      sessionStorage.removeItem(SESSION_STORAGE_KEY); // Limpiar siempre las ideas temporales después del login
      sessionStorage.removeItem('pendingSaveIdeaName');
      sessionStorage.removeItem('pendingUnlockIdeaName');
      router.replace(pathname, { scroll: false }); // Limpiar query params
      console.log("Post-login: Flujo completado, limpiando sessionStorage y query params.");
    }
  }, [pageSearchParams, authIsLoading, isAuthenticated, token, router, pathname, handleSaveIdea, handleUnlockReport, generatedIdeas, setGeneratedIdeas /* Añadido setGeneratedIdeas por si es necesario en dependencias */]);

  useEffect(() => { 
    const afterLogin = pageSearchParams.get('afterLogin');
    // Solo restaurar si NO estamos en el flujo 'afterLogin' Y no hay ideas ya
    if (afterLogin !== 'true' && generatedIdeas.length === 0) { 
      const tempIdeasString = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (tempIdeasString) { 
        try { 
          const tempIdeasFromStorage: GeneratedIdea[] = JSON.parse(tempIdeasString); 
          console.log("Mount Restore: Ideas restauradas de sessionStorage.", tempIdeasFromStorage); 
          setGeneratedIdeas(tempIdeasFromStorage); 
        } catch (e) { 
          console.error("Error parseando tempGeneratedIdeas de sessionStorage al montar", e); 
          sessionStorage.removeItem(SESSION_STORAGE_KEY); // Limpiar si está corrupto
        } 
      }
    }
  }, [pageSearchParams, generatedIdeas, setGeneratedIdeas /* Evitar re-ejecución innecesaria; pageSearchParams es la clave aquí */]); 

  if (authIsLoading && !user && !token) {
    // Este es un estado de carga global para la autenticación.
    // El fallback de Suspense manejará la carga del contenido específico de esta página.
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><p>Verificando sesión...</p></div>;
  }

  const labelClasses = "block text-base font-medium text-gray-200 mb-1.5";
  const inputClasses = "w-full p-3 bg-gray-700/70 border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 transition-all duration-150 ease-in-out focus:bg-gray-700/90";
  const selectClasses = `${inputClasses} appearance-none bg-no-repeat bg-right-3 bg-[length:1em_1em]`;
  const selectArrowSvg = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;

  return (
    <div className="relative min-h-screen bg-gray-900/20 text-white">
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat -z-10 animate-pulse-opacity-slow"
        style={{ backgroundImage: "url('/background-generar-ideas.png')" }}
      ></div>
      <div className="fixed inset-0 w-full h-full bg-black/70 -z-10"></div>

      <div className="relative z-20 font-sans flex flex-col items-center py-10 px-4 min-h-screen">
        <div className="w-full max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-purple-400">GENERACIÓN DE MODELOS DE NEGOCIO CON IA</h2>
          <h5 className="text-1xl md:text-1xl font-bold text-center mb-10 text-purple-800">Proveé todo el contexto que consideres apropiado.</h5>
          
          <form onSubmit={handleSubmit} className="space-y-8 bg-gray-900/70 backdrop-blur-sm p-6 md:p-10 rounded-xl shadow-2xl border border-gray-700/60 mb-16">
            <div className="grid md:grid-cols-2 md:gap-x-8 gap-y-6">
              <div className="space-y-6">
                <div><label htmlFor="interests" className={labelClasses}>Intereses / Pasiones <span className="text-xs font-medium text-gray-500 mt-0.5">(separados por comas)</span></label><input type="text" name="interests" id="interests" value={formData.interests} onChange={handleChange} className={inputClasses} placeholder="Ej: cocina vegana, IA" required /></div>
                <div><label htmlFor="skills" className={labelClasses}>Habilidades específicas <span className="text-xs font-medium text-gray-500 mt-0.5">(separados por comas)</span></label><input type="text" name="skills" id="skills" value={formData.skills} onChange={handleChange} className={inputClasses} placeholder="Ej: desarrollo web, diseño" required /></div>
                <div><label htmlFor="target_audience" className={labelClasses}>Público Objetivo Ideal <span className="text-xs text-gray-500">(Opcional)</span></label><textarea name="target_audience" id="target_audience" value={formData.target_audience} onChange={handleChange} rows={3} className={inputClasses} placeholder="Ej: 'jóvenes profesionales urbanos'..." /></div>
                <div><label htmlFor="problem_to_solve" className={labelClasses}>Problema Específico a Resolver <span className="text-xs text-gray-500">(Opcional)</span></label><textarea name="problem_to_solve" id="problem_to_solve" value={formData.problem_to_solve} onChange={handleChange} rows={3} className={inputClasses} placeholder="Describe un problema..." /></div>
              </div>

              <div className="space-y-6">
                <div><label htmlFor="resources_time" className={labelClasses}>Tiempo Disponible Semanal</label><select name="resources_time" id="resources_time" value={formData.resources_time} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}><option value="No especificado" className="text-gray-500 bg-gray-800">Selecciona...</option><option value="Menos de 10 horas" className="bg-gray-800">Menos de 10 horas</option><option value="10-20 horas" className="bg-gray-800">10-20 horas</option><option value="Más de 20 horas (Full-time)" className="bg-gray-800">Más de 20 horas</option></select></div>
                <div><label htmlFor="resources_capital" className={labelClasses}>Capital Inicial Aproximado</label><select name="resources_capital" id="resources_capital" value={formData.resources_capital} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}><option value="No especificado" className="text-gray-500 bg-gray-800">Selecciona...</option><option value="Muy bajo (Bootstrap/Casi nulo)" className="bg-gray-800">Muy bajo</option><option value="Bajo (Algunos ahorros)" className="bg-gray-800">Bajo</option><option value="Medio (Inversión moderada)" className="bg-gray-800">Medio</option><option value="Alto (Busco inversión externa / Capital propio significativo)" className="bg-gray-800">Alto</option></select></div>
                <div><label htmlFor="risk_aversion" className={labelClasses}>Aversión al Riesgo</label><select name="risk_aversion" id="risk_aversion" value={formData.risk_aversion} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}><option value="No especificada" className="text-gray-500 bg-gray-800">Selecciona...</option><option value="Muy alta (Prefiero algo muy seguro y probado)" className="bg-gray-800">Muy alta</option><option value="Alta (Cauteloso, prefiero minimizar riesgos)" className="bg-gray-800">Alta</option><option value="Media (Abierto a riesgos calculados)" className="bg-gray-800">Media</option><option value="Baja (Dispuesto a tomar riesgos significativos por alta recompensa)" className="bg-gray-800">Baja</option></select></div>
                <div><label htmlFor="innovation_level" className={labelClasses}>Nivel de Innovación Deseado</label><select name="innovation_level" id="innovation_level" value={formData.innovation_level} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}><option value="No especificado" className="text-gray-500 bg-gray-800">Selecciona...</option><option value="Incremental" className="bg-gray-800">Incremental</option><option value="Adaptativa" className="bg-gray-800">Adaptativa</option><option value="Disruptiva" className="bg-gray-800">Disruptiva</option></select></div>
                <div><label htmlFor="preferred_business_model" className={labelClasses}>Modelo de Negocio Preferido <span className="text-xs text-gray-500">(Opcional)</span></label><select name="preferred_business_model" id="preferred_business_model" value={formData.preferred_business_model} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}><option value="No especificado" className="text-gray-500 bg-gray-800">Selecciona...</option><option value="SaaS" className="bg-gray-800">SaaS</option><option value="E-commerce" className="bg-gray-800">E-commerce</option><option value="Marketplace" className="bg-gray-800">Marketplace</option><option value="Contenido/Comunidad" className="bg-gray-800">Contenido/Comunidad</option><option value="Servicios" className="bg-gray-800">Servicios</option><option value="Producto Físico" className="bg-gray-800">Producto Físico</option></select></div>
              </div>
            </div>
            
            <div className="md:col-span-2 pt-4">
              <label className="block text-base font-medium text-gray-200 mb-2">Valores Fundamentales del Negocio <span className="text-xs text-gray-500">(Selecciona hasta 3)</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3 mt-1">
                {CORE_VALUES_OPTIONS.map(value => (
                  <label key={value} className="flex items-center space-x-2.5 text-sm text-gray-300 cursor-pointer hover:text-purple-300 transition-colors">
                    <input type="checkbox" name="core_business_values" value={value} checked={formData.core_business_values?.includes(value)} onChange={handleCheckboxChange} disabled={(formData.core_business_values?.length ?? 0) >= 3 && !formData.core_business_values?.includes(value)} className="form-checkbox h-4 w-4 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500 focus:ring-offset-gray-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50" />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <button type="submit" disabled={isLoading || !!isSavingIdeaName || !!isUnlockingReportIdeaName} className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition-transform hover:scale-105 active:scale-95 disabled:opacity-60 flex items-center justify-center text-base md:col-span-2 mt-8">
              {isLoading ? 'Generando...' : ((isSavingIdeaName || isUnlockingReportIdeaName) ? 'Procesando...' : 'Generar Conceptos de Negocio')}
            </button>
          </form>

          {pageError && <p className="my-4 text-center text-red-400 bg-red-900/50 p-3 rounded-md">{pageError}</p>}

          <div ref={resultsContainerRef} className="mt-10 scroll-mt-24">
            {generatedIdeas.length > 0 && !isLoading && (
              <>
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-purple-300">¡Tus Conceptos de Negocio Personalizados!</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {generatedIdeas.map((idea, index) => {
                    const unlockButtonClasses = idea.is_detailed_report_purchased ? 'text-green-300 border-green-500/70 bg-green-600/20 hover:bg-green-600/30 cursor-pointer' : 'text-blue-300 hover:text-blue-200 border-blue-500/70 hover:bg-blue-500/30';
                    const saveButtonClasses = idea.isSaved ? 'bg-green-700/80 text-white border-green-700 cursor-not-allowed' : 'text-green-300 hover:text-green-200 border-green-500/70 hover:bg-green-500/30';
                    return (
                      <div key={idea.id || idea.idea_name + index} className="flex flex-col bg-gray-800/80 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-700/60 hover:border-purple-500/70 transition-all duration-300">
                        <h3 className="text-xl font-semibold text-purple-300 mb-3">{idea.idea_name}</h3>
                        <p className="text-gray-300 text-sm mb-5 flex-grow line-clamp-[10]">{idea.idea_description}</p>
                        <div className="mt-auto space-y-2.5">
                          <button onClick={() => openModalWithIdea(idea)} className="w-full text-sm text-purple-300 hover:text-purple-200 py-2.5 px-3 rounded-lg border border-purple-500/70 hover:bg-purple-500/30 transition-colors flex items-center justify-center"> Ver Resumen Básico </button>
                          <button onClick={() => handleUnlockReport(idea)} disabled={isUnlockingReportIdeaName === idea.idea_name && !idea.is_detailed_report_purchased} className={`w-full text-sm py-2.5 px-3 rounded-lg border transition-colors disabled:opacity-60 flex items-center justify-center ${unlockButtonClasses}`}> {isUnlockingReportIdeaName === idea.idea_name && !idea.is_detailed_report_purchased ? (<> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Desbloqueando...</>) : (idea.is_detailed_report_purchased ? <><CheckIcon /> Ver Informe Detallado</> : <><LockIcon /> Desbloquear Informe Detallado</> )} </button>
                          <button onClick={() => handleSaveIdea(idea, false)} disabled={isSavingIdeaName === idea.idea_name || idea.isSaved} className={`w-full text-sm py-2.5 px-3 rounded-lg border transition-colors disabled:opacity-60 flex items-center justify-center ${saveButtonClasses}`}> {isSavingIdeaName === idea.idea_name ? (<> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Guardando...</>) : (idea.isSaved ? <><CheckIcon /> ¡Guardada!</> : <><SaveIcon /> Guardar Idea</> )} </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && selectedIdea && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in-up scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"> <h2 className="text-2xl md:text-3xl font-bold text-purple-400">{selectedIdea.idea_name}</h2> <button onClick={closeModal} className="text-gray-400 hover:text-white text-3xl leading-none p-1 -mr-2">×</button> </div>
            <div className="space-y-3 text-gray-300">
              <p><strong className="text-gray-100">Descripción:</strong> {selectedIdea.idea_description}</p>
              <p><strong className="text-gray-100">Justificación Personal:</strong> {selectedIdea.personalization_justification}</p>
              <p><strong className="text-gray-100">Modelo de Negocio Sugerido:</strong> {selectedIdea.suggested_business_model}</p>
              <div className="p-3 bg-gray-700/50 rounded mt-2"><strong className="text-gray-100 block mb-1 text-sm">Análisis de Viabilidad:</strong><p className="text-xs md:text-sm"><span className="font-medium text-purple-300">Oportunidad:</span> {selectedIdea.preliminary_viability_analysis.oportunidad_disruptiva}</p><p className="text-xs md:text-sm"><span className="font-medium text-purple-300">Riesgo:</span> {selectedIdea.preliminary_viability_analysis.riesgo_clave_no_obvio}</p></div>
              <div><strong className="text-gray-100 block mb-1 text-sm">Siguientes Pasos:</strong><ul className="list-disc list-inside ml-4 space-y-1 text-xs md:text-sm">{selectedIdea.suggested_next_steps.map((step, i) => (<li key={i}>{step}</li>))}</ul></div>
              {selectedIdea.is_detailed_report_purchased && selectedIdea.detailed_report_content && ( <div className="mt-4 pt-4 border-t border-gray-700"> <p className="text-sm text-green-400">El informe detallado completo ya está disponible.</p> </div> )}
              <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                 <button onClick={() => handleSaveIdea(selectedIdea, false)} disabled={isSavingIdeaName === selectedIdea?.idea_name || selectedIdea?.isSaved} className={`w-full sm:w-auto px-5 py-2 text-white font-semibold rounded-md shadow-md disabled:opacity-70 flex items-center justify-center ${selectedIdea?.isSaved ? 'bg-green-700 border-green-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>{isSavingIdeaName === selectedIdea?.idea_name ? (<> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Guardando...</>) : (selectedIdea?.isSaved ? <><CheckIcon /> ¡Guardada!</> : <><SaveIcon /> Guardar Idea</>)}</button>
                <button onClick={() => handleUnlockReport(selectedIdea)} disabled={isUnlockingReportIdeaName === selectedIdea?.idea_name && !selectedIdea?.is_detailed_report_purchased} className={`w-full sm:w-auto px-5 py-2 text-white font-semibold rounded-md shadow-md disabled:opacity-70 flex items-center justify-center ${ selectedIdea?.is_detailed_report_purchased ? 'bg-green-600 cursor-pointer' : 'bg-blue-600 hover:bg-blue-700' }`}> {isUnlockingReportIdeaName === selectedIdea?.idea_name && !selectedIdea?.is_detailed_report_purchased ? (<> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Desbloqueando...</>) : (selectedIdea?.is_detailed_report_purchased ? <><CheckIcon /> Ver Informe Detallado</> : <><LockIcon /> Desbloquear Informe</> )} </button>
                <button onClick={closeModal} className="w-full sm:w-auto px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md shadow-md flex items-center justify-center">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente exportado por defecto que envuelve el contenido interactivo con Suspense
export default function GenerateIdeaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><p>Cargando página de generación de ideas...</p></div>}>
      <GenerateIdeaInteractiveContent />
    </Suspense>
  );
}