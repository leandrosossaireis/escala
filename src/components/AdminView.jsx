import React, { useMemo, useState } from "react";
import {
  Trash2,
  Plus,
  Download,
  Printer,
  RotateCcw,
  Save,
  Calendar,
  Users,
  Sparkles,
  Sliders,
  Palette,
  BarChart3,
  Briefcase,
  Upload,
  Shield,
  CloudUpload,
  LogOut,
  Pencil,
  X,
} from "lucide-react";
import {
  getAdminCredentials,
  saveAdminCredentials,
  getGitHubSyncConfig,
  saveGitHubSyncConfig,
  publishStateToGitHub,
} from "../lib/store";
import {
  STATUS_META,
  COLOR_SETTINGS,
  CODE_DEFAULT_COLORS,
  LIVE_COLORS,
  HOLIDAY_LABELS,
  getMonthRange,
  listDaysInRange,
  formatMonthTitle,
  formatShortDate,
  getWeekday,
  getMondayOfWeek,
  addDays,
  buildCalendar,
  buildMonthlyReport,
  buildEmployeeWorkdaySummary,
  generateBrazilianHolidaysForYear,
} from "../lib/schedule";

const ADMIN_TABS = [
  { id: "escala", label: "Escala", icon: Calendar },
  { id: "equipes", label: "Equipes", icon: Users },
  { id: "feriados", label: "Feriados", icon: Sparkles },
  { id: "ajustes", label: "Trocas e ajustes", icon: Sliders },
  { id: "cores", label: "Cores", icon: Palette },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
  { id: "seguranca", label: "Senha do Admin", icon: Shield },
];

export default function AdminView({
  appState,
  setAppState,
  onResetAll,
  onLogout,
  notify,
}) {
  const [activeTab, setActiveTab] = useState("escala");

  // ---------------------------------------------------------------------------
  // Tab 1: Escala State
  // ---------------------------------------------------------------------------
  const [anchorDate, setAnchorDate] = useState(
    appState.settings.schedule_anchor || "2026-01-05"
  );
  const [anchorGroup, setAnchorGroup] = useState(
    appState.settings.anchor_group || "B"
  );
  const [rotationStart, setRotationStart] = useState(
    appState.settings.rotation_start || "2026-01-01"
  );
  const [mateusName, setMateusName] = useState(
    appState.settings.mateus_name || "Mateus"
  );

  const [invertWeekDate, setInvertWeekDate] = useState("2026-11-16");
  const [sundayDutyDate, setSundayDutyDate] = useState("2026-11-29");
  const [sundayDutyTeamId, setSundayDutyTeamId] = useState(
    appState.teams[0]?.id || ""
  );
  const [mateusFolgaMonth, setMateusFolgaMonth] = useState("2026-12");
  const [mateusFolgaSunday, setMateusFolgaSunday] = useState("2026-12-20");

  // ---------------------------------------------------------------------------
  // Tab 2: Equipes State
  // ---------------------------------------------------------------------------
  const [newTeam, setNewTeam] = useState({
    name: "",
    kind: "campo",
    group: "A",
    order: 7,
  });

  // ---------------------------------------------------------------------------
  // Tab 3: Feriados State
  // ---------------------------------------------------------------------------
  const [newHoliday, setNewHoliday] = useState({
    date: "2026-12-24",
    name: "",
    type: "facultativo",
  });
  const [importYear, setImportYear] = useState(2026);

  // ---------------------------------------------------------------------------
  // Tab 4: Trocas e Ajustes State (Smart Individual & Team Swaps + Edit Support)
  // ---------------------------------------------------------------------------
  const [trocaPlantaoForm, setTrocaPlantaoForm] = useState({
    id: null,
    date: "2026-11-22",
    team_id: appState.teams[0]?.id || "",
    member_out: "", // "" = Dupla toda, or specific member name (e.g. "Felipe")
    member_in: "",  // Optional substitute employee (e.g. "Alison")
    custom_name: "",
    note: "",
  });

  const [swapDayTeamsForm, setSwapDayTeamsForm] = useState({
    date: "2026-11-23",
    team1_id: appState.teams[0]?.id || "",
    team2_id: appState.teams[3]?.id || "",
  });

  const [swapDutiesForm, setSwapDutiesForm] = useState({
    date1: "2026-11-08",
    date2: "2026-11-15",
  });

  const [pointOverrideForm, setPointOverrideForm] = useState({
    id: null,
    team_id: appState.teams[0]?.id || "",
    member: "", // "" = Dupla toda, or specific member name
    member_in: "", // Optional substitute employee
    date: "2026-11-25",
    status: "trabalha",
    custom_name: "",
    note: "",
  });

  const [absenceForm, setAbsenceForm] = useState({
    id: null,
    team_id: appState.teams[3]?.id || appState.teams[0]?.id || "",
    member: "", // "" = Dupla toda, or specific member name (e.g. "Welliton")
    substitute_member: "", // Optional substitute during absence
    kind: "ferias",
    start_date: "2026-11-17",
    end_date: "2026-11-21",
    note: "",
  });

  // ---------------------------------------------------------------------------
  // Tab 5: Serviços e Diárias State
  // ---------------------------------------------------------------------------
  const [adminServiceForm, setAdminServiceForm] = useState({
    date: "2026-11-21",
    team_id: appState.teams[0]?.id || "",
    employeesText: appState.teams[0]?.name || "",
    category: "Ordem de Serviço / Campo",
    client: "",
    protocol: "",
    notes: "",
  });

  // ---------------------------------------------------------------------------
  // Tab 6: Cores State
  // ---------------------------------------------------------------------------
  const [colorDraft, setColorDraft] = useState({
    color_trabalha: appState.settings.color_trabalha || LIVE_COLORS.trabalha,
    color_folga: appState.settings.color_folga || LIVE_COLORS.folga,
    color_plantao_domingo:
      appState.settings.color_plantao_domingo || LIVE_COLORS.plantao_domingo,
    color_plantao_feriado:
      appState.settings.color_plantao_feriado || LIVE_COLORS.plantao_feriado,
    color_troca: appState.settings.color_troca || LIVE_COLORS.troca,
    color_feriado: appState.settings.color_feriado || LIVE_COLORS.feriado,
    color_alteracao: appState.settings.color_alteracao || LIVE_COLORS.alteracao,
    color_ferias: appState.settings.color_ferias || LIVE_COLORS.ferias,
  });

  // ---------------------------------------------------------------------------
  // Tab 7: Relatórios State (Smart Multi-Dimension Filters)
  // ---------------------------------------------------------------------------
  const [reportPeriodMode, setReportPeriodMode] = useState("mes"); // "mes" | "ano" | "custom"
  const [reportMonth, setReportMonth] = useState("2026-11");
  const [reportYear, setReportYear] = useState("2026");
  const [reportCustomStart, setReportCustomStart] = useState("2026-11-01");
  const [reportCustomEnd, setReportCustomEnd] = useState("2026-11-30");

  const [reportSearch, setReportSearch] = useState("");
  const [reportTeamFilter, setReportTeamFilter] = useState("all");
  const [reportGroupFilter, setReportGroupFilter] = useState("all"); // "all" | "A" | "B" | "campo" | "atendimento"
  const [reportEventFilter, setReportEventFilter] = useState("all"); // "all" | "com_ocorrencia" | "com_adicional" | "com_plantao" | "com_ferias"
  const [reportSortBy, setReportSortBy] = useState("padrao"); // "padrao" | "mais_trabalhados" | "mais_plantoes" | "maior_valor" | "nome"

  // ---------------------------------------------------------------------------
  // Tab 8: Segurança e Publicação Online State
  // ---------------------------------------------------------------------------
  const [credForm, setCredForm] = useState(() => getAdminCredentials());
  const [ghConfig, setGhConfig] = useState(() => getGitHubSyncConfig());
  const [publishing, setPublishing] = useState(false);

  async function handlePublishToGitHub() {
    if (!ghConfig.token) {
      setActiveTab("seguranca");
      notify?.(
        "Informe seu Token do GitHub na aba 'Segurança e Publicação' para publicar online para todos!",
        "error"
      );
      return;
    }
    try {
      setPublishing(true);
      await publishStateToGitHub(appState, ghConfig);
      notify?.(
        "Escala publicada no GitHub! Todos que abrirem o link verão os novos dados."
      );
    } catch (err) {
      notify?.(err.message || "Falha ao publicar no GitHub.", "error");
    } finally {
      setPublishing(false);
    }
  }

  function handleSaveCredentials(e) {
    e.preventDefault();
    if (!credForm.password || credForm.password.length < 3) {
      notify?.("A senha precisa ter pelo menos 3 caracteres.", "error");
      return;
    }
    saveAdminCredentials(credForm);
    notify?.("Credenciais de Administrador atualizadas!");
  }

  function handleSaveGhConfig(e) {
    e.preventDefault();
    saveGitHubSyncConfig(ghConfig);
    notify?.("Configuração do GitHub salva neste navegador!");
  }

  const activeTeams = useMemo(
    () =>
      [...appState.teams]
        .filter((t) => t.active !== false)
        .sort((a, b) =>
          a.kind === b.kind ? a.order - b.order : a.kind === "campo" ? -1 : 1
        ),
    [appState.teams]
  );

  // All individual employee names across all active teams
  const allEmployeesList = useMemo(() => {
    const list = [];
    for (const t of activeTeams) {
      const members = t.members?.length
        ? t.members
        : t.name.split("/").map((s) => s.trim()).filter(Boolean);
      for (const m of members) {
        if (!list.some((x) => x.name === m)) {
          list.push({ name: m, teamId: t.id, teamName: t.name, kind: t.kind });
        }
      }
    }
    return list;
  }, [activeTeams]);

  function getTeamMembersList(teamId) {
    const t = appState.teams.find((x) => x.id === teamId);
    if (!t) return [];
    return t.members?.length
      ? t.members
      : t.name.split("/").map((s) => s.trim()).filter(Boolean);
  }

  // Compute Sundays of mateusFolgaMonth
  const sundaysInFolgaMonth = useMemo(() => {
    const { firstDay, lastDay } = getMonthRange(mateusFolgaMonth);
    const days = listDaysInRange(firstDay, lastDay);
    return days.filter((d) => getWeekday(d) === 0);
  }, [mateusFolgaMonth]);

  // Compute report data for selected period (Month, Full Year, or Custom Date Range)
  const reportPeriodInfo = useMemo(() => {
    if (reportPeriodMode === "ano") {
      return {
        startIso: `${reportYear}-01-01`,
        endIso: `${reportYear}-12-31`,
        title: `Ano de ${reportYear} (Jan a Dez)`,
        fileSlug: `anual-${reportYear}`,
      };
    }
    if (reportPeriodMode === "custom") {
      const s =
        reportCustomStart <= reportCustomEnd
          ? reportCustomStart
          : reportCustomEnd;
      const e =
        reportCustomEnd >= reportCustomStart
          ? reportCustomEnd
          : reportCustomStart;
      return {
        startIso: s,
        endIso: e,
        title: `${formatShortDate(s)} a ${formatShortDate(e)}`,
        fileSlug: `${s}_a_${e}`,
      };
    }
    const { firstDay, lastDay } = getMonthRange(reportMonth);
    return {
      startIso: firstDay,
      endIso: lastDay,
      title: formatMonthTitle(reportMonth),
      fileSlug: reportMonth,
    };
  }, [
    reportPeriodMode,
    reportMonth,
    reportYear,
    reportCustomStart,
    reportCustomEnd,
  ]);

  const reportCalendar = useMemo(() => {
    return buildCalendar({
      startIso: reportPeriodInfo.startIso,
      endIso: reportPeriodInfo.endIso,
      settings: appState.settings,
      teams: appState.teams,
      holidays: appState.holidays,
      overrides: appState.overrides,
      absences: appState.absences,
      weekOverrides: appState.weekOverrides,
      dutyOverrides: appState.dutyOverrides,
    });
  }, [reportPeriodInfo, appState]);

  const monthlyReport = useMemo(
    () => buildMonthlyReport(reportCalendar, appState.teams),
    [reportCalendar, appState.teams]
  );

  const employeeReport = useMemo(
    () =>
      buildEmployeeWorkdaySummary(
        reportCalendar,
        appState.teams,
        appState.services || []
      ),
    [reportCalendar, appState.teams, appState.services]
  );

  // Filtered & Sorted Team rows
  const filteredTeamRows = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    return monthlyReport.rows.filter((r) => {
      const t = r.team;
      if (reportTeamFilter !== "all" && t.id !== reportTeamFilter) return false;
      if (reportGroupFilter === "A" && t.group !== "A") return false;
      if (reportGroupFilter === "B" && t.group !== "B") return false;
      if (reportGroupFilter === "campo" && t.kind !== "campo") return false;
      if (reportGroupFilter === "atendimento" && t.kind !== "atendimento")
        return false;
      if (reportEventFilter === "com_plantao" && r.plantao_domingo + r.plantao_feriado + r.troca === 0)
        return false;
      if (reportEventFilter === "com_ferias" && r.ferias + r.ausencia === 0)
        return false;
      if (q && !t.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [
    monthlyReport.rows,
    reportTeamFilter,
    reportGroupFilter,
    reportEventFilter,
    reportSearch,
  ]);

  // Filtered & Sorted Employee rows
  const filteredEmployeeReport = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    const rNorm = Number(appState.settings.rate_dia_normal ?? 0);
    const rDom = Number(appState.settings.rate_plantao_domingo ?? 150);
    const rFer = Number(appState.settings.rate_plantao_feriado ?? 180);
    const rAdd = Number(appState.settings.rate_dia_adicional ?? 150);

    const list = employeeReport.filter((emp) => {
      if (reportTeamFilter !== "all" && emp.teamId !== reportTeamFilter)
        return false;
      if (reportGroupFilter === "A" && emp.group !== "A") return false;
      if (reportGroupFilter === "B" && emp.group !== "B") return false;
      if (reportGroupFilter === "campo" && emp.kind !== "campo") return false;
      if (reportGroupFilter === "atendimento" && emp.kind !== "atendimento")
        return false;

      if (
        reportEventFilter === "com_ocorrencia" &&
        (!emp.occurrences || emp.occurrences.length === 0)
      )
        return false;
      if (reportEventFilter === "com_adicional" && emp.diasAdicionais === 0)
        return false;
      if (
        reportEventFilter === "com_plantao" &&
        emp.plantoesDomingo + emp.plantoesFeriado === 0
      )
        return false;
      if (reportEventFilter === "com_ferias" && emp.feriasAusencias === 0)
        return false;

      if (q) {
        const matchName = emp.name.toLowerCase().includes(q);
        const matchTeam = emp.teamName.toLowerCase().includes(q);
        const matchOcc = (emp.occurrences || []).some(
          (o) =>
            o.badge?.toLowerCase().includes(q) ||
            o.description?.toLowerCase().includes(q)
        );
        if (!matchName && !matchTeam && !matchOcc) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (reportSortBy === "mais_trabalhados") {
        return b.totalTrabalhado - a.totalTrabalhado;
      }
      if (reportSortBy === "mais_plantoes") {
        return (
          b.plantoesDomingo +
          b.plantoesFeriado +
          b.diasAdicionais -
          (a.plantoesDomingo + a.plantoesFeriado + a.diasAdicionais)
        );
      }
      if (reportSortBy === "maior_valor") {
        const valA =
          a.diasNormais * rNorm +
          a.plantoesDomingo * rDom +
          a.plantoesFeriado * rFer +
          a.diasAdicionais * rAdd;
        const valB =
          b.diasNormais * rNorm +
          b.plantoesDomingo * rDom +
          b.plantoesFeriado * rFer +
          b.diasAdicionais * rAdd;
        return valB - valA;
      }
      if (reportSortBy === "nome") {
        return a.name.localeCompare(b.name);
      }
      if (a.kind !== b.kind) return a.kind === "campo" ? -1 : 1;
      return b.totalTrabalhado - a.totalTrabalhado || a.name.localeCompare(b.name);
    });
  }, [
    employeeReport,
    reportTeamFilter,
    reportGroupFilter,
    reportEventFilter,
    reportSearch,
    reportSortBy,
    appState.settings,
  ]);

  // Filtered Duties
  const filteredDuties = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    return monthlyReport.duties.filter((d) => {
      if (reportTeamFilter !== "all" && d.team_id !== reportTeamFilter)
        return false;
      if (reportGroupFilter !== "all") {
        const t = appState.teams.find((x) => x.id === d.team_id);
        if (t) {
          if (reportGroupFilter === "A" && t.group !== "A") return false;
          if (reportGroupFilter === "B" && t.group !== "B") return false;
          if (reportGroupFilter === "campo" && t.kind !== "campo") return false;
          if (reportGroupFilter === "atendimento" && t.kind !== "atendimento")
            return false;
        }
      }
      if (
        q &&
        !(d.label || "").toLowerCase().includes(q) &&
        !(d.kind || "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [
    monthlyReport.duties,
    reportTeamFilter,
    reportGroupFilter,
    reportSearch,
    appState.teams,
  ]);

  // ===========================================================================
  // Handlers: Tab 1 (Escala)
  // ===========================================================================
  function handleSaveRotationSettings(e) {
    e.preventDefault();
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        schedule_anchor: getMondayOfWeek(anchorDate),
        anchor_group: anchorGroup,
        rotation_start: rotationStart,
        mateus_name: mateusName.trim() || "Mateus",
      },
    }));
    notify?.("Configuração do rodízio salva!");
  }

  function handleWeekOverride(direction) {
    const monday = getMondayOfWeek(invertWeekDate);
    setAppState((prev) => {
      const filtered = (prev.weekOverrides || []).filter(
        (w) => getMondayOfWeek(w.week_start) !== monday
      );
      if (direction === "inverter") {
        filtered.push({ week_start: monday, direction: "inverter" });
      }
      return { ...prev, weekOverrides: filtered };
    });
    notify?.(
      direction === "inverter"
        ? `Semana de ${formatShortDate(monday)} invertida!`
        : `Semana de ${formatShortDate(monday)} voltou ao cálculo automático!`
    );
  }

  function handleSetSundayDuty(isAuto = false) {
    if (getWeekday(sundayDutyDate) !== 0) {
      notify?.("A data escolhida precisa ser um domingo!", "error");
      return;
    }
    const targetTeam = appState.teams.find((t) => t.id === sundayDutyTeamId);
    const kind = targetTeam?.kind === "atendimento" ? "atendimento" : "campo";

    setAppState((prev) => {
      const filtered = (prev.dutyOverrides || []).filter(
        (d) => !(d.date === sundayDutyDate && d.kind === kind)
      );
      if (!isAuto && targetTeam) {
        filtered.push({
          date: sundayDutyDate,
          kind,
          team_id: targetTeam.id,
        });
      }
      return { ...prev, dutyOverrides: filtered };
    });
    notify?.(
      isAuto
        ? `Plantão de ${formatShortDate(sundayDutyDate)} voltou ao automático.`
        : `Plantão de ${formatShortDate(sundayDutyDate)} definido para ${targetTeam?.name}.`
    );
  }

  function handleSaveMateusFolga(resetToFirst = false) {
    setAppState((prev) => {
      const existing = (prev.settings.mateus_folga_dates || []).filter(
        (d) => !d.startsWith(mateusFolgaMonth)
      );
      if (!resetToFirst && mateusFolgaSunday) {
        existing.push(mateusFolgaSunday);
      }
      return {
        ...prev,
        settings: {
          ...prev.settings,
          mateus_folga_dates: existing,
        },
      };
    });
    notify?.(
      resetToFirst
        ? `Folga do ${mateusName} voltou para o 1º domingo do mês.`
        : `Domingo de folga do ${mateusName} salvo em ${formatShortDate(
            mateusFolgaSunday
          )}!`
    );
  }

  // ===========================================================================
  // Handlers: Tab 2 (Equipes)
  // ===========================================================================
  function handleUpdateTeamRow(teamId, field, value) {
    setAppState((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => {
        if (t.id !== teamId) return t;
        const updated = { ...t, [field]: value };
        if (field === "name") {
          updated.members = String(value)
            .split("/")
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return updated;
      }),
    }));
  }

  function handleDeleteTeam(teamId) {
    setAppState((prev) => ({
      ...prev,
      teams: prev.teams.filter((t) => t.id !== teamId),
    }));
    notify?.("Equipe removida.");
  }

  function handleAddTeam(e) {
    e.preventDefault();
    if (!newTeam.name.trim()) {
      notify?.("Informe o nome da equipe ou dupla.", "error");
      return;
    }
    const created = {
      id: `team-${Date.now()}`,
      name: newTeam.name.trim(),
      kind: newTeam.kind,
      group: newTeam.group,
      order: Number(newTeam.order) || 1,
      active: true,
      members: newTeam.name
        .split("/")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    setAppState((prev) => ({
      ...prev,
      teams: [...prev.teams, created],
    }));
    setNewTeam((prev) => ({ ...prev, name: "", order: prev.order + 1 }));
    notify?.(`Equipe "${created.name}" adicionada!`);
  }

  // ===========================================================================
  // Handlers: Tab 3 (Feriados)
  // ===========================================================================
  function handleAddHoliday(e) {
    e.preventDefault();
    if (!newHoliday.name.trim() || !newHoliday.date) {
      notify?.("Preencha a data e o nome do feriado.", "error");
      return;
    }
    setAppState((prev) => {
      const filtered = prev.holidays.filter((h) => h.date !== newHoliday.date);
      return {
        ...prev,
        holidays: [
          ...filtered,
          {
            id: `hol-${newHoliday.date}`,
            date: newHoliday.date,
            name: newHoliday.name.trim(),
            type: newHoliday.type,
          },
        ],
      };
    });
    setNewHoliday((prev) => ({ ...prev, name: "" }));
    notify?.("Feriado adicionado!");
  }

  function handleImportNationalHolidays() {
    const generated = generateBrazilianHolidaysForYear(importYear);
    setAppState((prev) => {
      const existingByDate = {};
      for (const h of prev.holidays) existingByDate[h.date] = h;
      for (const g of generated) existingByDate[g.date] = g;
      return {
        ...prev,
        holidays: Object.values(existingByDate),
      };
    });
    notify?.(
      `${generated.length} feriados (Nacionais, SP e Espírito Santo do Pinhal) de ${importYear} importados!`
    );
  }

  function handleDeleteHoliday(date) {
    setAppState((prev) => ({
      ...prev,
      holidays: prev.holidays.filter((h) => h.date !== date),
    }));
    notify?.("Feriado removido.");
  }

  // ===========================================================================
  // Handlers: Tab 4 (Trocas e Ajustes - Smart Individual & Team Swaps + Edit)
  // ===========================================================================
  function computeAutoSwapLabel(teamId, memberOut, memberIn, manualCustom) {
    if (manualCustom && manualCustom.trim()) return manualCustom.trim();
    const members = getTeamMembersList(teamId);
    if (!memberOut) {
      return memberIn ? memberIn : members.join(" / ");
    }
    const updated = members
      .map((m) => (m === memberOut ? memberIn || `${m} (Folga)` : m))
      .filter(Boolean);
    return updated.join(" / ");
  }

  function handleSaveTrocaPlantao(e) {
    e.preventDefault();
    const targetTeam = appState.teams.find(
      (t) => t.id === trocaPlantaoForm.team_id
    );
    if (!targetTeam) return;

    const autoLabel = computeAutoSwapLabel(
      trocaPlantaoForm.team_id,
      trocaPlantaoForm.member_out,
      trocaPlantaoForm.member_in,
      trocaPlantaoForm.custom_name
    );

    const autoNote =
      trocaPlantaoForm.note?.trim() ||
      (trocaPlantaoForm.member_out
        ? `Troca individual: ${trocaPlantaoForm.member_out} saiu${
            trocaPlantaoForm.member_in
              ? `, ${trocaPlantaoForm.member_in} cobriu`
              : ""
          }`
        : "Troca de plantão");

    setAppState((prev) => {
      const filtered = prev.overrides.filter((o) =>
        trocaPlantaoForm.id
          ? o.id !== trocaPlantaoForm.id
          : !(
              o.date === trocaPlantaoForm.date &&
              o.team_id === trocaPlantaoForm.team_id
            )
      );
      filtered.push({
        id: trocaPlantaoForm.id || `ovr-${Date.now()}`,
        date: trocaPlantaoForm.date,
        team_id: trocaPlantaoForm.team_id,
        status: "troca",
        member_out: trocaPlantaoForm.member_out || null,
        member_in: trocaPlantaoForm.member_in || null,
        custom_name: autoLabel,
        note: autoNote,
      });
      return { ...prev, overrides: filtered };
    });
    setTrocaPlantaoForm((prev) => ({
      ...prev,
      id: null,
      member_out: "",
      member_in: "",
      custom_name: "",
      note: "",
    }));
    notify?.("Troca de plantão salva com sucesso!");
  }

  function handleSwapDayBetweenTwoTeams(e) {
    e.preventDefault();
    const { date, team1_id, team2_id } = swapDayTeamsForm;
    if (team1_id === team2_id) {
      notify?.("Selecione duas equipes diferentes para trocar.", "error");
      return;
    }
    const cal = buildCalendar({
      startIso: date,
      endIso: date,
      settings: appState.settings,
      teams: appState.teams,
      holidays: appState.holidays,
      overrides: appState.overrides,
      absences: appState.absences,
      weekOverrides: appState.weekOverrides,
      dutyOverrides: appState.dutyOverrides,
    });
    const dayInfo = cal.days[date];
    const st1 = dayInfo?.teams?.[team1_id]?.status || "folga";
    const st2 = dayInfo?.teams?.[team2_id]?.status || "folga";

    const t1 = appState.teams.find((t) => t.id === team1_id);
    const t2 = appState.teams.find((t) => t.id === team2_id);

    setAppState((prev) => {
      const filtered = prev.overrides.filter(
        (o) =>
          !(o.date === date && (o.team_id === team1_id || o.team_id === team2_id))
      );
      filtered.push(
        {
          id: `ovr-${Date.now()}-1`,
          date,
          team_id: team1_id,
          status: st2 === "trabalha" ? "alteracao" : st2,
          note: `Troca de dia com ${t2?.name}`,
        },
        {
          id: `ovr-${Date.now()}-2`,
          date,
          team_id: team2_id,
          status: st1 === "trabalha" ? "alteracao" : st1,
          note: `Troca de dia com ${t1?.name}`,
        }
      );
      return { ...prev, overrides: filtered };
    });
    notify?.(`Dia ${formatShortDate(date)} trocado entre ${t1?.name} e ${t2?.name}!`);
  }

  function handleSwapDutiesBetweenDates(e) {
    e.preventDefault();
    const { date1, date2 } = swapDutiesForm;
    if (date1 === date2) {
      notify?.("Escolha duas datas distintas.", "error");
      return;
    }
    const cal1 = buildCalendar({
      startIso: date1,
      endIso: date1,
      settings: appState.settings,
      teams: appState.teams,
      holidays: appState.holidays,
      overrides: appState.overrides,
      absences: appState.absences,
      weekOverrides: appState.weekOverrides,
      dutyOverrides: appState.dutyOverrides,
    });
    const cal2 = buildCalendar({
      startIso: date2,
      endIso: date2,
      settings: appState.settings,
      teams: appState.teams,
      holidays: appState.holidays,
      overrides: appState.overrides,
      absences: appState.absences,
      weekOverrides: appState.weekOverrides,
      dutyOverrides: appState.dutyOverrides,
    });

    const team1 = cal1.days[date1]?.campo_team_id;
    const team2 = cal2.days[date2]?.campo_team_id;

    if (!team1 || !team2) {
      notify?.("Ambas as datas precisam ter plantão de campo atribuído.", "error");
      return;
    }

    const kind1 = getWeekday(date1) === 0 ? "campo" : "holiday";
    const kind2 = getWeekday(date2) === 0 ? "campo" : "holiday";

    setAppState((prev) => {
      const filtered = (prev.dutyOverrides || []).filter(
        (d) =>
          !(
            (d.date === date1 && d.kind === kind1) ||
            (d.date === date2 && d.kind === kind2)
          )
      );
      filtered.push(
        { date: date1, kind: kind1, team_id: team2 },
        { date: date2, kind: kind2, team_id: team1 }
      );
      return { ...prev, dutyOverrides: filtered };
    });
    notify?.(
      `Plantões trocados entre ${formatShortDate(date1)} e ${formatShortDate(
        date2
      )}!`
    );
  }

  function handleSavePointOverride(e) {
    e.preventDefault();
    const isEditing = Boolean(pointOverrideForm.id);
    const members = getTeamMembersList(pointOverrideForm.team_id);
    let computedCustom = pointOverrideForm.custom_name?.trim() || null;

    if (!computedCustom && pointOverrideForm.member) {
      const otherMembers = members.filter((m) => m !== pointOverrideForm.member);
      if (pointOverrideForm.member_in) {
        computedCustom = [...otherMembers, pointOverrideForm.member_in].join(" / ");
      } else {
        computedCustom = `${pointOverrideForm.member} (${
          STATUS_META[pointOverrideForm.status]?.short || pointOverrideForm.status
        })${otherMembers.length ? ` · ${otherMembers.join("/")} normal` : ""}`;
      }
    }

    setAppState((prev) => {
      const filtered = prev.overrides.filter((o) => {
        if (isEditing && o.id === pointOverrideForm.id) return false;
        // Also remove any legacy twin override on the same date that shares the same swap/custom_name
        if (
          isEditing &&
          o.date === pointOverrideForm.date &&
          o.status === "troca" &&
          pointOverrideForm.status === "troca"
        ) {
          return false;
        }
        return !(
          !isEditing &&
          o.date === pointOverrideForm.date &&
          o.team_id === pointOverrideForm.team_id &&
          (o.member || "") === (pointOverrideForm.member || "")
        );
      });
      filtered.push({
        id: pointOverrideForm.id || `ovr-${Date.now()}`,
        date: pointOverrideForm.date,
        team_id: pointOverrideForm.team_id,
        member: pointOverrideForm.member || null,
        member_out:
          pointOverrideForm.status === "troca" && pointOverrideForm.member
            ? pointOverrideForm.member
            : null,
        member_in: pointOverrideForm.member_in || null,
        status: pointOverrideForm.status,
        custom_name: computedCustom,
        note: pointOverrideForm.note?.trim() || null,
      });
      return { ...prev, overrides: filtered };
    });
    setPointOverrideForm((prev) => ({
      ...prev,
      id: null,
      member: "",
      member_in: "",
      custom_name: "",
      note: "",
    }));
    notify?.(isEditing ? "Ajuste atualizado!" : "Ajuste pontual salvo!");
  }

  function handleEditOverride(ovr) {
    setPointOverrideForm({
      id: ovr.id,
      team_id: ovr.team_id,
      member: ovr.member || ovr.member_out || "",
      member_in: ovr.member_in || "",
      date: ovr.date,
      status: ovr.status,
      custom_name: ovr.custom_name || "",
      note: ovr.note || "",
    });
    notify?.("Editando ajuste selecionado no formulário acima.");
  }

  function handleDeleteOverride(id) {
    setAppState((prev) => ({
      ...prev,
      overrides: prev.overrides.filter((o) => o.id !== id),
    }));
    if (pointOverrideForm.id === id) {
      setPointOverrideForm((prev) => ({ ...prev, id: null }));
    }
    notify?.("Ajuste removido.");
  }

  function handleSaveAbsence(e) {
    e.preventDefault();
    if (absenceForm.end_date < absenceForm.start_date) {
      notify?.("A data final deve ser igual ou posterior à data inicial.", "error");
      return;
    }
    const isEditing = Boolean(absenceForm.id);
    setAppState((prev) => {
      const filtered = isEditing
        ? prev.absences.filter((a) => a.id !== absenceForm.id)
        : [...prev.absences];
      filtered.push({
        id: absenceForm.id || `abs-${Date.now()}`,
        team_id: absenceForm.team_id,
        member: absenceForm.member || null,
        substitute_member: absenceForm.substitute_member || null,
        kind: absenceForm.kind,
        start_date: absenceForm.start_date,
        end_date: absenceForm.end_date,
        note: absenceForm.note?.trim() || null,
      });
      return {
        ...prev,
        absences: filtered,
      };
    });
    setAbsenceForm((prev) => ({
      ...prev,
      id: null,
      member: "",
      substitute_member: "",
      note: "",
    }));
    notify?.(
      isEditing
        ? "Férias/ausência atualizada com sucesso!"
        : "Período de férias/ausência cadastrado!"
    );
  }

  function handleEditAbsence(abs) {
    setAbsenceForm({
      id: abs.id,
      team_id: abs.team_id,
      member: abs.member || "",
      substitute_member: abs.substitute_member || "",
      kind: abs.kind,
      start_date: abs.start_date,
      end_date: abs.end_date,
      note: abs.note || "",
    });
    notify?.("Editando férias/ausência selecionada.");
  }

  function handleDeleteAbsence(id) {
    setAppState((prev) => ({
      ...prev,
      absences: prev.absences.filter((a) => a.id !== id),
    }));
    if (absenceForm.id === id) {
      setAbsenceForm((prev) => ({ ...prev, id: null }));
    }
    notify?.("Férias/ausência removida.");
  }

  // ===========================================================================
  // Handlers: Tab 5 (Serviços)
  // ===========================================================================
  function handleAdminAddService(e) {
    e.preventDefault();
    if (!adminServiceForm.client.trim() && !adminServiceForm.notes.trim()) {
      notify?.("Informe o cliente ou descrição do serviço.", "error");
      return;
    }
    const employees = adminServiceForm.employeesText
      .split(/[\/,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    setAppState((prev) => ({
      ...prev,
      services: [
        {
          id: `srv-${Date.now()}`,
          date: adminServiceForm.date,
          team_id: adminServiceForm.team_id,
          employees,
          category: adminServiceForm.category,
          client: adminServiceForm.client.trim() || "Serviço Operacional",
          protocol: adminServiceForm.protocol.trim(),
          status: "concluido",
          notes: adminServiceForm.notes.trim(),
        },
        ...(prev.services || []),
      ],
    }));
    setAdminServiceForm((prev) => ({
      ...prev,
      client: "",
      protocol: "",
      notes: "",
    }));
    notify?.("Serviço adicionado ao histórico!");
  }

  // ===========================================================================
  // Handlers: Tab 6 (Cores)
  // ===========================================================================
  function handleSaveColors(e) {
    e.preventDefault();
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...colorDraft,
      },
    }));
    notify?.("Cores do calendário atualizadas!");
  }

  function handleRestoreLiveColors() {
    const next = {
      color_trabalha: LIVE_COLORS.trabalha,
      color_folga: LIVE_COLORS.folga,
      color_plantao_domingo: LIVE_COLORS.plantao_domingo,
      color_plantao_feriado: LIVE_COLORS.plantao_feriado,
      color_troca: LIVE_COLORS.troca,
      color_feriado: LIVE_COLORS.feriado,
      color_alteracao: LIVE_COLORS.alteracao,
      color_ferias: LIVE_COLORS.ferias,
    };
    setColorDraft(next);
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...next,
      },
    }));
    notify?.("Cores restauradas para o padrão da Escala Operacional!");
  }

  // ===========================================================================
  // Handlers: Tab 7 (Export Excel / CSV / Backup JSON)
  // ===========================================================================
  function handleExportEmployeeExcelNoValues() {
    // Build a styled Excel (.xls) workbook with the exact visual layout & colors of the Relatório Individual por Funcionário table, WITHOUT financial values (R$)
    const escapeHtml = (str) =>
      String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const rowsHtml = filteredEmployeeReport
      .map((emp) => {
        const cleanBadge = (b) => String(b || "").replace(/\s*\(\+R\$\)/g, "");
        const occHtml =
          emp.occurrences && emp.occurrences.length > 0
            ? emp.occurrences
                .map((occ) => {
                  const dt = formatShortDate(occ.date).slice(0, 5);
                  const bLabel = cleanBadge(occ.badge);
                  let bBg = "#EBEBE6";
                  let bFg = "#42474F";
                  if (occ.color === "domingo") {
                    bBg = "#FFEDD5";
                    bFg = "#C2410C";
                  } else if (occ.color === "feriado") {
                    bBg = "#EDE9FE";
                    bFg = "#6D28D9";
                  } else if (occ.color === "adicional") {
                    bBg = "#DBEAFE";
                    bFg = "#1D4ED8";
                  } else if (
                    occ.color === "ferias" ||
                    occ.color === "ausencia"
                  ) {
                    bBg = "#FEF08A";
                    bFg = "#854D0E";
                  }
                  return `<div style="margin-bottom:4px; padding:4px 6px; background:#FBFAF7; border:1px solid #EBEBE6;">
                    <b style="font-family:Consolas,monospace; color:#14181F;">${escapeHtml(
                      dt
                    )}</b>
                    <span style="background:${bBg}; color:${bFg}; font-weight:bold; padding:1px 5px; font-size:10px;">[${escapeHtml(
                    bLabel
                  )}]</span>
                    <span style="color:#42474F;"> ${escapeHtml(
                      occ.description
                    )}</span>
                  </div>`;
                })
                .join("<br style='mso-data-placement:same-cell;' />")
            : `<span style="color:#A3A8B1;">Sem ocorrências extras no período</span>`;

        return `<tr>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; vertical-align:top;">
            <div style="font-weight:bold; color:#14181F; font-size:13px;">${escapeHtml(
              emp.name
            )}</div>
            <div style="color:#8A8F98; font-size:11px;">${escapeHtml(
              emp.teamName
            )} (Grp ${escapeHtml(emp.group)})</div>
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center; vertical-align:top; font-weight:600; color:#14181F;">
            ${emp.diasNormais}
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center; vertical-align:top; font-weight:bold; color:${
            emp.plantoesDomingo > 0 ? "#C2410C" : "#A3A8B1"
          }; background:${emp.plantoesDomingo > 0 ? "#FFF7ED" : "#FFFFFF"};">
            ${emp.plantoesDomingo}
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center; vertical-align:top; font-weight:bold; color:${
            emp.plantoesFeriado > 0 ? "#6D28D9" : "#A3A8B1"
          }; background:${emp.plantoesFeriado > 0 ? "#F5F3FF" : "#FFFFFF"};">
            ${emp.plantoesFeriado}
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center; vertical-align:top; font-weight:bold; color:${
            emp.diasAdicionais > 0 ? "#1D4ED8" : "#A3A8B1"
          }; background:${emp.diasAdicionais > 0 ? "#EFF6FF" : "#FFFFFF"};">
            ${emp.diasAdicionais > 0 ? `+${emp.diasAdicionais}` : "0"}
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center; vertical-align:top; font-weight:bold; color:${
            emp.feriasAusencias > 0 ? "#854D0E" : "#A3A8B1"
          }; background:${emp.feriasAusencias > 0 ? "#FEFCE8" : "#FFFFFF"};">
            ${emp.feriasAusencias > 0 ? `${emp.feriasAusencias}d` : "0"}
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center; vertical-align:top; color:#6B7280;">
            ${emp.folgas}
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; vertical-align:top; font-size:11.5px; width:420px;">
            ${occHtml}
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:right; vertical-align:top; font-weight:bold; color:#065F46; background:#ECFDF5;">
            ${emp.totalTrabalhado} dias
          </td>
        </tr>`;
      })
      .join("");

    const excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Relatorio Funcionarios</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body style="font-family: Inter, Calibri, Arial, sans-serif;">
        <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse; width:100%;">
          <tr>
            <td colspan="9" style="padding:12px 8px; font-size:16px; font-weight:bold; color:#14181F; background:#FBFAF7; border-bottom:2px solid #14181F;">
              Relatório Individual por Funcionário — ${escapeHtml(
                reportPeriodInfo.title
              )} (${filteredEmployeeReport.length})
            </td>
          </tr>
          <tr style="background:#F3F2ED; color:#8A8F98; font-size:10.5px; font-weight:bold; text-transform:uppercase;">
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:left;">FUNCIONÁRIO</th>
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center;">NORMAIS</th>
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center;">PLANTÃO DOM.</th>
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center;">PLANTÃO FER.</th>
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center;">DIA ADICIONAL</th>
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center;">FÉRIAS/AUS.</th>
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center;">FOLGAS</th>
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:left;">HISTÓRICO E DESCRIÇÕES (FÉRIAS, TROCAS, ADICIONAIS E OBS.)</th>
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:right;">TOTAL TRABALHADO</th>
          </tr>
          ${rowsHtml}
        </table>
      </body>
    </html>`;

    const blob = new Blob(["\uFEFF" + excelHtml], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-funcionarios-${reportPeriodInfo.fileSlug}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    notify?.(
      `Excel (sem valores R$) exportado: relatorio-funcionarios-${reportPeriodInfo.fileSlug}.xls!`
    );
  }

  function handleExportDutiesAndHolidaysExcel() {
    const escapeHtml = (str) =>
      String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    // 1. Employees who worked at least 1 Sunday Duty, Holiday Duty, or Additional Off-day Coverage
    const dutyEmployees = filteredEmployeeReport.filter(
      (emp) =>
        emp.plantoesDomingo + emp.plantoesFeriado + emp.diasAdicionais > 0
    );

    const empRowsHtml = dutyEmployees
      .map((emp) => {
        const cleanBadge = (b) => String(b || "").replace(/\s*\(\+R\$\)/g, "");
        const dutyOccurrences = (emp.occurrences || []).filter((occ) =>
          ["domingo", "feriado", "adicional"].includes(occ.color)
        );
        const occHtml =
          dutyOccurrences.length > 0
            ? dutyOccurrences
                .map((occ) => {
                  const dt = formatShortDate(occ.date).slice(0, 5);
                  const bLabel = cleanBadge(occ.badge);
                  let bBg = "#EBEBE6";
                  let bFg = "#42474F";
                  if (occ.color === "domingo") {
                    bBg = "#FFEDD5";
                    bFg = "#C2410C";
                  } else if (occ.color === "feriado") {
                    bBg = "#EDE9FE";
                    bFg = "#6D28D9";
                  } else if (occ.color === "adicional") {
                    bBg = "#DBEAFE";
                    bFg = "#1D4ED8";
                  }
                  return `<div style="margin-bottom:4px; padding:4px 6px; background:#FBFAF7; border:1px solid #EBEBE6;">
                    <b style="font-family:Consolas,monospace; color:#14181F;">${escapeHtml(
                      dt
                    )}</b>
                    <span style="background:${bBg}; color:${bFg}; font-weight:bold; padding:1px 5px; font-size:10px;">[${escapeHtml(
                    bLabel
                  )}]</span>
                    <span style="color:#42474F;"> ${escapeHtml(
                      occ.description
                    )}</span>
                  </div>`;
                })
                .join("<br style='mso-data-placement:same-cell;' />")
            : `<span style="color:#A3A8B1;">-</span>`;

        const totalExtras =
          emp.plantoesDomingo + emp.plantoesFeriado + emp.diasAdicionais;

        return `<tr>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; vertical-align:top;">
            <div style="font-weight:bold; color:#14181F; font-size:13px;">${escapeHtml(
              emp.name
            )}</div>
            <div style="color:#8A8F98; font-size:11px;">${escapeHtml(
              emp.teamName
            )} (Grp ${escapeHtml(emp.group)})</div>
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center; vertical-align:top; font-weight:bold; color:${
            emp.plantoesDomingo > 0 ? "#C2410C" : "#A3A8B1"
          }; background:${emp.plantoesDomingo > 0 ? "#FFF7ED" : "#FFFFFF"};">
            ${emp.plantoesDomingo}
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center; vertical-align:top; font-weight:bold; color:${
            emp.plantoesFeriado > 0 ? "#6D28D9" : "#A3A8B1"
          }; background:${emp.plantoesFeriado > 0 ? "#F5F3FF" : "#FFFFFF"};">
            ${emp.plantoesFeriado}
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center; vertical-align:top; font-weight:bold; color:${
            emp.diasAdicionais > 0 ? "#1D4ED8" : "#A3A8B1"
          }; background:${emp.diasAdicionais > 0 ? "#EFF6FF" : "#FFFFFF"};">
            ${emp.diasAdicionais > 0 ? `+${emp.diasAdicionais}` : "0"}
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; vertical-align:top; font-size:11.5px; width:440px;">
            ${occHtml}
          </td>
          <td style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:right; vertical-align:top; font-weight:bold; color:#065F46; background:#ECFDF5;">
            ${totalExtras} ${totalExtras === 1 ? "plantão" : "plantões"}
          </td>
        </tr>`;
      })
      .join("");

    // 2. Chronological list of Sunday & Holiday duties in the period
    const dutiesRowsHtml = filteredDuties
      .map((d) => {
        const isHoliday = d.kind.toLowerCase().includes("feriado") || d.kind.includes("(");
        const isAtend = d.kind.toLowerCase().includes("atendimento");
        const badgeBg = isAtend
          ? "#EDE9FE"
          : isHoliday
          ? "#F5F3FF"
          : "#FFF7ED";
        const badgeFg = isAtend
          ? "#6D28D9"
          : isHoliday
          ? "#6D28D9"
          : "#C2410C";

        return `<tr>
          <td style="padding:8px; border-bottom:1px solid #EBEBE6; font-family:Consolas,monospace; font-weight:bold; color:#14181F;">
            ${escapeHtml(formatShortDate(d.date))}
          </td>
          <td style="padding:8px; border-bottom:1px solid #EBEBE6;">
            <span style="background:${badgeBg}; color:${badgeFg}; font-weight:bold; padding:2px 6px; font-size:11px;">
              ${escapeHtml(d.kind)}
            </span>
          </td>
          <td colspan="4" style="padding:8px; border-bottom:1px solid #EBEBE6; font-weight:bold; color:#14181F;">
            ${escapeHtml(d.label || "")}
          </td>
        </tr>`;
      })
      .join("");

    const excelHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Plantoes e Feriados</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body style="font-family: Inter, Calibri, Arial, sans-serif;">
        <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse; width:100%;">
          <tr>
            <td colspan="6" style="padding:12px 8px; font-size:16px; font-weight:bold; color:#14181F; background:#FBFAF7; border-bottom:2px solid #14181F;">
              Relatório Exclusivo de Plantões (Domingos, Feriados e Dias Adicionais) — ${escapeHtml(
                reportPeriodInfo.title
              )}
            </td>
          </tr>
          <tr style="background:#F3F2ED; color:#8A8F98; font-size:10.5px; font-weight:bold; text-transform:uppercase;">
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:left;">FUNCIONÁRIO</th>
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center;">PLANTÃO DOMINGO</th>
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center;">PLANTÃO FERIADO</th>
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:center;">DIA ADICIONAL</th>
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:left;">DATAS E DESCRIÇÕES DOS PLANTÕES / TROCAS</th>
            <th style="padding:10px 8px; border-bottom:1px solid #EBEBE6; text-align:right;">TOTAL DE PLANTÕES</th>
          </tr>
          ${empRowsHtml}
          <tr><td colspan="6" style="padding:14px;"></td></tr>
          <tr>
            <td colspan="6" style="padding:10px 8px; font-size:14px; font-weight:bold; color:#14181F; background:#FBFAF7; border-bottom:2px solid #14181F;">
              Cronograma de Plantões de Domingos e Feriados (${
                filteredDuties.length
              })
            </td>
          </tr>
          <tr style="background:#F3F2ED; color:#8A8F98; font-size:10.5px; font-weight:bold; text-transform:uppercase;">
            <th style="padding:8px; border-bottom:1px solid #EBEBE6; text-align:left;">DATA</th>
            <th style="padding:8px; border-bottom:1px solid #EBEBE6; text-align:left;">TIPO DE PLANTÃO / FERIADO</th>
            <th colspan="4" style="padding:8px; border-bottom:1px solid #EBEBE6; text-align:left;">EQUIPE / FUNCIONÁRIOS ESCALADOS</th>
          </tr>
          ${dutiesRowsHtml}
        </table>
      </body>
    </html>`;

    const blob = new Blob(["\uFEFF" + excelHtml], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plantoes-e-feriados-${reportPeriodInfo.fileSlug}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    notify?.(
      `Relatório de Plantões e Feriados exportado: plantoes-e-feriados-${reportPeriodInfo.fileSlug}.xls!`
    );
  }

  function handleExportCsv(includeValues = false) {
    const lines = [];
    lines.push("RESUMO POR EQUIPE;" + reportPeriodInfo.title);
    lines.push(
      "Equipe;Tipo;Grupo;Trabalha;Folga;Plantao Domingo;Plantao Feriado;Troca;Feriado;Ferias;Ausencia;Total Trabalhado"
    );
    for (const r of filteredTeamRows) {
      lines.push(
        [
          r.team.name,
          r.team.kind,
          r.team.group,
          r.trabalha,
          r.folga,
          r.plantao_domingo,
          r.plantao_feriado,
          r.troca,
          r.feriado,
          r.ferias,
          r.ausencia,
          r.total_trabalhado,
        ].join(";")
      );
    }

    lines.push("");
    lines.push("RELATORIO INDIVIDUAL POR FUNCIONARIO");
    if (includeValues) {
      lines.push(
        "Funcionario;Equipe;Grupo;Normais;Plantao Dom.;Plantao Fer.;Dia Adicional;Ferias/Aus.;Folgas;Historico e Descricoes (Ferias, Trocas, Adicionais e Obs.);Total Trabalhado;Valor Estimado (R$)"
      );
    } else {
      lines.push(
        "Funcionario;Equipe;Grupo;Normais;Plantao Dom.;Plantao Fer.;Dia Adicional;Ferias/Aus.;Folgas;Historico e Descricoes (Ferias, Trocas, Adicionais e Obs.);Total Trabalhado"
      );
    }

    const rNorm = Number(appState.settings.rate_dia_normal ?? 0);
    const rDom = Number(appState.settings.rate_plantao_domingo ?? 150);
    const rFer = Number(appState.settings.rate_plantao_feriado ?? 180);
    const rAdd = Number(appState.settings.rate_dia_adicional ?? 150);

    for (const emp of filteredEmployeeReport) {
      const totalFin =
        emp.diasNormais * rNorm +
        emp.plantoesDomingo * rDom +
        emp.plantoesFeriado * rFer +
        emp.diasAdicionais * rAdd;
      const detailsText = (emp.occurrences || [])
        .map(
          (o) =>
            `${formatShortDate(o.date).slice(0, 5)} [${String(
              o.badge || ""
            ).replace(/\s*\(\+R\$\)/g, "")}]: ${o.description || ""}`
        )
        .join(" | ");

      const rowCols = [
        emp.name,
        emp.teamName,
        `Grp ${emp.group}`,
        emp.diasNormais,
        emp.plantoesDomingo,
        emp.plantoesFeriado,
        emp.diasAdicionais > 0 ? `+${emp.diasAdicionais}` : 0,
        emp.feriasAusencias,
        emp.folgas,
        `"${detailsText.replace(/"/g, '""')}"`,
        `${emp.totalTrabalhado} dias`,
      ];

      if (includeValues) {
        rowCols.push(totalFin.toFixed(2).replace(".", ","));
      }

      lines.push(rowCols.join(";"));
    }

    lines.push("");
    lines.push("PLANTOES DO PERIODO");
    lines.push("Data;Tipo;Equipe / Responsavel");
    for (const d of filteredDuties) {
      lines.push([formatShortDate(d.date), d.kind, d.label || ""].join(";"));
    }

    const csvContent = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `escala-${reportPeriodInfo.fileSlug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify?.(`Arquivo escala-${reportPeriodInfo.fileSlug}.csv exportado!`);
  }

  function handleExportBackupJson() {
    const json = JSON.stringify(appState, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-escala-facil-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify?.("Backup completo exportado em JSON!");
  }

  function handleImportBackupJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || "{}"));
        if (parsed.teams && parsed.settings) {
          setAppState(parsed);
          notify?.("Backup importado com sucesso!");
        } else {
          notify?.("Arquivo JSON inválido.", "error");
        }
      } catch {
        notify?.("Erro ao ler arquivo JSON.", "error");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 pt-7 pb-20">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A8F98] mb-1">
            ADMINISTRAÇÃO · SEM LIMITE DE TOKENS
          </div>
          <h1 className="font-heading text-[28px] sm:text-[32px] font-bold tracking-[-0.02em] text-[#14181F]">
            Configurações da escala
          </h1>
          <p className="text-[13.5px] text-[#6B7280] mt-0.5">
            Gerencie o rodízio, equipes, feriados, trocas de plantão, férias,
            serviços diários e relatórios mensais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            type="button"
            onClick={handleExportBackupJson}
            className="h-9 px-3.5 rounded-full bg-white border border-[#E5E4DF] text-[12.5px] font-medium text-[#14181F] hover:bg-[#F4F3EE] transition inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Salvar Backup</span>
          </button>
          <label className="h-9 px-3.5 rounded-full bg-white border border-[#E5E4DF] text-[12.5px] font-medium text-[#14181F] hover:bg-[#F4F3EE] transition inline-flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Restaurar Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackupJson}
              className="hidden"
            />
          </label>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="h-9 px-3.5 rounded-full bg-white border border-[#EF4444]/30 text-[12.5px] font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair do Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Radix-style Navigation Tabs (Scrollable on Mobile) */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#F3F2ED] border border-[#E8E7E1] mb-6 w-full sm:w-fit overflow-x-auto no-print">
        {ADMIN_TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 h-9 rounded-xl text-[12.5px] sm:text-[13px] font-semibold transition whitespace-nowrap shrink-0 ${
                active
                  ? "bg-white text-[#14181F] shadow-sm"
                  : "text-[#6B7280] hover:text-[#14181F]"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: ESCALA                                                         */}
      {/* ===================================================================== */}
      {activeTab === "escala" && (
        <div className="space-y-4">
          {/* Card 1: Rodízio das semanas */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <h2 className="font-heading text-[17px] font-bold text-[#14181F]">
              Rodízio das semanas
            </h2>
            <p className="text-[13px] text-[#6B7280] mt-0.5 mb-4">
              Define qual grupo trabalha de segunda a sexta na semana de
              referência (o outro grupo trabalha de terça a sábado).
            </p>
            <form
              onSubmit={handleSaveRotationSettings}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
            >
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Semana de referência (segunda-feira)
                </label>
                <input
                  type="date"
                  value={anchorDate}
                  onChange={(e) => setAnchorDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Grupo que faz Segunda a Sexta
                </label>
                <select
                  value={anchorGroup}
                  onChange={(e) => setAnchorGroup(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                >
                  <option value="A">Grupo A</option>
                  <option value="B">Grupo B</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Início da rotação de plantões
                </label>
                <input
                  type="date"
                  value={rotationStart}
                  onChange={(e) => setRotationStart(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Nome do titular do domingo (Atendimento)
                </label>
                <input
                  type="text"
                  value={mateusName}
                  onChange={(e) => setMateusName(e.target.value)}
                  placeholder="Mateus"
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 h-10 rounded-full bg-[#14181F] text-white text-[13px] font-semibold hover:bg-[#272D38] transition"
                >
                  Salvar configuração
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Alterar uma semana */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <h2 className="font-heading text-[17px] font-bold text-[#14181F]">
              Alterar uma semana
            </h2>
            <p className="text-[13px] text-[#6B7280] mt-0.5 mb-4">
              Inverte os grupos A e B apenas na semana escolhida (segunda a
              domingo), sem afetar as semanas seguintes.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Qualquer dia da semana ({formatShortDate(getMondayOfWeek(invertWeekDate))} a{" "}
                  {formatShortDate(addDays(getMondayOfWeek(invertWeekDate), 6))})
                </label>
                <input
                  type="date"
                  value={invertWeekDate}
                  onChange={(e) => setInvertWeekDate(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                />
              </div>
              <button
                type="button"
                onClick={() => handleWeekOverride("inverter")}
                className="px-4 h-10 rounded-full bg-[#14181F] text-white text-[13px] font-semibold hover:bg-[#272D38] transition"
              >
                Inverter semana
              </button>
              <button
                type="button"
                onClick={() => handleWeekOverride("automatico")}
                className="px-4 h-10 rounded-full bg-white border border-[#E5E4DF] text-[#14181F] text-[13px] font-medium hover:bg-[#F4F3EE] transition"
              >
                Voltar ao automático
              </button>
            </div>
          </div>

          {/* Card 3: Plantão de domingo */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <h2 className="font-heading text-[17px] font-bold text-[#14181F]">
              Plantão de domingo
            </h2>
            <p className="text-[13px] text-[#6B7280] mt-0.5 mb-4">
              Define manualmente qual dupla de campo ou atendente fará o plantão
              em um domingo específico.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Domingo
                </label>
                <input
                  type="date"
                  value={sundayDutyDate}
                  onChange={(e) => setSundayDutyDate(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Equipe ou atendente
                </label>
                <select
                  value={sundayDutyTeamId}
                  onChange={(e) => setSundayDutyTeamId(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                >
                  <optgroup label="Campo">
                    {activeTeams
                      .filter((t) => t.kind === "campo")
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Atendimento">
                    {activeTeams
                      .filter((t) => t.kind === "atendimento")
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleSetSundayDuty(false)}
                className="px-4 h-10 rounded-full bg-[#14181F] text-white text-[13px] font-semibold hover:bg-[#272D38] transition"
              >
                Definir plantão
              </button>
              <button
                type="button"
                onClick={() => handleSetSundayDuty(true)}
                className="px-4 h-10 rounded-full bg-white border border-[#E5E4DF] text-[#14181F] text-[13px] font-medium hover:bg-[#F4F3EE] transition"
              >
                Voltar ao automático
              </button>
            </div>
          </div>

          {/* Card 4: Folga do Mateus */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <h2 className="font-heading text-[17px] font-bold text-[#14181F]">
              Folga do {mateusName}
            </h2>
            <p className="text-[13px] text-[#6B7280] mt-0.5 mb-4">
              Por padrão o plantão de atendimento acontece no 1º domingo do mês.
              Use abaixo para mudar qual domingo terá plantão de atendimento.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Mês
                </label>
                <input
                  type="month"
                  value={mateusFolgaMonth}
                  onChange={(e) => {
                    setMateusFolgaMonth(e.target.value);
                  }}
                  className="h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Domingo de folga
                </label>
                <select
                  value={mateusFolgaSunday}
                  onChange={(e) => setMateusFolgaSunday(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                >
                  {sundaysInFolgaMonth.map((sunIso, idx) => (
                    <option key={sunIso} value={sunIso}>
                      {idx + 1}º domingo · {formatShortDate(sunIso)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleSaveMateusFolga(false)}
                className="px-4 h-10 rounded-full bg-[#14181F] text-white text-[13px] font-semibold hover:bg-[#272D38] transition"
              >
                Salvar troca
              </button>
              <button
                type="button"
                onClick={() => handleSaveMateusFolga(true)}
                className="px-4 h-10 rounded-full bg-white border border-[#E5E4DF] text-[#14181F] text-[13px] font-medium hover:bg-[#F4F3EE] transition"
              >
                Primeiro domingo
              </button>
            </div>
          </div>

          {/* Card 5: Como a escala é calculada */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <h2 className="font-heading text-[17px] font-bold text-[#14181F] mb-2">
              Como a escala é calculada
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-[13px] text-[#42474F]">
              <li>
                <strong>Rodízio semanal alternado:</strong> O grupo âncora
                trabalha de segunda a sexta numa semana e de terça a sábado na
                seguinte; o outro grupo faz o inverso.
              </li>
              <li>
                <strong>Plantão de domingo (campo):</strong> Uma dupla por
                domingo em rodízio balanceado, preferindo quem está de segunda a
                sexta naquela semana.
              </li>
              <li>
                <strong>Plantão de feriado (campo):</strong> Uma dupla por
                feriado oficial (nacional/estadual/municipal) em rodízio
                corrido. Pontos facultativos mantêm a escala normal.
              </li>
              <li>
                <strong>Plantão de atendimento (domingo):</strong> Uma pessoa
                por mês cobrindo o domingo de folga do {mateusName}, preferindo
                quem folga no sábado.
              </li>
              <li>
                <strong>Prioridade máxima para ajustes:</strong> Qualquer
                exceção manual, férias ou troca sobrescreve o cálculo
                automático.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: EQUIPES                                                        */}
      {/* ===================================================================== */}
      {activeTab === "equipes" && (
        <div className="space-y-4">
          {["campo", "atendimento"].map((kind) => (
            <div
              key={kind}
              className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]"
            >
              <h2 className="font-heading text-[17px] font-bold text-[#14181F] mb-3">
                {kind === "campo" ? "Equipe de campo" : "Equipe de atendimento"}
              </h2>
              <div className="space-y-2.5">
                {appState.teams
                  .filter((t) => t.kind === kind)
                  .sort((a, b) => a.order - b.order)
                  .map((team) => (
                    <div
                      key={team.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 rounded-2xl bg-[#FBFAF7] border border-[#EBEBE6]"
                    >
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={team.name}
                          onChange={(e) =>
                            handleUpdateTeamRow(team.id, "name", e.target.value)
                          }
                          className="w-full h-9 px-3 rounded-xl border border-[#E5E4DF] bg-white text-[13px] font-medium"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <select
                          value={team.kind}
                          onChange={(e) =>
                            handleUpdateTeamRow(team.id, "kind", e.target.value)
                          }
                          className="w-full h-9 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[12.5px]"
                        >
                          <option value="campo">Campo</option>
                          <option value="atendimento">Atendimento</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          value={team.group}
                          onChange={(e) =>
                            handleUpdateTeamRow(
                              team.id,
                              "group",
                              e.target.value
                            )
                          }
                          className="w-full h-9 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[12.5px]"
                        >
                          <option value="A">Grupo A</option>
                          <option value="B">Grupo B</option>
                        </select>
                      </div>
                      <div className="sm:col-span-1">
                        <input
                          type="number"
                          value={team.order}
                          onChange={(e) =>
                            handleUpdateTeamRow(
                              team.id,
                              "order",
                              Number(e.target.value)
                            )
                          }
                          className="w-full h-9 px-2 rounded-xl border border-[#E5E4DF] bg-white text-[12.5px] text-center"
                        />
                      </div>
                      <div className="sm:col-span-1 flex items-center justify-center">
                        <label className="inline-flex items-center gap-1.5 text-[12px] text-[#42474F] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={team.active !== false}
                            onChange={(e) =>
                              handleUpdateTeamRow(
                                team.id,
                                "active",
                                e.target.checked
                              )
                            }
                            className="rounded"
                          />
                          <span>Ativa</span>
                        </label>
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteTeam(team.id)}
                          className="w-8 h-8 rounded-full text-[#EF4444] hover:bg-[#EF4444]/10 flex items-center justify-center transition"
                          title="Excluir equipe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {/* Card 3: Adicionar equipe */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <h2 className="font-heading text-[17px] font-bold text-[#14181F] mb-3">
              Adicionar equipe
            </h2>
            <form
              onSubmit={handleAddTeam}
              className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
            >
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Nome (use &quot;/&quot; para duplas, ex: João / Pedro)
                </label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, name: e.target.value })
                  }
                  placeholder="Nome da equipe ou dupla"
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Tipo
                </label>
                <select
                  value={newTeam.kind}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, kind: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                >
                  <option value="campo">Campo</option>
                  <option value="atendimento">Atendimento</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Grupo
                </label>
                <select
                  value={newTeam.group}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, group: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                >
                  <option value="A">Grupo A</option>
                  <option value="B">Grupo B</option>
                </select>
              </div>
              <button
                type="submit"
                className="h-10 px-5 rounded-full bg-[#14181F] text-white text-[13px] font-semibold hover:bg-[#272D38] transition"
              >
                + Adicionar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: FERIADOS                                                       */}
      {/* ===================================================================== */}
      {activeTab === "feriados" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Novo feriado */}
            <div className="md:col-span-2 bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
              <h2 className="font-heading text-[17px] font-bold text-[#14181F] mb-3">
                Novo feriado
              </h2>
              <form
                onSubmit={handleAddHoliday}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
              >
                <div>
                  <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) =>
                      setNewHoliday({ ...newHoliday, date: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                    Nome do feriado
                  </label>
                  <input
                    type="text"
                    value={newHoliday.name}
                    onChange={(e) =>
                      setNewHoliday({ ...newHoliday, name: e.target.value })
                    }
                    placeholder="Ex: Aniversário da Cidade"
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                    Tipo
                  </label>
                  <select
                    value={newHoliday.type}
                    onChange={(e) =>
                      setNewHoliday({ ...newHoliday, type: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                  >
                    {Object.entries(HOLIDAY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 h-10 rounded-full bg-[#14181F] text-white text-[13px] font-semibold hover:bg-[#272D38] transition"
                  >
                    + Adicionar feriado
                  </button>
                </div>
              </form>
            </div>

            {/* Importar feriados nacionais e municipais */}
            <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)] flex flex-col justify-between">
              <div>
                <h2 className="font-heading text-[17px] font-bold text-[#14181F] mb-1">
                  Importar feriados (Nacionais + Pinhal-SP)
                </h2>
                <p className="text-[12.5px] text-[#6B7280] mb-4">
                  Gera automaticamente os feriados nacionais, móveis, estadual
                  (9 de Julho - SP) e municipais de{" "}
                  <strong>Espírito Santo do Pinhal-SP</strong> (13/12 Santa
                  Luzia e 27/12 Aniversário da Cidade) para o ano escolhido.
                </p>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                    Ano
                  </label>
                  <input
                    type="number"
                    value={importYear}
                    onChange={(e) => setImportYear(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleImportNationalHolidays}
                  className="px-5 h-10 rounded-full bg-[#14181F] text-white text-[13px] font-semibold hover:bg-[#272D38] transition"
                >
                  Importar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de feriados */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <h2 className="font-heading text-[17px] font-bold text-[#14181F] mb-3">
              Feriados cadastrados ({appState.holidays.length})
            </h2>
            <div className="divide-y divide-[#F2F1EC]">
              {[...appState.holidays]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((h) => (
                  <div
                    key={h.date}
                    className="py-2.5 flex items-center justify-between gap-3 text-[13px]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-[#14181F] tabular-nums">
                        {formatShortDate(h.date)}
                      </span>
                      <span className="font-medium text-[#14181F]">
                        {h.name}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          h.type === "facultativo"
                            ? "bg-[#EAB308]/15 text-[#854D0E]"
                            : "bg-[#EF4444]/15 text-[#991B1B]"
                        }`}
                      >
                        {HOLIDAY_LABELS[h.type] || h.type}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteHoliday(h.date)}
                      className="w-8 h-8 rounded-full text-[#EF4444] hover:bg-[#EF4444]/10 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: TROCAS E AJUSTES (SMART INDIVIDUAL & DUO SWAPS + EDITABLE)     */}
      {/* ===================================================================== */}
      {activeTab === "ajustes" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Troca de plantão (Inteligente: Dupla toda ou só 1 pessoa da dupla) */}
            <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
              <h2 className="font-heading text-[16px] font-bold text-[#14181F] mb-1">
                Troca de plantão (Dupla ou 1 pessoa)
              </h2>
              <p className="text-[12px] text-[#6B7280] mb-3">
                Permite trocar a dupla inteira ou somente 1 integrante da dupla
                (montando a nova dupla do dia automaticamente).
              </p>
              <form onSubmit={handleSaveTrocaPlantao} className="space-y-2.5">
                <div>
                  <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                    Dia do plantão / troca
                  </label>
                  <input
                    type="date"
                    value={trocaPlantaoForm.date}
                    onChange={(e) =>
                      setTrocaPlantaoForm({
                        ...trocaPlantaoForm,
                        date: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                    Equipe original
                  </label>
                  <select
                    value={trocaPlantaoForm.team_id}
                    onChange={(e) =>
                      setTrocaPlantaoForm({
                        ...trocaPlantaoForm,
                        team_id: e.target.value,
                        member_out: "",
                      })
                    }
                    className="w-full h-9 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                  >
                    {activeTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-[#42474F] mb-1">
                      Quem saiu?
                    </label>
                    <select
                      value={trocaPlantaoForm.member_out}
                      onChange={(e) =>
                        setTrocaPlantaoForm({
                          ...trocaPlantaoForm,
                          member_out: e.target.value,
                        })
                      }
                      className="w-full h-9 px-2.5 rounded-xl border border-[#E5E4DF] text-[12.5px]"
                    >
                      <option value="">A dupla toda</option>
                      {getTeamMembersList(trocaPlantaoForm.team_id).map((m) => (
                        <option key={m} value={m}>
                          Somente {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#42474F] mb-1">
                      Quem cobriu?
                    </label>
                    <select
                      value={trocaPlantaoForm.member_in}
                      onChange={(e) =>
                        setTrocaPlantaoForm({
                          ...trocaPlantaoForm,
                          member_in: e.target.value,
                        })
                      }
                      className="w-full h-9 px-2.5 rounded-xl border border-[#E5E4DF] text-[12.5px]"
                    >
                      <option value="">Escolher / digitar...</option>
                      {allEmployeesList.map((emp) => (
                        <option key={emp.name} value={emp.name}>
                          {emp.name} ({emp.teamName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                    Nome no calendário (automático ou personalizado)
                  </label>
                  <input
                    type="text"
                    value={trocaPlantaoForm.custom_name}
                    onChange={(e) =>
                      setTrocaPlantaoForm({
                        ...trocaPlantaoForm,
                        custom_name: e.target.value,
                      })
                    }
                    placeholder={computeAutoSwapLabel(
                      trocaPlantaoForm.team_id,
                      trocaPlantaoForm.member_out,
                      trocaPlantaoForm.member_in,
                      ""
                    )}
                    className="w-full h-9 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-9 rounded-full bg-[#14181F] text-white text-[12.5px] font-semibold hover:bg-[#272D38]"
                >
                  Salvar troca
                </button>
              </form>
            </div>

            {/* Card 2: Trocar o dia entre duas equipes */}
            <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
              <h2 className="font-heading text-[16px] font-bold text-[#14181F] mb-1">
                Trocar o dia entre duas equipes
              </h2>
              <p className="text-[12px] text-[#6B7280] mb-3">
                Inverte quem trabalha e quem folga em um dia específico (ex:
                segunda ou sábado).
              </p>
              <form
                onSubmit={handleSwapDayBetweenTwoTeams}
                className="space-y-2.5"
              >
                <div>
                  <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                    Dia
                  </label>
                  <input
                    type="date"
                    value={swapDayTeamsForm.date}
                    onChange={(e) =>
                      setSwapDayTeamsForm({
                        ...swapDayTeamsForm,
                        date: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                    Equipe 1
                  </label>
                  <select
                    value={swapDayTeamsForm.team1_id}
                    onChange={(e) =>
                      setSwapDayTeamsForm({
                        ...swapDayTeamsForm,
                        team1_id: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                  >
                    {activeTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                    Equipe 2
                  </label>
                  <select
                    value={swapDayTeamsForm.team2_id}
                    onChange={(e) =>
                      setSwapDayTeamsForm({
                        ...swapDayTeamsForm,
                        team2_id: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                  >
                    {activeTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full h-9 rounded-full bg-[#14181F] text-white text-[12.5px] font-semibold hover:bg-[#272D38]"
                >
                  Trocar dia
                </button>
              </form>
            </div>

            {/* Card 3: Trocar plantão entre domingos e feriados */}
            <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
              <h2 className="font-heading text-[16px] font-bold text-[#14181F] mb-1">
                Trocar plantão entre datas
              </h2>
              <p className="text-[12px] text-[#6B7280] mb-3">
                Permuta as equipes escaladas entre dois domingos ou feriados.
              </p>
              <form
                onSubmit={handleSwapDutiesBetweenDates}
                className="space-y-2.5"
              >
                <div>
                  <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                    Data 1 (domingo ou feriado)
                  </label>
                  <input
                    type="date"
                    value={swapDutiesForm.date1}
                    onChange={(e) =>
                      setSwapDutiesForm({
                        ...swapDutiesForm,
                        date1: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                    Data 2 (domingo ou feriado)
                  </label>
                  <input
                    type="date"
                    value={swapDutiesForm.date2}
                    onChange={(e) =>
                      setSwapDutiesForm({
                        ...swapDutiesForm,
                        date2: e.target.value,
                      })
                    }
                    className="w-full h-9 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full h-9 rounded-full bg-[#14181F] text-white text-[12.5px] font-semibold hover:bg-[#272D38]"
                  >
                    Permutar plantões
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Card 4: Ajuste pontual de um dia (com suporte a 1 pessoa da dupla + Edição) */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-heading text-[17px] font-bold text-[#14181F]">
                  {pointOverrideForm.id
                    ? "Editando Ajuste / Troca"
                    : "Ajuste pontual de um dia (Equipe ou 1 Pessoa da Dupla)"}
                </h2>
                <p className="text-[12.5px] text-[#6B7280]">
                  Você pode aplicar o ajuste na dupla toda ou escolher somente 1
                  funcionário da dupla (o outro integrante continua trabalhando
                  normalmente).
                </p>
              </div>
              {pointOverrideForm.id && (
                <button
                  type="button"
                  onClick={() =>
                    setPointOverrideForm((prev) => ({
                      ...prev,
                      id: null,
                      member: "",
                      member_in: "",
                      custom_name: "",
                      note: "",
                    }))
                  }
                  className="px-3 h-8 rounded-full bg-[#F4F3EE] text-[12px] font-semibold text-[#14181F] hover:bg-[#E5E4DF]"
                >
                  Cancelar edição
                </button>
              )}
            </div>

            <form
              onSubmit={handleSavePointOverride}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-2.5 items-end mb-4 p-3.5 rounded-2xl bg-[#FBFAF7] border border-[#EBEBE6]"
            >
              <div>
                <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                  Equipe
                </label>
                <select
                  value={pointOverrideForm.team_id}
                  onChange={(e) =>
                    setPointOverrideForm({
                      ...pointOverrideForm,
                      team_id: e.target.value,
                      member: "",
                    })
                  }
                  className="w-full h-10 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[13px]"
                >
                  {activeTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                  Integrante
                </label>
                <select
                  value={pointOverrideForm.member}
                  onChange={(e) =>
                    setPointOverrideForm({
                      ...pointOverrideForm,
                      member: e.target.value,
                    })
                  }
                  className="w-full h-10 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[13px]"
                >
                  <option value="">A dupla toda</option>
                  {getTeamMembersList(pointOverrideForm.team_id).map((m) => (
                    <option key={m} value={m}>
                      Somente {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={pointOverrideForm.date}
                  onChange={(e) =>
                    setPointOverrideForm({
                      ...pointOverrideForm,
                      date: e.target.value,
                    })
                  }
                  className="w-full h-10 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                  Situação
                </label>
                <select
                  value={pointOverrideForm.status}
                  onChange={(e) =>
                    setPointOverrideForm({
                      ...pointOverrideForm,
                      status: e.target.value,
                    })
                  }
                  className="w-full h-10 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[13px]"
                >
                  {Object.entries(STATUS_META)
                    .filter(([k]) => k !== "feriado")
                    .map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                  Substituto (se houver)
                </label>
                <select
                  value={pointOverrideForm.member_in}
                  onChange={(e) =>
                    setPointOverrideForm({
                      ...pointOverrideForm,
                      member_in: e.target.value,
                    })
                  }
                  className="w-full h-10 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[13px]"
                >
                  <option value="">Nenhum</option>
                  {allEmployeesList.map((emp) => (
                    <option key={emp.name} value={emp.name}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                  Nome exibido
                </label>
                <input
                  type="text"
                  value={pointOverrideForm.custom_name}
                  onChange={(e) =>
                    setPointOverrideForm({
                      ...pointOverrideForm,
                      custom_name: e.target.value,
                    })
                  }
                  placeholder="Automático"
                  className="w-full h-10 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                  Anotação / Motivo
                </label>
                <input
                  type="text"
                  value={pointOverrideForm.note}
                  onChange={(e) =>
                    setPointOverrideForm({
                      ...pointOverrideForm,
                      note: e.target.value,
                    })
                  }
                  placeholder="Ex: Veio a pedido do Guto"
                  className="w-full h-10 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[13px]"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-4 rounded-full bg-[#14181F] text-white text-[13px] font-semibold hover:bg-[#272D38]"
              >
                {pointOverrideForm.id ? "Salvar Edição" : "+ Salvar"}
              </button>
            </form>

            {/* List of existing point overrides & swaps with Edit + Delete */}
            <div className="divide-y divide-[#F2F1EC]">
              {appState.overrides.map((ovr) => {
                const t = appState.teams.find((x) => x.id === ovr.team_id);
                const indivMember = ovr.member || ovr.member_out;
                return (
                  <div
                    key={ovr.id}
                    className={`py-2.5 px-2 rounded-xl flex items-center justify-between gap-2 text-[13px] ${
                      pointOverrideForm.id === ovr.id ? "bg-[#F3F2ED]" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-semibold tabular-nums">
                        {formatShortDate(ovr.date)}
                      </span>
                      <span className="font-semibold text-[#14181F]">
                        {t?.name || "Equipe"}
                      </span>
                      {indivMember ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#14181F] text-white text-[11px] font-semibold">
                          Somente {indivMember}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#EBEBE6] text-[#42474F] text-[11px] font-medium">
                          Dupla toda
                        </span>
                      )}
                      {ovr.member_in && (
                        <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#065F46] text-[11px] font-semibold">
                          Coberto por {ovr.member_in}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F3F2ED] text-[11.5px] font-medium">
                        {STATUS_META[ovr.status]?.label || ovr.status}
                      </span>
                      {ovr.custom_name && (
                        <span className="text-[12px] text-[#3B82F6] font-medium">
                          Exibe: &quot;{ovr.custom_name}&quot;
                        </span>
                      )}
                      {ovr.note && (
                        <span className="text-[12px] text-[#6B7280]">
                          ({ovr.note})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditOverride(ovr)}
                        title="Editar troca / ajuste"
                        className="w-8 h-8 rounded-full text-[#14181F] hover:bg-[#F3F2ED] flex items-center justify-center"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOverride(ovr.id)}
                        title="Excluir troca / ajuste"
                        className="w-8 h-8 rounded-full text-[#EF4444] hover:bg-[#EF4444]/10 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 5: Férias e ausências (Suporta 1 pessoa da dupla + Substituto + Edição) */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-heading text-[17px] font-bold text-[#14181F]">
                  {absenceForm.id
                    ? "Editando Férias / Ausência"
                    : "Férias e ausências (Dupla toda ou somente 1 funcionário)"}
                </h2>
                <p className="text-[12.5px] text-[#6B7280]">
                  Exemplo: Se o <strong>Welliton</strong> sair de férias e você
                  selecionar <em>&quot;Somente Welliton&quot;</em>, o{" "}
                  <strong>Igor</strong> continua contando os dias trabalhados
                  normalmente.
                </p>
              </div>
              {absenceForm.id && (
                <button
                  type="button"
                  onClick={() =>
                    setAbsenceForm((prev) => ({
                      ...prev,
                      id: null,
                      member: "",
                      substitute_member: "",
                      note: "",
                    }))
                  }
                  className="px-3 h-8 rounded-full bg-[#F4F3EE] text-[12px] font-semibold text-[#14181F] hover:bg-[#E5E4DF]"
                >
                  Cancelar edição
                </button>
              )}
            </div>

            <form
              onSubmit={handleSaveAbsence}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-2.5 items-end mb-4 p-3.5 rounded-2xl bg-[#FBFAF7] border border-[#EBEBE6]"
            >
              <div>
                <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                  Equipe
                </label>
                <select
                  value={absenceForm.team_id}
                  onChange={(e) =>
                    setAbsenceForm({
                      ...absenceForm,
                      team_id: e.target.value,
                      member: "",
                    })
                  }
                  className="w-full h-10 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[13px]"
                >
                  {activeTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                  Quem saiu?
                </label>
                <select
                  value={absenceForm.member}
                  onChange={(e) =>
                    setAbsenceForm({ ...absenceForm, member: e.target.value })
                  }
                  className="w-full h-10 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[13px]"
                >
                  <option value="">A dupla toda</option>
                  {getTeamMembersList(absenceForm.team_id).map((m) => (
                    <option key={m} value={m}>
                      Somente {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                  Substituto (opc.)
                </label>
                <select
                  value={absenceForm.substitute_member}
                  onChange={(e) =>
                    setAbsenceForm({
                      ...absenceForm,
                      substitute_member: e.target.value,
                    })
                  }
                  className="w-full h-10 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[13px]"
                >
                  <option value="">Sem substituto</option>
                  {allEmployeesList.map((emp) => (
                    <option key={emp.name} value={emp.name}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                  Tipo
                </label>
                <select
                  value={absenceForm.kind}
                  onChange={(e) =>
                    setAbsenceForm({ ...absenceForm, kind: e.target.value })
                  }
                  className="w-full h-10 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[13px]"
                >
                  <option value="ferias">Férias</option>
                  <option value="ausencia">Ausência</option>
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                  De
                </label>
                <input
                  type="date"
                  value={absenceForm.start_date}
                  onChange={(e) =>
                    setAbsenceForm({
                      ...absenceForm,
                      start_date: e.target.value,
                    })
                  }
                  className="w-full h-10 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                  Até
                </label>
                <input
                  type="date"
                  value={absenceForm.end_date}
                  onChange={(e) =>
                    setAbsenceForm({ ...absenceForm, end_date: e.target.value })
                  }
                  className="w-full h-10 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[#42474F] mb-1">
                  Observação
                </label>
                <input
                  type="text"
                  value={absenceForm.note}
                  onChange={(e) =>
                    setAbsenceForm({ ...absenceForm, note: e.target.value })
                  }
                  placeholder="Opcional"
                  className="w-full h-10 px-2.5 rounded-xl border border-[#E5E4DF] bg-white text-[13px]"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-4 rounded-full bg-[#14181F] text-white text-[13px] font-semibold hover:bg-[#272D38]"
              >
                {absenceForm.id ? "Salvar Edição" : "+ Salvar"}
              </button>
            </form>

            {/* List of existing absences with Edit + Delete */}
            <div className="divide-y divide-[#F2F1EC]">
              {appState.absences.map((abs) => {
                const t = appState.teams.find((x) => x.id === abs.team_id);
                const teamMembers = getTeamMembersList(abs.team_id);
                const remainingWorking = abs.member
                  ? teamMembers.filter((m) => m !== abs.member)
                  : [];
                return (
                  <div
                    key={abs.id}
                    className={`py-2.5 px-2 rounded-xl flex items-center justify-between gap-2 text-[13px] ${
                      absenceForm.id === abs.id ? "bg-[#F3F2ED]" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#14181F]">
                        {t?.name || "Equipe"}
                      </span>
                      {abs.member ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#14181F] text-white text-[11px] font-semibold">
                          Somente {abs.member}
                          {remainingWorking.length > 0
                            ? ` (${remainingWorking.join("/")} trabalha normal)`
                            : ""}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#EBEBE6] text-[#42474F] text-[11px] font-medium">
                          Dupla toda
                        </span>
                      )}
                      {abs.substitute_member && (
                        <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#065F46] text-[11px] font-semibold">
                          Substituto: {abs.substitute_member}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EAB308]/20 text-[#854D0E] text-[11.5px] font-semibold">
                        {abs.kind === "ausencia" ? "Ausência" : "Férias"}
                      </span>
                      <span className="font-mono text-[12.5px] text-[#42474F] tabular-nums">
                        {formatShortDate(abs.start_date)} até{" "}
                        {formatShortDate(abs.end_date)}
                      </span>
                      {abs.note && (
                        <span className="text-[12px] text-[#6B7280]">
                          ({abs.note})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditAbsence(abs)}
                        title="Editar férias / ausência"
                        className="w-8 h-8 rounded-full text-[#14181F] hover:bg-[#F3F2ED] flex items-center justify-center"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAbsence(abs.id)}
                        title="Excluir férias / ausência"
                        className="w-8 h-8 rounded-full text-[#EF4444] hover:bg-[#EF4444]/10 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: SERVIÇOS E DIÁRIAS                                             */}
      {/* ===================================================================== */}
      {activeTab === "servicos" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <h2 className="font-heading text-[17px] font-bold text-[#14181F] mb-1">
              Lançamento Rápido de Serviços / Ordens de Serviço
            </h2>
            <p className="text-[13px] text-[#6B7280] mb-4">
              Registre serviços executados pelas equipes e vincule diretamente à
              contagem mensal de produtividade de cada funcionário.
            </p>
            <form
              onSubmit={handleAdminAddService}
              className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
            >
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={adminServiceForm.date}
                  onChange={(e) =>
                    setAdminServiceForm({
                      ...adminServiceForm,
                      date: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Funcionários (use /)
                </label>
                <input
                  type="text"
                  value={adminServiceForm.employeesText}
                  onChange={(e) =>
                    setAdminServiceForm({
                      ...adminServiceForm,
                      employeesText: e.target.value,
                    })
                  }
                  placeholder="Lucas / Felipe"
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Categoria
                </label>
                <select
                  value={adminServiceForm.category}
                  onChange={(e) =>
                    setAdminServiceForm({
                      ...adminServiceForm,
                      category: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                >
                  <option value="Ordem de Serviço / Campo">OS Campo</option>
                  <option value="Instalação">Instalação</option>
                  <option value="Manutenção / Reparo">Manutenção</option>
                  <option value="Plantão Domingo">Plantão Domingo</option>
                  <option value="Plantão Feriado">Plantão Feriado</option>
                  <option value="Atendimento Suporte">Atendimento</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Cliente / Local
                </label>
                <input
                  type="text"
                  value={adminServiceForm.client}
                  onChange={(e) =>
                    setAdminServiceForm({
                      ...adminServiceForm,
                      client: e.target.value,
                    })
                  }
                  placeholder="Cliente ou bairro"
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Observação / OS
                </label>
                <input
                  type="text"
                  value={adminServiceForm.notes}
                  onChange={(e) =>
                    setAdminServiceForm({
                      ...adminServiceForm,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Detalhes..."
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-5 rounded-full bg-[#14181F] text-white text-[13px] font-semibold hover:bg-[#272D38]"
              >
                + Lançar
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <h2 className="font-heading text-[17px] font-bold text-[#14181F] mb-3">
              Todos os Serviços Registrados ({(appState.services || []).length})
            </h2>
            <div className="divide-y divide-[#F2F1EC]">
              {(appState.services || []).map((srv) => (
                <div
                  key={srv.id}
                  className="py-3 flex items-center justify-between gap-3 text-[13px]"
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-semibold tabular-nums">
                      {formatShortDate(srv.date)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#065F46] text-[11px] font-semibold">
                      {srv.category}
                    </span>
                    <span className="font-semibold text-[#14181F]">
                      {srv.client}
                    </span>
                    <span className="text-[#42474F]">
                      — {(srv.employees || []).join(" / ")}
                    </span>
                    {srv.notes && (
                      <span className="text-[#6B7280] text-[12px]">
                        ({srv.notes})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setAppState((prev) => ({
                        ...prev,
                        services: (prev.services || []).filter(
                          (x) => x.id !== srv.id
                        ),
                      }))
                    }
                    className="w-8 h-8 rounded-full text-[#EF4444] hover:bg-[#EF4444]/10 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: CORES                                                          */}
      {/* ===================================================================== */}
      {activeTab === "cores" && (
        <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
          <h2 className="font-heading text-[17px] font-bold text-[#14181F] mb-1">
            Cores do mapa
          </h2>
          <p className="text-[13px] text-[#6B7280] mb-4">
            Personalize as cores exibidas no calendário mensal, na matriz de
            equipes e na legenda.
          </p>
          <form onSubmit={handleSaveColors}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {COLOR_SETTINGS.map((item) => (
                <div
                  key={item.key}
                  className="p-3.5 rounded-2xl bg-[#FBFAF7] border border-[#EBEBE6] flex items-center justify-between"
                >
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#14181F]">
                      {item.label}
                    </div>
                    <div className="text-[11.5px] font-mono text-[#6B7280] uppercase">
                      {colorDraft[item.setting]}
                    </div>
                  </div>
                  <input
                    type="color"
                    value={colorDraft[item.setting]}
                    onChange={(e) =>
                      setColorDraft({
                        ...colorDraft,
                        [item.setting]: e.target.value,
                      })
                    }
                    className="w-11 h-10 rounded-xl cursor-pointer border border-[#E5E4DF] bg-white p-1"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="px-5 h-10 rounded-full bg-[#14181F] text-white text-[13px] font-semibold hover:bg-[#272D38] transition"
              >
                Salvar cores
              </button>
              <button
                type="button"
                onClick={handleRestoreLiveColors}
                className="px-5 h-10 rounded-full bg-white border border-[#E5E4DF] text-[#14181F] text-[13px] font-medium hover:bg-[#F4F3EE] transition"
              >
                Restaurar padrão
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 7: RELATÓRIOS (WITH SMART FILTERS & KPI CARDS)                    */}
      {/* ===================================================================== */}
      {activeTab === "relatorios" && (
        <div className="space-y-4">
          {/* Smart Filter Control Bar */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)] no-print">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#EBEBE6]">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A8F98]">
                  FILTROS INTELIGENTES DE RELATÓRIO
                </div>
                <h2 className="font-heading text-[18px] font-bold text-[#14181F]">
                  Período: {reportPeriodInfo.title}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Period Mode Switcher */}
                <div className="inline-flex items-center p-1 rounded-full bg-[#F3F2ED] border border-[#E8E7E1]">
                  <button
                    type="button"
                    onClick={() => setReportPeriodMode("mes")}
                    className={`px-3 h-7 rounded-full text-[12px] font-semibold transition ${
                      reportPeriodMode === "mes"
                        ? "bg-white text-[#14181F] shadow-sm"
                        : "text-[#6B7280]"
                    }`}
                  >
                    Por Mês
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportPeriodMode("ano")}
                    className={`px-3 h-7 rounded-full text-[12px] font-semibold transition ${
                      reportPeriodMode === "ano"
                        ? "bg-white text-[#14181F] shadow-sm"
                        : "text-[#6B7280]"
                    }`}
                  >
                    Ano Inteiro
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportPeriodMode("custom")}
                    className={`px-3 h-7 rounded-full text-[12px] font-semibold transition ${
                      reportPeriodMode === "custom"
                        ? "bg-white text-[#14181F] shadow-sm"
                        : "text-[#6B7280]"
                    }`}
                  >
                    Período Livre
                  </button>
                </div>

                {reportPeriodMode === "mes" && (
                  <input
                    type="month"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="h-9 px-3 rounded-full border border-[#E5E4DF] text-[13px] font-medium"
                  />
                )}

                {reportPeriodMode === "ano" && (
                  <select
                    value={reportYear}
                    onChange={(e) => setReportYear(e.target.value)}
                    className="h-9 px-3.5 rounded-full border border-[#E5E4DF] text-[13px] font-medium"
                  >
                    <option value="2026">Ano 2026</option>
                    <option value="2027">Ano 2027</option>
                    <option value="2028">Ano 2028</option>
                  </select>
                )}

                {reportPeriodMode === "custom" && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={reportCustomStart}
                      onChange={(e) => setReportCustomStart(e.target.value)}
                      className="h-9 px-2.5 rounded-full border border-[#E5E4DF] text-[12.5px]"
                    />
                    <span className="text-[12px] text-[#8A8F98]">até</span>
                    <input
                      type="date"
                      value={reportCustomEnd}
                      onChange={(e) => setReportCustomEnd(e.target.value)}
                      className="h-9 px-2.5 rounded-full border border-[#E5E4DF] text-[12.5px]"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleExportDutiesAndHolidaysExcel}
                  className="h-9 px-4 rounded-full bg-[#8B5CF6] text-white text-[12.5px] font-semibold hover:bg-[#7C3AED] transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel Só Plantões e Feriados</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportEmployeeExcelNoValues}
                  className="h-9 px-4 rounded-full bg-[#10B981] text-white text-[12.5px] font-semibold hover:bg-[#059669] transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel Geral (Sem R$)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportCsv(false)}
                  className="h-9 px-4 rounded-full bg-[#14181F] text-white text-[12.5px] font-semibold hover:bg-[#272D38] transition inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-9 px-4 rounded-full bg-white border border-[#E5E4DF] text-[#14181F] text-[12.5px] font-medium hover:bg-[#F4F3EE] transition inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>

            {/* Filter Inputs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8A8F98] mb-1">
                  Buscar Funcionário / Motivo
                </label>
                <input
                  type="text"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder="Ex: Tilú, Guto, Férias, Troca..."
                  className="w-full h-9 px-3 rounded-xl border border-[#E5E4DF] text-[12.5px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8A8F98] mb-1">
                  Equipe / Dupla
                </label>
                <select
                  value={reportTeamFilter}
                  onChange={(e) => setReportTeamFilter(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-[#E5E4DF] text-[12.5px]"
                >
                  <option value="all">Todas as equipes</option>
                  {activeTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8A8F98] mb-1">
                  Grupo / Setor
                </label>
                <select
                  value={reportGroupFilter}
                  onChange={(e) => setReportGroupFilter(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-[#E5E4DF] text-[12.5px]"
                >
                  <option value="all">Todos (Campo + Atendimento)</option>
                  <option value="A">Somente Grupo A</option>
                  <option value="B">Somente Grupo B</option>
                  <option value="campo">Somente Equipe de Campo</option>
                  <option value="atendimento">Somente Atendimento</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8A8F98] mb-1">
                  Filtro Rápido de Situação
                </label>
                <select
                  value={reportEventFilter}
                  onChange={(e) => setReportEventFilter(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-[#E5E4DF] text-[12.5px]"
                >
                  <option value="all">Todos os funcionários</option>
                  <option value="com_ocorrencia">
                    Somente com Trocas / Férias / Obs.
                  </option>
                  <option value="com_adicional">
                    Somente com Dia Adicional (+R$)
                  </option>
                  <option value="com_plantao">
                    Somente quem fez Plantão (Dom/Fer)
                  </option>
                  <option value="com_ferias">
                    Somente com Férias / Ausência
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8A8F98] mb-1">
                  Ordenar Por
                </label>
                <select
                  value={reportSortBy}
                  onChange={(e) => setReportSortBy(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-[#E5E4DF] text-[12.5px]"
                >
                  <option value="padrao">Setor e Dias Trabalhados</option>
                  <option value="maior_valor">Maior Valor a Receber (R$)</option>
                  <option value="mais_plantoes">
                    Mais Plantões e Adicionais
                  </option>
                  <option value="mais_trabalhados">
                    Mais Dias Trabalhados
                  </option>
                  <option value="nome">Ordem Alfabética (A-Z)</option>
                </select>
              </div>
            </div>

            {(reportSearch ||
              reportTeamFilter !== "all" ||
              reportGroupFilter !== "all" ||
              reportEventFilter !== "all") && (
              <div className="mt-3 pt-2.5 border-t border-[#F2F1EC] flex items-center justify-between text-[12px]">
                <span className="text-[#6B7280]">
                  Exibindo <strong>{filteredEmployeeReport.length}</strong>{" "}
                  funcionário(s) e <strong>{filteredTeamRows.length}</strong>{" "}
                  equipe(s) com os filtros ativos.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReportSearch("");
                    setReportTeamFilter("all");
                    setReportGroupFilter("all");
                    setReportEventFilter("all");
                    setReportSortBy("padrao");
                  }}
                  className="text-[#14181F] font-semibold underline"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </div>

          {/* Card 1: Resumo do período por Equipe */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <div className="pb-3 mb-3 border-b border-[#EBEBE6]">
              <h2 className="font-heading text-[18px] font-bold text-[#14181F]">
                Resumo por Equipe — {reportPeriodInfo.title} (
                {filteredTeamRows.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#EBEBE6] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A8F98]">
                    <th className="py-2.5 px-2.5">Equipe</th>
                    <th className="py-2.5 px-2.5 text-center">Trabalha</th>
                    <th className="py-2.5 px-2.5 text-center">Folga</th>
                    <th className="py-2.5 px-2.5 text-center">Plantão dom.</th>
                    <th className="py-2.5 px-2.5 text-center">Plantão fer.</th>
                    <th className="py-2.5 px-2.5 text-center">Troca</th>
                    <th className="py-2.5 px-2.5 text-center">Feriado</th>
                    <th className="py-2.5 px-2.5 text-center">Férias</th>
                    <th className="py-2.5 px-2.5 text-center">Ausência</th>
                    <th className="py-2.5 px-2.5 text-right">
                      Total Trabalhado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F1EC]">
                  {filteredTeamRows.map((r) => (
                    <tr key={r.team.id} className="hover:bg-[#FBFAF7]">
                      <td className="py-2.5 px-2.5 font-semibold text-[#14181F]">
                        {r.team.name}{" "}
                        <span className="text-[11px] font-normal text-[#8A8F98]">
                          ({r.team.group})
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-center tabular-nums">
                        {r.trabalha}
                      </td>
                      <td className="py-2.5 px-2.5 text-center tabular-nums">
                        {r.folga}
                      </td>
                      <td className="py-2.5 px-2.5 text-center tabular-nums font-semibold text-[#C2410C]">
                        {r.plantao_domingo}
                      </td>
                      <td className="py-2.5 px-2.5 text-center tabular-nums font-semibold text-[#6D28D9]">
                        {r.plantao_feriado}
                      </td>
                      <td className="py-2.5 px-2.5 text-center tabular-nums font-semibold text-[#1D4ED8]">
                        {r.troca}
                      </td>
                      <td className="py-2.5 px-2.5 text-center tabular-nums">
                        {r.feriado}
                      </td>
                      <td className="py-2.5 px-2.5 text-center tabular-nums">
                        {r.ferias}
                      </td>
                      <td className="py-2.5 px-2.5 text-center tabular-nums">
                        {r.ausencia}
                      </td>
                      <td className="py-2.5 px-2.5 text-right tabular-nums font-bold text-[#065F46]">
                        {r.total_trabalhado} dias
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Relatório Individual por Funcionário + Cálculo Financeiro de Diárias e Detalhamento */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#EBEBE6]">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="font-heading text-[17px] font-bold text-[#14181F]">
                    Relatório Individual por Funcionário —{" "}
                    {reportPeriodInfo.title} ({filteredEmployeeReport.length})
                  </h2>
                  <button
                    type="button"
                    onClick={handleExportDutiesAndHolidaysExcel}
                    className="h-8 px-3.5 rounded-full bg-[#8B5CF6]/15 text-[#6D28D9] border border-[#8B5CF6]/30 text-[12px] font-semibold hover:bg-[#8B5CF6]/25 transition inline-flex items-center gap-1.5 no-print"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Só Plantões e Feriados (.xls)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportEmployeeExcelNoValues}
                    className="h-8 px-3.5 rounded-full bg-[#10B981]/15 text-[#065F46] border border-[#10B981]/30 text-[12px] font-semibold hover:bg-[#10B981]/25 transition inline-flex items-center gap-1.5 no-print"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Excel Geral (Sem R$)</span>
                  </button>
                </div>
                <p className="text-[12.5px] text-[#6B7280] mt-0.5">
                  Inclui contagem de dias normais, plantões,{" "}
                  <strong>dias adicionais trabalhados na folga</strong> e todas
                  as anotações (o arquivo Excel baixado não exibe valores em R$).
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 no-print">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#8A8F98]">
                    Dia Normal (R$)
                  </label>
                  <input
                    type="number"
                    value={appState.settings.rate_dia_normal ?? 0}
                    onChange={(e) =>
                      setAppState((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          rate_dia_normal: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full h-8 px-2.5 rounded-lg border border-[#E5E4DF] text-[12px] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#C2410C]">
                    Plantão Dom. (R$)
                  </label>
                  <input
                    type="number"
                    value={appState.settings.rate_plantao_domingo ?? 150}
                    onChange={(e) =>
                      setAppState((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          rate_plantao_domingo: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full h-8 px-2.5 rounded-lg border border-[#E5E4DF] text-[12px] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#6D28D9]">
                    Plantão Fer. (R$)
                  </label>
                  <input
                    type="number"
                    value={appState.settings.rate_plantao_feriado ?? 180}
                    onChange={(e) =>
                      setAppState((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          rate_plantao_feriado: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full h-8 px-2.5 rounded-lg border border-[#E5E4DF] text-[12px] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#1D4ED8]">
                    Dia Adicional / Folga (R$)
                  </label>
                  <input
                    type="number"
                    value={appState.settings.rate_dia_adicional ?? 150}
                    onChange={(e) =>
                      setAppState((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          rate_dia_adicional: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-full h-8 px-2.5 rounded-lg border border-[#E5E4DF] text-[12px] font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#EBEBE6] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8F98]">
                    <th className="py-2.5 px-2.5">Funcionário</th>
                    <th className="py-2.5 px-2.5 text-center">Normais</th>
                    <th className="py-2.5 px-2.5 text-center">Plantão Dom.</th>
                    <th className="py-2.5 px-2.5 text-center">Plantão Fer.</th>
                    <th className="py-2.5 px-2.5 text-center">
                      Dia Adicional
                    </th>
                    <th className="py-2.5 px-2.5 text-center">Férias/Aus.</th>
                    <th className="py-2.5 px-2.5 text-center">Folgas</th>
                    <th className="py-2.5 px-2.5">
                      Histórico e Descrições (Férias, Trocas, Adicionais e Obs.)
                    </th>
                    <th className="py-2.5 px-2.5 text-right">
                      Total Trabalhado
                    </th>
                    <th className="py-2.5 px-2.5 text-right">
                      Adicional / Total (R$)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F1EC]">
                  {filteredEmployeeReport.map((emp) => {
                    const rNorm = Number(
                      appState.settings.rate_dia_normal ?? 0
                    );
                    const rDom = Number(
                      appState.settings.rate_plantao_domingo ?? 150
                    );
                    const rFer = Number(
                      appState.settings.rate_plantao_feriado ?? 180
                    );
                    const rAdd = Number(
                      appState.settings.rate_dia_adicional ?? 150
                    );
                    const totalFinanceiro =
                      emp.diasNormais * rNorm +
                      emp.plantoesDomingo * rDom +
                      emp.plantoesFeriado * rFer +
                      emp.diasAdicionais * rAdd;

                    return (
                      <tr
                        key={emp.name}
                        className="hover:bg-[#FBFAF7] align-top"
                      >
                        <td className="py-3 px-2.5">
                          <div className="font-semibold text-[#14181F]">
                            {emp.name}
                          </div>
                          <div className="text-[11px] text-[#8A8F98]">
                            {emp.teamName} (Grp {emp.group})
                          </div>
                        </td>
                        <td className="py-3 px-2.5 text-center tabular-nums font-medium">
                          {emp.diasNormais}
                        </td>
                        <td className="py-3 px-2.5 text-center tabular-nums">
                          {emp.plantoesDomingo > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#F97316]/15 text-[#C2410C] font-bold">
                              {emp.plantoesDomingo}
                            </span>
                          ) : (
                            <span className="text-[#A3A8B1]">0</span>
                          )}
                        </td>
                        <td className="py-3 px-2.5 text-center tabular-nums">
                          {emp.plantoesFeriado > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#6D28D9] font-bold">
                              {emp.plantoesFeriado}
                            </span>
                          ) : (
                            <span className="text-[#A3A8B1]">0</span>
                          )}
                        </td>
                        <td className="py-3 px-2.5 text-center tabular-nums">
                          {emp.diasAdicionais > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#1D4ED8] font-bold">
                              +{emp.diasAdicionais}
                            </span>
                          ) : (
                            <span className="text-[#A3A8B1]">0</span>
                          )}
                        </td>
                        <td className="py-3 px-2.5 text-center tabular-nums">
                          {emp.feriasAusencias > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#EAB308]/25 text-[#854D0E] font-bold">
                              {emp.feriasAusencias}d
                            </span>
                          ) : (
                            <span className="text-[#A3A8B1]">0</span>
                          )}
                        </td>
                        <td className="py-3 px-2.5 text-center tabular-nums text-[#6B7280]">
                          {emp.folgas}
                        </td>
                        <td className="py-3 px-2.5 min-w-[270px] max-w-[420px]">
                          {emp.occurrences && emp.occurrences.length > 0 ? (
                            <div className="space-y-1.5">
                              {emp.occurrences.map((occ, idx) => (
                                <div
                                  key={`${occ.date}-${idx}`}
                                  className="text-[11.5px] leading-snug p-1.5 rounded-lg bg-[#FBFAF7] border border-[#EBEBE6] flex flex-wrap items-center gap-1.5"
                                >
                                  <span className="font-mono font-semibold text-[#14181F] tabular-nums">
                                    {formatShortDate(occ.date).slice(0, 5)}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                      occ.color === "domingo"
                                        ? "bg-[#F97316]/15 text-[#C2410C]"
                                        : occ.color === "feriado"
                                        ? "bg-[#8B5CF6]/15 text-[#6D28D9]"
                                        : occ.color === "adicional"
                                        ? "bg-[#3B82F6]/15 text-[#1D4ED8]"
                                        : occ.color === "ferias" ||
                                          occ.color === "ausencia"
                                        ? "bg-[#EAB308]/25 text-[#854D0E]"
                                        : "bg-[#EBEBE6] text-[#42474F]"
                                    }`}
                                  >
                                    {occ.badge}
                                  </span>
                                  <span className="text-[#42474F]">
                                    {occ.description}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11.5px] text-[#A3A8B1]">
                              Sem ocorrências extras no mês
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2.5 text-right tabular-nums font-bold text-[#065F46] whitespace-nowrap">
                          {emp.totalTrabalhado} dias
                        </td>
                        <td className="py-3 px-2.5 text-right tabular-nums font-bold text-[#14181F] whitespace-nowrap">
                          {totalFinanceiro.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2B: Relatório Exclusivo de Plantões (Domingos, Feriados e Dias Adicionais) */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#EBEBE6]">
              <div>
                <h2 className="font-heading text-[17px] font-bold text-[#14181F]">
                  Resumo Exclusivo de Plantões e Feriados por Funcionário —{" "}
                  {reportPeriodInfo.title}
                </h2>
                <p className="text-[12.5px] text-[#6B7280]">
                  Exibe apenas quem realizou plantão de domingo, plantão de
                  feriado ou dia adicional de cobertura no período (sem valores
                  financeiros).
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportDutiesAndHolidaysExcel}
                className="h-9 px-4 rounded-full bg-[#8B5CF6] text-white text-[12.5px] font-semibold hover:bg-[#7C3AED] transition inline-flex items-center gap-1.5 shadow-sm no-print"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Excel Só Plantões e Feriados</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#EBEBE6] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8A8F98]">
                    <th className="py-2.5 px-2.5">Funcionário</th>
                    <th className="py-2.5 px-2.5 text-center">
                      Plantão Domingo
                    </th>
                    <th className="py-2.5 px-2.5 text-center">
                      Plantão Feriado
                    </th>
                    <th className="py-2.5 px-2.5 text-center">Dia Adicional</th>
                    <th className="py-2.5 px-2.5">
                      Datas e Descrições dos Plantões / Feriados / Trocas
                    </th>
                    <th className="py-2.5 px-2.5 text-right">
                      Total de Plantões
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F1EC]">
                  {filteredEmployeeReport
                    .filter(
                      (emp) =>
                        emp.plantoesDomingo +
                          emp.plantoesFeriado +
                          emp.diasAdicionais >
                        0
                    )
                    .map((emp) => {
                      const dutyOccs = (emp.occurrences || []).filter((occ) =>
                        ["domingo", "feriado", "adicional"].includes(occ.color)
                      );
                      const totalExtras =
                        emp.plantoesDomingo +
                        emp.plantoesFeriado +
                        emp.diasAdicionais;

                      return (
                        <tr
                          key={`duty-${emp.name}`}
                          className="hover:bg-[#FBFAF7] align-top"
                        >
                          <td className="py-3 px-2.5">
                            <div className="font-semibold text-[#14181F]">
                              {emp.name}
                            </div>
                            <div className="text-[11px] text-[#8A8F98]">
                              {emp.teamName} (Grp {emp.group})
                            </div>
                          </td>
                          <td className="py-3 px-2.5 text-center tabular-nums">
                            {emp.plantoesDomingo > 0 ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#F97316]/15 text-[#C2410C] font-bold">
                                {emp.plantoesDomingo}
                              </span>
                            ) : (
                              <span className="text-[#A3A8B1]">0</span>
                            )}
                          </td>
                          <td className="py-3 px-2.5 text-center tabular-nums">
                            {emp.plantoesFeriado > 0 ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#6D28D9] font-bold">
                                {emp.plantoesFeriado}
                              </span>
                            ) : (
                              <span className="text-[#A3A8B1]">0</span>
                            )}
                          </td>
                          <td className="py-3 px-2.5 text-center tabular-nums">
                            {emp.diasAdicionais > 0 ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#1D4ED8] font-bold">
                                +{emp.diasAdicionais}
                              </span>
                            ) : (
                              <span className="text-[#A3A8B1]">0</span>
                            )}
                          </td>
                          <td className="py-3 px-2.5 min-w-[270px] max-w-[440px]">
                            <div className="space-y-1.5">
                              {dutyOccs.map((occ, idx) => (
                                <div
                                  key={`${occ.date}-${idx}`}
                                  className="text-[11.5px] leading-snug p-1.5 rounded-lg bg-[#FBFAF7] border border-[#EBEBE6] flex flex-wrap items-center gap-1.5"
                                >
                                  <span className="font-mono font-semibold text-[#14181F] tabular-nums">
                                    {formatShortDate(occ.date).slice(0, 5)}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                      occ.color === "domingo"
                                        ? "bg-[#F97316]/15 text-[#C2410C]"
                                        : occ.color === "feriado"
                                        ? "bg-[#8B5CF6]/15 text-[#6D28D9]"
                                        : "bg-[#3B82F6]/15 text-[#1D4ED8]"
                                    }`}
                                  >
                                    {String(occ.badge || "").replace(
                                      /\s*\(\+R\$\)/g,
                                      ""
                                    )}
                                  </span>
                                  <span className="text-[#42474F]">
                                    {occ.description}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-2.5 text-right tabular-nums font-bold text-[#065F46] whitespace-nowrap">
                            <span className="px-3 py-1 rounded-full bg-[#10B981]/15 text-[#065F46]">
                              {totalExtras}{" "}
                              {totalExtras === 1 ? "plantão" : "plantões"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 3: Histórico Detalhado de Férias, Trocas, Coberturas e Anotações do Período */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-4 sm:p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <h2 className="font-heading text-[17px] font-bold text-[#14181F] mb-1">
              Histórico Detalhado de Férias, Trocas, Coberturas e Observações —{" "}
              {reportPeriodInfo.title}
            </h2>
            <p className="text-[12.5px] text-[#6B7280] mb-3">
              Todas as ocorrências, substituições e motivos registrados para os
              funcionários filtrados.
            </p>
            <div className="divide-y divide-[#F2F1EC]">
              {filteredEmployeeReport
                .flatMap((emp) =>
                  (emp.occurrences || []).map((occ) => ({
                    ...occ,
                    empName: emp.name,
                    teamName: emp.teamName,
                  }))
                )
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((item, idx) => (
                  <div
                    key={`${item.date}-${item.empName}-${idx}`}
                    className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[13px]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-semibold text-[#14181F] tabular-nums">
                        {formatShortDate(item.date)}
                      </span>
                      <span className="font-bold text-[#14181F]">
                        {item.empName}
                      </span>
                      <span className="text-[11.5px] text-[#8A8F98]">
                        ({item.teamName})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.color === "domingo"
                            ? "bg-[#F97316]/15 text-[#C2410C]"
                            : item.color === "feriado"
                            ? "bg-[#8B5CF6]/15 text-[#6D28D9]"
                            : item.color === "adicional"
                            ? "bg-[#3B82F6]/15 text-[#1D4ED8]"
                            : item.color === "ferias" ||
                              item.color === "ausencia"
                            ? "bg-[#EAB308]/25 text-[#854D0E]"
                            : "bg-[#F3F2ED] text-[#42474F]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-[12.5px] text-[#42474F]">
                      {item.description}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Card 4: Plantões do período */}
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <h2 className="font-heading text-[17px] font-bold text-[#14181F] mb-3">
              Plantões do período ({filteredDuties.length})
            </h2>
            <div className="divide-y divide-[#F2F1EC]">
              {filteredDuties.map((d, i) => (
                <div
                  key={`${d.date}-${i}`}
                  className="py-2.5 flex items-center justify-between text-[13px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-[#14181F] tabular-nums">
                      {formatShortDate(d.date)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F3F2ED] text-[11.5px] font-medium text-[#42474F]">
                      {d.kind}
                    </span>
                  </div>
                  <span className="font-semibold text-[#14181F]">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 8: SENHA DO ADMIN                                                 */}
      {/* ===================================================================== */}
      {activeTab === "seguranca" && (
        <div className="max-w-lg">
          <div className="bg-white border border-[#EBEBE6] rounded-[18px] p-5 shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
            <h2 className="font-heading text-[17px] font-bold text-[#14181F] mb-1">
              Acesso Restrito do Administrador
            </h2>
            <p className="text-[13px] text-[#6B7280] mb-4">
              Qualquer pessoa que abrir o link do site verá apenas o modo de{" "}
              <strong>Consulta Livre (Somente Leitura)</strong>. Todas as
              alterações que você fizer logado como Admin são{" "}
              <strong>sincronizadas automaticamente em tempo real</strong> para
              todos.
            </p>
            <form onSubmit={handleSaveCredentials} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Usuário ou E-mail do Admin
                </label>
                <input
                  type="text"
                  value={credForm.email}
                  onChange={(e) =>
                    setCredForm({ ...credForm, email: e.target.value })
                  }
                  placeholder="admin"
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#42474F] mb-1">
                  Senha do Administrador
                </label>
                <input
                  type="password"
                  value={credForm.password}
                  onChange={(e) =>
                    setCredForm({ ...credForm, password: e.target.value })
                  }
                  placeholder="Digite a nova senha"
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E4DF] text-[13px]"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-5 h-10 rounded-full bg-[#14181F] text-white text-[13px] font-semibold hover:bg-[#272D38] transition"
              >
                Salvar Senha de Admin
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
