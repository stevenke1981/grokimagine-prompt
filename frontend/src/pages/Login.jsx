import { useState } from "react";
import { buildGoogleOAuthUrl, buildGithubOAuthUrl, buildChatGPTOAuthUrl } from "../utils/oauth.js";

// Client IDs are public — safe to embed in frontend
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || "";

// Fallback to server-side OAuth if client IDs not configured
const USE_PKCE = Boolean(GOOGLE_CLIENT_ID || GITHUB_CLIENT_ID);

export default function Login() {
  const [loading, setLoading] = useState(null); // "google" | "github" | null

  async function handleChatGPT() {
    setLoading("chatgpt");
    const url = await buildChatGPTOAuthUrl();
    window.location.href = url;
  }

  async function handleGoogle() {
    if (!GOOGLE_CLIENT_ID) {
      window.location.href = "/api/auth/google";
      return;
    }
    setLoading("google");
    const url = await buildGoogleOAuthUrl(GOOGLE_CLIENT_ID);
    window.location.href = url;
  }

  function handleGitHub() {
    if (!GITHUB_CLIENT_ID) {
      window.location.href = "/api/auth/github";
      return;
    }
    setLoading("github");
    const url = buildGithubOAuthUrl(GITHUB_CLIENT_ID);
    window.location.href = url;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Grok Image</h1>
          <p className="text-gray-500 mt-2 text-sm">
            AI 提示詞生成 &amp; Grok 圖像生成器
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleChatGPT}
            disabled={loading !== null}
            className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-[#10a37f] hover:bg-[#0d8f6e] text-white rounded-xl transition-colors font-medium disabled:opacity-60"
          >
            {loading === "chatgpt" ? <Spinner white /> : <ChatGPTIcon />}
            使用 ChatGPT 登入
          </button>

          <button
            onClick={handleGoogle}
            disabled={loading !== null}
            className="flex items-center justify-center gap-3 w-full py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 disabled:opacity-60"
          >
            {loading === "google" ? (
              <Spinner />
            ) : (
              <GoogleIcon />
            )}
            使用 Google 登入
          </button>

          <button
            onClick={handleGitHub}
            disabled={loading !== null}
            className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-60"
          >
            {loading === "github" ? (
              <Spinner white />
            ) : (
              <GitHubIcon />
            )}
            使用 GitHub 登入
          </button>
        </div>

        {USE_PKCE && (
          <p className="mt-4 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
            ✓ 使用 PKCE 安全認證（瀏覽器端直接發起）
          </p>
        )}

        <p className="mt-6 text-xs text-gray-400">
          登入即表示你同意我們的服務條款與隱私政策
        </p>
      </div>
    </div>
  );
}

function Spinner({ white }) {
  return (
    <div
      className={`w-5 h-5 border-2 rounded-full animate-spin ${
        white
          ? "border-white border-t-transparent"
          : "border-gray-500 border-t-transparent"
      }`}
    />
  );
}

function ChatGPTIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 41 41" fill="white">
      <path d="M37.532 16.87a9.963 9.963 0 00-.856-8.184 10.078 10.078 0 00-10.855-4.835 9.964 9.964 0 00-7.505-3.35 10.079 10.079 0 00-9.612 6.977 9.967 9.967 0 00-6.664 4.834 10.08 10.08 0 001.24 11.817 9.965 9.965 0 00.856 8.185 10.079 10.079 0 0010.855 4.835 9.965 9.965 0 007.504 3.35 10.078 10.078 0 009.617-6.981 9.967 9.967 0 006.663-4.834 10.079 10.079 0 00-1.243-11.814zM22.498 37.886a7.474 7.474 0 01-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 00.655-1.134V19.054l3.366 1.944a.12.12 0 01.066.092v9.299a7.505 7.505 0 01-7.49 7.496zM6.392 31.006a7.471 7.471 0 01-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 001.308 0l9.724-5.614v3.888a.12.12 0 01-.048.103l-8.051 4.649a7.504 7.504 0 01-10.24-2.744zM4.297 13.62A7.469 7.469 0 018.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 00.654 1.132l9.723 5.614-3.366 1.944a.12.12 0 01-.114.012L7.044 23.86a7.504 7.504 0 01-2.747-10.24zm27.658 6.437l-9.724-5.615 3.367-1.943a.121.121 0 01.114-.012l8.048 4.648a7.498 7.498 0 01-1.158 13.528v-9.476a1.293 1.293 0 00-.647-1.13zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 00-1.308 0l-9.723 5.614v-3.888a.12.12 0 01.048-.103l8.05-4.645a7.497 7.497 0 0111.135 7.763zm-21.063 6.929l-3.367-1.944a.12.12 0 01-.065-.092v-9.299a7.497 7.497 0 0112.293-5.756 6.94 6.94 0 00-.236.134l-7.965 4.6a1.294 1.294 0 00-.654 1.132l-.006 11.225zm1.829-3.943l4.33-2.501 4.332 2.5v4.999l-4.331 2.5-4.331-2.5V18z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
