// src/app/generate-idea/page.tsx
"use client";

import React, { useState, FormEvent, useEffect, useRef, useCallback, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname, useSearchParams as useNextSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ANONYMOUS_FREE_GENERATIONS_LIMIT = 2;
const ANONYMOUS_COUNT_STORAGE_KEY = 'anonymousUserGenCount_v1';
const ANONYMOUS_DATE_STORAGE_KEY = 'anonymousUserLastGenDate_v1';

// --- Iconos SVG ---
const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => ( <span className="w-4 h-4 inline-block mr-1.5 align-middle">{children}</span> );
const LockIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /> </svg> </IconWrapper> );
const SaveIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /> </svg> </IconWrapper> );
const CheckIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /> </svg> </IconWrapper> );
// --- FIN Iconos SVG ---

// --- Interfaces ---
interface FormData {
  idea_seed?: string;
  problem_to_solve?: string;
  interests: string;
  skills: string;
  resources_time: string;
  resources_capital: string;
  risk_aversion: string;
  target_audience?: string;
  core_business_values?: string[];
  innovation_level?: string;
  preferred_business_model?: string;
}
interface ViabilityAnalysisFrontend {
  oportunidad_disruptiva: string;
  riesgo_clave_no_obvio: string;
}
interface GeneratedIdea {
  id?: number;
  idea_name: string;
  idea_description: string;
  personalization_justification: string;
  suggested_business_model: string;
  preliminary_viability_analysis: ViabilityAnalysisFrontend;
  suggested_next_steps: string[];
  isSaved?: boolean;
  is_detailed_report_purchased?: boolean;
  detailed_report_content?: any;
}
interface UserProfileInputForAPI {
  interests: string[];
  skills: string[];
  resources_time: string;
  resources_capital: string;
  risk_aversion: string;
  target_audience: string | null;
  problem_to_solve: string | null;
  core_business_values: string[];
  innovation_level: string | null;
  preferred_business_model: string | null;
}
interface IdeaBaseForAPI {
    idea_name: string;
    idea_description: string;
    personalization_justification: string;
    suggested_business_model: string;
    preliminary_viability_analysis: ViabilityAnalysisFrontend;
    suggested_next_steps: string[];
}
interface SaveIdeaPayloadForAPI {
    idea_to_save: IdeaBaseForAPI;
    user_profile_at_generation: UserProfileInputForAPI;
}
interface ApiErrorDetailItem {
    loc: (string | number)[];
    msg: string;
    type: string;
}
interface ApiError {
    detail: string | ApiErrorDetailItem[];
}
interface UserGenerationLimits {
  daily_remaining: number;
  daily_limit: number;
  monthly_remaining: number;
  monthly_limit: number;
  can_generate_today: boolean;
  can_generate_this_month: boolean;
}
// --- FIN Interfaces ---

// --- Constantes ---
const SESSION_STORAGE_KEY = 'tempGeneratedIdeas_v3';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://genesis-ai-zeta.vercel.app/';
const LAST_FORM_DATA_KEY = 'lastUsedFormDataForGeneration_v3';
const PENDING_FORM_DATA_KEY = 'pendingFormDataForAction_v3';
const CORE_VALUES_OPTIONS = [
  "Innovación", "Sostenibilidad", "Impacto Social", "Eficiencia",
  "Calidad Premium", "Accesibilidad", "Comunidad"
];
const DETAILED_REPORT_PRICE_DISPLAY = "ARS 10.000"; // Usar esta constante
// --- FIN Constantes ---

function GenerateIdeaInteractiveContent() {
  const [formData, setFormData] = useState<FormData>({
    idea_seed: '', problem_to_solve: '', interests: '', skills: '',
    resources_time: 'No especificado', resources_capital: 'No especificado', risk_aversion: 'No especificada',
    target_audience: '', core_business_values: [],
    innovation_level: 'No especificado', preferred_business_model: 'No especificado',
  });
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false); 
  const [isSavingIdeaName, setIsSavingIdeaName] = useState<string | null>(null); 
  // isUnlockingReportIdeaName ya no es tan relevante para el estado del botón si redirigimos,
  // pero podría usarse para un feedback visual momentáneo antes de la redirección.
  // Por ahora, lo mantendremos para ese feedback visual, pero no bloqueará la UI por mucho tiempo.
  const [isProcessingUnlock, setIsProcessingUnlock] = useState<string | null>(null); 
  const [pageError, setPageError] = useState<string | null>(null); 
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [anonymousGenerationsToday, setAnonymousGenerationsToday] = useState(0);
  const [canGenerateAnonymously, setCanGenerateAnonymously] = useState(true);
  const [userLimits, setUserLimits] = useState<UserGenerationLimits | null>(null); 
  const [isLoadingLimits, setIsLoadingLimits] = useState(false); 

  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const { user, session, isLoading: authIsLoading, isAuthenticated, fetchUserLimits: contextFetchUserLimits } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const pageSearchParams = useNextSearchParams();

  const openModalWithIdea = (idea: GeneratedIdea) => { setSelectedIdea(idea); setIsModalOpen(true); };
  const closeModal = useCallback(() => { setIsModalOpen(false); setSelectedIdea(null); }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      const storedCountStr = localStorage.getItem(ANONYMOUS_COUNT_STORAGE_KEY);
      const storedDate = localStorage.getItem(ANONYMOUS_DATE_STORAGE_KEY);
      const today = new Date().toISOString().split('T')[0];
      if (storedDate === today && storedCountStr) {
        const count = parseInt(storedCountStr, 10);
        if (!isNaN(count)) {
          setAnonymousGenerationsToday(count);
          setCanGenerateAnonymously(count < ANONYMOUS_FREE_GENERATIONS_LIMIT);
        } else {
          localStorage.setItem(ANONYMOUS_COUNT_STORAGE_KEY, '0');
          localStorage.setItem(ANONYMOUS_DATE_STORAGE_KEY, today);
          setAnonymousGenerationsToday(0);
          setCanGenerateAnonymously(true);
        }
      } else {
        localStorage.setItem(ANONYMOUS_COUNT_STORAGE_KEY, '0');
        localStorage.setItem(ANONYMOUS_DATE_STORAGE_KEY, today);
        setAnonymousGenerationsToday(0);
        setCanGenerateAnonymously(true);
      }
    } else {
      setCanGenerateAnonymously(true);
      setAnonymousGenerationsToday(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authIsLoading && isAuthenticated) {
        contextFetchUserLimits();
    } else if (!authIsLoading && !isAuthenticated) {
        setUserLimits(null);
    }
  }, [authIsLoading, isAuthenticated, contextFetchUserLimits]);
  
  const authContextUserLimits = useAuth().userLimits;
  useEffect(() => {
    setUserLimits(authContextUserLimits);
  }, [authContextUserLimits]);


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

  const buildUserProfileForAPI = useCallback((currentFormData: FormData): UserProfileInputForAPI => {
    let problemToSolveForAPI: string | null = null;
    const problemInput = currentFormData.problem_to_solve?.trim();
    const ideaSeedInput = currentFormData.idea_seed?.trim();

    if (problemInput && problemInput !== '') {
      problemToSolveForAPI = problemInput;
    } else if (ideaSeedInput && ideaSeedInput !== '') {
      problemToSolveForAPI = `Concepto inicial o área de enfoque: ${ideaSeedInput}`;
    }

    return {
      interests: currentFormData.interests ? currentFormData.interests.split(',').map(item => item.trim()).filter(Boolean) : [],
      skills: currentFormData.skills ? currentFormData.skills.split(',').map(item => item.trim()).filter(Boolean) : [],
      resources_time: currentFormData.resources_time === 'No especificado' ? 'No especificado' : currentFormData.resources_time,
      resources_capital: currentFormData.resources_capital === 'No especificado' ? 'No especificado' : currentFormData.resources_capital,
      risk_aversion: currentFormData.risk_aversion === 'No especificada' ? 'No especificada' : currentFormData.risk_aversion,
      target_audience: currentFormData.target_audience?.trim() || null,
      problem_to_solve: problemToSolveForAPI,
      core_business_values: currentFormData.core_business_values || [],
      innovation_level: (currentFormData.innovation_level && currentFormData.innovation_level !== 'No especificado') ? currentFormData.innovation_level : null,
      preferred_business_model: (currentFormData.preferred_business_model && currentFormData.preferred_business_model !== 'No especificado') ? currentFormData.preferred_business_model : null,
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentAccessToken = session?.access_token;

    if (!isAuthenticated && !canGenerateAnonymously) {
      toast.error("Has alcanzado el máximo de generaciones gratuitas. Regístrate o inicia sesión para más.");
      return;
    }

    const ideaSeedValue = formData.idea_seed?.trim() || "";
    const problemToSolveValue = formData.problem_to_solve?.trim() || "";
    if (ideaSeedValue === "" && problemToSolveValue === "") {
      toast.error("Por favor, completa al menos tu idea inicial (Paso 1.1) o el problema que buscas resolver (Paso 1.2).");
      return;
    }

    setIsLoading(true);
    setPageError(null);
    setSelectedIdea(null);
    setIsModalOpen(false);
    const currentFormDataForSubmit = { ...formData };
    const payloadForGenerate = buildUserProfileForAPI(currentFormDataForSubmit);

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (isAuthenticated && currentAccessToken) {
        headers['Authorization'] = `Bearer ${currentAccessToken}`;
      }

      const response = await fetch(`${API_BASE_URL}api/v1/ideas/generate`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payloadForGenerate),
      });
      const data = await response.json();

      if (!response.ok) {
        let errorDetail = `Error: ${response.status}`;
        let isLimitError = false;
        if (data && data.detail) {
          if (response.status === 429 || (typeof data.detail === 'string' && data.detail.toLowerCase().includes("límite de generación"))) {
            errorDetail = data.detail;
            isLimitError = true;
            if(isAuthenticated) contextFetchUserLimits();
          } else if (Array.isArray(data.detail) && data.detail[0] && typeof data.detail[0] === 'object' && 'msg' in data.detail[0]) {
            errorDetail = data.detail.map((d: ApiErrorDetailItem) => `${d.loc.join('.')} - ${d.msg}`).join('; ');
          } else if (typeof data.detail === 'string') {
            errorDetail = data.detail;
          }
        }
        toast.error(errorDetail);
        if (!isLimitError) setPageError(errorDetail);
        return;
      }

      const ideasFromApi = Array.isArray(data.generated_ideas) ? data.generated_ideas : [];
      const ideasWithInitialState: GeneratedIdea[] = ideasFromApi.map((idea: any) => ({
        ...idea, id: undefined, isSaved: false, is_detailed_report_purchased: false, detailed_report_content: null
      }));
      setGeneratedIdeas(ideasWithInitialState);

      if (!isAuthenticated) {
        const newCount = anonymousGenerationsToday + 1;
        setAnonymousGenerationsToday(newCount);
        localStorage.setItem(ANONYMOUS_COUNT_STORAGE_KEY, newCount.toString());
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(ANONYMOUS_DATE_STORAGE_KEY, today);
        if (newCount >= ANONYMOUS_FREE_GENERATIONS_LIMIT) {
          setCanGenerateAnonymously(false);
          toast.info("Has utilizado tu última generación gratuita de hoy.");
        } else {
          toast.info(`Te quedan ${ANONYMOUS_FREE_GENERATIONS_LIMIT - newCount} generaciones gratuitas hoy.`);
        }
      } else {
        contextFetchUserLimits();
      }

      if (ideasWithInitialState.length > 0) {
        try {
          sessionStorage.setItem(LAST_FORM_DATA_KEY, JSON.stringify(currentFormDataForSubmit));
        } catch (e) {
          console.error("Error guardando LAST_FORM_DATA_KEY en sessionStorage:", e);
        }
        if (resultsContainerRef.current) {
          setTimeout(() => resultsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }
      } else {
        sessionStorage.removeItem(LAST_FORM_DATA_KEY);
        setGeneratedIdeas([]);
        toast.info("No se generaron ideas esta vez, intenta ajustar tus criterios.");
      }
    } catch (err: any) {
      console.error("Error general en handleSubmit (catch):", err);
      const displayMessage = err.message || "Error al generar ideas. Intenta de nuevo.";
      toast.error(displayMessage);
      setPageError(displayMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveIdea = useCallback(async (ideaToSave: GeneratedIdea | null, triggeredFromUnlock: boolean = false): Promise<GeneratedIdea | null> => {
    // Se añade : Promise<GeneratedIdea | null> para que handleUnlockReport pueda usar su resultado
    if (!ideaToSave) {
      console.error("handleSaveIdea: ideaToSave es null.");
      return null;
    }
    const currentAccessToken = session?.access_token;

    if (ideaToSave.id && ideaToSave.isSaved && !triggeredFromUnlock) {
      toast.info(`La idea "${ideaToSave.idea_name}" ya está guardada.`);
      return ideaToSave; // Devuelve la idea ya que está guardada
    }
    if (authIsLoading) {
      toast.info("Verificando tu sesión...");
      return null;
    }

    if (!isAuthenticated || !currentAccessToken) {
      toast.warn("Debes iniciar sesión para guardar esta idea.");
      try {
        // Si generatedIdeas está vacío pero ideaToSave existe (ej. desde post-login)
        const ideasToStoreInSession = generatedIdeas.length > 0 ? generatedIdeas : (ideaToSave ? [ideaToSave] : []);
        if (ideasToStoreInSession.length > 0) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(ideasToStoreInSession));
        }
        sessionStorage.setItem('pendingSaveIdeaName', ideaToSave.idea_name);
        
        // Usar LAST_FORM_DATA_KEY si existe, sino el formData actual del estado
        const formSnapshotForPending = sessionStorage.getItem(LAST_FORM_DATA_KEY) || JSON.stringify(formData);
        sessionStorage.setItem(PENDING_FORM_DATA_KEY, formSnapshotForPending);

      } catch (e) {
        console.error("Error guardando estado en sessionStorage (save pre-login):", e);
      }
      router.push(`/login?redirect=${pathname}&action=savePending`);
      return null;
    }

    setIsSavingIdeaName(ideaToSave.idea_name);
    try {
      let profileDataToUseForSnapshot: FormData = { ...formData }; 
      const isPendingSaveAction = pageSearchParams.get('action') === 'savePending' && sessionStorage.getItem('pendingSaveIdeaName') === ideaToSave.idea_name;
      const pendingFormDataString = sessionStorage.getItem(PENDING_FORM_DATA_KEY);
      
      if (isPendingSaveAction && pendingFormDataString) {
        try {
          profileDataToUseForSnapshot = JSON.parse(pendingFormDataString);
        } catch (e) { console.error("Error parseando PENDING_FORM_DATA_KEY (save post-login):", e); }
      } else {
        const lastUsedFormDataString = sessionStorage.getItem(LAST_FORM_DATA_KEY);
        if (lastUsedFormDataString) {
          try { profileDataToUseForSnapshot = JSON.parse(lastUsedFormDataString); } 
          catch (e) { console.error("Error parseando LAST_FORM_DATA_KEY (normal save):", e); }
        }
      }

      const userProfileForPayload = buildUserProfileForAPI(profileDataToUseForSnapshot);
      const ideaDataForPayload: IdeaBaseForAPI = {
        idea_name: ideaToSave.idea_name,
        idea_description: ideaToSave.idea_description,
        personalization_justification: ideaToSave.personalization_justification,
        suggested_business_model: ideaToSave.suggested_business_model,
        preliminary_viability_analysis: ideaToSave.preliminary_viability_analysis,
        suggested_next_steps: ideaToSave.suggested_next_steps,
      };
      const payloadForBackend: SaveIdeaPayloadForAPI = {
        idea_to_save: ideaDataForPayload,
        user_profile_at_generation: userProfileForPayload
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/ideas/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentAccessToken}`},
        body: JSON.stringify(payloadForBackend)
      });
      const data = await response.json();

      if (!response.ok) {
        const apiError = data as ApiError;
        const errorMsg = Array.isArray(apiError.detail) ? apiError.detail.map(d => `${d.loc.join('.')} - ${d.msg}`).join('; ') : (typeof apiError.detail === 'string' ? apiError.detail : `Error al guardar: ${response.status}`);
        throw new Error(errorMsg);
      }

      const updatedIdeaFromDB = data as GeneratedIdea; 
      const ideaConEstadoCompleto: GeneratedIdea = { ...ideaToSave, ...updatedIdeaFromDB, isSaved: true };

      if (!triggeredFromUnlock) {
        toast.success(`¡Idea "${ideaConEstadoCompleto.idea_name}" guardada con éxito!`);
      } else {
        toast.info(`Idea "${ideaConEstadoCompleto.idea_name}" guardada. Procediendo...`);
      }

      setGeneratedIdeas(prevIdeas => prevIdeas.map(i =>
        (i.idea_name === ideaToSave.idea_name && !i.id) ? ideaConEstadoCompleto : (i.id === ideaConEstadoCompleto.id ? ideaConEstadoCompleto : i)
      ));
      if (selectedIdea?.idea_name === ideaToSave.idea_name) {
        setSelectedIdea(ideaConEstadoCompleto);
      }

      if (isPendingSaveAction) {
        sessionStorage.removeItem('pendingSaveIdeaName');
        sessionStorage.removeItem(PENDING_FORM_DATA_KEY);
      }
      return ideaConEstadoCompleto; // Devolver la idea guardada/actualizada
    } catch (err: any) {
      console.error("Error en handleSaveIdea:", err);
      const errorMessage = err.message || "Ocurrió un error desconocido al guardar la idea.";
      if (!triggeredFromUnlock) toast.error(errorMessage);
      else toast.error(`Error al auto-guardar para adquirir: ${errorMessage}`);
      return null; // Devolver null en caso de error
    } finally {
      setIsSavingIdeaName(null);
    }
  }, [authIsLoading, isAuthenticated, session, router, pathname, pageSearchParams, generatedIdeas, selectedIdea, formData, buildUserProfileForAPI, API_BASE_URL]);

  // --- MODIFICACIÓN handleUnlockReport ---
  const handleUnlockReport = useCallback(async (ideaToUnlock: GeneratedIdea | null) => {
    if (!ideaToUnlock) return;

    setIsProcessingUnlock(ideaToUnlock.idea_name); // Feedback visual momentáneo

    // 1. Si ya está comprada, ir al informe
    if (ideaToUnlock.is_detailed_report_purchased) {
      if (ideaToUnlock.id) {
        router.push(`/idea/${ideaToUnlock.id}/report`);
      } else {
        // Esto no debería pasar si está comprada, ya que debería tener ID
        toast.error("Error: Informe comprado pero falta ID de la idea.");
        openModalWithIdea(ideaToUnlock); // Reabrir modal para mostrar el estado actual
      }
      setIsProcessingUnlock(null);
      return;
    }

    // 2. Si no está autenticado, redirigir a login
    if (authIsLoading) { // Esperar a que termine la carga de auth
        toast.info("Verificando sesión...");
        setIsProcessingUnlock(null);
        return;
    }
    if (!isAuthenticated || !session?.access_token) {
      toast.warn("Debes iniciar sesión para adquirir informes.");
      try {
        const ideasToStoreInSession = generatedIdeas.length > 0 ? generatedIdeas : (ideaToUnlock ? [ideaToUnlock] : []);
        if (ideasToStoreInSession.length > 0) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(ideasToStoreInSession));
        }
        sessionStorage.setItem('pendingUnlockIdeaName', ideaToUnlock.idea_name);
        const formSnapshotForPending = sessionStorage.getItem(LAST_FORM_DATA_KEY) || JSON.stringify(formData);
        sessionStorage.setItem(PENDING_FORM_DATA_KEY, formSnapshotForPending);
      } catch (e) {
        console.error("Error guardando estado en sessionStorage (unlock pre-login):", e);
      }
      router.push(`/login?redirect=${pathname}&action=unlockPending`);
      setIsProcessingUnlock(null);
      return;
    }

    // 3. Usuario autenticado. Verificar si la idea está guardada.
    let ideaParaCheckout = { ...ideaToUnlock };

    if (!ideaParaCheckout.id || !ideaParaCheckout.isSaved) {
      toast.info(`La idea "${ideaParaCheckout.idea_name}" debe guardarse primero. Guardando automáticamente...`);
      // Llamar a handleSaveIdea y esperar su resultado.
      // El true indica que el guardado es parte del flujo de desbloqueo (para el toast).
      const savedIdea = await handleSaveIdea(ideaParaCheckout, true); 
      
      if (savedIdea && savedIdea.id) {
        ideaParaCheckout = savedIdea; // Usar la idea con el ID y estado actualizado
        // Actualizar la idea en el modal si está abierta y es la misma
        if (selectedIdea?.idea_name === ideaParaCheckout.idea_name) {
            setSelectedIdea(ideaParaCheckout);
        }
      } else {
        toast.error("No se pudo guardar la idea. No se puede proceder a la adquisición.");
        setIsProcessingUnlock(null);
        return;
      }
    }

    // 4. Ahora la idea debería tener un ID. Redirigir a checkout.
    if (ideaParaCheckout.id) {
      console.log(`GenerateIdeaPage: Redirecting to checkout for idea ID: ${ideaParaCheckout.id}`);
      router.push(`/idea/${ideaParaCheckout.id}/checkout`);
    } else {
      // Esto sería un error de lógica si llegamos aquí.
      toast.error("Error crítico: La idea no tiene ID después del intento de guardado.");
    }
    
    // Limpiar el estado de procesamiento después de la redirección (o intento)
    // Es posible que la redirección ocurra antes de que esto se ejecute si es síncrona,
    // pero es buena práctica tenerlo.
    setIsProcessingUnlock(null);

    // Limpiar pendingUnlockIdeaName y PENDING_FORM_DATA_KEY si era una acción post-login
    // Esto se hará en el useEffect post-login si fue una acción pendiente.
    // Si fue una acción directa, estas claves no deberían estar seteadas o no importan.
    const isPendingUnlockAction = pageSearchParams.get('action') === 'unlockPending' && sessionStorage.getItem('pendingUnlockIdeaName') === ideaToUnlock.idea_name;
    if (isPendingUnlockAction) {
        console.log("handleUnlockReport (directo, post-confirm save): Limpiando sessionStorage para unlockPending.");
        sessionStorage.removeItem('pendingUnlockIdeaName');
        sessionStorage.removeItem(PENDING_FORM_DATA_KEY);
    }

  }, [authIsLoading, isAuthenticated, session, router, pathname, pageSearchParams, generatedIdeas, selectedIdea, formData, handleSaveIdea, openModalWithIdea, API_BASE_URL]);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
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
    const afterLogin = pageSearchParams.get('afterLogin');
    if (afterLogin !== 'true' && generatedIdeas.length > 0) {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(generatedIdeas));
      }
      catch (e) {
        console.error("Error actualizando sessionStorage por cambio en generatedIdeas:", e);
      }
    }
  }, [generatedIdeas, pageSearchParams]);

  useEffect(() => {
    const afterLogin = pageSearchParams.get('afterLogin');
    if (afterLogin !== 'true') {
      const tempIdeasString = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (tempIdeasString) {
        try {
          const tempIdeasFromStorage: GeneratedIdea[] = JSON.parse(tempIdeasString);
          if (Array.isArray(tempIdeasFromStorage) && generatedIdeas.length === 0) {
            setGeneratedIdeas(tempIdeasFromStorage);
          }
        } catch (e) {
          console.error("Error parseando tempGeneratedIdeas al montar:", e);
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }

      const storedFormDataString = sessionStorage.getItem(LAST_FORM_DATA_KEY);
      if (storedFormDataString) {
        try {
          const storedFormData = JSON.parse(storedFormDataString);
          const isCurrentFormDataEmpty = !formData.interests && !formData.skills && !formData.idea_seed && !formData.problem_to_solve;
          if(isCurrentFormDataEmpty) {
            setFormData(prev => ({...prev, ...storedFormData}));
          }
        } catch (e) {
          console.error("Error parseando LAST_FORM_DATA_KEY al montar:", e);
          sessionStorage.removeItem(LAST_FORM_DATA_KEY);
        }
      }
    }
  }, [pageSearchParams]); 

  // --- Effect for handling actions after login (SIN CAMBIOS POR AHORA, pero revisaremos si necesita ajustes tras probar) ---
  useEffect(() => {
    const processPostLoginActions = async () => { // Convertido a async
        const afterLogin = pageSearchParams.get('afterLogin') === 'true';
        const action = pageSearchParams.get('action');
        
        if (afterLogin && !authIsLoading && isAuthenticated && session?.access_token) {
            let ideasParaProcesar = [...generatedIdeas];
            if(ideasParaProcesar.length === 0){
                const tempIdeasString = sessionStorage.getItem(SESSION_STORAGE_KEY);
                if (tempIdeasString) {
                    try {
                      ideasParaProcesar = JSON.parse(tempIdeasString);
                      // Opcional: si el estado aún no tiene estas ideas, se podría actualizar
                      // if(generatedIdeas.length === 0) setGeneratedIdeas(ideasParaProcesar);
                    } catch (e) {
                      console.error("Error parsing ideasFromSession (post-login effect):", e);
                      ideasParaProcesar = [];
                    }
                }
            }

            const pendingSaveIdeaName = sessionStorage.getItem('pendingSaveIdeaName');
            const pendingUnlockIdeaName = sessionStorage.getItem('pendingUnlockIdeaName');
            let ideaToProcess: GeneratedIdea | undefined;

            if (action === 'savePending' && pendingSaveIdeaName) {
                ideaToProcess = ideasParaProcesar.find(i => i.idea_name === pendingSaveIdeaName && !i.id);
                if (ideaToProcess) {
                  await handleSaveIdea(ideaToProcess, false); // Await la operación
                } else { /* console.warn(...) */ }
            } else if (action === 'unlockPending' && pendingUnlockIdeaName) {
                ideaToProcess = ideasParaProcesar.find(i => i.idea_name === pendingUnlockIdeaName);
                if (ideaToProcess) {
                  await handleUnlockReport(ideaToProcess); // Await la operación
                } else { /* console.warn(...) */ }
            }

            // Limpieza de sessionStorage, debe ocurrir DESPUÉS de que las operaciones await terminen.
            if (action === 'savePending' || action === 'unlockPending') {
                // Las claves específicas (pendingSaveIdeaName, etc.) se limpian dentro de handleSaveIdea/handleUnlockReport si tienen éxito
                // y en este mismo efecto si la idea no se encuentra.
                // SESSION_STORAGE_KEY se limpia aquí como estaba en tu código original.
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }
            router.replace(pathname, { scroll: false });
        }
    };
    processPostLoginActions();
  }, [pageSearchParams, authIsLoading, isAuthenticated, session, router, pathname, handleSaveIdea, handleUnlockReport, generatedIdeas]);


  if (authIsLoading && !user && !session?.access_token && !pageSearchParams.get('afterLogin')) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><p>Verificando sesión...</p></div>;
  }

  const labelClasses = "block text-base font-semibold text-gray-100 mb-2";
  const inputClasses = "w-full p-3.5 bg-gray-700/60 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400/70 transition-all duration-150 ease-in-out focus:bg-gray-700/80 shadow-sm";
  const selectClasses = `${inputClasses} appearance-none bg-no-repeat bg-right-3 bg-[length:1em_1em]`;
  const selectArrowSvg = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;
  const sectionTitleClasses = "text-2xl font-bold text-purple-300 mb-4 border-b-2 border-purple-700/40 pb-3";
  const fieldGroupClasses = "space-y-6";
  const sectionSpacingClasses = "space-y-8";

  const isGenerationDisabled =
    isLoading ||
    !!isSavingIdeaName ||
    !!isProcessingUnlock || // Cambiado de isUnlockingReportIdeaName
    (!isAuthenticated && !canGenerateAnonymously) ||
    (isAuthenticated && userLimits && !isLoadingLimits 
        ? (!userLimits.can_generate_today || !userLimits.can_generate_this_month)
        : (isAuthenticated && !userLimits && !isLoadingLimits) 
          ? true 
          : false 
    );

  return (
     <div className="relative min-h-screen bg-gray-900/20 text-white">
      <div className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat -z-10 animate-pulse-opacity-slow" style={{ backgroundImage: "url('/background-generar-ideas.png')" }}></div>
      <div className="fixed inset-0 w-full h-full bg-black/70 -z-10"></div>
      <div className="relative z-20 font-sans flex flex-col items-center py-10 px-4 min-h-screen">
        <div className="w-full max-w-3xl">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-800 mb-4">
              Genera. Valida. Emprende.
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              Describe tu punto de partida. Nuestra IA te proporcionará conceptos de negocio y análisis iniciales.
            </p>
          </header>

          <form onSubmit={handleSubmit} className={`space-y-12 bg-gray-800/70 backdrop-blur-md p-6 md:p-10 rounded-2xl shadow-2xl border border-gray-700/50 mb-16`}>
            {/* FORMULARIO SIN CAMBIOS EN SU JSX INTERNO */}
             <section aria-labelledby="vision-heading" className={sectionSpacingClasses}> <h2 id="vision-heading" className={sectionTitleClasses}> Paso 1: Tu Visión <span className="text-sm font-normal text-gray-400">(Completa al menos uno de estos dos campos)</span> </h2> <div className={fieldGroupClasses}> <div> <label htmlFor="idea_seed" className={labelClasses}> 1. ¿Tienes una idea o concepto inicial en mente? <span className="block text-xs font-normal text-gray-400/80 mt-1">Si ya tienes un chispazo o un área de enfoque, compártela.</span> </label> <textarea name="idea_seed" id="idea_seed" value={formData.idea_seed} onChange={handleChange} rows={3} className={inputClasses} placeholder='Ej: "Plataforma de IA para optimizar logística de última milla" o "Moda sostenible con materiales reciclados"' /> </div> <div> <label htmlFor="problem_to_solve" className={labelClasses}> 2. ¿Qué problema o necesidad clave buscas abordar? <span className="block text-xs font-normal text-gray-400/80 mt-1">Describe el desafío o la oportunidad que quieres abordar.</span> </label> <textarea name="problem_to_solve" id="problem_to_solve" value={formData.problem_to_solve} onChange={handleChange} rows={3} className={inputClasses} placeholder='Ej: "La ineficiencia en la gestión de inventarios para PyMEs" o "La falta de opciones de ocio saludable para jóvenes en áreas urbanas"' /> </div> </div> </section>
             <section aria-labelledby="profile-heading" className={sectionSpacingClasses}> <h2 id="profile-heading" className={sectionTitleClasses}> Paso 2: Sobre Ti <span className="text-sm font-normal text-gray-400">(Opcional)</span> </h2> <div className="grid md:grid-cols-2 md:gap-x-8 gap-y-6"> <div className={fieldGroupClasses}> <div> <label htmlFor="interests" className={labelClasses}> 2.1. Nichos o Industrias de Interés Principal <span className="block text-xs font-normal text-gray-400/80 mt-1">Separa por comas. Ej: Fintech, IA en salud, E-commerce de autor</span> </label> <input type="text" name="interests" id="interests" value={formData.interests} onChange={handleChange} className={inputClasses} placeholder="Ej: Energías renovables, EdTech, Bienestar digital" /> </div> <div> <label htmlFor="resources_time" className={labelClasses}>2.3. Dedicación Estimada al Proyecto</label> <select name="resources_time" id="resources_time" value={formData.resources_time} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}> <option value="No especificado" className="text-gray-500 bg-gray-800">Elige tu disponibilidad...</option> <option value="Menos de 10 horas semanales" className="bg-gray-800">Menos de 10 horas/semana (Complementario)</option> <option value="10-20 horas semanales" className="bg-gray-800">10-20 horas/semana (Medio tiempo)</option> <option value="Más de 20 horas semanales (Full-time)" className="bg-gray-800">Más de 20 horas/semana (Dedicación completa)</option> </select> </div> </div> <div className={fieldGroupClasses}> <div> <label htmlFor="skills" className={labelClasses}> 2.2. Tus Habilidades o Experiencia Clave <span className="block text-xs font-normal text-gray-400/80 mt-1">Separa por comas. Ej: Desarrollo Full-Stack, Marketing Digital</span> </label> <input type="text" name="skills" id="skills" value={formData.skills} onChange={handleChange} className={inputClasses} placeholder="Ej: Gestión de Proyectos Ágiles, Ventas B2B, Diseño UX/UI" /> </div> <div> <label htmlFor="resources_capital" className={labelClasses}>2.4. Capacidad de Inversión Inicial</label> <select name="resources_capital" id="resources_capital" value={formData.resources_capital} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}> <option value="No especificado" className="text-gray-500 bg-gray-800">Define tu capacidad...</option> <option value="Muy bajo (Bootstrap/Casi nulo)" className="bg-gray-800">Bootstrap / Fondos mínimos</option> <option value="Bajo (Algunos ahorros personales)" className="bg-gray-800">Ahorros personales (Bajo)</option> <option value="Medio (Inversión moderada o 'Amigos y Familia')" className="bg-gray-800">Inversión moderada (Medio)</option> <option value="Alto (Busco 'Ángeles Inversionistas' / Capital Semilla)" className="bg-gray-800">Capital Semilla / Inversores (Alto)</option> </select> </div> </div> </div> </section>
             <section aria-labelledby="preferences-heading" className={sectionSpacingClasses}> <h2 id="preferences-heading" className={sectionTitleClasses}> Paso 3: Ajustes Finos <span className="text-sm font-normal text-gray-400">(Opcional)</span> </h2> <div className="grid md:grid-cols-2 md:gap-x-8 gap-y-6"> <div className={fieldGroupClasses}> <div> <label htmlFor="target_audience" className={labelClasses}> 3.1. Describe tu Cliente o Usuario Ideal <span className="block text-xs font-normal text-gray-400/80 mt-1">¿A quién te diriges? Mientras más detalles, más precisa la IA.</span> </label> <textarea name="target_audience" id="target_audience" value={formData.target_audience} onChange={handleChange} rows={2} className={inputClasses} placeholder='Ej: "Startups B2B en sector SaaS con 10-50 empleados" o "Millennials eco-conscientes (25-35 años) en grandes ciudades"' /> </div> <div> <label htmlFor="innovation_level" className={labelClasses}>3.3. Nivel de Innovación que Buscas</label> <select name="innovation_level" id="innovation_level" value={formData.innovation_level} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}> <option value="No especificado" className="text-gray-500 bg-gray-800">Selecciona el alcance...</option> <option value="Incremental" className="bg-gray-800">Incremental (Mejorar algo existente)</option> <option value="Adaptativa" className="bg-gray-800">Adaptativa (Aplicar un modelo exitoso a un nuevo nicho)</option> <option value="Disruptiva" className="bg-gray-800">Disruptiva (Crear o transformar un mercado)</option> </select> </div> </div> <div className={fieldGroupClasses}> <div> <label htmlFor="risk_aversion" className={labelClasses}>3.2. Tu Tolerancia al Riesgo Empresarial</label> <select name="risk_aversion" id="risk_aversion" value={formData.risk_aversion} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}> <option value="No especificada" className="text-gray-500 bg-gray-800">Define tu perfil de riesgo...</option> <option value="Muy alta (Prefiero algo muy seguro y probado)" className="bg-gray-800">Muy alta (Busco máxima seguridad)</option> <option value="Alta (Cauteloso, prefiero minimizar riesgos)" className="bg-gray-800">Alta (Cauteloso)</option> <option value="Media (Abierto a riesgos calculados)" className="bg-gray-800">Media (Equilibrado)</option> <option value="Baja (Dispuesto a tomar riesgos significativos por alta recompensa)" className="bg-gray-800">Baja (Audaz)</option> </select> </div> <div> <label htmlFor="preferred_business_model" className={labelClasses}>3.4. Modelo de Negocio de Preferencia</label> <select name="preferred_business_model" id="preferred_business_model" value={formData.preferred_business_model} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}> <option value="No especificado" className="text-gray-500 bg-gray-800">Elige un modelo o déjalo a la IA...</option> <option value="SaaS (Software como Servicio)" className="bg-gray-800">SaaS (Software como Servicio)</option> <option value="E-commerce (Venta Online Directa)" className="bg-gray-800">E-commerce (Venta Online Directa)</option> <option value="Marketplace (Plataforma Intermediaria)" className="bg-gray-800">Marketplace (Plataforma Intermediaria)</option> <option value="Contenido/Comunidad (Suscripción, Publicidad)" className="bg-gray-800">Contenido/Comunidad</option> <option value="Servicios Profesionales/Consultoría" className="bg-gray-800">Servicios Profesionales/Consultoría</option> <option value="Producto Físico (Diseño, Fabricación y Venta)" className="bg-gray-800">Producto Físico</option> </select> </div> </div> </div> <div className="md:col-span-2 pt-4"> <label className={labelClasses}>3.5. Valores Fundamentales para tu Futuro Negocio <span className="text-xs font-normal text-gray-500">(Selecciona hasta 3)</span></label> <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3 mt-1"> {CORE_VALUES_OPTIONS.map(value => ( <label key={value} className="flex items-center space-x-2.5 text-sm text-gray-300 cursor-pointer hover:text-purple-300 transition-colors"> <input type="checkbox" name="core_business_values" value={value} checked={formData.core_business_values?.includes(value)} onChange={handleCheckboxChange} disabled={(formData.core_business_values?.length ?? 0) >= 3 && !formData.core_business_values?.includes(value)} className="form-checkbox h-4 w-4 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500 focus:ring-offset-gray-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50" /> <span>{value}</span> </label> ))} </div> </div> </section>

            <button type="submit" disabled={isGenerationDisabled} className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition-all hover:scale-105 active:scale-95 disabled:opacity-60 flex items-center justify-center text-base md:col-span-2 mt-10">
              {isLoading ? 'Generando...' : ((isSavingIdeaName || isProcessingUnlock) ? 'Procesando...' : 'Generar Conceptos de Negocio con IA')}
            </button>
            {!isAuthenticated && !canGenerateAnonymously && (
                <p className="text-center text-purple-300 text-sm mt-4">
                    Has alcanzado el máximo de generaciones gratuitas. Regístrate o inicia sesión para más.
                </p>
            )}
            {isAuthenticated && userLimits && !userLimits.can_generate_today && (
                 <p className="text-center text-purple-300 text-sm mt-4">
                    Has alcanzado tu límite diario de generaciones. Intenta de nuevo mañana.
                </p>
            )}
            {isAuthenticated && userLimits && userLimits.can_generate_today && !userLimits.can_generate_this_month && (
                 <p className="text-center text-purple-300 text-sm mt-4">
                    Has alcanzado tu límite mensual de generaciones.
                </p>
            )}
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
                          
                          {/* --- BOTÓN "ADQUIRIR INFORME" EN TARJETA MODIFICADO --- */}
                          <button 
                            onClick={() => handleUnlockReport(idea)} 
                            disabled={isProcessingUnlock === idea.idea_name && !idea.is_detailed_report_purchased} 
                            className={`w-full text-sm py-2.5 px-3 rounded-lg border transition-colors disabled:opacity-60 flex items-center justify-center ${unlockButtonClasses}`}
                          >
                            {isProcessingUnlock === idea.idea_name && !idea.is_detailed_report_purchased
                                ? (<> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Procesando...</>)
                                : (idea.is_detailed_report_purchased
                                    ? <><CheckIcon /> Ver Informe Detallado</>
                                    : <><LockIcon /> Adquirir Informe Detallado ({DETAILED_REPORT_PRICE_DISPLAY})</>
                                  )
                            }
                          </button>
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

      {/* --- MODAL "RESUMEN BÁSICO" MODIFICADO --- */}
      {isModalOpen && selectedIdea && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in-up scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"> <h2 className="text-2xl md:text-3xl font-bold text-purple-400">{selectedIdea.idea_name}</h2> <button onClick={closeModal} className="text-gray-400 hover:text-white text-3xl leading-none p-1 -mr-2">×</button> </div>
            <div className="space-y-3 text-gray-300">
              <p><strong className="text-gray-100">Descripción:</strong> {selectedIdea.idea_description}</p>
              <p><strong className="text-gray-100">Justificación Personal:</strong> {selectedIdea.personalization_justification}</p>
              <p><strong className="text-gray-100">Modelo de Negocio Sugerido:</strong> {selectedIdea.suggested_business_model}</p>
              <div className="p-3 bg-gray-700/50 rounded mt-2"><strong className="text-gray-100 block mb-1 text-sm">Análisis de Viabilidad:</strong><p className="text-xs md:text-sm"><span className="font-medium text-purple-300">Oportunidad:</span> {selectedIdea.preliminary_viability_analysis.oportunidad_disruptiva}</p><p className="text-xs md:text-sm"><span className="font-medium text-purple-300">Riesgo:</span> {selectedIdea.preliminary_viability_analysis.riesgo_clave_no_obvio}</p></div>
              {selectedIdea.is_detailed_report_purchased && selectedIdea.detailed_report_content && ( <div className="mt-4 pt-4 border-t border-gray-700"> <p className="text-sm text-green-400">El informe detallado completo ya está disponible.</p> </div> )}
              <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                 <button onClick={() => handleSaveIdea(selectedIdea, false)} disabled={isSavingIdeaName === selectedIdea?.idea_name || selectedIdea?.isSaved} className={`w-full sm:w-auto px-5 py-2 text-white font-semibold rounded-md shadow-md disabled:opacity-70 flex items-center justify-center ${selectedIdea?.isSaved ? 'bg-green-700 border-green-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>{isSavingIdeaName === selectedIdea?.idea_name ? (<> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Guardando...</>) : (selectedIdea?.isSaved ? <><CheckIcon /> ¡Guardada!</> : <><SaveIcon /> Guardar Idea</>)}</button>
                
                {/* --- BOTÓN "ADQUIRIR INFORME" EN MODAL MODIFICADO --- */}
                <button
                    onClick={() => {
                        if (selectedIdea) { // selectedIdea siempre debería existir aquí
                            closeModal(); // Cerrar modal ANTES de llamar a handleUnlockReport para evitar problemas de estado
                            handleUnlockReport(selectedIdea);
                        }
                    }}
                    disabled={isProcessingUnlock === selectedIdea?.idea_name && !selectedIdea?.is_detailed_report_purchased}
                    className={`w-full sm:w-auto px-5 py-2 text-white font-semibold rounded-md shadow-md disabled:opacity-70 flex items-center justify-center ${ selectedIdea?.is_detailed_report_purchased ? 'bg-green-600 cursor-pointer hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700' }`}
                >
                  {isProcessingUnlock === selectedIdea?.idea_name && !selectedIdea?.is_detailed_report_purchased
                      ? (<> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Procesando...</>)
                      : (selectedIdea?.is_detailed_report_purchased
                          ? <><CheckIcon /> Ver Informe Completo</>
                          : <><LockIcon /> Adquirir Informe Completo ({DETAILED_REPORT_PRICE_DISPLAY})</>
                        )
                  }
                </button>
                <button onClick={closeModal} className="w-full sm:w-auto px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md shadow-md flex items-center justify-center">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GenerateIdeaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><p>Cargando página de generación de ideas...</p></div>}>
      <GenerateIdeaInteractiveContent />
    </Suspense>
  );
}
