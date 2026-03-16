import { useState } from "react";
import axios from "axios";

export default function ImagePreview({
  mode, finalPrompt, setFinalPrompt,
  images, setImages, formData, rawPrompt,
  onSaved,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState(null);

  const isVideo = mode === "video";
  const canGenerate = !isVideo; // video: show prompt only, no generation endpoint yet

  async function handleGenerate() {
    if (!finalPrompt.trim()) {
      setError("請先使用 AI 增強生成提示詞");
      return;
    }
    setError("");
    setLoading(true);

    // 1. Save prompt record first (images: [])
    let recordId = null;
    try {
      const { data: record } = await axios.post(
        "/api/prompts",
        {
          type: mode,
          form_data: formData,
          raw_prompt: rawPrompt,
          enhanced_prompt: finalPrompt,
          images: [],
          video_settings: isVideo ? formData : {},
        },
        { withCredentials: true }
      );
      recordId = record.id;
      setSavedId(recordId);
    } catch (_) { /* non-critical */ }

    // 2. Generate image
    try {
      const { data } = await axios.post(
        "/api/generate-image",
        { prompt: finalPrompt, n: 1 },
        { withCredentials: true }
      );
      setImages(data.images);

      // 3. Update record with image URLs
      if (recordId && data.images.length > 0) {
        await axios.patch(
          `/api/prompts/${recordId}`,
          { images: data.images },
          { withCredentials: true }
        );
        onSaved?.(); // trigger history refresh
      }
    } catch (e) {
      setError(e.response?.data?.error || "生圖失敗，請檢查 API Key");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveVideoPrompt() {
    if (!finalPrompt.trim()) {
      setError("請先 AI 增強影片提示詞");
      return;
    }
    setError("");
    try {
      await axios.post(
        "/api/prompts",
        {
          type: "video",
          form_data: formData,
          raw_prompt: rawPrompt,
          enhanced_prompt: finalPrompt,
          images: [],
          video_settings: formData,
        },
        { withCredentials: true }
      );
      onSaved?.();
    } catch (e) {
      setError("存檔失敗");
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4 h-full">
      <h2 className="font-semibold text-gray-800">輸出區</h2>

      {/* Prompt editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          最終提示詞（可手動編輯）
        </label>
        <textarea
          value={finalPrompt}
          onChange={(e) => setFinalPrompt(e.target.value)}
          rows={5}
          placeholder={
            isVideo
              ? "點擊「AI 增強影片提示詞」後，可複製到 Sora、Runway、Pika 等工具使用…"
              : "點擊「AI 增強提示詞」後，增強結果會顯示於此…"
          }
          className={`w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none ${
            isVideo ? "focus:ring-purple-400" : "focus:ring-orange-400"
          }`}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Copy button (always) */}
      {finalPrompt && (
        <CopyButton text={finalPrompt} />
      )}

      {/* Action button */}
      {canGenerate ? (
        <button
          onClick={handleGenerate}
          disabled={loading || !finalPrompt.trim()}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              生成中…
            </>
          ) : (
            <><ImageIcon /> 生成圖片</>
          )}
        </button>
      ) : (
        <button
          onClick={handleSaveVideoPrompt}
          disabled={!finalPrompt.trim()}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <SaveIcon /> 儲存影片提示詞
        </button>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {images.map((url, i) => (
            <div key={i} className="relative group fade-in">
              <img src={url} alt={`Generated ${i + 1}`} className="w-full rounded-xl object-cover shadow" />
              <a
                href={url} download={`grok-image-${i + 1}.png`} target="_blank" rel="noreferrer"
                className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                下載
              </a>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-300">
          {isVideo ? <VideoPlaceholderIcon /> : <ImagePlaceholderIcon />}
          <p className="mt-3 text-sm">
            {isVideo ? "複製提示詞到影片生成工具使用" : "生成的圖片將顯示於此"}
          </p>
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="w-full py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
    >
      {copied ? "✓ 已複製" : "複製提示詞"}
    </button>
  );
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function VideoPlaceholderIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}
