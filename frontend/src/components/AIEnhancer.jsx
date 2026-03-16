import { useState } from "react";
import axios from "axios";

export default function AIEnhancer({ formData, mode, onEnhanced }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isVideo = mode === "video";

  async function handleEnhance() {
    if (!formData.subject?.trim()) {
      setError("請先填寫主題");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(
        "/api/enhance-prompt",
        { ...formData, mode },
        { withCredentials: true }
      );
      onEnhanced(data.enhanced);
    } catch (e) {
      setError(e.response?.data?.error || "AI 增強失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="text-sm text-red-500 mb-2 px-1">{error}</p>}
      <button
        onClick={handleEnhance}
        disabled={loading}
        className={`w-full py-3 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 ${
          isVideo
            ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        }`}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            AI 增強中…
          </>
        ) : (
          <>
            <SparkleIcon />
            {isVideo ? "AI 增強影片提示詞" : "AI 增強提示詞"}
          </>
        )}
      </button>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z" />
      <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z" />
    </svg>
  );
}
