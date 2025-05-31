// src/app/generate-idea/page.tsx
"use client";

import React, { useState, FormEvent, useEffect, useRef, useCallback, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname, useSearchParams as useNextSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import PayPalButtonWrapper from '@/components/PayPalButtonWrapper'; 

const ANONYMOUS_FREE_GENERATIONS_LIMIT = 2;
const ANONYMOUS_COUNT_STORAGE_KEY = 'anonymousUserGenCount_v1';
const ANONYMOUS_DATE_STORAGE_KEY = 'anonymousUserLastGenDate_v1';

// --- Iconos SVG ---
const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => ( <span className="w-4 h-4 inline-block mr-1.5 align-middle">{children}</span> );
const LockIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /> </svg> </IconWrapper> );
const SaveIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /> </svg> </IconWrapper> );
const CheckIcon = () => ( <IconWrapper> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /> </svg> </IconWrapper> );
const PlusCircleIcon = () => ( <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"> <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /> </svg> </IconWrapper> );

const ACTION_COMPLETED_SIGNAL_KEY = 'genesisAI_action_completed_v1';
const PENDING_GENERATION_FORM_DATA_KEY = 'pendingGenerationFormData_v1';

import {
  HeartIcon as HeartIconOutline,
  MagnifyingGlassIcon, 
  KeyIcon,             
  BookmarkIcon,        
  UserPlusIcon,        
  ArrowRightCircleIcon 
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

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
  is_extended_viability_purchased?: boolean; // <--- NUEVO CAMPO
  detailed_report_content?: any;
  payment_provider?: 'mercadopago' | 'paypal'; 
  _productType?: 'detailed_report' | 'extended_viability'; // Campo temporal para el modal
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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const LAST_FORM_DATA_KEY = 'lastUsedFormDataForGeneration_v3';
const PENDING_FORM_DATA_KEY = 'pendingFormDataForAction_v3';
const CORE_VALUES_OPTIONS = [
  "Innovación", "Sostenibilidad", "Impacto Social", "Eficiencia",
  "Calidad Premium", "Accesibilidad", "Comunidad"
];
const DETAILED_REPORT_PRICE_DISPLAY_ARS = "ARS 10.000"; 
const DETAILED_REPORT_PRICE_USD_PAYPAL = "10.00";
const EXTENDED_VIABILITY_PRICE_DISPLAY_ARS = "ARS 5.000"; // Precio ejemplo
const EXTENDED_VIABILITY_PRICE_USD_PAYPAL = "5.00";  // Precio ejemplo
// --- FIN Constantes ---

declare global {
  interface Window {
    paypal?: any; 
  }
}

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
  const [isProcessingUnlock, setIsProcessingUnlock] = useState<string | null>(null); 
  const [pageError, setPageError] = useState<string | null>(null); 
  
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isUnlockConfirmModalOpen, setIsUnlockConfirmModalOpen] = useState(false);
  const [ideaForUnlockConfirmation, setIdeaForUnlockConfirmation] = useState<GeneratedIdea | null>(null);

  const [anonymousGenerationsToday, setAnonymousGenerationsToday] = useState(0);
  const [canGenerateAnonymously, setCanGenerateAnonymously] = useState(true);
  const [userLimits, setUserLimits] = useState<UserGenerationLimits | null>(null); 
  const [isLoadingLimits, setIsLoadingLimits] = useState(false); 

  const [isProcessingPayPal, setIsProcessingPayPal] = useState<string | null>(null); 
  const [showPayPalButtons, setShowPayPalButtons] = useState(false); 
  const [isProcessingExtendedModule, setIsProcessingExtendedModule] = useState<string | null>(null); // <--- NUEVO ESTADO

  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const { user, session, isLoading: authIsLoading, isAuthenticated, fetchUserLimits: contextFetchUserLimits } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const pageSearchParams = useNextSearchParams();

  const openModalWithIdea = (idea: GeneratedIdea) => { setSelectedIdea(idea); setIsModalOpen(true); };
  const closeModal = useCallback(() => { setIsModalOpen(false); setSelectedIdea(null); }, []);

  const openUnlockConfirmModal = useCallback((idea: GeneratedIdea, productType: 'detailed_report' | 'extended_viability' = 'detailed_report') => {
    setIdeaForUnlockConfirmation({ ...idea, _productType: productType }); // Guardar el tipo de producto
    setIsUnlockConfirmModalOpen(true);
    setShowPayPalButtons(false); 
    setIsProcessingPayPal(null); 
    setIsProcessingUnlock(null);
    setIsProcessingExtendedModule(null); // Resetear este también
  }, []); 

  const closeUnlockConfirmModal = useCallback(() => {
    setIsUnlockConfirmModalOpen(false);
    setIdeaForUnlockConfirmation(null);
    setIsProcessingPayPal(null); 
    setIsProcessingUnlock(null); 
    setIsProcessingExtendedModule(null);
    setShowPayPalButtons(false); 
  }, []); 

  useEffect(() => {
    if (!isAuthenticated) {const storedCountStr = localStorage.getItem(ANONYMOUS_COUNT_STORAGE_KEY);
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
    }}
    else {setCanGenerateAnonymously(true);
      setAnonymousGenerationsToday(0);}
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authIsLoading && isAuthenticated) { contextFetchUserLimits(); } else if (!authIsLoading && !isAuthenticated) { setUserLimits(null); }
  }, [authIsLoading, isAuthenticated, contextFetchUserLimits]);
  const authContextUserLimits = useAuth().userLimits;
  useEffect(() => { setUserLimits(authContextUserLimits); }, [authContextUserLimits]);
  
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

    // --- INICIO DE NUEVA LÓGICA DE AUTENTICACIÓN ---
    if (!isAuthenticated) { // isAuthenticated viene de useAuth()
        toast.info("Debes iniciar sesión o registrarte para generar ideas.");
        try {
            // Guardar el formData actual para restaurarlo después del login
            sessionStorage.setItem(PENDING_GENERATION_FORM_DATA_KEY, JSON.stringify(formData));
            console.log("[handleSubmit] formData guardado en PENDING_GENERATION_FORM_DATA_KEY para usuario no autenticado.");
        } catch (e) {
            console.error("Error guardando PENDING_GENERATION_FORM_DATA_KEY en sessionStorage:", e);
        }
        // Redirigir a login, indicando que hay una acción pendiente y a dónde volver.
        // El 'action=pendingGeneration' es para que el useEffect post-login sepa qué hacer.
        router.push(`/login?redirect=${pathname}&action=pendingGeneration&afterLogin=true`);
        return; // Detener la ejecución de handleSubmit
    }
    // --- FIN DE NUEVA LÓGICA DE AUTENTICACIÓN ---

    // Si llegamos aquí, el usuario ESTÁ autenticado.
    const currentAccessToken = session?.access_token; // session viene de useAuth()

    // Ya no necesitamos esta verificación porque la de arriba la cubre y es más estricta.
    // if (!isAuthenticated && !canGenerateAnonymously) { toast.error("Has alcanzado el máximo de generaciones gratuitas. Regístrate o inicia sesión para más."); return; }
    
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
    closeUnlockConfirmModal(); 
    
    const currentFormDataForSubmit = { ...formData }; // Usamos el formData actual
    const payloadForGenerate = buildUserProfileForAPI(currentFormDataForSubmit);
    
    try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        // Como ya verificamos isAuthenticated arriba, podemos asumir que tenemos el token si es necesario
        if (currentAccessToken) { // Este if es redundante si la lógica de arriba asegura autenticación, pero no hace daño
            headers['Authorization'] = `Bearer ${currentAccessToken}`; 
        } else {
            // Esto no debería ocurrir si la lógica de arriba funciona bien.
            // Podrías lanzar un error o un toast si por alguna razón no hay token aquí.
            console.error("[handleSubmit] Usuario autenticado pero sin access token. Esto no debería pasar.");
            toast.error("Error de sesión. Por favor, intenta recargar la página o vuelve a iniciar sesión.");
            setIsLoading(false);
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/ideas/generate`, { 
            method: 'POST', 
            headers: headers, 
            body: JSON.stringify(payloadForGenerate) 
        });
        const data = await response.json();

        if (!response.ok) {
            let errorDetail = `Error: ${response.status}`; 
            let isLimitError = false;
            if (data && data.detail) {
                // La lógica de error de límite se mantiene, ya que se aplica a usuarios autenticados
                if (response.status === 429 || (typeof data.detail === 'string' && data.detail.toLowerCase().includes("límite de generación"))) { 
                    errorDetail = data.detail; 
                    isLimitError = true; 
                    contextFetchUserLimits(); // contextFetchUserLimits viene de useAuth()
                } else if (Array.isArray(data.detail) && data.detail[0] && typeof data.detail[0] === 'object' && 'msg' in data.detail[0]) { 
                    errorDetail = data.detail.map((d: ApiErrorDetailItem) => `${d.loc.join('.')} - ${d.msg}`).join('; ');
                } else if (typeof data.detail === 'string') { 
                    errorDetail = data.detail; 
                }
            }
            toast.error(errorDetail); 
            if (!isLimitError) setPageError(errorDetail); 
            setIsLoading(false); 
            return;
        }

        const ideasFromApi = Array.isArray(data.generated_ideas) ? data.generated_ideas : [];
        const ideasWithInitialState: GeneratedIdea[] = ideasFromApi.map((idea: any) => ({ 
            ...idea, 
            id: undefined, // Las ideas nuevas no tienen ID de DB hasta que se guardan
            isSaved: false, 
            is_detailed_report_purchased: false, 
            is_extended_viability_purchased: false, 
            detailed_report_content: null 
        }));
        
        setGeneratedIdeas(ideasWithInitialState);

        // --- ELIMINAR ESTE BLOQUE if (!isAuthenticated) ---
        /* 
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
        */
        // --- FIN DE BLOQUE ELIMINADO ---

        // Ahora, como siempre estamos autenticados aquí, solo llamamos a contextFetchUserLimits
        contextFetchUserLimits();

        if (ideasWithInitialState.length > 0) { 
            try { 
                sessionStorage.setItem(LAST_FORM_DATA_KEY, JSON.stringify(currentFormDataForSubmit)); 
                console.log("[handleSubmit] LAST_FORM_DATA_KEY guardado en sessionStorage.");
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
    if (!ideaToSave) return null;
    const currentAccessToken = session?.access_token;
    if (ideaToSave.id && ideaToSave.isSaved && !triggeredFromUnlock) { toast.info(`La idea "${ideaToSave.idea_name}" ya está guardada.`); return ideaToSave; }
    if (authIsLoading) { toast.info("Verificando tu sesión..."); return null; }
    if (!isAuthenticated || !currentAccessToken) { router.push(`/login?redirect=${pathname}&action=savePending`); return null; }
    setIsSavingIdeaName(ideaToSave.idea_name);
    try { 
        let profileDataToUseForSnapshot: FormData = { ...formData }; 
        const isPendingSaveAction = pageSearchParams.get('action') === 'savePending' && sessionStorage.getItem('pendingSaveIdeaName') === ideaToSave.idea_name;
        const pendingFormDataString = sessionStorage.getItem(PENDING_FORM_DATA_KEY);
        if (isPendingSaveAction && pendingFormDataString) { try { profileDataToUseForSnapshot = JSON.parse(pendingFormDataString); } catch (e) { console.error("Error parseando PENDING_FORM_DATA_KEY (save post-login):", e); }
        } else { const lastUsedFormDataString = sessionStorage.getItem(LAST_FORM_DATA_KEY); if (lastUsedFormDataString) { try { profileDataToUseForSnapshot = JSON.parse(lastUsedFormDataString); } catch (e) { console.error("Error parseando LAST_FORM_DATA_KEY (normal save):", e); } } }
        const userProfileForPayload = buildUserProfileForAPI(profileDataToUseForSnapshot);
        const ideaDataForPayload: IdeaBaseForAPI = { idea_name: ideaToSave.idea_name, idea_description: ideaToSave.idea_description, personalization_justification: ideaToSave.personalization_justification, suggested_business_model: ideaToSave.suggested_business_model, preliminary_viability_analysis: ideaToSave.preliminary_viability_analysis, suggested_next_steps: ideaToSave.suggested_next_steps, };
        const payloadForBackend: SaveIdeaPayloadForAPI = { idea_to_save: ideaDataForPayload, user_profile_at_generation: userProfileForPayload };
        const response = await fetch(`${API_BASE_URL}/api/v1/ideas/save`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentAccessToken}`}, body: JSON.stringify(payloadForBackend) });
        const data = await response.json();
        if (!response.ok) { const apiError = data as ApiError; const errorMsg = Array.isArray(apiError.detail) ? apiError.detail.map(d => `${d.loc.join('.')} - ${d.msg}`).join('; ') : (typeof apiError.detail === 'string' ? apiError.detail : `Error al guardar: ${response.status}`); throw new Error(errorMsg); }
        const updatedIdeaFromDB = data as GeneratedIdea; 
        const ideaConEstadoCompleto: GeneratedIdea = { ...ideaToSave, ...updatedIdeaFromDB, isSaved: true, is_extended_viability_purchased: ideaToSave.is_extended_viability_purchased || updatedIdeaFromDB.is_extended_viability_purchased }; // Preservar estado de módulo extendido
        if (!triggeredFromUnlock) toast.success(`¡Idea "${ideaConEstadoCompleto.idea_name}" guardada con éxito!`);
        else toast.info(`Idea "${ideaConEstadoCompleto.idea_name}" guardada. Procediendo...`);
        setGeneratedIdeas(prevIdeas => prevIdeas.map(i => (i.idea_name === ideaToSave.idea_name && !i.id) ? ideaConEstadoCompleto : (i.id === ideaConEstadoCompleto.id ? ideaConEstadoCompleto : i)));
        if (selectedIdea?.idea_name === ideaToSave.idea_name) setSelectedIdea(ideaConEstadoCompleto);
        if (ideaForUnlockConfirmation?.idea_name === ideaToSave.idea_name) setIdeaForUnlockConfirmation(ideaConEstadoCompleto);
        if (isPendingSaveAction) { sessionStorage.removeItem('pendingSaveIdeaName'); sessionStorage.removeItem(PENDING_FORM_DATA_KEY); }
        return ideaConEstadoCompleto;
    } catch (err: any) { 
        console.error("Error en handleSaveIdea:", err);
        const errorMessage = err.message || "Ocurrió un error desconocido al guardar la idea.";
        if (!triggeredFromUnlock) toast.error(errorMessage);
        else toast.error(`Error al auto-guardar para adquirir: ${errorMessage}`);
        return null; 
    } finally { setIsSavingIdeaName(null); }
  }, [authIsLoading, isAuthenticated, session, router, pathname, pageSearchParams, generatedIdeas, selectedIdea, ideaForUnlockConfirmation, formData, buildUserProfileForAPI]);

  const handleMercadoPagoCheckout = useCallback(async (ideaToUnlock: GeneratedIdea | null) => {
    if (!ideaToUnlock) return;
    setIsProcessingUnlock(ideaToUnlock.idea_name);
    let ideaParaCheckout = { ...ideaToUnlock };
    if (!ideaParaCheckout.id || !ideaParaCheckout.isSaved) {
      const savedIdea = await handleSaveIdea(ideaParaCheckout, true); 
      if (savedIdea && savedIdea.id) {
        ideaParaCheckout = savedIdea;
        if (ideaForUnlockConfirmation?.idea_name === savedIdea.idea_name) {
            setIdeaForUnlockConfirmation(savedIdea);
        }
      } else { 
        toast.error("No se pudo guardar la idea. No se puede proceder al pago con Mercado Pago."); 
        setIsProcessingUnlock(null); 
        return; 
      }
    }
    if (ideaParaCheckout.id) {
      console.log(`GenerateIdeaPage: Redirecting to Mercado Pago checkout for idea ID: ${ideaParaCheckout.id}`);
      router.push(`/idea/${ideaParaCheckout.id}/checkout`);
    } else { 
      toast.error("Error crítico: La idea no tiene ID para el checkout de Mercado Pago."); 
      setIsProcessingUnlock(null); 
    }
    const isPendingUnlockAction = pageSearchParams.get('action') === 'unlockPending' && sessionStorage.getItem('pendingUnlockIdeaName') === ideaToUnlock.idea_name;
    if (isPendingUnlockAction) {
        sessionStorage.removeItem('pendingUnlockIdeaName');
        sessionStorage.removeItem(PENDING_FORM_DATA_KEY);
    }
  }, [router, pageSearchParams, handleSaveIdea, ideaForUnlockConfirmation]);

  const handlePreparePayPalPayment = useCallback(async (productType: 'detailed_report' | 'extended_viability') => {
    if (!ideaForUnlockConfirmation) {
        toast.error("No hay una idea seleccionada para el pago.");
        return;
    }
    // Diferenciar el estado de procesamiento basado en el producto
    if (productType === 'detailed_report') {
        setIsProcessingPayPal(ideaForUnlockConfirmation.idea_name);
    } else if (productType === 'extended_viability') {
        setIsProcessingExtendedModule(ideaForUnlockConfirmation.idea_name);
    }
    
    let ideaToProceedWith = { ...ideaForUnlockConfirmation, _productType: productType }; // Añadir tipo de producto

    if (!ideaToProceedWith.id || !ideaToProceedWith.isSaved) {
        toast.info(`Preparando "${ideaToProceedWith.idea_name}" para el pago...`);
        const savedIdea = await handleSaveIdea(ideaToProceedWith, true); 
        if (savedIdea && savedIdea.id) {
            ideaToProceedWith = {...savedIdea, _productType: productType }; // Asegurar que _productType se mantenga
            setIdeaForUnlockConfirmation(ideaToProceedWith); // Actualizar el estado del modal
        } else {
            toast.error("No se pudo preparar la idea para el pago. Intenta de nuevo.");
            if (productType === 'detailed_report') setIsProcessingPayPal(null);
            else setIsProcessingExtendedModule(null);
            return;
        }
    }
    // Actualizar ideaForUnlockConfirmation con _productType antes de mostrar botones
    setIdeaForUnlockConfirmation(ideaToProceedWith); 
    setShowPayPalButtons(true);
  }, [ideaForUnlockConfirmation, handleSaveIdea]);
  
  // Callbacks para PayPalButtonWrapper
  const handlePayPalSuccess = useCallback((paidIdeaId: number, productType?: 'detailed_report' | 'extended_viability') => {
    toast.success(`¡Pago con PayPal completado! ${productType === 'extended_viability' ? 'Módulo extendido' : 'Informe'} desbloqueado.`);
    
    setGeneratedIdeas(prevIdeas => prevIdeas.map(i => {
        if (i.id === paidIdeaId) {
            return productType === 'extended_viability'
                ? { ...i, is_extended_viability_purchased: true, payment_provider: 'paypal' }
                : { ...i, is_detailed_report_purchased: true, payment_provider: 'paypal' };
        }
        return i;
    }));

    if (selectedIdea?.id === paidIdeaId) {
        setSelectedIdea(prev => {
            if (!prev) return null;
            return productType === 'extended_viability'
                ? {...prev, is_extended_viability_purchased: true, payment_provider: 'paypal'}
                : {...prev, is_detailed_report_purchased: true, payment_provider: 'paypal'};
        });
    }
    try {
        sessionStorage.setItem(ACTION_COMPLETED_SIGNAL_KEY, JSON.stringify({
            actionCompletedForIdeaId: paidIdeaId.toString(), // Convertir a string para consistencia con MP
            timestamp: Date.now()
        }));
        console.log(`[PayPalSuccess] Señal de ACCIÓN COMPLETADA guardada para idea ID: ${paidIdeaId}`);
    } catch (e) {
        console.error("[PayPalSuccess] Error guardando señal de acción completada:", e);
    }
    closeUnlockConfirmModal(); 
    // Decidir a dónde redirigir basado en el producto
    if (productType === 'extended_viability') {
        // TODO: Definir la ruta para el informe extendido
        // router.push(`/idea/${paidIdeaId}/extended-viability-report`); 
        toast.info("El análisis extendido estará disponible pronto en 'Mis Ideas'."); // Placeholder
    } else {
        router.push(`/idea/${paidIdeaId}/report`);
    }
  }, [closeUnlockConfirmModal, router, selectedIdea, setGeneratedIdeas, setSelectedIdea]);

useEffect(() => {
    console.log(`[SignalEffect] Disparado. Pathname: ${pathname}. isAuthenticated: ${isAuthenticated}. generatedIdeas.length: ${generatedIdeas.length}`);
    
    const signalString = sessionStorage.getItem(ACTION_COMPLETED_SIGNAL_KEY);
    console.log("[SignalEffect] Contenido inicial de la señal en sessionStorage:", signalString);

    // Solo proceder si la señal existe Y generatedIdeas ya está poblado.
    if (signalString && generatedIdeas.length > 0) {
        console.log("[SignalEffect] Señal ENCONTRADA y generatedIdeas TIENE CONTENIDO. Intentando procesar.");
        
        // Eliminar la señal AHORA porque vamos a intentar procesarla.
        sessionStorage.removeItem(ACTION_COMPLETED_SIGNAL_KEY);
        console.log("[SignalEffect] Señal ELIMINADA de sessionStorage.");

        try {
            const signalData = JSON.parse(signalString);
            const affectedIdeaIdString: string | undefined = signalData.actionCompletedForIdeaId;
            
            if (!affectedIdeaIdString) {
                console.error("[SignalEffect] actionCompletedForIdeaId no encontrado en la señal parseada:", signalData);
                return; // Salir si no hay ID
            }

            const affectedIdeaIdNumber = parseInt(affectedIdeaIdString, 10);
            if (isNaN(affectedIdeaIdNumber)) {
                console.error("[SignalEffect] ID de idea inválido en señal:", affectedIdeaIdString);
                return; // Salir si el ID no es un número
            }

            const purchasedStateFromSignal = {
                is_detailed_report_purchased: signalData.is_detailed_report_purchased === true,
                is_extended_viability_purchased: signalData.is_extended_viability_purchased === true,
                payment_provider: signalData.payment_provider as ('mercadopago' | 'paypal' | undefined)
            };

            console.log(`[SignalEffect] Procesando para idea ID ${affectedIdeaIdNumber}. Datos de la señal:`, purchasedStateFromSignal);

            let ideaActuallyUpdatedInState = false;
            setGeneratedIdeas(prevIdeas => {
                // prevIdeas aquí debería ser el array generatedIdeas que ya está poblado
                console.log(`[SignalEffect] Dentro de setGeneratedIdeas. prevIdeas (debería estar poblado) tiene ${prevIdeas.length} elementos.`);
                
                const updatedGeneratedIdeas = prevIdeas.map(currentLoopIdea => {
                    if (currentLoopIdea.id && currentLoopIdea.id === affectedIdeaIdNumber) {
                        console.log(`[SignalEffect] ACTUALIZANDO idea ID ${affectedIdeaIdNumber} en estado. Antes: p=${currentLoopIdea.is_detailed_report_purchased}. Señal: p=${purchasedStateFromSignal.is_detailed_report_purchased}`);
                        ideaActuallyUpdatedInState = true;
                        return {
                            ...currentLoopIdea,
                            is_detailed_report_purchased: purchasedStateFromSignal.is_detailed_report_purchased || currentLoopIdea.is_detailed_report_purchased,
                            is_extended_viability_purchased: purchasedStateFromSignal.is_extended_viability_purchased || currentLoopIdea.is_extended_viability_purchased,
                            payment_provider: purchasedStateFromSignal.payment_provider || currentLoopIdea.payment_provider,
                        };
                    }
                    return currentLoopIdea;
                });

                if (ideaActuallyUpdatedInState) {
                    console.log(`[SignalEffect] setGeneratedIdeas: La idea ID ${affectedIdeaIdNumber} FUE encontrada y actualizada en el map.`);
                    try {
                        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedGeneratedIdeas));
                        console.log(`[SignalEffect] SESSION_STORAGE_KEY ('${SESSION_STORAGE_KEY}') actualizado con el estado de la idea comprada.`);
                    } catch (e) {
                        console.error("[SignalEffect] Error guardando en sessionStorage tras actualizar idea comprada:", e);
                    }
                } else {
                     console.warn(`[SignalEffect] setGeneratedIdeas: La idea ID ${affectedIdeaIdNumber} NO FUE encontrada en el map para actualizar (prevIdeas IDs: ${prevIdeas.map(i=>i.id).join(', ')}). Esto es inesperado si generatedIdeas.length > 0 y la idea debería estar allí.`);
                }
                return updatedGeneratedIdeas;
            });

            if (ideaActuallyUpdatedInState) {
                // Actualizar selectedIdea y ideaForUnlockConfirmation
                setSelectedIdea(prevSelectedIdea => {
                    if (prevSelectedIdea && prevSelectedIdea.id === affectedIdeaIdNumber) {
                        return { ...prevSelectedIdea, ...purchasedStateFromSignal };
                    }
                    return prevSelectedIdea;
                });
                setIdeaForUnlockConfirmation(prevIdeaForUnlock => { 
                    if (prevIdeaForUnlock && prevIdeaForUnlock.id === affectedIdeaIdNumber) {
                        return { ...prevIdeaForUnlock, ...purchasedStateFromSignal };
                    }
                    return prevIdeaForUnlock;
                });

                // Usar generatedIdeas del estado actual para el nombre es un poco arriesgado por la asincronía de setGeneratedIdeas
                // pero podemos intentarlo, o usar el nombre si lo guardamos en la señal.
                // O simplemente usar el ID para el toast.
                let ideaNameForToast = `Idea ID ${affectedIdeaIdNumber}`;
                // Para obtener el nombre más actualizado, sería mejor buscarlo en `updatedGeneratedIdeas`
                // pero ese no está disponible fuera del `setGeneratedIdeas`.
                // Podemos buscar en `generatedIdeas` (que será el valor ANTES de esta actualización síncrona)
                const ideaEncontrada = generatedIdeas.find(i => i.id === affectedIdeaIdNumber);
                if (ideaEncontrada) ideaNameForToast = ideaEncontrada.idea_name;
                
                toast.success(`Estado de compra para "${ideaNameForToast}" aplicado desde señal.`);
            } else {
                // Si la idea no se encontró en generatedIdeas aunque generatedIdeas tenía contenido.
                // Esto podría pasar si las ideas que se muestran son diferentes a la que se compró
                // (ej. el usuario generó nuevas ideas y la idea comprada ya no está en `tempGeneratedIdeas_v3`).
                console.warn(`[SignalEffect] La idea ID ${affectedIdeaIdNumber} de la señal no se encontró en el array generatedIdeas poblado. La señal fue eliminada.`);
            }

        } catch (parseError) {
            console.error("[SignalEffect] Error parseando la señal:", parseError);
            // La señal ya fue eliminada si el parseo falló aquí, lo cual está bien.
        }
    } else if (signalString && generatedIdeas.length === 0) {
        console.log("[SignalEffect] Señal encontrada, PERO generatedIdeas está vacío. Se reintentará cuando generatedIdeas cambie. La señal NO se elimina aún.");
    } else {
        console.log("[SignalEffect] No se encontró señal en sessionStorage o generatedIdeas estaba vacío sin señal.");
    }
//}, [isAuthenticated, session, pathname, generatedIdeas, setSelectedIdea, setIdeaForUnlockConfirmation, setGeneratedIdeas]);
// Array de dependencias:
// - pathname: para que se ejecute al navegar a la página.
// - generatedIdeas: para que se re-ejecute cuando las ideas se restauren de sessionStorage.
// - isAuthenticated, session: por si el estado de autenticación es relevante (aunque para leer sessionStorage no lo es directamente).
// - Los setters son requeridos por la regla de hooks si se usan.
}, [pathname, generatedIdeas, isAuthenticated, session, setSelectedIdea, setIdeaForUnlockConfirmation, setGeneratedIdeas]);

  const handlePayPalError = useCallback((errorMessage: string, orderId?: string) => {
    let finalMessage = errorMessage;
    if (orderId) {
        finalMessage += ` Tu pago pudo haberse completado. Contacta a soporte con el ID de pedido: ${orderId}`;
    }
    toast.error(finalMessage);
  }, []);

  const handlePayPalCancel = useCallback(() => {
    toast.info("Has cancelado el pago con PayPal.");
  }, []);
  
  const handlePayPalProcessingEnd = useCallback(() => {
    setIsProcessingPayPal(null); 
    setIsProcessingExtendedModule(null);
    setShowPayPalButtons(false); 
  }, []);

  const handleAcquireExtendedModule = (idea: GeneratedIdea) => {
    if (!idea.id) { toast.error("La idea no tiene un ID válido."); return; }
    if (idea.is_extended_viability_purchased) { toast.info("Ya has adquirido el Análisis Extendido para esta idea."); return; }
    if (!idea.is_detailed_report_purchased) { toast.warn("Debes adquirir primero el Informe Detallado."); return; }
    if (authIsLoading) { toast.info("Verificando sesión..."); return; }
    if (!isAuthenticated || !session?.access_token) {
        toast.warn("Debes iniciar sesión para adquirir módulos adicionales.");
        sessionStorage.setItem('pendingAction', JSON.stringify({ type: 'acquireExtendedModule', ideaId: idea.id, ideaName: idea.idea_name }));
        if (generatedIdeas.length > 0) sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(generatedIdeas));
        const formSnapshotForPending = sessionStorage.getItem(LAST_FORM_DATA_KEY) || JSON.stringify(formData);
        sessionStorage.setItem(PENDING_FORM_DATA_KEY, formSnapshotForPending);
        router.push(`/login?redirect=${pathname}&action=pendingExtendedModule`);
        return;
    }
    openUnlockConfirmModal(idea, 'extended_viability'); // Especificar que es para el módulo extendido
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isModalOpen) closeModal();
        else if (isUnlockConfirmModalOpen) closeUnlockConfirmModal();
      }
    };
    if (isModalOpen || isUnlockConfirmModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isModalOpen, closeModal, isUnlockConfirmModalOpen, closeUnlockConfirmModal]);

  useEffect(() => {
    const afterLogin = pageSearchParams.get('afterLogin');
    if (afterLogin !== 'true' && generatedIdeas.length > 0) {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(generatedIdeas));
      }
      catch (e) { console.error("Error actualizando sessionStorage por cambio en generatedIdeas:", e); }
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
        } catch (e) { console.error("Error parseando tempGeneratedIdeas al montar:", e); sessionStorage.removeItem(SESSION_STORAGE_KEY); }
      }
      const storedFormDataString = sessionStorage.getItem(LAST_FORM_DATA_KEY);
      if (storedFormDataString) {
        try {
          const storedFormData = JSON.parse(storedFormDataString);
          const isCurrentFormDataEmpty = !formData.interests && !formData.skills && !formData.idea_seed && !formData.problem_to_solve;
          if(isCurrentFormDataEmpty) setFormData(prev => ({...prev, ...storedFormData}));
        } catch (e) { console.error("Error parseando LAST_FORM_DATA_KEY al montar:", e); sessionStorage.removeItem(LAST_FORM_DATA_KEY); }
      }
    }
  }, [pageSearchParams, formData.interests, formData.skills, formData.idea_seed, formData.problem_to_solve, generatedIdeas.length]);

  useEffect(() => {
    const processPostLoginActions = async () => {
        const afterLogin = pageSearchParams.get('afterLogin') === 'true';
        const action = pageSearchParams.get('action'); // Tu variable se llama 'action'
        
        if (afterLogin && !authIsLoading && isAuthenticated && session?.access_token) {
            console.log(`[PostLoginEffect] afterLogin=true, action=${action}`); // Log para depurar

            let ideasParaProcesar = [...generatedIdeas];
            if(ideasParaProcesar.length === 0){
                const tempIdeasString = sessionStorage.getItem(SESSION_STORAGE_KEY);
                if (tempIdeasString) {
                    try { 
                        ideasParaProcesar = JSON.parse(tempIdeasString); 
                        console.log("[PostLoginEffect] Ideas restauradas desde sessionStorage para procesar acción pendiente:", ideasParaProcesar.length);
                    } 
                    catch (e) { 
                        console.error("Error parsing ideasFromSession (post-login effect):", e); 
                        ideasParaProcesar = []; 
                    }
                }
            }

            const pendingSaveIdeaName = sessionStorage.getItem('pendingSaveIdeaName');
            const pendingUnlockIdeaName = sessionStorage.getItem('pendingUnlockIdeaName');
            const pendingActionRaw = sessionStorage.getItem('pendingAction');

            let ideaToProcess: GeneratedIdea | undefined;
            let actionWasHandled = false; // Para controlar si se debe hacer el router.replace

            if (action === 'savePending' && pendingSaveIdeaName) {
                actionWasHandled = true;
                ideaToProcess = ideasParaProcesar.find(i => i.idea_name === pendingSaveIdeaName && !i.id);
                if (ideaToProcess) {
                    console.log("[PostLoginEffect] Procesando 'savePending' para:", ideaToProcess.idea_name);
                    await handleSaveIdea(ideaToProcess, false); 
                } else {
                     console.warn("[PostLoginEffect] 'savePending': No se encontró la idea o ya tiene ID:", pendingSaveIdeaName);
                }
                sessionStorage.removeItem('pendingSaveIdeaName');
                sessionStorage.removeItem(PENDING_FORM_DATA_KEY); // Limpiar form data general
            } else if (action === 'unlockPending' && pendingUnlockIdeaName) {
                actionWasHandled = true;
                ideaToProcess = ideasParaProcesar.find(i => i.idea_name === pendingUnlockIdeaName);
                if (ideaToProcess) {
                    console.log("[PostLoginEffect] Procesando 'unlockPending' para:", ideaToProcess.idea_name);
                    openUnlockConfirmModal(ideaToProcess, 'detailed_report');
                } else {
                    console.warn("[PostLoginEffect] 'unlockPending': No se encontró la idea:", pendingUnlockIdeaName);
                }
                sessionStorage.removeItem('pendingUnlockIdeaName');
                sessionStorage.removeItem(PENDING_FORM_DATA_KEY); // Limpiar form data general
            } else if (action === 'pendingExtendedModule' && pendingActionRaw) {
                actionWasHandled = true;
                try {
                    const pendingActionData = JSON.parse(pendingActionRaw);
                    if (pendingActionData.type === 'acquireExtendedModule' && pendingActionData.ideaName) {
                        ideaToProcess = ideasParaProcesar.find(i => i.idea_name === pendingActionData.ideaName);
                        if (ideaToProcess) {
                            console.log("[PostLoginEffect] Procesando 'pendingExtendedModule' para:", ideaToProcess.idea_name);
                            openUnlockConfirmModal(ideaToProcess, 'extended_viability');
                        } else {
                            console.warn("[PostLoginEffect] 'pendingExtendedModule': No se encontró la idea:", pendingActionData.ideaName);
                        }
                    }
                } catch (e) { console.error("Error parseando pendingAction:", e); }
                sessionStorage.removeItem('pendingAction');
                sessionStorage.removeItem(PENDING_FORM_DATA_KEY); // Limpiar form data general
            
            // --- INICIO: NUEVA LÓGICA PARA 'pendingGeneration' ---
            } else if (action === 'pendingGeneration') {
                actionWasHandled = true;
                console.log("[PostLoginEffect] Detectada acción 'pendingGeneration'.");
                const pendingFormDataString = sessionStorage.getItem(PENDING_GENERATION_FORM_DATA_KEY);
                if (pendingFormDataString) {
                    try {
                        const pendingFormData: FormData = JSON.parse(pendingFormDataString); // Usa tu interfaz FormData
                        console.log("[PostLoginEffect] Restaurando formData desde PENDING_GENERATION_FORM_DATA_KEY:", pendingFormData);
                        setFormData(pendingFormData); // Actualizar el estado del formulario
                        toast.info("Hemos restaurado los datos de tu formulario. ¡Ya puedes generar tus ideas!");
                        sessionStorage.removeItem(PENDING_GENERATION_FORM_DATA_KEY); // Limpiar después de restaurar
                        console.log("[PostLoginEffect] PENDING_GENERATION_FORM_DATA_KEY eliminado.");
                    } catch (e) {
                        console.error("[PostLoginEffect] Error parseando PENDING_GENERATION_FORM_DATA_KEY:", e);
                        sessionStorage.removeItem(PENDING_GENERATION_FORM_DATA_KEY); // Limpiar si está corrupto
                    }
                } else {
                    console.log("[PostLoginEffect] 'pendingGeneration' detectado pero no se encontró PENDING_GENERATION_FORM_DATA_KEY.");
                }
            // --- FIN: NUEVA LÓGICA PARA 'pendingGeneration' ---
            }
            
            // Limpieza general de query params si alguna acción fue manejada
            if (actionWasHandled || action) { // Si action tenía un valor, aunque no lo hayamos manejado explícitamente, limpiamos la URL
                // Limpiar query params 'action' y 'afterLogin' de la URL
                const newSearchParams = new URLSearchParams(pageSearchParams.toString());
                newSearchParams.delete('action');
                newSearchParams.delete('afterLogin');
                const newPathQuery = `${pathname}${newSearchParams.size > 0 ? `?${newSearchParams.toString()}` : ''}`;
                router.replace(newPathQuery, { scroll: false });
                console.log("[PostLoginEffect] Query params 'action' y 'afterLogin' eliminados de la URL si estaban presentes.");
            }

            // Tu lógica original de limpiar ideas temporales (SESSION_STORAGE_KEY)
            // Solo la ejecutamos si la acción NO fue una que necesitara las ideas para un modal
            // y si la acción pendiente fue realmente procesada (ideaToProcess no es undefined).
            // Para 'pendingGeneration', no se usa 'ideaToProcess', así que esta condición está bien.
            if (actionWasHandled && !( 
                   (action === 'unlockPending' && pendingUnlockIdeaName && ideaToProcess) || 
                   (action === 'pendingExtendedModule' && pendingActionRaw && ideaToProcess) 
                )) {
                 console.log("[PostLoginEffect] Limpiando SESSION_STORAGE_KEY ('tempGeneratedIdeas_v3') porque la acción no requiere ideas en modal o 'ideaToProcess' es undefined.");
                 sessionStorage.removeItem(SESSION_STORAGE_KEY);
            } else if (actionWasHandled) {
                console.log("[PostLoginEffect] NO se limpia SESSION_STORAGE_KEY porque la acción podría necesitar ideas en modal y 'ideaToProcess' está definido.");
            }
        }
    };
    processPostLoginActions();
  }, [
      pageSearchParams, 
      authIsLoading, 
      isAuthenticated, 
      session, 
      router, 
      pathname, 
      handleSaveIdea, 
      generatedIdeas, 
      openUnlockConfirmModal, 
      handleMercadoPagoCheckout, // Estaba en tus dependencias originales
      // --- NUEVAS DEPENDENCIAS ---
      formData, // Leído implícitamente por buildUserProfileForAPI dentro de handleSaveIdea, y para setFormData.
      setFormData, // Porque lo llamamos directamente.
      buildUserProfileForAPI // Si handleSaveIdea lo usa y está definido en el scope del componente.
      // --- FIN NUEVAS DEPENDENCIAS ---
    ]);

useEffect(() => {
    // Este efecto es SOLO para restaurar el formData si se guardó previamente.
    // Se ejecuta al cargar/navegar a esta página.
    console.log(`[FormRestoreEffectSimple] Ejecutándose. Pathname: ${pathname}.`);
    
    const pendingFormDataString = sessionStorage.getItem(PENDING_GENERATION_FORM_DATA_KEY);
    
    if (pendingFormDataString) {
        console.log("[FormRestoreEffectSimple] PENDING_GENERATION_FORM_DATA_KEY encontrado:", pendingFormDataString.substring(0,100) + "...");
        try {
            const pendingFormData: FormData = JSON.parse(pendingFormDataString); // FormData es tu interfaz
            
            console.log("[FormRestoreEffectSimple] Restaurando formData desde PENDING_GENERATION_FORM_DATA_KEY:", pendingFormData);
            setFormData(pendingFormData); // Actualiza el estado del formulario
            toast.info("Hemos restaurado los datos de tu formulario anterior.");
            
            // Eliminar la clave después de la restauración para que no se aplique de nuevo
            // en futuras visitas a menos que se vuelva a guardar.
            sessionStorage.removeItem(PENDING_GENERATION_FORM_DATA_KEY);
            console.log("[FormRestoreEffectSimple] PENDING_GENERATION_FORM_DATA_KEY eliminado de sessionStorage.");

        } catch (e) {
            console.error("[FormRestoreEffectSimple] Error parseando PENDING_GENERATION_FORM_DATA_KEY:", e);
            sessionStorage.removeItem(PENDING_GENERATION_FORM_DATA_KEY); // Limpiar si está corrupto
        }
    } else {
        console.log("[FormRestoreEffectSimple] No se encontró PENDING_GENERATION_FORM_DATA_KEY en sessionStorage.");
    }
// Dependencias: pathname para que se ejecute al navegar a esta ruta.
// setFormData es una dependencia porque la usamos.
// toast (si es una prop o viene de un hook que podría cambiar, aunque es raro para toast).
// No necesitamos `formData` como dependencia aquí si la lógica es solo "si existe la clave, úsala y bórrala".
}, [pathname, setFormData, toast]); // Asegúrate de que toast esté bien manejado como dependencia si es necesario.

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

  const isGenerationDisabled = isLoading || !!isSavingIdeaName || !!isProcessingUnlock || !!isProcessingPayPal || !!isProcessingExtendedModule || (!isAuthenticated && !canGenerateAnonymously) || (isAuthenticated && userLimits && !isLoadingLimits ? (!userLimits.can_generate_today || !userLimits.can_generate_this_month) : (isAuthenticated && !userLimits && !isLoadingLimits) ? true : false );

  const handleAcquireReportClick = (idea: GeneratedIdea) => { // Para el informe detallado principal
    if (idea.is_detailed_report_purchased) {
      if (idea.id) router.push(`/idea/${idea.id}/report`);
      else toast.error("Error: Informe comprado pero falta ID de la idea.");
    } else {
      if (authIsLoading) { toast.info("Verificando sesión..."); return; }
      if (!isAuthenticated || !session?.access_token) {
        toast.warn("Debes iniciar sesión para adquirir informes.");
        try {
          const ideasToStoreInSession = generatedIdeas.length > 0 ? generatedIdeas : (idea ? [idea] : []);
          if (ideasToStoreInSession.length > 0) sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(ideasToStoreInSession));
          sessionStorage.setItem('pendingUnlockIdeaName', idea.idea_name); // Específico para informe detallado
          const formSnapshotForPending = sessionStorage.getItem(LAST_FORM_DATA_KEY) || JSON.stringify(formData);
          sessionStorage.setItem(PENDING_FORM_DATA_KEY, formSnapshotForPending);
        } catch (e) { console.error("Error guardando estado en sessionStorage (unlock pre-login):", e); }
        router.push(`/login?redirect=${pathname}&action=unlockPending`); // Acción específica para informe detallado
        return;
      }
      openUnlockConfirmModal(idea, 'detailed_report'); // Especificar que es para el informe detallado
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900/20 text-white">
      <div className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat -z-10 animate-pulse-opacity-slow" style={{ backgroundImage: "url('/background-generar-ideas.png')" }}></div>
      <div className="fixed inset-0 w-full h-full bg-black/70 -z-10"></div>
      <div className="relative z-20 font-sans flex flex-col items-center py-10 px-4 min-h-screen">
        <div className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl">
          <header className="text-center mb-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-800 mb-4">
              Genera. Valida. Emprende.
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              Describe tu punto de partida. Nuestra IA te proporcionará conceptos de negocio y análisis iniciales.
            </p>
          </header>

          <form onSubmit={handleSubmit} className={`bg-gray-800/70 backdrop-blur-md p-6 md:p-10 rounded-2xl shadow-2xl border border-gray-700/50 mb-16`}>
            {/* ... (Contenido del formulario SIN CAMBIOS) ... */}
             <div className="flex flex-col lg:flex-row lg:gap-8 space-y-12 lg:space-y-0">
              <div className="lg:flex-1 space-y-5">
                <section aria-labelledby="vision-heading" className={sectionSpacingClasses}> <h2 id="vision-heading" className={sectionTitleClasses}> Paso 1: Tu Visión <span className="text-sm font-normal text-gray-400">(Completa al menos uno de estos dos campos)</span> </h2> <div className={fieldGroupClasses}> <div> <label htmlFor="idea_seed" className={labelClasses}> 1. ¿Tienes una idea o concepto inicial en mente? <span className="block text-xs font-normal text-gray-400/80 mt-1">Si ya tienes un chispazo o un área de enfoque, compártela.</span> </label> <textarea name="idea_seed" id="idea_seed" value={formData.idea_seed} onChange={handleChange} rows={3} className={inputClasses} placeholder='Ej: "Plataforma de IA para optimizar logística de última milla" o "Moda sostenible con materiales reciclados"' /> </div> <div> <label htmlFor="problem_to_solve" className={labelClasses}> 2. ¿Qué problema o necesidad clave buscas abordar? <span className="block text-xs font-normal text-gray-400/80 mt-1">Describe el desafío o la oportunidad que quieres abordar.</span> </label> <textarea name="problem_to_solve" id="problem_to_solve" value={formData.problem_to_solve} onChange={handleChange} rows={3} className={inputClasses} placeholder='Ej: "La ineficiencia en la gestión de inventarios para PyMEs" o "La falta de opciones de ocio saludable para jóvenes en áreas urbanas"' /> </div> </div> </section>
                <section aria-labelledby="profile-heading" className={sectionSpacingClasses}> <h2 id="profile-heading" className={sectionTitleClasses}> Paso 2: Sobre Ti <span className="text-sm font-normal text-gray-400">(Opcional)</span> </h2> <div className="grid md:grid-cols-2 md:gap-x-8 gap-y-6"> <div className={fieldGroupClasses}> <div> <label htmlFor="interests" className={labelClasses}> 2.1. Nichos o Industrias de Interés Principal <span className="block text-xs font-normal text-gray-400/80 mt-1">Separa por comas. Ej: Fintech, IA en salud, E-commerce de autor</span> </label> <input type="text" name="interests" id="interests" value={formData.interests} onChange={handleChange} className={inputClasses} placeholder="Ej: Energías renovables, EdTech, Bienestar digital" /> </div> <div> <label htmlFor="resources_time" className={labelClasses}>2.3. Dedicación Estimada al Proyecto</label> <select name="resources_time" id="resources_time" value={formData.resources_time} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}> <option value="No especificado" className="text-gray-500 bg-gray-800">Elige tu disponibilidad...</option> <option value="Menos de 10 horas semanales" className="bg-gray-800">Menos de 10 horas/semana (Complementario)</option> <option value="10-20 horas semanales" className="bg-gray-800">10-20 horas/semana (Medio tiempo)</option> <option value="Más de 20 horas semanales (Full-time)" className="bg-gray-800">Más de 20 horas/semana (Dedicación completa)</option> </select> </div> </div> <div className={fieldGroupClasses}> <div> <label htmlFor="skills" className={labelClasses}> 2.2. Tus Habilidades o Experiencia Clave <span className="block text-xs font-normal text-gray-400/80 mt-1">Separa por comas. Ej: Desarrollo Full-Stack, Marketing Digital</span> </label> <input type="text" name="skills" id="skills" value={formData.skills} onChange={handleChange} className={inputClasses} placeholder="Ej: Gestión de Proyectos Ágiles, Ventas B2B, Diseño UX/UI" /> </div> <div> <label htmlFor="resources_capital" className={labelClasses}>2.4. Capacidad de Inversión Inicial</label> <select name="resources_capital" id="resources_capital" value={formData.resources_capital} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}> <option value="No especificado" className="text-gray-500 bg-gray-800">Define tu capacidad...</option> <option value="Muy bajo (Bootstrap/Casi nulo)" className="bg-gray-800">Bootstrap / Fondos mínimos</option> <option value="Bajo (Algunos ahorros personales)" className="bg-gray-800">Ahorros personales (Bajo)</option> <option value="Medio (Inversión moderada o 'Amigos y Familia')" className="bg-gray-800">Inversión moderada (Medio)</option> <option value="Alto (Busco 'Ángeles Inversionistas' / Capital Semilla)" className="bg-gray-800">Capital Semilla / Inversores (Alto)</option> </select> </div> </div> </div> </section>
              </div>
              <div className="lg:flex-1">
                <section aria-labelledby="preferences-heading" className={sectionSpacingClasses}> <h2 id="preferences-heading" className={sectionTitleClasses}> Paso 3: Ajustes Finos <span className="text-sm font-normal text-gray-400">(Opcional)</span> </h2> <div className="space-y-6"> <div className={fieldGroupClasses}> <div> <label htmlFor="target_audience" className={labelClasses}> 3.1. Describe tu Cliente o Usuario Ideal <span className="block text-xs font-normal text-gray-400/80 mt-1">¿A quién te diriges? Mientras más detalles, más precisa la IA.</span> </label> <textarea name="target_audience" id="target_audience" value={formData.target_audience} onChange={handleChange} rows={2} className={inputClasses} placeholder='Ej: "Startups B2B en sector SaaS con 10-50 empleados" o "Millennials eco-conscientes (25-35 años) en grandes ciudades"' /> </div> <div className="mt-6 md:mt-0"> <label htmlFor="innovation_level" className={labelClasses}>3.3. Nivel de Innovación que Buscas</label> <select name="innovation_level" id="innovation_level" value={formData.innovation_level} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}> <option value="No especificado" className="text-gray-500 bg-gray-800">Selecciona el alcance...</option> <option value="Incremental" className="bg-gray-800">Incremental (Mejorar algo existente)</option> <option value="Adaptativa" className="bg-gray-800">Adaptativa (Aplicar un modelo exitoso a un nuevo nicho)</option> <option value="Disruptiva" className="bg-gray-800">Disruptiva (Crear o transformar un mercado)</option> </select> </div> </div> <div className={fieldGroupClasses}> <div> <label htmlFor="risk_aversion" className={labelClasses}>3.2. Tu Tolerancia al Riesgo Empresarial</label> <select name="risk_aversion" id="risk_aversion" value={formData.risk_aversion} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}> <option value="No especificada" className="text-gray-500 bg-gray-800">Define tu perfil de riesgo...</option> <option value="Muy alta (Prefiero algo muy seguro y probado)" className="bg-gray-800">Muy alta (Busco máxima seguridad)</option> <option value="Alta (Cauteloso, prefiero minimizar riesgos)" className="bg-gray-800">Alta (Cauteloso)</option> <option value="Media (Abierto a riesgos calculados)" className="bg-gray-800">Media (Equilibrado)</option> <option value="Baja (Dispuesto a tomar riesgos significativos por alta recompensa)" className="bg-gray-800">Baja (Audaz)</option> </select> </div> <div className="mt-6 md:mt-0"> <label htmlFor="preferred_business_model" className={labelClasses}>3.4. Modelo de Negocio de Preferencia</label> <select name="preferred_business_model" id="preferred_business_model" value={formData.preferred_business_model} onChange={handleChange} className={selectClasses} style={{ backgroundImage: selectArrowSvg}}> <option value="No especificado" className="text-gray-500 bg-gray-800">Elige un modelo o déjalo a la IA...</option> <option value="SaaS (Software como Servicio)" className="bg-gray-800">SaaS (Software como Servicio)</option> <option value="E-commerce (Venta Online Directa)" className="bg-gray-800">E-commerce (Venta Online Directa)</option> <option value="Marketplace (Plataforma Intermediaria)" className="bg-gray-800">Marketplace (Plataforma Intermediaria)</option> <option value="Contenido/Comunidad (Suscripción, Publicidad)" className="bg-gray-800">Contenido/Comunidad</option> <option value="Servicios Profesionales/Consultoría" className="bg-gray-800">Servicios Profesionales/Consultoría</option> <option value="Producto Físico (Diseño, Fabricación y Venta)" className="bg-gray-800">Producto Físico</option> </select> </div> </div> </div> <div className="pt-4 mt-6 border-t border-gray-700/50"> <label className={labelClasses}>3.5. Valores Fundamentales para tu Futuro Negocio <span className="text-xs font-normal text-gray-500">(Selecciona hasta 3)</span></label> <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mt-1"> {CORE_VALUES_OPTIONS.map(value => ( <label key={value} className="flex items-center space-x-2.5 text-sm text-gray-300 cursor-pointer hover:text-purple-300 transition-colors"> <input type="checkbox" name="core_business_values" value={value} checked={formData.core_business_values?.includes(value)} onChange={handleCheckboxChange} disabled={(formData.core_business_values?.length ?? 0) >= 3 && !formData.core_business_values?.includes(value)} className="form-checkbox h-4 w-4 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500 focus:ring-offset-gray-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50" /> <span>{value}</span> </label> ))} </div> </div> </section>
              </div>
            </div>
            <button type="submit" disabled={isGenerationDisabled} className="w-full mt-12 py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition-all hover:scale-105 active:scale-95 disabled:opacity-60 flex items-center justify-center text-base">
              {isLoading ? 'Generando...' : ((isSavingIdeaName || isProcessingUnlock || isProcessingPayPal || isProcessingExtendedModule) ? 'Procesando...' : 'Generar Conceptos de Negocio con IA')}
            </button>
            {!isAuthenticated && !canGenerateAnonymously && ( <p className="text-center text-purple-300 text-sm mt-4"> Has alcanzado el máximo de generaciones gratuitas. Regístrate o inicia sesión para más. </p> )}
            {isAuthenticated && userLimits && !userLimits.can_generate_today && ( <p className="text-center text-purple-300 text-sm mt-4"> Has alcanzado tu límite diario de generaciones. Intenta de nuevo mañana. </p> )}
            {isAuthenticated && userLimits && userLimits.can_generate_today && !userLimits.can_generate_this_month && ( <p className="text-center text-purple-300 text-sm mt-4"> Has alcanzado tu límite mensual de generaciones. </p> )}
          </form>

          {pageError && <p className="my-4 text-center text-red-400 bg-red-900/50 p-3 rounded-md">{pageError}</p>}
          
          <div ref={resultsContainerRef} className="mt-10 scroll-mt-60">
            {generatedIdeas.length > 0 && !isLoading && (
              <>
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-purple-300">¡Tus Conceptos de Negocio Personalizados!</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {generatedIdeas.map((idea, index) => {
                   return (
                      <div key={idea.id || idea.idea_name + index} className="flex flex-col bg-gray-800/80 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-700/60 hover:border-purple-500/70 hover:scale-105 hover:shadow-purple-500/50 transition-all duration-300 relative">
                        <button
                          onClick={() => {
                            if (idea.isSaved) {
                              toast.info("Esta idea ya está guardada.");
                            } else {
                              handleSaveIdea(idea, false);
                            }
                          }}
                          disabled={isSavingIdeaName === idea.idea_name}
                          className="absolute top-3 right-3 p-1.5 text-pink-500 hover:text-pink-400 disabled:opacity-50 z-10"
                          aria-label={idea.isSaved ? "Idea guardada" : "Guardar idea"}
                        >
                          {isSavingIdeaName === idea.idea_name ? (
                            <span className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full"></span>
                          ) : idea.isSaved ? (
                            <HeartIconSolid className="w-6 h-6" />
                          ) : (
                            <HeartIconOutline className="w-6 h-6" />
                          )}
                        </button>
                        
                        <h3 className="text-xl font-semibold text-purple-300 mb-3 pr-10">{idea.idea_name}</h3>
                        <p className="text-gray-300 text-sm mb-5 flex-grow line-clamp-[10]">{idea.idea_description}</p>
                        <div className="mt-auto space-y-2.5">
                          <button onClick={() => openModalWithIdea(idea)} className="w-full text-sm text-purple-300 hover:text-purple-200 py-2.5 px-3 rounded-lg border border-purple-500/70 hover:bg-purple-500/30 transition-colors flex items-center justify-center"> Ver Resumen Inicial</button>
                          <button 
                            onClick={() => handleAcquireReportClick(idea)} 
                            disabled={(isProcessingUnlock === idea.idea_name || isProcessingPayPal === idea.idea_name) && !idea.is_detailed_report_purchased} 
                            className={`w-full text-sm py-2.5 px-3 rounded-lg border transition-colors disabled:opacity-60 flex items-center justify-center ${
                              idea.is_detailed_report_purchased 
                                ? 'text-green-300 border-green-500/70 bg-green-600/20 hover:bg-green-600/30 cursor-pointer' 
                                : 'text-blue-300 hover:text-blue-200 border-blue-500/70 hover:bg-blue-500/30'
                            }`}
                          >
                            {(isProcessingUnlock === idea.idea_name || isProcessingPayPal === idea.idea_name) && !idea.is_detailed_report_purchased
                                ? (<> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Procesando...</>)
                                : (idea.is_detailed_report_purchased
                                    ? <><CheckIcon /> Ver Informe Detallado</>
                                    : <><LockIcon /> Adquirir Informe Detallado</>
                                  )
                            }
                          </button>
                           {/* --- NUEVO BOTÓN PARA MÓDULO ADICIONAL --- */}
                           <button 
                                onClick={() => handleAcquireExtendedModule(idea)}
                                disabled={!idea.is_detailed_report_purchased || idea.is_extended_viability_purchased || isProcessingExtendedModule === idea.idea_name}
                                className={`w-full text-sm py-2.5 px-3 rounded-lg border transition-colors flex items-center justify-center
                                    ${!idea.is_detailed_report_purchased 
                                        ? 'text-gray-500 border-gray-600 bg-gray-700/30 cursor-not-allowed opacity-50' 
                                        : idea.is_extended_viability_purchased
                                            ? 'text-teal-300 border-teal-500/70 bg-teal-600/20 hover:bg-teal-600/30 cursor-pointer'
                                            : 'text-amber-400 hover:text-amber-300 border-amber-500/70 hover:bg-amber-500/30'
                                    }
                                    ${(isProcessingExtendedModule === idea.idea_name && !idea.is_extended_viability_purchased) ? 'opacity-60' : ''}
                                `}
                                title={!idea.is_detailed_report_purchased ? "Primero debes adquirir el Informe Detallado" : (idea.is_extended_viability_purchased ? "Ya tienes este análisis avanzado" : "Adquirir Análisis Extendido de Viabilidad")}
                            >
                                {isProcessingExtendedModule === idea.idea_name && !idea.is_extended_viability_purchased ? (
                                <> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Procesando...</>
                                ) : idea.is_extended_viability_purchased ? (
                                <><CheckIcon /> Análisis Avanzado Adquirido</>
                                ) : (
                                <><LockIcon /> Adquirir Análisis Avanzado</>
                                )}
                            </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-16 pt-5 border-t border-gray-700/50 text-center space-y-5">
                    <div className="group transform transition-all duration-500 ease-out hover:scale-105"> <MagnifyingGlassIcon className="w-10 h-10 mx-auto text-purple-400 mb-3 group-hover:text-purple-300" /> <p className="text-sm text-gray-200 mb-1 group-hover:text-white"> ¿Alguna idea resuena contigo? Profundiza con un <span className="font-semibold text-purple-300"> Resumen Básico Gratuito</span> <br className="sm:hidden"/> y descubre su DAFO y viabilidad inicial. </p> <p className="text-xs text-gray-500 group-hover:text-gray-400">(Acción disponible en cada tarjeta de idea)</p> </div>
                    <div className="group transform transition-all duration-500 ease-out hover:scale-105"> <KeyIcon className="w-10 h-10 mx-auto text-purple-400 mb-3 group-hover:text-purple-300" /> <p className="text-sm text-gray-200 mb-1 group-hover:text-white"> ¿Listo para un plan completo? Desbloquea el <span className="font-semibold text-purple-300"> Informe Detallado</span> <br className="sm:hidden"/> y obtén estrategias de mercado, modelo de negocio y un plan de acción paso a paso. </p> <p className="text-xs text-gray-500 group-hover:text-gray-400">(Acción disponible en cada tarjeta de idea)</p> </div>
                    {isAuthenticated ? ( <div className="group transform transition-all duration-500 ease-out hover:scale-105"> <BookmarkIcon className="w-10 h-10 mx-auto text-purple-400 mb-3 group-hover:text-purple-300" /> <p className="text-sm text-gray-200 mb-1 group-hover:text-white"> No pierdas tu progreso. <span className="font-semibold text-purple-300"> Guarda tus ideas favoritas</span> <br className="sm:hidden"/> para continuar tu análisis y desarrollo. </p> <p className="text-xs text-gray-500 group-hover:text-gray-400">(Usa el botón "Guardar Idea" en cada concepto)</p> </div> ) : ( <div className="group transform transition-all duration-500 ease-out hover:scale-105"> <UserPlusIcon className="w-10 h-10 mx-auto text-purple-400 mb-3 group-hover:text-purple-300" /> <p className="text-sm text-gray-200 mb-1 group-hover:text-white"> Para guardar tus ideas y acceder a más funcionalidades, <Link href="/login" className="font-semibold text-purple-300 hover:underline"> inicia sesión</Link> o <Link href="/signup" className="font-semibold text-purple-300 hover:underline"> regístrate</Link>. </p> </div> )}
                    <div className="mt-10"> <Link href={isAuthenticated ? "/my-ideas" : "/generate-idea"} className="inline-flex items-center px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-base shadow-lg transform transition-transform duration-150 hover:scale-105 active:scale-95" > <ArrowRightCircleIcon className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" /> {isAuthenticated ? "Ir a Mis Ideas Guardadas" : "Generar Más Ideas"} </Link> </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL "RESUMEN BÁSICO" --- */}
      {isModalOpen && selectedIdea && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in-up scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-purple-400">{selectedIdea.idea_name}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white text-3xl leading-none p-1 -mr-2">×</button>
            </div>
            <div className="space-y-3 text-gray-300">
              {/* ... (Contenido existente del modal: Descripción, Justificación, etc.) ... */}
              <p><strong className="text-gray-100">Descripción:</strong> {selectedIdea.idea_description}</p>
              <p><strong className="text-gray-100">Justificación Personal:</strong> {selectedIdea.personalization_justification}</p>
              <p><strong className="text-gray-100">Modelo de Negocio Sugerido:</strong> {selectedIdea.suggested_business_model}</p>
              <div className="p-3 bg-gray-700/50 rounded mt-2"><strong className="text-gray-100 block mb-1 text-sm">Análisis de Viabilidad:</strong><p className="text-xs md:text-sm"><span className="font-medium text-purple-300">Oportunidad:</span> {selectedIdea.preliminary_viability_analysis.oportunidad_disruptiva}</p><p className="text-xs md:text-sm"><span className="font-medium text-purple-300">Riesgo:</span> {selectedIdea.preliminary_viability_analysis.riesgo_clave_no_obvio}</p></div>
              
              {selectedIdea.is_detailed_report_purchased && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-sm text-green-400">El informe detallado completo ya está disponible.</p>
                </div>
              )}
              {selectedIdea.is_extended_viability_purchased && ( // Mostrar si el módulo extendido ya fue comprado
                <div className="mt-2 pt-2 border-t border-gray-700/50">
                  <p className="text-sm text-teal-400">El Análisis Extendido de Viabilidad ya ha sido adquirido.</p>
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap justify-end gap-3"> {/* Usar gap para espaciado */}
                <button 
                  onClick={() => handleSaveIdea(selectedIdea, false)} 
                  disabled={isSavingIdeaName === selectedIdea?.idea_name || selectedIdea?.isSaved} 
                  className={`w-full sm:w-auto px-5 py-2 text-white font-semibold rounded-md shadow-md disabled:opacity-70 flex items-center justify-center ${selectedIdea?.isSaved ? 'bg-green-700 border-green-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isSavingIdeaName === selectedIdea?.idea_name ? (<> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Guardando...</>) : (selectedIdea?.isSaved ? <><CheckIcon /> ¡Guardada!</> : <><SaveIcon /> Guardar Idea</>)}
                </button>
                
                {/* Botón para Adquirir/Ver Informe Detallado */}
                <button
                    onClick={() => { 
                        if (selectedIdea) { 
                            if (selectedIdea.is_detailed_report_purchased) {
                                if (selectedIdea.id) router.push(`/idea/${selectedIdea.id}/report`);
                                else toast.error("Error: Informe comprado pero falta ID.");
                                closeModal();
                            } else {
                                // Lógica para redirigir a login o abrir modal de confirmación
                                if (authIsLoading) { toast.info("Verificando sesión..."); return; }
                                if (!isAuthenticated || !session?.access_token) { /* ... (lógica de redirect a login) ... */ 
                                    toast.warn("Debes iniciar sesión para adquirir informes.");
                                    try {
                                        const ideasToStoreInSession = generatedIdeas.length > 0 ? generatedIdeas : (selectedIdea ? [selectedIdea] : []);
                                        if (ideasToStoreInSession.length > 0) sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(ideasToStoreInSession));
                                        sessionStorage.setItem('pendingUnlockIdeaName', selectedIdea.idea_name);
                                        const formSnapshotForPending = sessionStorage.getItem(LAST_FORM_DATA_KEY) || JSON.stringify(formData);
                                        sessionStorage.setItem(PENDING_FORM_DATA_KEY, formSnapshotForPending);
                                    } catch (e) { console.error("Error guardando estado (unlock pre-login desde modal):", e); }
                                    closeModal(); 
                                    router.push(`/login?redirect=${pathname}&action=unlockPending`);
                                    return;
                                }
                                closeModal(); 
                                openUnlockConfirmModal(selectedIdea, 'detailed_report'); // Abrir modal de confirmación para informe detallado
                            }
                        }
                    }}
                    disabled={(isProcessingUnlock === selectedIdea?.idea_name || isProcessingPayPal === selectedIdea?.idea_name) && !selectedIdea?.is_detailed_report_purchased}
                    className={`w-full sm:w-auto px-5 py-2 text-white font-semibold rounded-md shadow-md disabled:opacity-70 flex items-center justify-center ${ selectedIdea?.is_detailed_report_purchased ? 'bg-green-600 cursor-pointer hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700' }`}
                >
                  {(isProcessingUnlock === selectedIdea?.idea_name || isProcessingPayPal === selectedIdea?.idea_name) && !selectedIdea?.is_detailed_report_purchased
                      ? (<> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Procesando...</>)
                      : (selectedIdea?.is_detailed_report_purchased
                          ? <><CheckIcon /> Ver Informe Completo</>
                          : <><LockIcon /> Adquirir Informe Detallado</>
                        )
                  }
                </button>

                {/* --- NUEVO BOTÓN PARA MÓDULO ADICIONAL EN MODAL DE RESUMEN --- */}
                {selectedIdea && selectedIdea.is_detailed_report_purchased && ( // Mostrar solo si el informe base está comprado
                    <button
                        onClick={() => {
                            if(selectedIdea) {
                                closeModal(); // Cerrar modal actual de resumen
                                handleAcquireExtendedModule(selectedIdea); // Llama a la función que abre el modal de confirmación para el módulo extendido
                            }
                        }}
                        disabled={selectedIdea.is_extended_viability_purchased || isProcessingExtendedModule === selectedIdea.idea_name}
                        className={`w-full sm:w-auto px-5 py-2 font-semibold rounded-md shadow-md disabled:opacity-70 flex items-center justify-center
                            ${selectedIdea.is_extended_viability_purchased
                                ? 'bg-teal-600 text-white cursor-not-allowed' // Estilo si ya está comprado
                                : 'bg-amber-500 hover:bg-amber-600 text-white' // Estilo para adquirir
                            }
                        `}
                         title={selectedIdea.is_extended_viability_purchased ? "Ya tienes este análisis avanzado" : "Adquirir Análisis Extendido de Viabilidad"}
                    >
                        {isProcessingExtendedModule === selectedIdea.idea_name && !selectedIdea.is_extended_viability_purchased ? (
                             <> <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> Procesando...</>
                        ) : selectedIdea.is_extended_viability_purchased ? (
                            <><CheckIcon /> Avanzado Adquirido</>
                        ) : (
                            <><PlusCircleIcon /> Adquirir Análisis Avanzado</>
                        )}
                    </button>
                )}
                
                <button onClick={closeModal} className="w-full sm:w-auto px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md shadow-md flex items-center justify-center">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE CONFIRMACIÓN DE COMPRA --- */}
      {isUnlockConfirmModalOpen && ideaForUnlockConfirmation && (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" 
            onClick={closeUnlockConfirmModal}
        >
            <div
                className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-purple-400">
                        Confirmar Adquisición: {ideaForUnlockConfirmation._productType === 'extended_viability' ? 'Análisis Extendido' : 'Informe Detallado'}
                    </h2>
                    <button 
                        onClick={closeUnlockConfirmModal} 
                        className="text-gray-400 hover:text-white text-3xl leading-none p-1 -mr-2"
                        aria-label="Cerrar modal"
                    >×</button>
                </div>
                <div className="space-y-4 text-gray-300">
                    <p>
                    Estás a punto de adquirir el <strong className="text-purple-300">{ideaForUnlockConfirmation._productType === 'extended_viability' ? 'Análisis Extendido de Viabilidad' : 'Informe Detallado'}</strong> para la idea:
                    </p>
                    <p className="text-lg font-semibold text-white bg-gray-700/50 p-3 rounded-md break-words">
                    {ideaForUnlockConfirmation.idea_name}
                    </p>
                    <p className="text-sm">
                        {ideaForUnlockConfirmation._productType === 'extended_viability' 
                            ? "Este módulo profundiza en la viabilidad, validación de hipótesis y estrategias de mitigación de riesgos."
                            : "Este informe te proporcionará un análisis exhaustivo, incluyendo estrategias de mercado, modelo de negocio detallado, plan de acción paso a paso, y mucho más."
                        }
                    </p>
                    
                    {!showPayPalButtons && (
                        <div className="text-center my-4 space-y-2">
                            <div>
                                <p className="text-sm text-gray-400">Precio (Mercado Pago):</p>
                                <p className="text-2xl font-bold text-green-400">
                                    {ideaForUnlockConfirmation._productType === 'extended_viability' ? EXTENDED_VIABILITY_PRICE_DISPLAY_ARS : DETAILED_REPORT_PRICE_DISPLAY_ARS}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">o Precio (PayPal):</p>
                                <p className="text-2xl font-bold text-green-400">
                                    USD {ideaForUnlockConfirmation._productType === 'extended_viability' ? EXTENDED_VIABILITY_PRICE_USD_PAYPAL : DETAILED_REPORT_PRICE_USD_PAYPAL}
                                </p>
                            </div>
                        </div>
                    )}
                     {(isProcessingPayPal || (ideaForUnlockConfirmation._productType === 'extended_viability' && isProcessingExtendedModule)) && !showPayPalButtons && ideaForUnlockConfirmation && (
                         <p className="text-center text-sm text-gray-400 py-2">Preparando pago con PayPal...</p>
                    )}

                    <p className="text-xs text-gray-500">
                    Al confirmar, serás redirigido a la pasarela de pago. Si la idea no está guardada, se guardará automáticamente antes de proceder.
                    </p>
                </div>

                <div className="mt-8 flex flex-col space-y-3">
                    {!showPayPalButtons && (
                        <>
                            <button
                                onClick={async () => {
                                    if (ideaForUnlockConfirmation) {
                                        if (ideaForUnlockConfirmation._productType === 'extended_viability') {
                                            // TODO: Llamar a una función handleExtendedModuleMercadoPagoCheckout
                                            toast.info("Pago de módulo extendido con Mercado Pago aún no implementado.");
                                            setIsProcessingExtendedModule(null); // Limpiar si se intentó
                                        } else {
                                            await handleMercadoPagoCheckout(ideaForUnlockConfirmation);
                                        }
                                    }
                                }}
                                disabled={
                                    (ideaForUnlockConfirmation._productType === 'detailed_report' && isProcessingUnlock === ideaForUnlockConfirmation.idea_name) ||
                                    (ideaForUnlockConfirmation._productType === 'extended_viability' && isProcessingExtendedModule === ideaForUnlockConfirmation.idea_name) ||
                                    isProcessingPayPal === ideaForUnlockConfirmation.idea_name // Deshabilitar si PayPal está procesando para esta idea
                                }
                                className="w-full px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-60 flex items-center justify-center"
                            >
                                {(isProcessingUnlock === ideaForUnlockConfirmation.idea_name && ideaForUnlockConfirmation._productType === 'detailed_report') || (isProcessingExtendedModule === ideaForUnlockConfirmation.idea_name && ideaForUnlockConfirmation._productType === 'extended_viability') ? (
                                    <>
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                                    Procesando MP...
                                    </>
                                ) : ( "Pagar con Mercado Pago" )}
                            </button>

                            <button
                                onClick={() => handlePreparePayPalPayment(ideaForUnlockConfirmation._productType || 'detailed_report')} 
                                disabled={
                                    (ideaForUnlockConfirmation._productType === 'detailed_report' && isProcessingUnlock === ideaForUnlockConfirmation.idea_name) ||
                                    (ideaForUnlockConfirmation._productType === 'extended_viability' && isProcessingExtendedModule === ideaForUnlockConfirmation.idea_name) ||
                                    isProcessingPayPal === ideaForUnlockConfirmation.idea_name
                                }
                                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-60 flex items-center justify-center"
                            >
                                {isProcessingPayPal === ideaForUnlockConfirmation.idea_name && !showPayPalButtons ? (
                                    <>
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                                    Preparando PayPal...
                                    </>
                                ) : ( "Pagar con PayPal" )}
                            </button>
                        </>
                    )}

                    {showPayPalButtons && ideaForUnlockConfirmation && ideaForUnlockConfirmation.id && (
                        <PayPalButtonWrapper
                            key={`paypal-wrapper-${ideaForUnlockConfirmation.id}-${ideaForUnlockConfirmation._productType}`} 
                            ideaName={ideaForUnlockConfirmation.idea_name}
                            ideaId={ideaForUnlockConfirmation.id}
                            priceUSD={ideaForUnlockConfirmation._productType === 'extended_viability' ? EXTENDED_VIABILITY_PRICE_USD_PAYPAL : DETAILED_REPORT_PRICE_USD_PAYPAL}
                            sessionAccessToken={session?.access_token}
                            apiBaseUrl={API_BASE_URL}
                            onPaymentSuccess={() => handlePayPalSuccess(ideaForUnlockConfirmation.id!, ideaForUnlockConfirmation._productType)} // Asegurar que id no es undefined
                            onPaymentError={handlePayPalError}
                            onPaymentCancel={handlePayPalCancel}
                            onProcessingEnd={handlePayPalProcessingEnd}
                        />
                    )}
                    
                    { (!showPayPalButtons || (showPayPalButtons && !isProcessingPayPal && !isProcessingExtendedModule && ideaForUnlockConfirmation && !isProcessingUnlock) ) && (
                        <button
                            onClick={closeUnlockConfirmModal}
                            disabled={!!isProcessingUnlock || (!!isProcessingPayPal && showPayPalButtons) || (!!isProcessingExtendedModule && showPayPalButtons) }
                            className="w-full sm:w-auto mt-2 px-6 py-2.5 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-70"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>
        </div>
        )}
    </div>
  );
}

export default function GenerateIdeaPage() {
   return (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><p>Cargando generador de ideas...</p></div>}>
    <GenerateIdeaInteractiveContent />
  </Suspense>
  );
}
