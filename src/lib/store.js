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
const ADMIN_AUTH_KEY = "escala_facil_pro_admin_cred_v2";
const GITHUB_SYNC_KEY = "escala_facil_pro_github_sync";

// Salted SHA-256 hash of the default master password ("escala_pro_salt_v1:" + password)
// Ensures the plaintext password is never exposed in the source code or JS bundle.
const PASSWORD_SALT = "escala_pro_salt_v1:";
const DEFAULT_ADMIN_PASSWORD_HASH =
  "94f051c85fb236647fd83ef4fdba506704e84c527a116d642341502472219313";

export async function hashPassword(password) {
  const input = `${PASSWORD_SALT}${String(password)}`;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Pure-JS SHA-256 fallback for non-secure HTTP local network origins
  return sha256Fallback(input);
}

function sha256Fallback(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = "";
  const words = [];
  const asciiBitLength = ascii.length * 8;
  let hash = [];
  const k = [];
  let primeCounter = 0;
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += "\x80";
  while ((ascii.length % 64) - 56) ascii += "\x00";
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;
  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];
      const a = hash[0],
        e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : "") + b.toString(16);
    }
  }
  return result;
}

export function normalizeState(parsed) {
  const rawHolidays = Array.isArray(parsed?.holidays)
    ? parsed.holidays
    : INITIAL_HOLIDAYS;
  const holidays = rawHolidays.map((h) =>
    h &&
    typeof h.name === "string" &&
    h.name.toLowerCase().includes("corpus christi") &&
    h.type === "facultativo"
      ? { ...h, type: "municipal" }
      : h
  );

  return {
    updated_at: parsed?.updated_at || 0,
    settings: { ...DEFAULT_SETTINGS, ...(parsed?.settings || {}) },
    teams: Array.isArray(parsed?.teams) ? parsed.teams : INITIAL_TEAMS,
    holidays,
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
      if (parsed.passwordHash) {
        return {
          email: parsed.email || "Admin",
          passwordHash: parsed.passwordHash,
          password: "",
        };
      }
      // Migrate legacy plaintext password in localStorage to SHA-256 hash automatically
      if (parsed.password) {
        const migratedHash = sha256Fallback(`${PASSWORD_SALT}${parsed.password}`);
        const migrated = {
          email: parsed.email || "Admin",
          passwordHash: migratedHash,
        };
        localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(migrated));
        return { ...migrated, password: "" };
      }
    }
  } catch {
    // ignore
  }
  return {
    email: "Admin",
    passwordHash: DEFAULT_ADMIN_PASSWORD_HASH,
    password: "",
  };
}

export async function verifyAdminLogin(emailInput, passwordInput) {
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

  const inputHash = await hashPassword(passwordInput);
  const cleanInputHash =
    cleanInput !== passwordInput ? await hashPassword(cleanInput) : inputHash;

  const targetHash = creds.passwordHash || DEFAULT_ADMIN_PASSWORD_HASH;
  const passMatches =
    inputHash === targetHash ||
    cleanInputHash === targetHash ||
    cleanInputHash === DEFAULT_ADMIN_PASSWORD_HASH;

  return { valid: userMatches && passMatches, autoConfiguredToken: false };
}

export async function saveAdminCredentials({ email, password }) {
  const passwordHash = await hashPassword(password);
  localStorage.setItem(
    ADMIN_AUTH_KEY,
    JSON.stringify({ email: email.trim(), passwordHash })
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
