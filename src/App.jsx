import React, { useEffect, useState } from "react";
import { Calendar, SlidersHorizontal, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import PublicCalendarView from "./components/PublicCalendarView";
import AdminView from "./components/AdminView";
import { loadAppState, saveAppState, resetAppState } from "./lib/store";

export default function App() {
  const [appState, setAppState] = useState(() => loadAppState());
  const [route, setRoute] = useState("public"); // "public" | "admin"
  const [toast, setToast] = useState(null);

  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  function notify(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3400);
  }

  function handleAddService(newService) {
    setAppState((prev) => ({
      ...prev,
      services: [newService, ...(prev.services || [])],
    }));
  }

  function handleDeleteService(serviceId) {
    setAppState((prev) => ({
      ...prev,
      services: (prev.services || []).filter((s) => s.id !== serviceId),
    }));
    notify("Serviço removido.");
  }

  function handleResetAll() {
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
            {route === "public" ? (
              <button
                type="button"
                onClick={() => setRoute("admin")}
                className="inline-flex items-center gap-2 px-4 h-9 rounded-full bg-white border border-[#E5E4DF] text-[13px] font-medium text-[#14181F] hover:bg-[#F4F3EE] transition shadow-[0_1px_2px_rgba(20,24,31,0.03)]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#42474F]" />
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
        {route === "public" ? (
          <PublicCalendarView
            appState={appState}
            onAddService={handleAddService}
            onDeleteService={handleDeleteService}
            notify={notify}
          />
        ) : (
          <AdminView
            appState={appState}
            setAppState={setAppState}
            onResetAll={handleResetAll}
            notify={notify}
          />
        )}
      </main>

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
