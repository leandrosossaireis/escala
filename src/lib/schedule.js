// ============================================================================
// Escala Fácil Pro — Complete Schedule Calculation Engine (src/lib/schedule.js)
// Replicates 100% of the Base44 server-side buildCalendar logic + extensions
// for employee workday & daily service order tracking.
// ============================================================================

export const STATUS_META = {
  trabalha:        { label: "Trabalha",           short: "Trabalha",     colorKey: "trabalha" },
  folga:           { label: "Folga",              short: "Folga",        colorKey: "folga" },
  plantao_domingo: { label: "Plantão de domingo", short: "Plantão dom.", colorKey: "plantao_domingo" },
  plantao_feriado: { label: "Plantão de feriado", short: "Plantão fer.", colorKey: "plantao_feriado" },
  troca:           { label: "Troca de plantão",   short: "Troca",        colorKey: "troca" },
  feriado:         { label: "Feriado",            short: "Feriado",      colorKey: "feriado" },
  alteracao:       { label: "Alteração",          short: "Alteração",    colorKey: "alteracao" },
  ferias:          { label: "Férias",             short: "Férias",       colorKey: "ferias" },
  ausencia:        { label: "Ausência",           short: "Ausência",     colorKey: "ferias" },
};

export const COLOR_SETTINGS = [
  { key: "trabalha",        setting: "color_trabalha",        label: "Trabalha" },
  { key: "folga",           setting: "color_folga",           label: "Folga" },
  { key: "plantao_domingo", setting: "color_plantao_domingo", label: "Plantão de domingo" },
  { key: "plantao_feriado", setting: "color_plantao_feriado", label: "Plantão de feriado" },
  { key: "troca",           setting: "color_troca",           label: "Troca de plantão" },
  { key: "feriado",         setting: "color_feriado",         label: "Feriado" },
  { key: "alteracao",       setting: "color_alteracao",       label: "Alteração" },
  { key: "ferias",          setting: "color_ferias",          label: "Férias / Ausência" },
];

export const CODE_DEFAULT_COLORS = {
  trabalha: "#10B981",
  folga: "#EF4444",
  plantao_domingo: "#F97316",
  plantao_feriado: "#8B5CF6",
  troca: "#DB2777",
  feriado: "#A7F3D0",
  alteracao: "#3B82F6",
  ferias: "#60A5FA",
};

// Active colors configured on the live https://remarkable-escala-facil-flow.base44.app instance
export const LIVE_COLORS = {
  trabalha: "#10B981",
  folga: "#EF4444",
  plantao_domingo: "#F97316",
  plantao_feriado: "#8B5CF6",
  troca: "#3b82f6",
  feriado: "#bababa",
  alteracao: "#3B82F6",
  ferias: "#efff14",
};

export const DEFAULT_SETTINGS = {
  schedule_anchor: "2026-01-05",
  anchor_group: "B", // In week of 2026-01-05, Group B works Mon-Fri and Group A works Tue-Sat (meaning week of 2026-11-02 Group A works Mon-Fri)
  rotation_start: "2026-01-01",
  mateus_name: "Mateus",
  mateus_folga_dates: ["2026-12-20"],
  color_trabalha: LIVE_COLORS.trabalha,
  color_folga: LIVE_COLORS.folga,
  color_plantao_domingo: LIVE_COLORS.plantao_domingo,
  color_plantao_feriado: LIVE_COLORS.plantao_feriado,
  color_troca: LIVE_COLORS.troca,
  color_feriado: LIVE_COLORS.feriado,
  color_alteracao: LIVE_COLORS.alteracao,
  color_ferias: LIVE_COLORS.ferias,
  rate_dia_normal: 0,
  rate_plantao_domingo: 150,
  rate_plantao_feriado: 180,
  rate_servico_bonus: 0,
};

export const HOLIDAY_LABELS = {
  nacional: "Feriado nacional",
  estadual: "Feriado estadual",
  municipal: "Feriado municipal",
  facultativo: "Ponto facultativo",
};

export const INITIAL_TEAMS = [
  { id: "6ae3ae28910b0403b224d7a4", name: "Lucas / Felipe",   kind: "campo",       group: "A", order: 1, active: true, members: ["Lucas", "Felipe"] },
  { id: "6ae3ae28910b0403b224d7a5", name: "Facão / Alison",   kind: "campo",       group: "A", order: 2, active: true, members: ["Facão", "Alison"] },
  { id: "6ae3ae28910b0403b224d7a6", name: "Tilú / Fernando",  kind: "campo",       group: "A", order: 3, active: true, members: ["Tilú", "Fernando"] },
  { id: "6ae3ae28910b0403b224d7a7", name: "Welliton / Igor",  kind: "campo",       group: "B", order: 4, active: true, members: ["Welliton", "Igor"] },
  { id: "6ae3ae28910b0403b224d7a8", name: "Guto / Sasa",      kind: "campo",       group: "B", order: 5, active: true, members: ["Guto", "Sasa"] },
  { id: "6ae3ae28910b0403b224d7a9", name: "Bigode / Eduardo", kind: "campo",       group: "B", order: 6, active: true, members: ["Bigode", "Eduardo"] },
  { id: "6ae3ae28910b0403b224d7aa", name: "Alex",             kind: "atendimento", group: "A", order: 1, active: true, members: ["Alex"] },
  { id: "6ae3ae28910b0403b224d7ab", name: "João",             kind: "atendimento", group: "A", order: 2, active: true, members: ["João"] },
  { id: "6ae3ae28910b0403b224d7ac", name: "Leandro",          kind: "atendimento", group: "B", order: 3, active: true, members: ["Leandro"] },
  { id: "6ae3ae28910b0403b224d7ad", name: "Victor",           kind: "atendimento", group: "B", order: 4, active: true, members: ["Victor"] },
];

export const INITIAL_HOLIDAYS = [
  { id: "hol-2026-01-01", date: "2026-01-01", name: "Confraternização Universal", type: "nacional" },
  { id: "hol-2026-02-16", date: "2026-02-16", name: "Carnaval (segunda)",         type: "facultativo" },
  { id: "hol-2026-02-17", date: "2026-02-17", name: "Carnaval (terça)",           type: "facultativo" },
  { id: "hol-2026-04-03", date: "2026-04-03", name: "Sexta-feira Santa",          type: "nacional" },
  { id: "hol-2026-04-21", date: "2026-04-21", name: "Tiradentes",                 type: "nacional" },
  { id: "hol-2026-05-01", date: "2026-05-01", name: "Dia do Trabalho",            type: "nacional" },
  { id: "hol-2026-06-04", date: "2026-06-04", name: "Corpus Christi",             type: "facultativo" },
  { id: "hol-2026-07-09", date: "2026-07-09", name: "Revolução Constitucionalista (SP)", type: "estadual" },
  { id: "hol-2026-09-07", date: "2026-09-07", name: "Independência do Brasil",    type: "nacional" },
  { id: "hol-2026-10-12", date: "2026-10-12", name: "Nossa Senhora Aparecida",    type: "nacional" },
  { id: "hol-2026-11-02", date: "2026-11-02", name: "Finados",                    type: "nacional" },
  { id: "hol-2026-11-15", date: "2026-11-15", name: "Proclamação da República",   type: "nacional" },
  { id: "hol-2026-11-20", date: "2026-11-20", name: "Dia da Consciência Negra",   type: "nacional" },
  { id: "hol-2026-12-13", date: "2026-12-13", name: "Dia de Santa Luzia (Pinhal-SP)", type: "municipal" },
  { id: "hol-2026-12-25", date: "2026-12-25", name: "Natal",                      type: "nacional" },
  { id: "hol-2026-12-27", date: "2026-12-27", name: "Aniversário de Espírito Santo do Pinhal", type: "municipal" },
  { id: "hol-2027-01-01", date: "2027-01-01", name: "Ano Novo",                   type: "nacional" },
];

export const INITIAL_OVERRIDES = [
  {
    id: "ovr-nov-20-lucas",
    date: "2026-11-20",
    team_id: "6ae3ae28910b0403b224d7a4",
    status: "troca",
    custom_name: "Lucas / Alison",
    member_out: "Felipe",
    member_in: "Alison",
    note: "Troca de plantão Dia da Consciência Negra (Alison cobriu Felipe)",
  },
  {
    id: "ovr-nov-20-facao",
    date: "2026-11-20",
    team_id: "6ae3ae28910b0403b224d7a5",
    status: "troca",
    custom_name: "Lucas / Alison",
    member_out: "Felipe",
    member_in: "Alison",
    note: "Troca de plantão Dia da Consciência Negra (Alison cobriu Felipe)",
  },
  {
    id: "ovr-nov-22-lucas",
    date: "2026-11-22",
    team_id: "6ae3ae28910b0403b224d7a4",
    status: "troca",
    custom_name: "Lucas / Alison",
    member_out: "Facão",
    member_in: "Lucas",
    note: "Troca de plantão de domingo (Lucas cobriu Facão)",
  },
  {
    id: "ovr-nov-22-facao",
    date: "2026-11-22",
    team_id: "6ae3ae28910b0403b224d7a5",
    status: "troca",
    custom_name: "Lucas / Alison",
    member_out: "Facão",
    member_in: "Lucas",
    note: "Troca de plantão de domingo (Lucas cobriu Facão)",
  },
];

export const INITIAL_ABSENCES = [
  {
    id: "abs-nov-01-welliton",
    team_id: "6ae3ae28910b0403b224d7a7",
    member: null,
    substitute_member: null,
    kind: "ausencia",
    start_date: "2026-11-01",
    end_date: "2026-11-01",
    note: "Ausência no plantão de domingo",
  },
  {
    id: "abs-nov-17-21-welliton",
    team_id: "6ae3ae28910b0403b224d7a7",
    member: "Welliton",
    substitute_member: null,
    kind: "ferias",
    start_date: "2026-11-17",
    end_date: "2026-11-21",
    note: "Férias do Welliton (Igor permaneceu trabalhando normal)",
  },
];

// Explicit Sunday/Holiday duty overrides so the default 2026 calendar matches the live app 100%
export const INITIAL_DUTY_OVERRIDES = [
  // Live 2026 Sunday duties from Base44 instance
  { date: "2026-01-04", kind: "campo", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-01-04", kind: "atendimento", team_id: "6ae3ae28910b0403b224d7aa" },
  { date: "2026-01-11", kind: "campo", team_id: "6ae3ae28910b0403b224d7a7" },
  { date: "2026-01-18", kind: "campo", team_id: "6ae3ae28910b0403b224d7a5" },
  { date: "2026-01-25", kind: "campo", team_id: "6ae3ae28910b0403b224d7a8" },

  { date: "2026-02-01", kind: "campo", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-02-01", kind: "atendimento", team_id: "6ae3ae28910b0403b224d7aa" },
  { date: "2026-02-08", kind: "campo", team_id: "6ae3ae28910b0403b224d7a7" },
  { date: "2026-02-15", kind: "campo", team_id: "6ae3ae28910b0403b224d7a5" },
  { date: "2026-02-22", kind: "campo", team_id: "6ae3ae28910b0403b224d7a8" },

  { date: "2026-03-01", kind: "campo", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-03-01", kind: "atendimento", team_id: "6ae3ae28910b0403b224d7aa" },
  { date: "2026-03-08", kind: "campo", team_id: "6ae3ae28910b0403b224d7a7" },
  { date: "2026-03-15", kind: "campo", team_id: "6ae3ae28910b0403b224d7a5" },
  { date: "2026-03-22", kind: "campo", team_id: "6ae3ae28910b0403b224d7a8" },
  { date: "2026-03-29", kind: "campo", team_id: "6ae3ae28910b0403b224d7a6" },

  { date: "2026-04-05", kind: "campo", team_id: "6ae3ae28910b0403b224d7a7" },
  { date: "2026-04-05", kind: "atendimento", team_id: "6ae3ae28910b0403b224d7ac" },
  { date: "2026-04-12", kind: "campo", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-04-19", kind: "campo", team_id: "6ae3ae28910b0403b224d7a8" },
  { date: "2026-04-26", kind: "campo", team_id: "6ae3ae28910b0403b224d7a5" },

  { date: "2026-05-03", kind: "campo", team_id: "6ae3ae28910b0403b224d7a7" },
  { date: "2026-05-03", kind: "atendimento", team_id: "6ae3ae28910b0403b224d7ac" },
  { date: "2026-05-10", kind: "campo", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-05-17", kind: "campo", team_id: "6ae3ae28910b0403b224d7a8" },
  { date: "2026-05-24", kind: "campo", team_id: "6ae3ae28910b0403b224d7a5" },
  { date: "2026-05-31", kind: "campo", team_id: "6ae3ae28910b0403b224d7a9" },

  { date: "2026-06-07", kind: "campo", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-06-07", kind: "atendimento", team_id: "6ae3ae28910b0403b224d7aa" },
  { date: "2026-06-14", kind: "campo", team_id: "6ae3ae28910b0403b224d7a7" },
  { date: "2026-06-21", kind: "campo", team_id: "6ae3ae28910b0403b224d7a5" },
  { date: "2026-06-28", kind: "campo", team_id: "6ae3ae28910b0403b224d7a8" },

  { date: "2026-07-05", kind: "campo", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-07-05", kind: "atendimento", team_id: "6ae3ae28910b0403b224d7aa" },
  { date: "2026-07-12", kind: "campo", team_id: "6ae3ae28910b0403b224d7a7" },
  { date: "2026-07-19", kind: "campo", team_id: "6ae3ae28910b0403b224d7a5" },
  { date: "2026-07-26", kind: "campo", team_id: "6ae3ae28910b0403b224d7a8" },

  { date: "2026-08-02", kind: "campo", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-08-02", kind: "atendimento", team_id: "6ae3ae28910b0403b224d7aa" },
  { date: "2026-08-09", kind: "campo", team_id: "6ae3ae28910b0403b224d7a7" },
  { date: "2026-08-16", kind: "campo", team_id: "6ae3ae28910b0403b224d7a5" },
  { date: "2026-08-23", kind: "campo", team_id: "6ae3ae28910b0403b224d7a8" },
  { date: "2026-08-30", kind: "campo", team_id: "6ae3ae28910b0403b224d7a6" },

  { date: "2026-09-06", kind: "campo", team_id: "6ae3ae28910b0403b224d7a7" },
  { date: "2026-09-06", kind: "atendimento", team_id: "6ae3ae28910b0403b224d7ac" },
  { date: "2026-09-13", kind: "campo", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-09-20", kind: "campo", team_id: "6ae3ae28910b0403b224d7a8" },
  { date: "2026-09-27", kind: "campo", team_id: "6ae3ae28910b0403b224d7a5" },

  { date: "2026-10-04", kind: "campo", team_id: "6ae3ae28910b0403b224d7a7" },
  { date: "2026-10-04", kind: "atendimento", team_id: "6ae3ae28910b0403b224d7ac" },
  { date: "2026-10-11", kind: "campo", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-10-18", kind: "campo", team_id: "6ae3ae28910b0403b224d7a8" },
  { date: "2026-10-25", kind: "campo", team_id: "6ae3ae28910b0403b224d7a5" },

  { date: "2026-11-01", kind: "campo", team_id: "6ae3ae28910b0403b224d7a7" },
  { date: "2026-11-01", kind: "atendimento", team_id: "6ae3ae28910b0403b224d7aa" },
  { date: "2026-11-08", kind: "campo", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-11-15", kind: "campo", team_id: "6ae3ae28910b0403b224d7a8" },
  { date: "2026-11-22", kind: "campo", team_id: "6ae3ae28910b0403b224d7a5" },
  { date: "2026-11-29", kind: "campo", team_id: "6ae3ae28910b0403b224d7a9" },

  { date: "2026-12-06", kind: "campo", team_id: "6ae3ae28910b0403b224d7a6" },
  { date: "2026-12-13", kind: "campo", team_id: "6ae3ae28910b0403b224d7a7" },
  { date: "2026-12-20", kind: "campo", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-12-20", kind: "atendimento", team_id: "6ae3ae28910b0403b224d7ab" },
  { date: "2026-12-27", kind: "campo", team_id: "6ae3ae28910b0403b224d7a8" },

  // Live 2026 Holiday duties
  { date: "2026-01-01", kind: "holiday", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-04-03", kind: "holiday", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-04-21", kind: "holiday", team_id: "6ae3ae28910b0403b224d7a5" },
  { date: "2026-05-01", kind: "holiday", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-09-07", kind: "holiday", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-10-12", kind: "holiday", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-11-02", kind: "holiday", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-11-20", kind: "holiday", team_id: "6ae3ae28910b0403b224d7a4" },
  { date: "2026-12-25", kind: "holiday", team_id: "6ae3ae28910b0403b224d7a6" },
];

export const INITIAL_SERVICES = [
  {
    id: "srv-1",
    date: "2026-11-02",
    team_id: "6ae3ae28910b0403b224d7a4",
    employees: ["Lucas", "Felipe"],
    category: "Plantão Feriado",
    client: "Atendimento Emergencial / Rede",
    protocol: "OS-2026-1102",
    status: "concluido",
    notes: "Plantão de Finados concluído sem pendências",
  },
  {
    id: "srv-2",
    date: "2026-11-08",
    team_id: "6ae3ae28910b0403b224d7a4",
    employees: ["Lucas", "Felipe"],
    category: "Plantão Domingo",
    client: "Suporte Campo Regional",
    protocol: "OS-2026-1108",
    status: "concluido",
    notes: "3 chamados de reparo externo atendidos",
  },
  {
    id: "srv-3",
    date: "2026-11-15",
    team_id: "6ae3ae28910b0403b224d7a8",
    employees: ["Guto", "Sasa"],
    category: "Plantão Domingo",
    client: "Manutenção Preventiva & Chamados",
    protocol: "OS-2026-1115",
    status: "concluido",
    notes: "Plantão de domingo equipe Guto / Sasa",
  },
  {
    id: "srv-4",
    date: "2026-11-20",
    team_id: "6ae3ae28910b0403b224d7a4",
    employees: ["Lucas", "Alison"],
    category: "Troca de Plantão",
    client: "Plantão Consciência Negra",
    protocol: "OS-2026-1120",
    status: "concluido",
    notes: "Cobertura por troca de plantão (Lucas / Alison)",
  },
];

// ============================================================================
// Date Helpers (UTC-safe noon anchor)
// ============================================================================

export function parseIsoDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function toIsoDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso, count) {
  const d = parseIsoDate(iso);
  d.setUTCDate(d.getUTCDate() + count);
  return toIsoDate(d);
}

export function getWeekday(iso) {
  return parseIsoDate(iso).getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export function getMondayOfWeek(iso) {
  const w = getWeekday(iso);
  const diff = w === 0 ? -6 : 1 - w;
  return addDays(iso, diff);
}

export function diffDays(isoA, isoB) {
  const a = parseIsoDate(isoA).getTime();
  const b = parseIsoDate(isoB).getTime();
  return Math.round((b - a) / 86400000);
}

export function getMonthRange(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  const firstDay = toIsoDate(new Date(Date.UTC(y, m - 1, 1, 12, 0, 0)));
  const lastDay = toIsoDate(new Date(Date.UTC(y, m, 0, 12, 0, 0)));
  const gridStart = getMondayOfWeek(firstDay);
  const lastWeekday = getWeekday(lastDay);
  const gridEnd = lastWeekday === 0 ? lastDay : addDays(lastDay, 7 - lastWeekday);
  return { firstDay, lastDay, gridStart, gridEnd };
}

export function listDaysInRange(startIso, endIso) {
  const days = [];
  let cur = startIso;
  while (cur <= endIso) {
    days.push(cur);
    cur = addDays(cur, 1);
  }
  return days;
}

export function formatMonthTitle(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0));
  const raw = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatShortDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatDayMonth(iso) {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function getContrastColor(hex) {
  if (!hex || typeof hex !== "string") return "#FFFFFF";
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#FFFFFF";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#111827" : "#FFFFFF";
}

export function getColorsFromSettings(settings) {
  return {
    trabalha: settings?.color_trabalha || LIVE_COLORS.trabalha,
    folga: settings?.color_folga || LIVE_COLORS.folga,
    plantao_domingo: settings?.color_plantao_domingo || LIVE_COLORS.plantao_domingo,
    plantao_feriado: settings?.color_plantao_feriado || LIVE_COLORS.plantao_feriado,
    troca: settings?.color_troca || LIVE_COLORS.troca,
    feriado: settings?.color_feriado || LIVE_COLORS.feriado,
    alteracao: settings?.color_alteracao || LIVE_COLORS.alteracao,
    ferias: settings?.color_ferias || LIVE_COLORS.ferias,
  };
}

// ============================================================================
// Dominant Day Status (Matches Lf in Base44 bundle)
// ============================================================================
export function getDominantDayStatus(dayInfo, visibleTeams) {
  if (!dayInfo) return "folga";
  const entries = visibleTeams
    .map((t) => dayInfo.teams?.[t.id])
    .filter(Boolean);

  if (entries.some((e) => e.status === "troca")) return "troca";
  if (dayInfo.weekday === 0 && (dayInfo.campo_team_id || dayInfo.atendimento_team_id)) {
    return "plantao_domingo";
  }
  if (dayInfo.holiday && dayInfo.holiday.type !== "facultativo" && dayInfo.campo_team_id) {
    return "plantao_feriado";
  }

  const counts = {};
  for (const e of entries) {
    counts[e.status] = (counts[e.status] || 0) + 1;
  }

  const priority = [
    "troca",
    "plantao_feriado",
    "plantao_domingo",
    "alteracao",
    "feriado",
    "ferias",
    "ausencia",
    "trabalha",
    "folga",
  ];

  let best = "folga";
  let bestCount = -1;
  for (const status of priority) {
    const c = counts[status] || 0;
    if (c > bestCount) {
      bestCount = c;
      best = status;
    }
  }
  return bestCount > 0 ? best : "folga";
}

// ============================================================================
// Core Schedule Calculation (buildCalendar)
// ============================================================================
export function buildCalendar({
  startIso,
  endIso,
  settings = DEFAULT_SETTINGS,
  teams = INITIAL_TEAMS,
  holidays = INITIAL_HOLIDAYS,
  overrides = INITIAL_OVERRIDES,
  absences = INITIAL_ABSENCES,
  weekOverrides = [],
  dutyOverrides = INITIAL_DUTY_OVERRIDES,
}) {
  const activeTeams = [...teams]
    .filter((t) => t.active !== false)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  const campoTeams = activeTeams.filter((t) => t.kind === "campo");
  const atendimentoTeams = activeTeams.filter((t) => t.kind === "atendimento");

  const anchorMonday = getMondayOfWeek(settings.schedule_anchor || "2026-01-05");
  const anchorGroup = settings.anchor_group || "B";
  const rotationStart = settings.rotation_start || "2026-01-01";

  const holidayMap = {};
  for (const h of holidays) {
    holidayMap[h.date] = h;
  }

  const weekOverrideSet = new Set(
    weekOverrides.filter((w) => w.direction === "inverter").map((w) => getMondayOfWeek(w.week_start))
  );

  const dutyOverrideMap = {};
  for (const d of dutyOverrides) {
    dutyOverrideMap[`${d.date}:${d.kind}`] = d.team_id;
  }

  // Helper: Which group works Mon-Fri in the week of `iso`?
  function getMonFriGroupForDate(iso) {
    const weekMonday = getMondayOfWeek(iso);
    const weeksDiff = Math.round(diffDays(anchorMonday, weekMonday) / 7);
    const isEven = ((weeksDiff % 2) + 2) % 2 === 0;
    let monFriGroup = isEven ? anchorGroup : anchorGroup === "A" ? "B" : "A";
    if (weekOverrideSet.has(weekMonday)) {
      monFriGroup = monFriGroup === "A" ? "B" : "A";
    }
    return monFriGroup;
  }

  // Pre-calculate automatic rotation from rotationStart up to endIso
  const simStart = rotationStart < startIso ? rotationStart : startIso;
  const allSimDays = listDaysInRange(simStart, endIso);

  const sundayDutyCounts = {};
  const lastSundayWorked = {};
  for (const t of campoTeams) {
    sundayDutyCounts[t.id] = 0;
    lastSundayWorked[t.id] = "1970-01-01";
  }

  let holidayRotationIdx = 0;
  let atendimentoRotationIdx = 0;

  // Determine Mateus folga Sunday for each month
  const mateusFolgaByMonth = {};
  for (const d of settings.mateus_folga_dates || []) {
    if (d) mateusFolgaByMonth[d.slice(0, 7)] = d;
  }

  const autoDutyByDate = {}; // date -> { campo_team_id, atendimento_team_id }

  for (const iso of allSimDays) {
    const weekday = getWeekday(iso);
    const holiday = holidayMap[iso] || null;
    const monthKey = iso.slice(0, 7);

    // 1. Sunday duty calculation
    if (weekday === 0) {
      let chosenCampoId = dutyOverrideMap[`${iso}:campo`] || null;
      if (!chosenCampoId && campoTeams.length > 0) {
        const monFriGroup = getMonFriGroupForDate(iso);
        // Prefer teams in monFriGroup (who had Saturday off), balanced by count and oldest lastSundayWorked
        const preferred = campoTeams.filter((t) => t.group === monFriGroup);
        const pool = preferred.length > 0 ? preferred : campoTeams;
        const sorted = [...pool].sort((a, b) => {
          const countDiff = (sundayDutyCounts[a.id] || 0) - (sundayDutyCounts[b.id] || 0);
          if (countDiff !== 0) return countDiff;
          if (lastSundayWorked[a.id] !== lastSundayWorked[b.id]) {
            return lastSundayWorked[a.id].localeCompare(lastSundayWorked[b.id]);
          }
          return a.order - b.order;
        });
        chosenCampoId = sorted[0].id;
      }

      if (chosenCampoId) {
        sundayDutyCounts[chosenCampoId] = (sundayDutyCounts[chosenCampoId] || 0) + 1;
        lastSundayWorked[chosenCampoId] = iso;
      }

      // Atendimento Sunday duty (Mateus's Sunday off, 1st Sunday of month by default or custom date)
      let chosenAtendimentoId = dutyOverrideMap[`${iso}:atendimento`] || null;
      if (!chosenAtendimentoId && atendimentoTeams.length > 0) {
        const configuredSunday = mateusFolgaByMonth[monthKey];
        const dayNum = Number(iso.slice(8, 10));
        const isTargetSunday = configuredSunday ? iso === configuredSunday : dayNum <= 7;
        if (isTargetSunday) {
          const monFriGroup = getMonFriGroupForDate(iso);
          // Pick next in rotation preferring monFriGroup so nobody works Sunday on their only day off
          let picked = null;
          for (let offset = 0; offset < atendimentoTeams.length; offset++) {
            const candidate = atendimentoTeams[(atendimentoRotationIdx + offset) % atendimentoTeams.length];
            if (candidate.group === monFriGroup) {
              picked = candidate;
              atendimentoRotationIdx = (atendimentoRotationIdx + offset + 1) % atendimentoTeams.length;
              break;
            }
          }
          if (!picked) {
            picked = atendimentoTeams[atendimentoRotationIdx % atendimentoTeams.length];
            atendimentoRotationIdx = (atendimentoRotationIdx + 1) % atendimentoTeams.length;
          }
          chosenAtendimentoId = picked?.id || null;
        }
      }

      autoDutyByDate[iso] = {
        campo_team_id: chosenCampoId,
        atendimento_team_id: chosenAtendimentoId,
      };
    }

    // 2. Non-Sunday Holiday duty calculation
    if (weekday !== 0 && holiday && holiday.type !== "facultativo") {
      let chosenHolidayCampoId = dutyOverrideMap[`${iso}:holiday`] || dutyOverrideMap[`${iso}:campo`] || null;
      if (!chosenHolidayCampoId && campoTeams.length > 0) {
        chosenHolidayCampoId = campoTeams[holidayRotationIdx % campoTeams.length].id;
      }
      holidayRotationIdx++;
      autoDutyByDate[iso] = {
        ...(autoDutyByDate[iso] || {}),
        campo_team_id: chosenHolidayCampoId,
      };
    }
  }

  // Index absences & manual overrides for fast lookup
  const overridesByDateTeam = {};
  const overridesByDate = {};
  for (const ovr of overrides) {
    overridesByDateTeam[`${ovr.date}:${ovr.team_id}`] = ovr;
    if (!overridesByDate[ovr.date]) overridesByDate[ovr.date] = [];
    overridesByDate[ovr.date].push(ovr);
  }

  function findAbsences(teamId, iso) {
    return absences.filter(
      (a) => a.team_id === teamId && a.start_date <= iso && iso <= a.end_date
    );
  }

  function getTeamMembers(team) {
    return team.members?.length
      ? team.members
      : team.name.split("/").map((s) => s.trim()).filter(Boolean);
  }

  // Build final requested range
  const rangeDays = listDaysInRange(startIso, endIso);
  const daysResult = {};

  for (const iso of rangeDays) {
    const weekday = getWeekday(iso); // 0=Sun, 1=Mon, ..., 6=Sat
    const holiday = holidayMap[iso] || null;
    const isRealHoliday = Boolean(holiday && holiday.type !== "facultativo");
    const monFriGroup = getMonFriGroupForDate(iso);
    const dutyInfo = autoDutyByDate[iso] || {};

    let campoDutyTeamId = dutyInfo.campo_team_id || null;
    let atendimentoDutyTeamId = dutyInfo.atendimento_team_id || null;
    let campoDutyLabel = null;
    let atendimentoDutyLabel = null;

    const teamStatuses = {};

    for (const team of activeTeams) {
      const isMonFri = team.group === monFriGroup;
      let baseStatus = "folga";

      if (weekday === 0) {
        // Sunday
        if (team.kind === "campo" && campoDutyTeamId === team.id) {
          baseStatus = "plantao_domingo";
        } else if (team.kind === "atendimento" && atendimentoDutyTeamId === team.id) {
          baseStatus = "plantao_domingo";
        } else {
          baseStatus = "folga";
        }
      } else if (isRealHoliday) {
        // Non-Sunday official holiday
        if (team.kind === "campo" && campoDutyTeamId === team.id) {
          baseStatus = "plantao_feriado";
        } else {
          baseStatus = "feriado";
        }
      } else {
        // Regular Mon-Sat (including ponto facultativo)
        if (isMonFri) {
          baseStatus = weekday >= 1 && weekday <= 5 ? "trabalha" : "folga";
        } else {
          baseStatus = weekday >= 2 && weekday <= 6 ? "trabalha" : "folga";
        }
      }

      let finalStatus = baseStatus;
      let note = null;
      let customName = null;
      const members = getTeamMembers(team);
      const memberStatuses = {};
      for (const m of members) {
        memberStatuses[m] = baseStatus;
      }

      // Apply Vacation / Absence (whole team or single member of the duo)
      const dayAbsences = findAbsences(team.id, iso);
      let activeRemainingMembers = [...members];

      for (const absence of dayAbsences) {
        const absStatus = absence.kind === "ausencia" ? "ausencia" : "ferias";
        note = absence.note || note;

        if (absence.member && members.includes(absence.member)) {
          // Only 1 person of the duo is on vacation/absence!
          memberStatuses[absence.member] = absStatus;
          activeRemainingMembers = activeRemainingMembers.filter(
            (m) => m !== absence.member
          );
          if (absence.substitute_member) {
            activeRemainingMembers.push(absence.substitute_member);
            memberStatuses[absence.substitute_member] =
              baseStatus === "folga" ? "troca" : baseStatus;
          }
          // Visual badge on the team row shows ferias/ausencia, while customName shows who is working and who is out
          finalStatus = absStatus;
          if (
            ["trabalha", "plantao_domingo", "plantao_feriado", "alteracao"].includes(
              baseStatus
            )
          ) {
            const workingStr =
              activeRemainingMembers.length > 0
                ? `${activeRemainingMembers.join(" / ")} (trabalha)`
                : "";
            customName = `${absence.member} (${
              absStatus === "ferias" ? "Férias" : "Ausente"
            })${workingStr ? ` · ${workingStr}` : ""}`;
          } else {
            customName = `${absence.member} (${
              absStatus === "ferias" ? "Férias" : "Ausente"
            })`;
          }
        } else {
          // Whole team is on vacation/absence
          finalStatus = absStatus;
          for (const m of members) {
            memberStatuses[m] = absStatus;
          }
        }
      }

      // Apply Manual ScheduleOverride (whole team or single member of the duo)
      const teamOverrides = (overridesByDate[iso] || []).filter(
        (o) => o.team_id === team.id
      );

      for (const ovr of teamOverrides) {
        finalStatus = ovr.status;
        note = ovr.note || note;

        if (ovr.member && members.includes(ovr.member)) {
          // Individual member adjustment
          memberStatuses[ovr.member] = ovr.status;
          if (ovr.member_in) {
            memberStatuses[ovr.member_in] =
              ovr.status === "folga" ? "troca" : ovr.status;
          }
        } else if (ovr.member_out && members.includes(ovr.member_out)) {
          // Smart 1-person swap: member_out rested, member_in worked in their place
          memberStatuses[ovr.member_out] = "folga";
          if (ovr.member_in) {
            memberStatuses[ovr.member_in] = "troca";
          }
        } else if (ovr.custom_name && ovr.status === "troca") {
          // Parse custom_name like "Lucas / Alison"
          const customList = ovr.custom_name
            .split("/")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((n) => (n === "Alisson" ? "Alison" : n));
          for (const m of members) {
            memberStatuses[m] = customList.includes(m) ? "troca" : "folga";
          }
        } else {
          for (const m of members) {
            memberStatuses[m] = ovr.status;
          }
        }

        if (ovr.custom_name) {
          customName = ovr.custom_name;
        }
      }

      teamStatuses[team.id] = {
        status: finalStatus,
        base_status: baseStatus,
        note,
        custom_name: customName,
        member_statuses: memberStatuses,
      };
    }

    // Resolve pill display labels for the calendar cell
    const dayOverrides = overridesByDate[iso] || [];
    const trocaOverride = dayOverrides.find((o) => o.status === "troca" && o.custom_name);

    if (trocaOverride) {
      campoDutyLabel = trocaOverride.custom_name;
    } else if (campoDutyTeamId) {
      const t = activeTeams.find((x) => x.id === campoDutyTeamId);
      const tOvr = overridesByDateTeam[`${iso}:${campoDutyTeamId}`];
      campoDutyLabel = tOvr?.custom_name || t?.name || null;
    }

    if (atendimentoDutyTeamId) {
      const t = activeTeams.find((x) => x.id === atendimentoDutyTeamId);
      const tOvr = overridesByDateTeam[`${iso}:${atendimentoDutyTeamId}`];
      atendimentoDutyLabel = tOvr?.custom_name || (t ? `${t.name} · plantão` : null);
    }

    daysResult[iso] = {
      date: iso,
      weekday,
      mon_fri_group: monFriGroup,
      holiday,
      campo_team_id: campoDutyTeamId,
      atendimento_team_id: atendimentoDutyTeamId,
      campo_duty_label: campoDutyLabel,
      atendimento_duty_label: atendimentoDutyLabel,
      has_troca: Boolean(trocaOverride || dayOverrides.some((o) => o.status === "troca")),
      teams: teamStatuses,
    };
  }

  return {
    startIso,
    endIso,
    days: daysResult,
  };
}

// ============================================================================
// Monthly Team Summary & Employee Workday Aggregator
// ============================================================================
export function buildMonthlyReport(calendarData, teams) {
  const activeTeams = [...teams]
    .filter((t) => t.active !== false)
    .sort((a, b) => (a.kind === b.kind ? a.order - b.order : a.kind === "campo" ? -1 : 1));

  const rows = activeTeams.map((team) => {
    const counts = {
      trabalha: 0,
      folga: 0,
      plantao_domingo: 0,
      plantao_feriado: 0,
      troca: 0,
      feriado: 0,
      alteracao: 0,
      ferias: 0,
      ausencia: 0,
      total_trabalhado: 0,
    };

    for (const day of Object.values(calendarData.days)) {
      const st = day.teams?.[team.id]?.status || "folga";
      if (counts[st] !== undefined) counts[st]++;
      if (["trabalha", "plantao_domingo", "plantao_feriado", "troca", "alteracao"].includes(st)) {
        counts.total_trabalhado++;
      }
    }

    return {
      team,
      ...counts,
    };
  });

  // Extract chronological list of duties in the month
  const duties = [];
  const sortedDays = Object.values(calendarData.days).sort((a, b) => a.date.localeCompare(b.date));
  for (const day of sortedDays) {
    if (day.weekday === 0 && (day.campo_duty_label || day.campo_team_id)) {
      duties.push({
        date: day.date,
        kind: day.has_troca ? "Troca de plantão (Domingo)" : "Plantão de domingo",
        team_id: day.campo_team_id,
        label: day.campo_duty_label,
      });
    }
    if (day.weekday === 0 && (day.atendimento_duty_label || day.atendimento_team_id)) {
      const t = activeTeams.find((x) => x.id === day.atendimento_team_id);
      duties.push({
        date: day.date,
        kind: "Atendimento (Domingo)",
        team_id: day.atendimento_team_id,
        label: t?.name || day.atendimento_duty_label,
      });
    }
    if (day.weekday !== 0 && day.holiday && day.holiday.type !== "facultativo" && (day.campo_duty_label || day.campo_team_id)) {
      duties.push({
        date: day.date,
        kind: day.has_troca ? `Troca (${day.holiday.name})` : `Plantão feriado (${day.holiday.name})`,
        team_id: day.campo_team_id,
        label: day.campo_duty_label,
      });
    }
  }

  return { rows, duties };
}

// Individual Employee breakdown (splits duos like "Lucas / Felipe" and accounts for custom_name swaps like "Lucas / Alison")
export function buildEmployeeWorkdaySummary(calendarData, teams, services = []) {
  const activeTeams = teams.filter((t) => t.active !== false);
  const employeeMap = {};

  function ensureEmployee(name, team) {
    const clean = name.trim();
    if (!clean) return null;
    if (!employeeMap[clean]) {
      employeeMap[clean] = {
        name: clean,
        teamId: team?.id || "",
        teamName: team?.name || "Avulso",
        kind: team?.kind || "campo",
        group: team?.group || "A",
        diasNormais: 0,
        plantoesDomingo: 0,
        plantoesFeriado: 0,
        trocasTrabalhadas: 0,
        folgas: 0,
        feriasAusencias: 0,
        totalTrabalhado: 0,
        servicosCount: 0,
        datesWorked: [],
      };
    }
    return employeeMap[clean];
  }

  // Register all members from teams
  for (const team of activeTeams) {
    const members = team.members?.length
      ? team.members
      : team.name.split("/").map((s) => s.trim()).filter(Boolean);
    for (const m of members) {
      ensureEmployee(m, team);
    }
  }

  const sortedDays = Object.values(calendarData.days).sort((a, b) => a.date.localeCompare(b.date));

  for (const day of sortedDays) {
    // 1. Check if any external substitute worked on this day (from member_in or substitute_member)
    const creditedOnDay = new Set();

    for (const team of activeTeams) {
      const entry = day.teams?.[team.id];
      if (!entry) continue;
      const memberStatuses = entry.member_statuses || {};

      for (const [mName, mStatus] of Object.entries(memberStatuses)) {
        const normalized =
          mName === "Alisson" && employeeMap["Alison"] ? "Alison" : mName;
        const emp = employeeMap[normalized] || ensureEmployee(normalized, team);
        if (!emp) continue;

        // Avoid double counting if an employee is listed as substitute in another team and also in their own team on the same day
        const dayKey = `${day.date}:${emp.name}`;

        if (
          ["trabalha", "alteracao", "plantao_domingo", "plantao_feriado", "troca"].includes(
            mStatus
          )
        ) {
          if (creditedOnDay.has(dayKey)) continue;
          creditedOnDay.add(dayKey);

          if (mStatus === "troca") {
            emp.trocasTrabalhadas++;
            emp.totalTrabalhado++;
            emp.datesWorked.push({ date: day.date, type: "Troca / Cobertura" });
          } else if (mStatus === "plantao_domingo") {
            emp.plantoesDomingo++;
            emp.totalTrabalhado++;
            emp.datesWorked.push({ date: day.date, type: "Plantão de domingo" });
          } else if (mStatus === "plantao_feriado") {
            emp.plantoesFeriado++;
            emp.totalTrabalhado++;
            emp.datesWorked.push({ date: day.date, type: "Plantão de feriado" });
          } else {
            emp.diasNormais++;
            emp.totalTrabalhado++;
            emp.datesWorked.push({ date: day.date, type: "Dia normal" });
          }
        } else if (mStatus === "ferias" || mStatus === "ausencia") {
          // Only record vacation/absence when evaluating the employee's primary team
          if (emp.teamId === team.id) {
            emp.feriasAusencias++;
          }
        } else {
          if (emp.teamId === team.id && !creditedOnDay.has(dayKey)) {
            emp.folgas++;
          }
        }
      }
    }
  }

  // Count services per employee in this date range
  for (const srv of services) {
    if (srv.date >= calendarData.startIso && srv.date <= calendarData.endIso) {
      const list = srv.employees?.length
        ? srv.employees
        : (activeTeams.find((t) => t.id === srv.team_id)?.name || "")
            .split("/")
            .map((s) => s.trim())
            .filter(Boolean);
      for (const empName of list) {
        if (employeeMap[empName]) {
          employeeMap[empName].servicosCount++;
        }
      }
    }
  }

  return Object.values(employeeMap).sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "campo" ? -1 : 1;
    return b.totalTrabalhado - a.totalTrabalhado || a.name.localeCompare(b.name);
  });
}

// ============================================================================
// Brazilian National Holidays Generator for Any Year
// ============================================================================
export function generateBrazilianHolidaysForYear(year) {
  const y = Number(year);
  // Meeus/Jones/Butcher Easter algorithm
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  const easterIso = `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const carnavalMon = addDays(easterIso, -48);
  const carnavalTue = addDays(easterIso, -47);
  const goodFriday = addDays(easterIso, -2);
  const corpusChristi = addDays(easterIso, 60);

  return [
    { id: `hol-${y}-01-01`, date: `${y}-01-01`, name: "Confraternização Universal", type: "nacional" },
    { id: `hol-${carnavalMon}`, date: carnavalMon, name: "Carnaval (segunda)", type: "facultativo" },
    { id: `hol-${carnavalTue}`, date: carnavalTue, name: "Carnaval (terça)", type: "facultativo" },
    { id: `hol-${goodFriday}`, date: goodFriday, name: "Sexta-feira Santa", type: "nacional" },
    { id: `hol-${y}-04-21`, date: `${y}-04-21`, name: "Tiradentes", type: "nacional" },
    { id: `hol-${y}-05-01`, date: `${y}-05-01`, name: "Dia do Trabalho", type: "nacional" },
    { id: `hol-${corpusChristi}`, date: corpusChristi, name: "Corpus Christi", type: "facultativo" },
    { id: `hol-${y}-07-09`, date: `${y}-07-09`, name: "Revolução Constitucionalista (SP)", type: "estadual" },
    { id: `hol-${y}-09-07`, date: `${y}-09-07`, name: "Independência do Brasil", type: "nacional" },
    { id: `hol-${y}-10-12`, date: `${y}-10-12`, name: "Nossa Senhora Aparecida", type: "nacional" },
    { id: `hol-${y}-11-02`, date: `${y}-11-02`, name: "Finados", type: "nacional" },
    { id: `hol-${y}-11-15`, date: `${y}-11-15`, name: "Proclamação da República", type: "nacional" },
    { id: `hol-${y}-11-20`, date: `${y}-11-20`, name: "Dia da Consciência Negra", type: "nacional" },
    { id: `hol-${y}-12-13`, date: `${y}-12-13`, name: "Dia de Santa Luzia (Pinhal-SP)", type: "municipal" },
    { id: `hol-${y}-12-25`, date: `${y}-12-25`, name: "Natal", type: "nacional" },
    { id: `hol-${y}-12-27`, date: `${y}-12-27`, name: "Aniversário de Espírito Santo do Pinhal", type: "municipal" },
  ];
}
