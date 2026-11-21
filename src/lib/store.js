import {
  DEFAULT_SETTINGS,
  INITIAL_TEAMS,
  INITIAL_HOLIDAYS,
  INITIAL_OVERRIDES,
  INITIAL_ABSENCES,
  INITIAL_DUTY_OVERRIDES,
  INITIAL_SERVICES,
} from "./schedule";

const STORAGE_KEY = "escala_facil_pro_v2_state";

export function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialState();
    const parsed = JSON.parse(raw);
    return {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      teams: Array.isArray(parsed.teams) ? parsed.teams : INITIAL_TEAMS,
      holidays: Array.isArray(parsed.holidays) ? parsed.holidays : INITIAL_HOLIDAYS,
      overrides: Array.isArray(parsed.overrides) ? parsed.overrides : INITIAL_OVERRIDES,
      absences: Array.isArray(parsed.absences) ? parsed.absences : INITIAL_ABSENCES,
      weekOverrides: Array.isArray(parsed.weekOverrides) ? parsed.weekOverrides : [],
      dutyOverrides: Array.isArray(parsed.dutyOverrides) ? parsed.dutyOverrides : INITIAL_DUTY_OVERRIDES,
      services: Array.isArray(parsed.services) ? parsed.services : INITIAL_SERVICES,
    };
  } catch (e) {
    console.error("Failed to load state from localStorage:", e);
    return getInitialState();
  }
}

export function getInitialState() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    teams: [...INITIAL_TEAMS],
    holidays: [...INITIAL_HOLIDAYS],
    overrides: [...INITIAL_OVERRIDES],
    absences: [...INITIAL_ABSENCES],
    weekOverrides: [],
    dutyOverrides: [...INITIAL_DUTY_OVERRIDES],
    services: [...INITIAL_SERVICES],
  };
}

export function saveAppState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state to localStorage:", e);
  }
}

export function resetAppState() {
  localStorage.removeItem(STORAGE_KEY);
  return getInitialState();
}
