import {
  DEFAULT_SETTINGS,
  INITIAL_TEAMS,
  INITIAL_HOLIDAYS,
  INITIAL_OVERRIDES,
  INITIAL_ABSENCES,
  INITIAL_DUTY_OVERRIDES,
  INITIAL_SERVICES,
} from "./schedule";

const STORAGE_KEY = "escala_facil_pro_v6_state";
const LOCAL_UPDATED_AT_KEY = "escala_facil_pro_local_updated_at";
const AUTH_SESSION_KEY = "escala_facil_pro_admin_session";
const ADMIN_AUTH_KEY = "escala_facil_pro_admin_cred";
const GITHUB_SYNC_KEY = "escala_facil_pro_github_sync";

export function normalizeState(parsed) {
  return {
    updated_at: parsed?.updated_at || 0,
    settings: { ...DEFAULT_SETTINGS, ...(parsed?.settings || {}) },
    teams: Array.isArray(parsed?.teams) ? parsed.teams : INITIAL_TEAMS,
    holidays: Array.isArray(parsed?.holidays) ? parsed.holidays : INITIAL_HOLIDAYS,
    overrides: Array.isArray(parsed?.overrides) ? parsed.overrides : INITIAL_OVERRIDES,
    absences: Array.isArray(parsed?.absences) ? parsed.absences : INITIAL_ABSENCES,
    weekOverrides: Array.isArray(parsed?.weekOverrides) ? parsed.weekOverrides : [],
    dutyOverrides: Array.isArray(parsed?.dutyOverrides) ? parsed.dutyOverrides : INITIAL_DUTY_OVERRIDES,
    services: Array.isArray(parsed?.services) ? parsed.services : INITIAL_SERVICES,
  };
}

export function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialState();
    return normalizeState(JSON.parse(raw));
  } catch (e) {
    console.error("Failed to load state from localStorage:", e);
    return getInitialState();
  }
}

export function getLocalUpdatedAt() {
  try {
    return Number(localStorage.getItem(LOCAL_UPDATED_AT_KEY) || "0");
  } catch {
    return 0;
  }
}

export function saveAppState(state, markAsAdminEdit = false) {
  try {
    const now = markAsAdminEdit
      ? Date.now()
      : state.updated_at || getLocalUpdatedAt() || 0;
    const withTs = { ...state, updated_at: now };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withTs));
    if (markAsAdminEdit) {
      localStorage.setItem(LOCAL_UPDATED_AT_KEY, String(now));
    }
  } catch (e) {
    console.error("Failed to save state to localStorage:", e);
  }
}

export async function fetchPublishedEscalaData() {
  // 1. Fetch live public/escala-data.json directly from GitHub Raw / API with cache-busting so updates appear immediately (< 2 seconds) without waiting for GitHub Pages rebuild!
  const rawUrls = [
    `https://api.github.com/repos/leandrosossaireis/escala/contents/public/escala-data.json?ref=main&t=${Date.now()}`,
    `https://raw.githubusercontent.com/leandrosossaireis/escala/main/public/escala-data.json?t=${Date.now()}`,
    `./escala-data.json?t=${Date.now()}`,
  ];

  for (const url of rawUrls) {
    try {
      const isApi = url.includes("api.github.com");
      const res = await fetch(url, {
        cache: "no-store",
        headers: isApi
          ? { Accept: "application/vnd.github.raw+json" }
          : undefined,
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.teams && data.settings) {
        return normalizeState(data);
      }
    } catch {
      // fallback to next URL
    }
  }
  return null;
}

export function getInitialState() {
  return {
    updated_at: 0,
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

export function resetAppState() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LOCAL_UPDATED_AT_KEY);
  return getInitialState();
}

export function getAdminCredentials() {
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.password) return parsed;
    }
  } catch {
    // ignore
  }
  return {
    email: "admin",
    password: "admin", // Default initial password (admin can change it inside Admin -> Segurança)
  };
}

export function verifyAdminLogin(emailInput, passwordInput) {
  const creds = getAdminCredentials();
  const cleanInput = passwordInput.trim();

  if (
    cleanInput.startsWith("github_pat_") ||
    cleanInput.startsWith("ghp_")
  ) {
    const cfg = getGitHubSyncConfig();
    saveGitHubSyncConfig({ ...cfg, token: cleanInput });
    return { valid: true, autoConfiguredToken: true };
  }

  const userMatches =
    !creds.email ||
    emailInput.trim().toLowerCase() === creds.email.trim().toLowerCase() ||
    emailInput.trim().toLowerCase() === "admin";
  const passMatches = passwordInput === creds.password;

  return { valid: userMatches && passMatches, autoConfiguredToken: false };
}

export function saveAdminCredentials({ email, password }) {
  localStorage.setItem(
    ADMIN_AUTH_KEY,
    JSON.stringify({ email: email.trim(), password })
  );
}

export function isAdminLoggedIn() {
  try {
    return (
      localStorage.getItem(AUTH_SESSION_KEY) === "true" ||
      sessionStorage.getItem(AUTH_SESSION_KEY) === "true"
    );
  } catch {
    return false;
  }
}

export function setAdminLoggedIn(loggedIn) {
  try {
    if (loggedIn) {
      localStorage.setItem(AUTH_SESSION_KEY, "true");
      sessionStorage.setItem(AUTH_SESSION_KEY, "true");
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

// ============================================================================
// Automatic Cloud Sync (publishes changes to public/escala-data.json)
// ============================================================================

export function getGitHubSyncConfig() {
  try {
    const raw = localStorage.getItem(GITHUB_SYNC_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        owner: parsed.owner || "leandrosossaireis",
        repo: parsed.repo || "escala",
        branch: parsed.branch || "main",
        token: parsed.token || "",
      };
    }
  } catch {
    // ignore
  }
  return {
    owner: "leandrosossaireis",
    repo: "escala",
    branch: "main",
    token: "",
  };
}

export function saveGitHubSyncConfig(cfg) {
  localStorage.setItem(GITHUB_SYNC_KEY, JSON.stringify(cfg));
}

export async function publishStateToGitHub(appState, config) {
  const cfg = config || getGitHubSyncConfig();
  const owner = cfg.owner || "leandrosossaireis";
  const repo = cfg.repo || "escala";
  const branch = cfg.branch || "main";
  const activeToken = cfg.token;

  if (!activeToken) {
    throw new Error(
      "Informe seu Token do GitHub (com permissão Contents: Read & Write) na aba Senha do Admin para sincronizar online."
    );
  }

  const path = "public/escala-data.json";
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // 1. Get current file SHA if it exists
  let sha = undefined;
  const getRes = await fetch(`${apiUrl}?ref=${branch}&t=${Date.now()}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${activeToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (getRes.ok) {
    const existing = await getRes.json();
    sha = existing.sha;
  }

  // 2. Encode JSON in UTF-8 Base64
  const jsonString = JSON.stringify(appState, null, 2);
  const utf8Bytes = new TextEncoder().encode(jsonString);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64Content = btoa(binary);

  // 3. Commit updated public/escala-data.json to GitHub
  const putRes = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${activeToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `chore: atualização automática da escala (${new Date().toLocaleString(
        "pt-BR"
      )})`,
      content: base64Content,
      branch: branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const errBody = await putRes.json().catch(() => ({}));
    throw new Error(
      errBody.message || `Erro HTTP ${putRes.status} ao sincronizar.`
    );
  }

  return await putRes.json();
}
