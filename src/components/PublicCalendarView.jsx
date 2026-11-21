import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Briefcase,
  Users,
  Plus,
  X,
  Share2,
  Copy,
  Trophy,
  Calendar as CalendarIcon,
  Printer,
  UserCheck,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import {
  STATUS_META,
  COLOR_SETTINGS,
  getMonthRange,
  listDaysInRange,
  formatMonthTitle,
  formatShortDate,
  formatDayMonth,
  getContrastColor,
  getColorsFromSettings,
  getDominantDayStatus,
  buildCalendar,
  buildEmployeeWorkdaySummary,
  getWeekday,
  getMondayOfWeek,
  addDays,
} from "../lib/schedule";

const WEEKDAY_HEADERS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const WEEKDAY_MOBILE = ["S", "T", "Q", "Q", "S", "S", "D"];
const SHORT_WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function PublicCalendarView({
  appState,
  isAdmin = false,
  onAddService,
  onDeleteService,
  notify,
}) {
  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const [monthKey, setMonthKey] = useState(() => todayIso.slice(0, 7));
  const [viewMode, setViewMode] = useState("mes"); // "mes" | "equipes" | "funcionarios" | "ranking" | "servicos"
  const [selectedTeamId, setSelectedTeamId] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [onlyHolidays, setOnlyHolidays] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [jumpInput, setJumpInput] = useState(() => {
    const [y, m, d] = todayIso.split("-");
    return `${d}/${m}/${y}`;
  });
  const [focusedDate, setFocusedDate] = useState(null);
  const [modalDate, setModalDate] = useState(null);
  const [selectedEmployeeProfile, setSelectedEmployeeProfile] = useState(null);

  const [serviceForm, setServiceForm] = useState({
    date: todayIso,
    team_id: "",
    employeesText: "",
    category: "Ordem de Serviço / Campo",
    client: "",
    protocol: "",
    status: "concluido",
    notes: "",
  });

  const colors = useMemo(
    () => getColorsFromSettings(appState.settings),
    [appState.settings]
  );

  const activeTeams = useMemo(
    () =>
      [...appState.teams]
        .filter((t) => t.active !== false)
        .sort((a, b) =>
          a.kind === b.kind
            ? a.order - b.order
            : a.kind === "campo"
            ? -1
            : 1
        ),
    [appState.teams]
  );

  const visibleTeams = useMemo(() => {
    return activeTeams.filter((t) => {
      if (selectedTeamId !== "all" && t.id !== selectedTeamId) return false;
      if (selectedGroup === "A" && t.group !== "A") return false;
      if (selectedGroup === "B" && t.group !== "B") return false;
      if (selectedGroup === "campo" && t.kind !== "campo") return false;
      if (selectedGroup === "atendimento" && t.kind !== "atendimento")
        return false;
      return true;
    });
  }, [activeTeams, selectedTeamId, selectedGroup]);

  const { firstDay, lastDay, gridStart, gridEnd } = useMemo(
    () => getMonthRange(monthKey),
    [monthKey]
  );

  const gridCalendar = useMemo(
    () =>
      buildCalendar({
        startIso: gridStart,
        endIso: gridEnd,
        settings: appState.settings,
        teams: appState.teams,
        holidays: appState.holidays,
        overrides: appState.overrides,
        absences: appState.absences,
        weekOverrides: appState.weekOverrides,
        dutyOverrides: appState.dutyOverrides,
      }),
    [gridStart, gridEnd, appState]
  );

  const monthCalendar = useMemo(
    () =>
      buildCalendar({
        startIso: firstDay,
        endIso: lastDay,
        settings: appState.settings,
        teams: appState.teams,
        holidays: appState.holidays,
        overrides: appState.overrides,
        absences: appState.absences,
        weekOverrides: appState.weekOverrides,
        dutyOverrides: appState.dutyOverrides,
      }),
    [firstDay, lastDay, appState]
  );

  // Full Year Calendar for Annual Ranking (Jan 1 to Dec 31 of the selected year)
  const selectedYear = monthKey.slice(0, 4);
  const yearCalendar = useMemo(
    () =>
      buildCalendar({
        startIso: `${selectedYear}-01-01`,
        endIso: `${selectedYear}-12-31`,
        settings: appState.settings,
        teams: appState.teams,
        holidays: appState.holidays,
        overrides: appState.overrides,
        absences: appState.absences,
        weekOverrides: appState.weekOverrides,
        dutyOverrides: appState.dutyOverrides,
      }),
    [selectedYear, appState]
  );

  // Live Today & Next Sunday Snapshot
  const nextSundayIso = useMemo(() => {
    const wd = getWeekday(todayIso);
    return wd === 0 ? todayIso : addDays(todayIso, 7 - wd);
  }, [todayIso]);

  const todaySnapshotCalendar = useMemo(
    () =>
      buildCalendar({
        startIso: todayIso,
        endIso: addDays(todayIso, 14),
        settings: appState.settings,
        teams: appState.teams,
        holidays: appState.holidays,
        overrides: appState.overrides,
        absences: appState.absences,
        weekOverrides: appState.weekOverrides,
        dutyOverrides: appState.dutyOverrides,
      }),
    [todayIso, appState]
  );

  const todayInfo = todaySnapshotCalendar.days[todayIso];
  const nextSundayInfo = todaySnapshotCalendar.days[nextSundayIso];

  const workingTodayCampo = useMemo(() => {
    if (!todayInfo) return [];
    return activeTeams
      .filter((t) => t.kind === "campo")
      .filter((t) =>
        [
          "trabalha",
          "plantao_domingo",
          "plantao_feriado",
          "troca",
          "alteracao",
        ].includes(todayInfo.teams?.[t.id]?.status)
      );
  }, [todayInfo, activeTeams]);

  const gridDays = useMemo(
    () => listDaysInRange(gridStart, gridEnd),
    [gridStart, gridEnd]
  );

  const monthDays = useMemo(
    () => listDaysInRange(firstDay, lastDay),
    [firstDay, lastDay]
  );

  const employeeSummary = useMemo(
    () =>
      buildEmployeeWorkdaySummary(
        monthCalendar,
        appState.teams,
        appState.services || []
      ),
    [monthCalendar, appState.teams, appState.services]
  );

  const annualEmployeeSummary = useMemo(
    () =>
      buildEmployeeWorkdaySummary(
        yearCalendar,
        appState.teams,
        appState.services || []
      ),
    [yearCalendar, appState.teams, appState.services]
  );

  const monthServices = useMemo(() => {
    return (appState.services || [])
      .filter((s) => s.date >= firstDay && s.date <= lastDay)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [appState.services, firstDay, lastDay]);

  const servicesByDate = useMemo(() => {
    const map = {};
    for (const s of appState.services || []) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [appState.services]);

  function handlePrevMonth() {
    const [y, m] = monthKey.split("-").map(Number);
    const prev =
      m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
    setMonthKey(prev);
  }

  function handleNextMonth() {
    const [y, m] = monthKey.split("-").map(Number);
    const next =
      m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    setMonthKey(next);
  }

  function handleToday() {
    setMonthKey(todayIso.slice(0, 7));
    setFocusedDate(todayIso);
    const [y, m, d] = todayIso.split("-");
    setJumpInput(`${d}/${m}/${y}`);
  }

  function handleJumpDate(e) {
    e.preventDefault();
    const trimmed = jumpInput.trim();
    let iso = null;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split("/");
      iso = `${y}-${m}-${d}`;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      iso = trimmed;
    }
    if (!iso) {
      notify?.("Formato de data inválido. Use dd/mm/aaaa.", "error");
      return;
    }
    setMonthKey(iso.slice(0, 7));
    setFocusedDate(iso);
  }

  // Generate WhatsApp Summary Message for current week / weekend duty
  function handleCopyWhatsAppSummary() {
    const baseDate =
      focusedDate && focusedDate.slice(0, 7) === monthKey
        ? focusedDate
        : todayIso.slice(0, 7) === monthKey
        ? todayIso
        : firstDay;

    const monIso = getMondayOfWeek(baseDate);
    const sunIso = addDays(monIso, 6);
    const weekCal = buildCalendar({
      startIso: monIso,
      endIso: sunIso,
      settings: appState.settings,
      teams: appState.teams,
      holidays: appState.holidays,
      overrides: appState.overrides,
      absences: appState.absences,
      weekOverrides: appState.weekOverrides,
      dutyOverrides: appState.dutyOverrides,
    });

    const monInfo = weekCal.days[monIso];
    const sunInfo = weekCal.days[sunIso];
    const monFriGrp = monInfo?.mon_fri_group || "A";
    const tueSatGrp = monFriGrp === "A" ? "B" : "A";

    const lines = [
      `📅 *ESCALA OPERACIONAL (${formatDayMonth(monIso)} a ${formatDayMonth(
        sunIso
      )})*`,
      ``,
      `🟢 *Segunda a Sexta (Grupo ${monFriGrp}):*`,
      activeTeams
        .filter((t) => t.group === monFriGrp)
        .map((t) => `• ${t.name}`)
        .join("\n"),
      ``,
      `🔵 *Terça a Sábado (Grupo ${tueSatGrp}):*`,
      activeTeams
        .filter((t) => t.group === tueSatGrp)
        .map((t) => `• ${t.name}`)
        .join("\n"),
      ``,
      `🟠 *Plantão de Domingo (${formatShortDate(sunIso)}):*`,
      `• Campo: *${sunInfo?.campo_duty_label || "A definir"}*`,
    ];

    if (sunInfo?.atendimento_duty_label) {
      lines.push(`• Atendimento: *${sunInfo.atendimento_duty_label}*`);
    }

    // Check if there is any holiday in the week
    for (const d of listDaysInRange(monIso, sunIso)) {
      const di = weekCal.days[d];
      if (di?.holiday && di.holiday.type !== "facultativo") {
        lines.push(
          ``,
          `🟣 *Feriado ${di.holiday.name} (${formatDayMonth(d)}):*`,
          `• Plantão: *${di.campo_duty_label || "A definir"}*`
        );
      }
    }

    const text = lines.join("\n");
    navigator.clipboard?.writeText(text);
    notify?.("Resumo da semana copiado! Pronto para colar no WhatsApp.");
  }

  function openDayModal(iso) {
    setModalDate(iso);
    const dayInfo = gridCalendar.days[iso];
    const defaultTeamId =
      selectedTeamId !== "all"
        ? selectedTeamId
        : dayInfo?.campo_team_id || activeTeams[0]?.id || "";
    const defaultTeam = activeTeams.find((t) => t.id === defaultTeamId);
    setServiceForm({
      date: iso,
      team_id: defaultTeamId,
      employeesText:
        dayInfo?.campo_team_id === defaultTeamId && dayInfo?.campo_duty_label
          ? dayInfo.campo_duty_label
          : defaultTeam?.name || "",
      category:
        dayInfo?.weekday === 0
          ? "Plantão Domingo"
          : dayInfo?.holiday
          ? "Plantão Feriado"
          : "Ordem de Serviço / Campo",
      client: "",
      protocol: `OS-${iso.replace(/-/g, "")}`,
      status: "concluido",
      notes: "",
    });
  }

  function handleCreateService(e) {
    e.preventDefault();
    if (!serviceForm.client.trim() && !serviceForm.notes.trim()) {
      notify?.("Informe o cliente/local ou descrição do serviço.", "error");
      return;
    }
    const employees = serviceForm.employeesText
      .split(/[\/,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    onAddService({
      id: `srv-${Date.now()}`,
      date: serviceForm.date,
      team_id: serviceForm.team_id,
      employees,
      category: serviceForm.category,
      client: serviceForm.client.trim() || "Serviço Operacional",
      protocol: serviceForm.protocol.trim(),
      status: serviceForm.status,
      notes: serviceForm.notes.trim(),
    });
    setServiceForm((prev) => ({
      ...prev,
      client: "",
      notes: "",
    }));
    notify?.("Serviço registrado com sucesso!");
  }

  const singleSelectedTeam =
    selectedTeamId !== "all"
      ? activeTeams.find((t) => t.id === selectedTeamId)
      : null;

  return (
    <div className="max-w-[1240px] mx-auto px-3 sm:px-6 pt-4 sm:pt-7 pb-16">
      {/* Header Title & Month Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A8F98] mb-1">
            CONSULTA LIVRE
          </div>
          <h1 className="font-heading text-[24px] sm:text-[34px] font-bold tracking-[-0.02em] text-[#14181F] leading-tight">
            Calendário de escala
          </h1>
          <p className="text-[13px] sm:text-[14px] text-[#6B7280] mt-0.5 max-w-xl">
            Semanas alternadas entre segunda–sexta e terça–sábado, plantões de
            domingo, feriados, férias e controle de dias trabalhados.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 self-start md:self-end">
          <button
            onClick={handlePrevMonth}
            aria-label="Mês anterior"
            className="w-9 h-9 rounded-full bg-white border border-[#E5E4DF] flex items-center justify-center text-[#14181F] hover:bg-[#F4F3EE] active:scale-95 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-[140px] sm:min-w-[170px] text-center font-heading font-semibold text-[14px] sm:text-[15px] text-[#14181F] tabular-nums">
            {formatMonthTitle(monthKey)}
          </div>
          <button
            onClick={handleNextMonth}
            aria-label="Próximo mês"
            className="w-9 h-9 rounded-full bg-white border border-[#E5E4DF] flex items-center justify-center text-[#14181F] hover:bg-[#F4F3EE] active:scale-95 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3.5 h-9 rounded-full bg-white border border-[#E5E4DF] text-[12.5px] sm:text-[13px] font-medium text-[#14181F] hover:bg-[#F4F3EE] transition"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Live Operational Status Bar (Hoje & Próximo Domingo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-4">
        <div
          onClick={() => openDayModal(todayIso)}
          className="bg-white border border-[#EBEBE6] rounded-[16px] p-3.5 shadow-[0_1px_2px_rgba(20,24,31,0.03)] flex items-center justify-between gap-3 cursor-pointer hover:border-[#14181F]/30 transition"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#10B981]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>HOJE · {formatShortDate(todayIso)}</span>
            </div>
            <div className="font-heading text-[14px] font-bold text-[#14181F] mt-0.5 truncate">
              {todayInfo?.weekday === 0
                ? `Plantão: ${todayInfo?.campo_duty_label || "Domingo"}`
                : `Seg–Sex: Grupo ${todayInfo?.mon_fri_group} (${workingTodayCampo.length} duplas ativas)`}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#F3F2ED] text-[11px] font-semibold text-[#14181F] shrink-0">
            Ver hoje
          </span>
        </div>

        <div
          onClick={() => openDayModal(nextSundayIso)}
          className="bg-white border border-[#EBEBE6] rounded-[16px] p-3.5 shadow-[0_1px_2px_rgba(20,24,31,0.03)] flex items-center justify-between gap-3 cursor-pointer hover:border-[#F97316]/40 transition"
        >
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F97316]">
              PLANTÃO DE DOMINGO · {formatDayMonth(nextSundayIso)}
            </div>
            <div className="font-heading text-[14px] font-bold text-[#14181F] mt-0.5 truncate">
              Campo: {nextSundayInfo?.campo_duty_label || "A definir"}
              {nextSundayInfo?.atendimento_duty_label
                ? ` · Atend.: ${nextSundayInfo.atendimento_duty_label.replace(
                    " · plantão",
                    ""
                  )}`
                : ""}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#F97316]/15 text-[#C2410C] text-[11px] font-semibold shrink-0">
            Domingo
          </span>
        </div>

        <div className="sm:col-span-2 lg:col-span-1 bg-white border border-[#EBEBE6] rounded-[16px] p-3.5 shadow-[0_1px_2px_rgba(20,24,31,0.03)] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A8F98]">
              RODÍZIO DA SEMANA ATUAL
            </div>
            <div className="text-[13px] font-semibold text-[#14181F] mt-0.5 truncate">
              Seg–Sex:{" "}
              <span className="text-[#10B981]">
                Grupo {todayInfo?.mon_fri_group}
              </span>{" "}
              · Ter–Sáb:{" "}
              <span className="text-[#3B82F6]">
                Grupo {todayInfo?.mon_fri_group === "A" ? "B" : "A"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "mes" ? "equipes" : "mes")}
            className="px-2.5 py-1 rounded-full bg-[#14181F] text-white text-[11px] font-semibold shrink-0 hover:bg-[#272D38]"
          >
            {viewMode === "mes" ? "Ver Equipes" : "Ver Mês"}
          </button>
        </div>
      </div>

      {/* Filters & View Mode Toolbar (100% Responsive) */}
      <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-3 sm:p-3.5 shadow-[0_1px_2px_rgba(20,24,31,0.04)] mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* View Switcher Tabs - Only Mês and Equipes on Public View */}
          <div className="flex items-center justify-between gap-2 order-1 lg:order-2">
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#F3F2ED] border border-[#E8E7E1]">
              <button
                type="button"
                onClick={() => setViewMode("mes")}
                className={`inline-flex items-center gap-1.5 px-3.5 h-8 rounded-full text-[12.5px] sm:text-[13px] font-medium transition whitespace-nowrap ${
                  viewMode === "mes"
                    ? "bg-white text-[#14181F] shadow-sm"
                    : "text-[#6B7280] hover:text-[#14181F]"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span>Mês</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("equipes")}
                className={`inline-flex items-center gap-1.5 px-3.5 h-8 rounded-full text-[12.5px] sm:text-[13px] font-medium transition whitespace-nowrap ${
                  viewMode === "equipes"
                    ? "bg-white text-[#14181F] shadow-sm"
                    : "text-[#6B7280] hover:text-[#14181F]"
                }`}
              >
                <List className="w-3.5 h-3.5 shrink-0" />
                <span>Equipes</span>
              </button>
            </div>

            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowMobileFilters((v) => !v)}
              className="sm:hidden h-9 px-3 rounded-full bg-[#F3F2ED] border border-[#E8E7E1] text-[12px] font-semibold text-[#14181F] inline-flex items-center gap-1 shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtros</span>
            </button>
          </div>

          {/* Filter Controls (Always visible on tablet/desktop, collapsible on phone) */}
          <div
            className={`${
              showMobileFilters ? "grid" : "hidden sm:flex"
            } grid-cols-1 xs:grid-cols-2 sm:flex-wrap items-center gap-2 order-2 lg:order-1`}
          >
            {/* Team Filter */}
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="h-9 sm:h-10 px-3.5 rounded-full bg-white border border-[#E5E4DF] text-[12.5px] sm:text-[13px] font-medium text-[#14181F] focus:outline-none focus:border-[#14181F] w-full sm:w-auto"
            >
              <option value="all">Todas as equipes</option>
              <optgroup label="Equipe de campo">
                {activeTeams
                  .filter((t) => t.kind === "campo")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Grupo {t.group})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Atendimento">
                {activeTeams
                  .filter((t) => t.kind === "atendimento")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Grupo {t.group})
                    </option>
                  ))}
              </optgroup>
            </select>

            {/* Group Filter */}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="h-9 sm:h-10 px-3.5 rounded-full bg-white border border-[#E5E4DF] text-[12.5px] sm:text-[13px] font-medium text-[#14181F] focus:outline-none focus:border-[#14181F] w-full sm:w-auto"
            >
              <option value="all">Todos os grupos</option>
              <option value="A">Grupo A</option>
              <option value="B">Grupo B</option>
              <option value="campo">Só campo</option>
              <option value="atendimento">Só atendimento</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 sm:h-10 px-3.5 rounded-full bg-white border border-[#E5E4DF] text-[12.5px] sm:text-[13px] font-medium text-[#14181F] focus:outline-none focus:border-[#14181F] w-full sm:w-auto"
            >
              <option value="all">Todos os status</option>
              {Object.entries(STATUS_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>

            {/* Only Holidays Toggle */}
            <label className="inline-flex items-center justify-between sm:justify-start gap-2 h-9 sm:h-10 px-3.5 rounded-full bg-white border border-[#E5E4DF] text-[12.5px] sm:text-[13px] font-medium text-[#14181F] cursor-pointer select-none">
              <button
                type="button"
                role="switch"
                aria-checked={onlyHolidays}
                onClick={() => setOnlyHolidays((v) => !v)}
                className={`rounded-full transition-colors relative flex items-center px-0.5 ${
                  onlyHolidays ? "bg-[#14181F]" : "bg-[#E2E1DC]"
                }`}
                style={{ height: "20px", width: "34px" }}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
                    onlyHolidays ? "translate-x-3.5" : "translate-x-0"
                  }`}
                />
              </button>
              <span>Só feriados</span>
            </label>

            {/* Date Jump Input */}
            <form
              onSubmit={handleJumpDate}
              className="inline-flex items-center justify-between h-9 sm:h-10 pl-3.5 pr-1.5 rounded-full bg-white border border-[#E5E4DF] w-full sm:w-auto"
            >
              <input
                type="text"
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                placeholder="dd/mm/aaaa"
                className="w-[95px] text-[12.5px] sm:text-[13px] font-medium text-[#14181F] focus:outline-none tabular-nums"
              />
              <button
                type="submit"
                className="px-3 h-7 rounded-full bg-[#14181F] text-white text-[12px] font-semibold hover:bg-[#272D38] transition"
              >
                Ir
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* VIEW 1: MÊS (7-COLUMN CALENDAR GRID - RESPONSIVE MOBILE & DESKTOP)    */}
      {/* ===================================================================== */}
      {viewMode === "mes" && (
        <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-2 sm:p-4 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
            {WEEKDAY_HEADERS.map((wd, idx) => (
              <div
                key={wd}
                className="text-center text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-[0.15em] sm:tracking-[0.22em] text-[#8A8F98] py-1"
              >
                <span className="hidden sm:inline">{wd}</span>
                <span className="sm:hidden">{WEEKDAY_MOBILE[idx]}</span>
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {gridDays.map((iso) => {
              const isCurrentMonth = iso.slice(0, 7) === monthKey;
              const dayInfo = gridCalendar.days[iso];
              const dayNum = Number(iso.slice(8, 10));
              const wdIndex = getWeekday(iso);
              const wdShort = WEEKDAY_HEADERS[wdIndex === 0 ? 6 : wdIndex - 1];
              const isToday = iso === todayIso;
              const isPast = iso < todayIso;
              const isFocused = iso === focusedDate;
              const dayServices = servicesByDate[iso] || [];

              let cellStatus = "folga";
              let singleTeamEntry = null;

              if (singleSelectedTeam) {
                singleTeamEntry = dayInfo?.teams?.[singleSelectedTeam.id];
                cellStatus = singleTeamEntry?.status || "folga";
              } else {
                cellStatus = getDominantDayStatus(dayInfo, visibleTeams);
              }

              const matchesStatusFilter =
                selectedStatus === "all" ||
                (singleSelectedTeam
                  ? cellStatus === selectedStatus
                  : visibleTeams.some(
                      (t) => dayInfo?.teams?.[t.id]?.status === selectedStatus
                    ));

              const matchesHolidayFilter =
                !onlyHolidays || Boolean(dayInfo?.holiday);

              const isDimmedByFilter =
                !matchesStatusFilter || !matchesHolidayFilter;

              if (!isCurrentMonth) {
                return (
                  <div
                    key={iso}
                    onClick={() => openDayModal(iso)}
                    className="min-h-[68px] sm:min-h-[112px] rounded-[10px] sm:rounded-[13px] bg-[#FAFAF6] border border-[#F0EFEA] p-1.5 sm:p-2.5 opacity-55 cursor-pointer hover:opacity-90 transition flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] sm:text-[13px] font-bold text-[#9CA3AF] tabular-nums">
                        {dayNum}
                      </span>
                      <span className="hidden sm:inline text-[9px] font-semibold uppercase tracking-[0.14em] text-[#A3A8B1]">
                        {wdShort}
                      </span>
                    </div>
                  </div>
                );
              }

              const colorKey = STATUS_META[cellStatus]?.colorKey || "trabalha";
              const bgHex = colors[colorKey] || "#10B981";
              const fgHex = getContrastColor(bgHex);
              const isFacultativo = dayInfo?.holiday?.type === "facultativo";
              const isOfficialHoliday =
                dayInfo?.holiday && dayInfo.holiday.type !== "facultativo";

              return (
                <div
                  key={iso}
                  onClick={() => openDayModal(iso)}
                  style={{
                    backgroundColor: isDimmedByFilter ? "#F7F6F2" : bgHex,
                    color: isDimmedByFilter ? "#9CA3AF" : fgHex,
                    opacity: isDimmedByFilter ? 0.45 : isPast ? 0.52 : 1,
                    filter: isPast && !isDimmedByFilter ? "saturate(0.78)" : "none",
                  }}
                  className={`min-h-[68px] sm:min-h-[112px] rounded-[10px] sm:rounded-[13px] p-1.5 sm:p-2.5 transition cursor-pointer flex flex-col justify-between relative hover:!opacity-95 active:scale-[0.99] ${
                    isFocused
                      ? "ring-2 ring-[#14181F] ring-offset-1 sm:ring-offset-2"
                      : isToday
                      ? "ring-2 ring-[#14181F]/80 ring-offset-1 shadow-md"
                      : ""
                  } ${
                    isFacultativo
                      ? "border-2 border-dashed border-[#EAB308]"
                      : isOfficialHoliday
                      ? "border border-[#EF4444]/40"
                      : ""
                  }`}
                >
                  {/* Top Row: Day number + Weekday */}
                  <div className="flex items-center justify-between">
                    {isToday ? (
                      <span
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-[#14181F] font-bold text-[10.5px] sm:text-[12px] flex items-center justify-center shadow-sm tabular-nums"
                        title="Hoje"
                      >
                        {dayNum}
                      </span>
                    ) : (
                      <span className="text-[11.5px] sm:text-[13px] font-bold tabular-nums">
                        {dayNum}
                      </span>
                    )}
                    <span className="hidden sm:inline text-[9px] font-semibold uppercase tracking-[0.14em] opacity-85">
                      {wdShort}
                    </span>
                  </div>

                  {/* Middle: Holiday badge, Duty pills */}
                  <div className="my-0.5 sm:my-1.5 flex flex-col gap-0.5 sm:gap-1 overflow-hidden">
                    {dayInfo?.holiday && (
                      <div
                        style={{
                          backgroundColor:
                            fgHex === "#FFFFFF"
                              ? "rgba(0,0,0,0.22)"
                              : "rgba(20,24,31,0.12)",
                        }}
                        className="px-1.5 sm:px-2 py-0.5 rounded-full text-[8.5px] sm:text-[10px] font-semibold truncate w-fit max-w-full"
                        title={`${dayInfo.holiday.name} (${dayInfo.holiday.type})`}
                      >
                        {dayInfo.holiday.name}
                      </div>
                    )}

                    {singleSelectedTeam && singleTeamEntry && (
                      <div
                        style={{
                          backgroundColor:
                            fgHex === "#FFFFFF"
                              ? "rgba(255,255,255,0.24)"
                              : "rgba(20,24,31,0.1)",
                        }}
                        className="px-1.5 sm:px-2 py-0.5 rounded-full text-[8.5px] sm:text-[10px] font-semibold truncate w-fit max-w-full"
                      >
                        {singleTeamEntry.custom_name ||
                          STATUS_META[singleTeamEntry.status]?.short}
                      </div>
                    )}

                    {!singleSelectedTeam && dayInfo?.campo_duty_label && (
                      <div
                        style={{
                          backgroundColor:
                            fgHex === "#FFFFFF"
                              ? "rgba(255,255,255,0.25)"
                              : "rgba(20,24,31,0.12)",
                        }}
                        className="px-1.5 sm:px-2 py-0.5 rounded-full text-[8.5px] sm:text-[10.5px] font-semibold truncate w-fit max-w-full leading-tight"
                        title={`Plantão Campo: ${dayInfo.campo_duty_label}`}
                      >
                        <span className="hidden sm:inline">• </span>
                        {dayInfo.campo_duty_label}
                      </div>
                    )}

                    {!singleSelectedTeam && dayInfo?.atendimento_duty_label && (
                      <div
                        style={{
                          backgroundColor:
                            fgHex === "#FFFFFF"
                              ? "rgba(255,255,255,0.25)"
                              : "rgba(20,24,31,0.12)",
                        }}
                        className="px-1.5 sm:px-2 py-0.5 rounded-full text-[8.5px] sm:text-[10.5px] font-semibold truncate w-fit max-w-full leading-tight"
                        title={`Plantão Atendimento: ${dayInfo.atendimento_duty_label}`}
                      >
                        <span className="hidden sm:inline">• </span>
                        {dayInfo.atendimento_duty_label}
                      </div>
                    )}
                  </div>

                  {/* Subtle bottom indicator on desktop */}
                  <div className="hidden sm:flex items-center justify-between text-[9px] opacity-75 font-medium">
                    <span>
                      {wdIndex >= 1 && wdIndex <= 5
                        ? `Seg-Sex: Grp ${dayInfo?.mon_fri_group}`
                        : wdIndex === 6
                        ? `Sáb: Grp ${
                            dayInfo?.mon_fri_group === "A" ? "B" : "A"
                          }`
                        : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 2: EQUIPES (DAILY STATUS MATRIX - STICKY & TOUCH SCROLLABLE)     */}
      {/* ===================================================================== */}
      {viewMode === "equipes" && (
        <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-3 sm:p-4 shadow-[0_1px_2px_rgba(20,24,31,0.04)] overflow-x-auto">
          <div
            className="min-w-max"
            style={{
              display: "grid",
              gridTemplateColumns: `165px repeat(${monthDays.length}, 29px)`,
            }}
          >
            {/* Header Row */}
            <div className="sticky left-0 z-10 bg-white pr-2 py-2 flex items-end text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A8F98] border-b border-[#EBEBE6]">
              EQUIPE
            </div>
            {monthDays.map((iso) => {
              const dNum = Number(iso.slice(8, 10));
              const wd = getWeekday(iso);
              const isSun = wd === 0;
              const isToday = iso === todayIso;
              const isPast = iso < todayIso;
              return (
                <div
                  key={iso}
                  onClick={() => openDayModal(iso)}
                  className={`py-1.5 text-center border-b border-[#EBEBE6] cursor-pointer select-none ${
                    isToday
                      ? "bg-[#F1F1EA] rounded-t-md"
                      : isSun
                      ? "bg-[#FAFAF5]"
                      : ""
                  } ${isPast ? "opacity-55" : ""}`}
                >
                  <div className="text-[9px] font-semibold text-[#A3A8B1]">
                    {SHORT_WEEKDAYS[wd]}
                  </div>
                  <div
                    className={`text-[11px] font-semibold tabular-nums ${
                      isToday
                        ? "text-[#14181F] font-bold underline"
                        : isSun
                        ? "text-[#8A8F98]"
                        : "text-[#42474F]"
                    }`}
                  >
                    {dNum}
                  </div>
                </div>
              );
            })}

            {/* Equipe de campo */}
            {visibleTeams.some((t) => t.kind === "campo") && (
              <>
                <div
                  style={{ gridColumn: `1 / span ${monthDays.length + 1}` }}
                  className="pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#14181F]"
                >
                  EQUIPE DE CAMPO
                </div>
                {visibleTeams
                  .filter((t) => t.kind === "campo")
                  .map((team) => (
                    <React.Fragment key={team.id}>
                      <div className="sticky left-0 z-10 bg-white pr-2 py-2.5 border-b border-[#F2F1EC] flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#14181F] shrink-0" />
                          <span className="text-[12.5px] font-medium text-[#14181F] truncate">
                            {team.name}
                          </span>
                        </div>
                        <span className="w-5 h-5 rounded-md bg-[#F4F3EE] border border-[#E5E4DF] text-[10px] font-semibold text-[#6B7280] flex items-center justify-center shrink-0">
                          {team.group}
                        </span>
                      </div>
                      {monthDays.map((iso) => {
                        const dayInfo = monthCalendar.days[iso];
                        const entry = dayInfo?.teams?.[team.id];
                        const st = entry?.status || "folga";
                        const colorKey = STATUS_META[st]?.colorKey || "folga";
                        const dotColor = colors[colorKey] || "#EF4444";
                        const wd = getWeekday(iso);
                        const isSun = wd === 0;
                        const isToday = iso === todayIso;
                        const isPast = iso < todayIso;
                        const matchesStatus =
                          selectedStatus === "all" || st === selectedStatus;
                        const matchesHol =
                          !onlyHolidays || Boolean(dayInfo?.holiday);

                        return (
                          <div
                            key={`${team.id}-${iso}`}
                            onClick={() => openDayModal(iso)}
                            title={`${formatDayMonth(iso)} · ${team.name} · ${
                              STATUS_META[st]?.label
                            }${
                              entry?.custom_name
                                ? ` (${entry.custom_name})`
                                : ""
                            }`}
                            className={`py-2.5 border-b border-[#F2F1EC] flex items-center justify-center cursor-pointer ${
                              isToday
                                ? "bg-[#F1F1EA]"
                                : isSun
                                ? "bg-[#FAFAF5]"
                                : ""
                            }`}
                          >
                            <span
                              style={{
                                backgroundColor: dotColor,
                                opacity:
                                  !matchesStatus || !matchesHol
                                    ? 0.15
                                    : isPast
                                    ? 0.45
                                    : 1,
                              }}
                              className="w-3.5 h-3.5 rounded-full transition-transform hover:scale-125 hover:!opacity-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
                            />
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
              </>
            )}

            {/* Atendimento */}
            {visibleTeams.some((t) => t.kind === "atendimento") && (
              <>
                <div
                  style={{ gridColumn: `1 / span ${monthDays.length + 1}` }}
                  className="pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8B5CF6]"
                >
                  ATENDIMENTO
                </div>
                {visibleTeams
                  .filter((t) => t.kind === "atendimento")
                  .map((team) => (
                    <React.Fragment key={team.id}>
                      <div className="sticky left-0 z-10 bg-white pr-2 py-2.5 border-b border-[#F2F1EC] flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shrink-0" />
                          <span className="text-[12.5px] font-medium text-[#14181F] truncate">
                            {team.name}
                          </span>
                        </div>
                        <span className="w-5 h-5 rounded-md bg-[#F4F3EE] border border-[#E5E4DF] text-[10px] font-semibold text-[#6B7280] flex items-center justify-center shrink-0">
                          {team.group}
                        </span>
                      </div>
                      {monthDays.map((iso) => {
                        const dayInfo = monthCalendar.days[iso];
                        const entry = dayInfo?.teams?.[team.id];
                        const st = entry?.status || "folga";
                        const colorKey = STATUS_META[st]?.colorKey || "folga";
                        const dotColor = colors[colorKey] || "#EF4444";
                        const wd = getWeekday(iso);
                        const isSun = wd === 0;
                        const isToday = iso === todayIso;
                        const isPast = iso < todayIso;
                        const matchesStatus =
                          selectedStatus === "all" || st === selectedStatus;
                        const matchesHol =
                          !onlyHolidays || Boolean(dayInfo?.holiday);

                        return (
                          <div
                            key={`${team.id}-${iso}`}
                            onClick={() => openDayModal(iso)}
                            title={`${formatDayMonth(iso)} · ${team.name} · ${
                              STATUS_META[st]?.label
                            }`}
                            className={`py-2.5 border-b border-[#F2F1EC] flex items-center justify-center cursor-pointer ${
                              isToday
                                ? "bg-[#F1F1EA]"
                                : isSun
                                ? "bg-[#FAFAF5]"
                                : ""
                            }`}
                          >
                            <span
                              style={{
                                backgroundColor: dotColor,
                                opacity:
                                  !matchesStatus || !matchesHol
                                    ? 0.15
                                    : isPast
                                    ? 0.45
                                    : 1,
                              }}
                              className="w-3.5 h-3.5 rounded-full transition-transform hover:scale-125 hover:!opacity-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
                            />
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 3: DIAS TRABALHADOS POR FUNCIONÁRIO (CARDS ON MOBILE, TABLE PC)  */}
      {/* ===================================================================== */}
      {viewMode === "funcionarios" && (
        <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#EBEBE6]">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A8F98]">
                CONTROLE INDIVIDUAL · {formatMonthTitle(monthKey)}
              </div>
              <h2 className="font-heading text-[18px] sm:text-[19px] font-bold text-[#14181F] mt-0.5">
                Dias Trabalhados e Plantões por Funcionário
              </h2>
              <p className="text-[12.5px] sm:text-[13px] text-[#6B7280]">
                Toque em qualquer funcionário para abrir a{" "}
                <strong>Ficha Individual e Espelho Mensal</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <div className="px-3.5 py-2 rounded-xl bg-[#FBFAF7] border border-[#EBEBE6] text-right">
                <div className="text-[10px] uppercase tracking-wider text-[#8A8F98] font-semibold">
                  Colaboradores
                </div>
                <div className="font-heading text-[17px] font-bold text-[#14181F] tabular-nums">
                  {employeeSummary.length}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Card List (shown on screens < md) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:hidden">
            {employeeSummary.map((emp) => (
              <div
                key={emp.name}
                onClick={() => setSelectedEmployeeProfile(emp)}
                className="p-3.5 rounded-2xl bg-[#FBFAF7] border border-[#EBEBE6] cursor-pointer active:scale-[0.99] transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        emp.kind === "campo" ? "bg-[#10B981]" : "bg-[#8B5CF6]"
                      }`}
                    />
                    <span className="font-heading font-bold text-[15px] text-[#14181F]">
                      {emp.name}
                    </span>
                    <span className="text-[11px] text-[#8A8F98]">
                      ({emp.teamName} · Grp {emp.group})
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#10B981]/15 text-[#065F46] font-bold text-[12px] tabular-nums">
                    {emp.totalTrabalhado} dias
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center pt-2 border-t border-[#EBEBE6]/70">
                  <div className="bg-white rounded-lg p-1.5 border border-[#EBEBE6]">
                    <div className="text-[9.5px] text-[#8A8F98] uppercase">
                      Normais
                    </div>
                    <div className="text-[12.5px] font-bold text-[#14181F] tabular-nums">
                      {emp.diasNormais}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-1.5 border border-[#EBEBE6]">
                    <div className="text-[9.5px] text-[#C2410C] uppercase">
                      Domingos
                    </div>
                    <div className="text-[12.5px] font-bold text-[#C2410C] tabular-nums">
                      {emp.plantoesDomingo}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-1.5 border border-[#EBEBE6]">
                    <div className="text-[9.5px] text-[#6D28D9] uppercase">
                      Feriados
                    </div>
                    <div className="text-[12.5px] font-bold text-[#6D28D9] tabular-nums">
                      {emp.plantoesFeriado}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-1.5 border border-[#EBEBE6]">
                    <div className="text-[9.5px] text-[#8A8F98] uppercase">
                      Folgas
                    </div>
                    <div className="text-[12.5px] font-bold text-[#6B7280] tabular-nums">
                      {emp.folgas}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (shown on md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EBEBE6] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A8F98]">
                  <th className="py-3 px-3">Funcionário</th>
                  <th className="py-3 px-3">Equipe / Dupla</th>
                  <th className="py-3 px-3 text-center">Setor</th>
                  <th className="py-3 px-3 text-center">Dias Normais</th>
                  <th className="py-3 px-3 text-center">Plantão Dom.</th>
                  <th className="py-3 px-3 text-center">Plantão Fer.</th>
                  <th className="py-3 px-3 text-center">Trocas</th>
                  <th className="py-3 px-3 text-center">Férias/Aus.</th>
                  <th className="py-3 px-3 text-center">Folgas</th>
                  <th className="py-3 px-3 text-center">Serviços (OS)</th>
                  <th className="py-3 px-3 text-right">Total Trabalhado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F1EC] text-[13px]">
                {employeeSummary.map((emp) => (
                  <tr
                    key={emp.name}
                    onClick={() => setSelectedEmployeeProfile(emp)}
                    className="hover:bg-[#FBFAF7] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 font-semibold text-[#14181F] flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          emp.kind === "campo" ? "bg-[#10B981]" : "bg-[#8B5CF6]"
                        }`}
                      />
                      <span className="underline decoration-[#D5D4CE] underline-offset-4">
                        {emp.name}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#42474F]">
                      {emp.teamName}{" "}
                      <span className="text-[11px] text-[#8A8F98]">
                        (Grp {emp.group})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          emp.kind === "campo"
                            ? "bg-[#14181F]/10 text-[#14181F]"
                            : "bg-[#8B5CF6]/15 text-[#6D28D9]"
                        }`}
                      >
                        {emp.kind === "campo" ? "Campo" : "Atendimento"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums font-medium">
                      {emp.diasNormais}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      {emp.plantoesDomingo > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#F97316]/15 text-[#C2410C] font-semibold">
                          {emp.plantoesDomingo}
                        </span>
                      ) : (
                        <span className="text-[#A3A8B1]">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      {emp.plantoesFeriado > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#6D28D9] font-semibold">
                          {emp.plantoesFeriado}
                        </span>
                      ) : (
                        <span className="text-[#A3A8B1]">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      {emp.trocasTrabalhadas > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#1D4ED8] font-semibold">
                          {emp.trocasTrabalhadas}
                        </span>
                      ) : (
                        <span className="text-[#A3A8B1]">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      {emp.feriasAusencias > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#EAB308]/20 text-[#854D0E] font-semibold">
                          {emp.feriasAusencias}
                        </span>
                      ) : (
                        <span className="text-[#A3A8B1]">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums text-[#6B7280]">
                      {emp.folgas}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F3F2ED] text-[#14181F] font-semibold">
                        {emp.servicosCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      <span className="px-3 py-1 rounded-full bg-[#10B981]/15 text-[#065F46] font-bold text-[13px]">
                        {emp.totalTrabalhado} dias
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 4: RANKING E EQUILÍBRIO ANUAL DE PLANTÕES (JAN-DEZ)              */}
      {/* ===================================================================== */}
      {viewMode === "ranking" && (
        <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
          <div className="pb-4 mb-4 border-b border-[#EBEBE6]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A8F98]">
              EQUILÍBRIO DE ESCALA · ANO {selectedYear}
            </div>
            <h2 className="font-heading text-[18px] sm:text-[19px] font-bold text-[#14181F] mt-0.5">
              Acumulado Anual de Plantões e Dias Trabalhados (Jan a Dez/
              {selectedYear})
            </h2>
            <p className="text-[12.5px] sm:text-[13px] text-[#6B7280]">
              Comparativo anual para garantir que todas as duplas e atendentes
              façam uma quantidade justa e equilibrada de domingos e feriados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {annualEmployeeSummary.map((emp) => {
              const totalPlantoes =
                emp.plantoesDomingo +
                emp.plantoesFeriado +
                emp.trocasTrabalhadas;
              return (
                <div
                  key={emp.name}
                  className="p-4 rounded-2xl bg-[#FBFAF7] border border-[#EBEBE6] flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            emp.kind === "campo"
                              ? "bg-[#10B981]"
                              : "bg-[#8B5CF6]"
                          }`}
                        />
                        <span className="font-heading font-bold text-[15.5px] text-[#14181F]">
                          {emp.name}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-[#6B7280] mt-0.5">
                        {emp.teamName} · Grupo {emp.group}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#14181F] text-white text-[11.5px] font-bold tabular-nums">
                      {emp.totalTrabalhado} dias/ano
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-white border border-[#EBEBE6]">
                      <div className="text-[10px] font-semibold text-[#C2410C] uppercase">
                        Domingos
                      </div>
                      <div className="font-heading text-[16px] font-bold text-[#C2410C] tabular-nums">
                        {emp.plantoesDomingo}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-[#EBEBE6]">
                      <div className="text-[10px] font-semibold text-[#6D28D9] uppercase">
                        Feriados
                      </div>
                      <div className="font-heading text-[16px] font-bold text-[#6D28D9] tabular-nums">
                        {emp.plantoesFeriado}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-[#EBEBE6]">
                      <div className="text-[10px] font-semibold text-[#065F46] uppercase">
                        Total Plantões
                      </div>
                      <div className="font-heading text-[16px] font-bold text-[#065F46] tabular-nums">
                        {totalPlantoes}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VIEW 5: CONTROLE DE SERVIÇOS E ORDENS DE SERVIÇO DO MÊS               */}
      {/* ===================================================================== */}
      {viewMode === "servicos" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {isAdmin && (
            <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)] h-fit">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A8F98]">
                NOVO REGISTRO (MODO ADMIN)
              </div>
              <h2 className="font-heading text-[18px] font-bold text-[#14181F] mt-0.5 mb-3">
                Lançar Serviço / Atendimento
              </h2>
              <form onSubmit={handleCreateService} className="space-y-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                    Data do serviço
                  </label>
                  <input
                    type="date"
                    value={serviceForm.date}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, date: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px] focus:outline-none focus:border-[#14181F]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                    Equipe responsável
                  </label>
                  <select
                    value={serviceForm.team_id}
                    onChange={(e) => {
                      const tid = e.target.value;
                      const t = activeTeams.find((x) => x.id === tid);
                      setServiceForm({
                        ...serviceForm,
                        team_id: tid,
                        employeesText: t ? t.name : serviceForm.employeesText,
                      });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px] focus:outline-none focus:border-[#14181F]"
                  >
                    <option value="">Selecione a equipe...</option>
                    {activeTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.kind === "campo" ? "Campo" : "Atendimento"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                    Funcionários que executaram (separados por /)
                  </label>
                  <input
                    type="text"
                    value={serviceForm.employeesText}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        employeesText: e.target.value,
                      })
                    }
                    placeholder="Ex: Lucas / Felipe"
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px] focus:outline-none focus:border-[#14181F]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                      Tipo de Serviço
                    </label>
                    <select
                      value={serviceForm.category}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          category: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px] focus:outline-none focus:border-[#14181F]"
                    >
                      <option value="Ordem de Serviço / Campo">OS Campo</option>
                      <option value="Instalação">Instalação</option>
                      <option value="Manutenção / Reparo">
                        Manutenção / Reparo
                      </option>
                      <option value="Plantão Domingo">Plantão Domingo</option>
                      <option value="Plantão Feriado">Plantão Feriado</option>
                      <option value="Atendimento Suporte">
                        Atendimento Suporte
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                      Protocolo / Nº OS
                    </label>
                    <input
                      type="text"
                      value={serviceForm.protocol}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          protocol: e.target.value,
                        })
                      }
                      placeholder="Ex: OS-1042"
                      className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px] focus:outline-none focus:border-[#14181F]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                    Cliente / Local / Bairro
                  </label>
                  <input
                    type="text"
                    value={serviceForm.client}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, client: e.target.value })
                    }
                    placeholder="Nome do cliente ou local atendido"
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px] focus:outline-none focus:border-[#14181F]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                    Observações do serviço executado
                  </label>
                  <textarea
                    rows={2}
                    value={serviceForm.notes}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, notes: e.target.value })
                    }
                    placeholder="Detalhes do atendimento..."
                    className="w-full p-3 rounded-xl border border-[#E5E4DF] text-[13px] focus:outline-none focus:border-[#14181F]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-10 rounded-full bg-[#14181F] text-white text-[13px] font-semibold hover:bg-[#272D38] transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Serviço</span>
                </button>
              </form>
            </div>
          )}

          <div
            className={`${
              isAdmin ? "lg:col-span-2" : "lg:col-span-3"
            } bg-white border border-[#EBEBE6] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]`}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EBEBE6]">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A8F98]">
                  HISTÓRICO OPERACIONAL (CONSULTA)
                </div>
                <h2 className="font-heading text-[18px] font-bold text-[#14181F]">
                  Serviços Realizados em {formatMonthTitle(monthKey)} (
                  {monthServices.length})
                </h2>
              </div>
            </div>

            {monthServices.length === 0 ? (
              <div className="py-12 text-center text-[#8A8F98] text-[13px]">
                Nenhum serviço registrado neste mês.
              </div>
            ) : (
              <div className="space-y-2.5">
                {monthServices.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-3.5 rounded-2xl bg-[#FBFAF7] border border-[#EBEBE6] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#14181F] text-white text-[11px] font-semibold tabular-nums">
                          {formatShortDate(srv.date)}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#065F46] text-[11px] font-semibold">
                          {srv.category}
                        </span>
                        {srv.protocol && (
                          <span className="text-[11px] font-mono text-[#6B7280]">
                            #{srv.protocol}
                          </span>
                        )}
                      </div>
                      <div className="text-[14px] font-semibold text-[#14181F]">
                        {srv.client}
                      </div>
                      {srv.notes && (
                        <div className="text-[12.5px] text-[#6B7280]">
                          {srv.notes}
                        </div>
                      )}
                      <div className="text-[11.5px] font-medium text-[#42474F]">
                        Funcionários:{" "}
                        <span className="font-semibold">
                          {(srv.employees || []).join(" / ") || "Não informado"}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => onDeleteService(srv.id)}
                          className="px-3 py-1.5 rounded-full text-[11.5px] font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition"
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* LEGENDA (EXACT REPLICA OF BASE44 LEGEND BAR)                          */}
      {/* ===================================================================== */}
      <div className="mt-4 bg-white border border-[#EBEBE6] rounded-[18px] p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A8F98] mr-1">
            LEGENDA
          </span>

          {COLOR_SETTINGS.map((item) => (
            <div key={item.key} className="inline-flex items-center gap-1.5 sm:gap-2">
              <span
                style={{ backgroundColor: colors[item.key] }}
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[5px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] shrink-0"
              />
              <span className="text-[11.5px] sm:text-[12.5px] text-[#42474F] font-medium">
                {item.label}
              </span>
            </div>
          ))}

          <div className="inline-flex items-center gap-1.5 sm:gap-2">
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[5px] border border-[#EF4444] bg-white shrink-0" />
            <span className="text-[11.5px] sm:text-[12.5px] text-[#42474F] font-medium">
              Feriado oficial
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 sm:gap-2">
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[5px] border-2 border-dashed border-[#EAB308] bg-white shrink-0" />
            <span className="text-[11.5px] sm:text-[12.5px] text-[#42474F] font-medium">
              Ponto facultativo
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* INDIVIDUAL EMPLOYEE SHEET MODAL (ESPELHO MENSAL DO COLABORADOR)       */}
      {/* ===================================================================== */}
      {selectedEmployeeProfile && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedEmployeeProfile(null)}
        >
          <div
            className="bg-white border border-[#EBEBE6] rounded-t-[24px] sm:rounded-[22px] max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EBEBE6]">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A8F98]">
                  FICHA INDIVIDUAL · {formatMonthTitle(monthKey)}
                </div>
                <h3 className="font-heading text-[22px] font-bold text-[#14181F] mt-0.5">
                  {selectedEmployeeProfile.name}
                </h3>
                <p className="text-[12.5px] text-[#6B7280]">
                  Equipe: {selectedEmployeeProfile.teamName} · Setor:{" "}
                  {selectedEmployeeProfile.kind === "campo"
                    ? "Campo"
                    : "Atendimento"}{" "}
                  (Grupo {selectedEmployeeProfile.group})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="w-8 h-8 rounded-full bg-[#F4F3EE] flex items-center justify-center text-[#14181F] hover:bg-[#E5E4DF]"
                  title="Imprimir Ficha"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedEmployeeProfile(null)}
                  className="w-8 h-8 rounded-full bg-[#F4F3EE] flex items-center justify-center text-[#42474F] hover:bg-[#E5E4DF]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
              <div className="p-3 rounded-2xl bg-[#FBFAF7] border border-[#EBEBE6] text-center">
                <div className="text-[10px] font-semibold uppercase text-[#8A8F98]">
                  Dias Normais
                </div>
                <div className="font-heading text-[20px] font-bold text-[#14181F] tabular-nums">
                  {selectedEmployeeProfile.diasNormais}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#FBFAF7] border border-[#EBEBE6] text-center">
                <div className="text-[10px] font-semibold uppercase text-[#C2410C]">
                  Domingos
                </div>
                <div className="font-heading text-[20px] font-bold text-[#C2410C] tabular-nums">
                  {selectedEmployeeProfile.plantoesDomingo}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#FBFAF7] border border-[#EBEBE6] text-center">
                <div className="text-[10px] font-semibold uppercase text-[#6D28D9]">
                  Feriados
                </div>
                <div className="font-heading text-[20px] font-bold text-[#6D28D9] tabular-nums">
                  {selectedEmployeeProfile.plantoesFeriado}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 text-center">
                <div className="text-[10px] font-semibold uppercase text-[#065F46]">
                  Total Mês
                </div>
                <div className="font-heading text-[20px] font-bold text-[#065F46] tabular-nums">
                  {selectedEmployeeProfile.totalTrabalhado}d
                </div>
              </div>
            </div>

            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A8F98] mb-2">
              DIAS TRABALHADOS NO MÊS ({selectedEmployeeProfile.datesWorked.length})
            </div>
            <div className="max-h-[260px] overflow-y-auto divide-y divide-[#F2F1EC] border border-[#EBEBE6] rounded-2xl px-3.5">
              {selectedEmployeeProfile.datesWorked.map((dw, i) => (
                <div
                  key={`${dw.date}-${i}`}
                  className="py-2 flex items-center justify-between text-[12.5px]"
                >
                  <span className="font-mono font-semibold text-[#14181F] tabular-nums">
                    {formatShortDate(dw.date)}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      dw.type.includes("domingo")
                        ? "bg-[#F97316]/15 text-[#C2410C]"
                        : dw.type.includes("feriado")
                        ? "bg-[#8B5CF6]/15 text-[#6D28D9]"
                        : dw.type.includes("Troca")
                        ? "bg-[#3B82F6]/15 text-[#1D4ED8]"
                        : "bg-[#10B981]/15 text-[#065F46]"
                    }`}
                  >
                    {dw.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DAY DETAILMODAL (WHEN CLICKING ANY DAY)                               */}
      {/* ===================================================================== */}
      {modalDate && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setModalDate(null)}
        >
          <div
            className="bg-white border border-[#EBEBE6] rounded-t-[24px] sm:rounded-[22px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const info =
                gridCalendar.days[modalDate] ||
                monthCalendar.days[modalDate] ||
                buildCalendar({
                  startIso: modalDate,
                  endIso: modalDate,
                  settings: appState.settings,
                  teams: appState.teams,
                  holidays: appState.holidays,
                  overrides: appState.overrides,
                  absences: appState.absences,
                  weekOverrides: appState.weekOverrides,
                  dutyOverrides: appState.dutyOverrides,
                }).days[modalDate];

              const daySrv = servicesByDate[modalDate] || [];

              return (
                <>
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EBEBE6]">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A8F98]">
                        DETALHES DO DIA · SEMANA SEG-SEX GRUPO{" "}
                        {info?.mon_fri_group}
                      </div>
                      <h3 className="font-heading text-[20px] sm:text-[22px] font-bold text-[#14181F] mt-0.5">
                        {formatShortDate(modalDate)}
                        {info?.holiday ? ` — ${info.holiday.name}` : ""}
                      </h3>
                    </div>
                    <button
                      onClick={() => setModalDate(null)}
                      className="w-8 h-8 rounded-full bg-[#F4F3EE] flex items-center justify-center text-[#42474F] hover:bg-[#E5E4DF]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {(info?.campo_duty_label || info?.atendimento_duty_label) && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-[#FBFAF7] border border-[#EBEBE6] flex flex-wrap items-center gap-4">
                      {info?.campo_duty_label && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8F98]">
                            PLANTÃO DE CAMPO
                          </div>
                          <div className="text-[14px] font-bold text-[#14181F]">
                            {info.campo_duty_label}
                          </div>
                        </div>
                      )}
                      {info?.atendimento_duty_label && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8F98]">
                            PLANTÃO DE ATENDIMENTO
                          </div>
                          <div className="text-[14px] font-bold text-[#8B5CF6]">
                            {info.atendimento_duty_label}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A8F98] mb-2">
                      SITUAÇÃO DE CADA EQUIPE E INTEGRANTE NO DIA
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeTeams.map((t) => {
                        const entry = info?.teams?.[t.id];
                        const st = entry?.status || "folga";
                        const cKey = STATUS_META[st]?.colorKey || "folga";
                        const badgeBg = colors[cKey];
                        const badgeFg = getContrastColor(badgeBg);
                        const memberEntries = Object.entries(
                          entry?.member_statuses || {}
                        );
                        const hasDifferentMemberStatuses =
                          memberEntries.length > 1 &&
                          new Set(memberEntries.map(([, mst]) => mst)).size > 1;

                        return (
                          <div
                            key={t.id}
                            className="p-2.5 rounded-xl border border-[#EBEBE6] flex flex-col justify-between gap-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate">
                                <div className="text-[13px] font-semibold text-[#14181F] truncate">
                                  {t.name}
                                </div>
                                <div className="text-[11px] text-[#8A8F98]">
                                  {t.kind === "campo" ? "Campo" : "Atendimento"}{" "}
                                  · Grupo {t.group}
                                  {entry?.custom_name
                                    ? ` · ${entry.custom_name}`
                                    : ""}
                                </div>
                              </div>
                              <span
                                style={{
                                  backgroundColor: badgeBg,
                                  color: badgeFg,
                                }}
                                className="px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0"
                              >
                                {STATUS_META[st]?.label}
                              </span>
                            </div>

                            {/* Individual breakdown if 1 member of the duo swapped or is on vacation */}
                            {hasDifferentMemberStatuses && (
                              <div className="pt-1.5 border-t border-[#F2F1EC] flex flex-wrap items-center gap-1.5">
                                {memberEntries.map(([mName, mSt]) => {
                                  const mcKey =
                                    STATUS_META[mSt]?.colorKey || "folga";
                                  const mBg = colors[mcKey];
                                  const mFg = getContrastColor(mBg);
                                  return (
                                    <span
                                      key={mName}
                                      style={{
                                        backgroundColor: mBg,
                                        color: mFg,
                                      }}
                                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                    >
                                      {mName}: {STATUS_META[mSt]?.short || mSt}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* Explanatory Note / Observation (e.g. "Tilú veio a pedido do Guto, pois seria sua Folga") */}
                            {entry?.note && (
                              <div className="pt-1 text-[11px] text-[#42474F] italic leading-snug">
                                📌 {entry.note}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
