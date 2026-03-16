import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { loadPkceSession, clearPkceSession } from "../utils/oauth.js";

export default function AuthCallback({ setUser }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("處理中…");
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(`OAuth 錯誤：${errorParam}`);
      return;
    }

    if (!code || !state) {
      setError("缺少 OAuth 參數");
      return;
    }

    const session = loadPkceSession();

    if (!session) {
      setError("找不到 OAuth session，請重新登入");
      return;
    }

    // CSRF state check — mirrors OpenClaw's parseOAuthCallbackInput
    if (session.state !== state) {
      setError("State 不匹配，可能遭受 CSRF 攻擊，請重新登入");
      return;
    }

    clearPkceSession();

    setStatus(`驗證 ${session.provider} 身份中…`);

    axios
      .post(
        "/api/auth/exchange",
        {
          provider: session.provider,
          code,
          code_verifier: session.verifier, // null for GitHub
          redirect_uri: `${window.location.origin}/auth/callback`,
        },
        { withCredentials: true }
      )
      .then((r) => {
        setUser(r.data.user);
        navigate("/", { replace: true });
      })
      .catch((e) => {
        setError(e.response?.data?.error || "Token 交換失敗，請重新登入");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-center space-y-4">
        {error ? (
          <>
            <div className="text-red-500 text-4xl">⚠️</div>
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-4 text-blue-500 hover:underline text-sm"
            >
              返回登入頁
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-600 text-sm">{status}</p>
          </>
        )}
      </div>
    </div>
  );
}
