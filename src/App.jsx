import React, { useEffect, useState } from "react";
import {
  Calendar,
  SlidersHorizontal,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  LogIn,
  X,
} from "lucide-react";
import PublicCalendarView from "./components/PublicCalendarView";
import AdminView from "./components/AdminView";
import {
  loadAppState,
  saveAppState,
  resetAppState,
  fetchPublishedEscalaData,
  getAdminCredentials,
  isAdminLoggedIn,
  setAdminLoggedIn,
} from "./lib/store";

export default function App() {
  const [appState, setAppState] = useState(() => loadAppState());
  const [route, setRoute] = useState("public"); // "public" | "admin"
  const [isAdmin, setIsAdmin] = useState(() => isAdminLoggedIn());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [toast, setToast] = useState(null);

  // On initial load, fetch the published escala-data.json so all visitors see the official schedule
  useEffect(() => {
    let active = true;
    fetchPublishedEscalaData().then((published) => {
      if (active && published && !isAdminLoggedIn()) {
        setAppState(published);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isAdmin) {
      saveAppState(appState);
    }
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
    const creds = getAdminCredentials();
    const userMatches =
      !creds.email ||
      loginEmail.trim().toLowerCase() === creds.email.trim().toLowerCase() ||
      loginEmail.trim().toLowerCase() === "admin";
    const passMatches = loginPassword === creds.password;

    if (userMatches && passMatches) {
      setIsAdmin(true);
      setAdminLoggedIn(true);
      setShowLoginModal(false);
      setRoute("admin");
      notify("Acesso Administrador liberado!");
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
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                Modo Admin Ativo
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
