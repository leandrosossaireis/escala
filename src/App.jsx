import React, { useEffect, useRef, useState } from "react";
import {
  Calendar,
  SlidersHorizontal,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  LogIn,
  X,
  RefreshCw,
} from "lucide-react";
import PublicCalendarView from "./components/PublicCalendarView";
import AdminView from "./components/AdminView";
import {
  loadAppState,
  saveAppState,
  getLocalUpdatedAt,
  resetAppState,
  fetchPublishedEscalaData,
  verifyAdminLogin,
  isAdminLoggedIn,
  setAdminLoggedIn,
  getGitHubSyncConfig,
  publishStateToGitHub,
} from "./lib/store";

export default function App() {
  const [appState, setAppState] = useState(() => loadAppState());
  const [route, setRoute] = useState("public"); // "public" | "admin"
  const [isAdmin, setIsAdmin] = useState(() => isAdminLoggedIn());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [toast, setToast] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle"); // "idle" | "syncing" | "synced" | "error"
  const isInitialMount = useRef(true);
  const lastPublishedJson = useRef("");

  // 1. Live Polling for Public Viewers (every 15 seconds + on window focus)
  // Fetches directly from GitHub Raw API (no cache), so changes appear instantaneously (< 2s) without waiting for GitHub Pages build!
  useEffect(() => {
    let active = true;

    async function loadLatestFromCloud() {
      const published = await fetchPublishedEscalaData();
      if (active && published) {
        const localTs = getLocalUpdatedAt();
        const remoteTs = Number(published.updated_at || 0);
        // Never overwrite newer local Admin edits with an older remote JSON file!
        if (localTs > 0 && remoteTs < localTs) {
          return;
        }
        const incomingJson = JSON.stringify(published);
        if (!isAdminLoggedIn()) {
          setAppState((prev) => {
            const currentJson = JSON.stringify(prev);
            return currentJson !== incomingJson ? published : prev;
          });
        } else if (!lastPublishedJson.current) {
          lastPublishedJson.current = incomingJson;
        }
      }
    }

    loadLatestFromCloud();
    const timer = setInterval(() => {
      if (!isAdminLoggedIn()) {
        loadLatestFromCloud();
      }
    }, 15000);

    const onFocus = () => {
      if (!isAdminLoggedIn()) loadLatestFromCloud();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // 2. Automatic Instant Cloud Sync when Admin makes ANY change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastPublishedJson.current = JSON.stringify(appState);
      return;
    }

    if (isAdmin) {
      saveAppState(appState, true);
    }

    if (!isAdmin) return;

    const currentJson = JSON.stringify(appState);
    if (currentJson === lastPublishedJson.current) return;

    const ghConfig = getGitHubSyncConfig();
    if (!ghConfig.token) return;

    setSyncStatus("syncing");
    const debounce = setTimeout(async () => {
      try {
        const stateWithTs = {
          ...appState,
          updated_at: getLocalUpdatedAt() || Date.now(),
        };
        await publishStateToGitHub(stateWithTs, ghConfig);
        lastPublishedJson.current = currentJson;
        setSyncStatus("synced");
      } catch (err) {
        console.error("Auto-sync error:", err);
        setSyncStatus("error");
      }
    }, 1200);

    return () => clearTimeout(debounce);
  }, [appState, isAdmin]);

  function notify(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3400);
  }

  function handleAdminButtonClick() {
    if (isAdmin) {
      setRoute("admin");
    } else {
      setLoginEmail("");
      setLoginPassword("");
      setShowLoginModal(true);
    }
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    const result = verifyAdminLogin(loginEmail, loginPassword);

    if (result.valid) {
      setIsAdmin(true);
      setAdminLoggedIn(true);
      setShowLoginModal(false);
      setRoute("admin");
      if (result.autoConfiguredToken) {
        notify(
          "Acesso Admin liberado e Sincronização Automática em Tempo Real ativada!"
        );
      } else {
        notify("Acesso Administrador liberado!");
      }
    } else {
      notify("Usuário ou senha de administrador incorretos.", "error");
    }
  }

  function handleLogout() {
    setIsAdmin(false);
    setAdminLoggedIn(false);
    setRoute("public");
    notify("Você saiu do modo Administrador.");
  }

  function handleAddService(newService) {
    if (!isAdmin) {
      notify("Apenas o administrador pode adicionar serviços.", "error");
      return;
    }
    setAppState((prev) => ({
      ...prev,
      services: [newService, ...(prev.services || [])],
    }));
  }

  function handleDeleteService(serviceId) {
    if (!isAdmin) {
      notify("Apenas o administrador pode remover serviços.", "error");
      return;
    }
    setAppState((prev) => ({
      ...prev,
      services: (prev.services || []).filter((s) => s.id !== serviceId),
    }));
    notify("Serviço removido.");
  }

  function handleResetAll() {
    if (!isAdmin) return;
    if (
      window.confirm(
        "Deseja restaurar todos os dados para a configuração original da Escala Operacional 2026?"
      )
    ) {
      const fresh = resetAppState();
      setAppState(fresh);
      notify("Dados restaurados para o padrão original!");
    }
  }

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#14181F]">
      {/* Top Navbar (Identical to Base44 header) */}
      <header className="sticky top-0 z-30 bg-[#FBFAF7]/90 backdrop-blur-md border-b border-[#EBEBE6] no-print">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => setRoute("public")}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-[11px] bg-[#14181F] text-white flex items-center justify-center shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="font-heading font-bold text-[15px] text-[#14181F] leading-none">
                Escala Operacional
              </div>
              <div className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-[#8A8F98] mt-1">
                CAMPO · ATENDIMENTO
              </div>
            </div>
          </div>

          {/* Right Action Pill */}
          <div className="flex items-center gap-2.5">
            {isAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/15 text-[#065F46] text-[11.5px] font-semibold">
                {syncStatus === "syncing" ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin text-[#065F46]" />
                    <span>Sincronizando...</span>
                  </>
                ) : syncStatus === "synced" ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span>Sincronizado Online ✓</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span>Modo Admin Ativo</span>
                  </>
                )}
              </span>
            )}
            {route === "public" ? (
              <button
                type="button"
                onClick={handleAdminButtonClick}
                className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-white border border-[#E5E4DF] text-[13px] font-medium text-[#14181F] hover:bg-[#F4F3EE] transition shadow-[0_1px_2px_rgba(20,24,31,0.03)]"
              >
                {isAdmin ? (
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#42474F]" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-[#42474F]" />
                )}
                <span>Administrar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRoute("public")}
                className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-white border border-[#E5E4DF] text-[13px] font-medium text-[#14181F] hover:bg-[#F4F3EE] transition shadow-[0_1px_2px_rgba(20,24,31,0.03)]"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#42474F]" />
                <span>Ver calendário</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {route === "public" || !isAdmin ? (
          <PublicCalendarView
            appState={appState}
            isAdmin={isAdmin}
            onAddService={handleAddService}
            onDeleteService={handleDeleteService}
            notify={notify}
          />
        ) : (
          <AdminView
            appState={appState}
            setAppState={setAppState}
            onResetAll={handleResetAll}
            onLogout={handleLogout}
            notify={notify}
          />
        )}
      </main>

      {/* Admin Login Modal (Identical to Base44 Welcome back / Login screen) */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white border border-[#EBEBE6] rounded-[24px] max-w-[400px] w-full p-7 shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F4F3EE] flex items-center justify-center text-[#42474F] hover:bg-[#E5E4DF]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#14181F] text-white flex items-center justify-center mb-3 shadow-sm">
                <LogIn className="w-5 h-5" />
              </div>
              <h2 className="font-heading text-[22px] font-bold text-[#14181F]">
                Acesso Restrito
              </h2>
              <p className="text-[13px] text-[#6B7280] mt-1">
                Somente o administrador pode alterar escalas e serviços.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-[#14181F] mb-1">
                  Usuário ou E-mail
                </label>
                <input
                  type="text"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin"
                  autoFocus
                  className="w-full h-11 px-3.5 rounded-xl border border-[#14181F]/30 text-[13.5px] focus:outline-none focus:border-[#14181F]"
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#14181F] mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#E5E4DF] text-[13.5px] focus:outline-none focus:border-[#14181F]"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#14181F] text-white text-[13.5px] font-semibold hover:bg-[#272D38] transition mt-2"
              >
                Entrar no Painel Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#14181F] text-white text-[13px] font-medium shadow-lg animate-fade-in">
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
