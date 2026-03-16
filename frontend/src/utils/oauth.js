// PKCE utilities — mirrors OpenClaw's chutes-oauth.ts pattern

export function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function generateState() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Save PKCE session to sessionStorage before redirect
export function savePkceSession(provider, verifier, state) {
  sessionStorage.setItem(
    "oauth_pkce",
    JSON.stringify({ provider, verifier, state })
  );
}

export function loadPkceSession() {
  try {
    return JSON.parse(sessionStorage.getItem("oauth_pkce") || "null");
  } catch {
    return null;
  }
}

export function clearPkceSession() {
  sessionStorage.removeItem("oauth_pkce");
}

// Build Google OAuth URL (supports PKCE natively for web apps)
export async function buildGoogleOAuthUrl(clientId) {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateState();
  const redirectUri = `${window.location.origin}/auth/callback`;

  savePkceSession("google", verifier, state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// ChatGPT (OpenAI Codex) OAuth — PKCE, public client_id, no secret needed
// Client ID from @mariozechner/pi-ai/openai-codex.js (public)
const OPENAI_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const OPENAI_AUTHORIZE_URL = "https://auth.openai.com/oauth/authorize";
const OPENAI_SCOPE = "openid profile email offline_access";

export async function buildChatGPTOAuthUrl() {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateState();
  const redirectUri = `${window.location.origin}/auth/callback`;

  savePkceSession("chatgpt", verifier, state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: OPENAI_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: OPENAI_SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    id_token_add_organizations: "true",
    codex_cli_simplified_flow: "true",
  });

  return `${OPENAI_AUTHORIZE_URL}?${params}`;
}

// GitHub doesn't support PKCE for web — use state-only CSRF protection
export function buildGithubOAuthUrl(clientId) {
  const state = generateState();
  const redirectUri = `${window.location.origin}/auth/callback`;

  savePkceSession("github", null, state); // no verifier for GitHub

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "user:email",
    state,
  });

  return `https://github.com/login/oauth/authorize?${params}`;
}
