import { useState } from "react";
import axios from "axios";
import PromptForm from "../components/PromptForm.jsx";
import VideoPromptForm from "../components/VideoPromptForm.jsx";
import TemplateLibrary from "../components/TemplateLibrary.jsx";
import AIEnhancer from "../components/AIEnhancer.jsx";
import ImagePreview from "../components/ImagePreview.jsx";
import PromptHistory from "../components/PromptHistory.jsx";

const DEFAULT_IMAGE_FORM = {
  subject: "", style: "photorealistic", composition: "wide shot",
  lighting: "natural", details: "",
};

const DEFAULT_VIDEO_FORM = {
  subject: "", motion: "", camera_movement: "", style: "cinematic",
  duration: "10s", environment: "", lighting: "", details: "",
};

export default function Home({ user, setUser }) {
  // Mode: "image" | "video"
  const [mode, setMode] = useState("image");

  // Left panel tab: "form" | "templates" | "history"
  const [leftTab, setLeftTab] = useState("form");

  const [imageForm, setImageForm] = useState(DEFAULT_IMAGE_FORM);
  const [videoForm, setVideoForm] = useState(DEFAULT_VIDEO_FORM);

  const [finalPrompt, setFinalPrompt] = useState("");
  const [rawPrompt, setRawPrompt] = useState("");
  const [images, setImages] = useState([]);
  const [historyTrigger, setHistoryTrigger] = useState(0);

  const formData = mode === "image" ? imageForm : videoForm;
  const setFormData = mode === "image" ? setImageForm : setVideoForm;

  async function handleLogout() {
    await axios.post("/api/auth/logout", {}, { withCredentials: true });
    setUser(null);
  }

  function handleTemplateSelect(tpl) {
    if (mode === "image") {
      setImageForm({
        subject: tpl.subject || "",
        style: tpl.style || "photorealistic",
        composition: tpl.composition || "wide shot",
        lighting: tpl.lighting || "natural",
        details: tpl.details || "",
      });
    } else {
      setVideoForm((prev) => ({
        ...prev,
        subject: tpl.subject || "",
        style: tpl.style || "cinematic",
        lighting: tpl.lighting || "",
        details: tpl.details || "",
        motion: tpl.motion || "",
        camera_movement: tpl.camera_movement || "",
        environment: tpl.environment || "",
        duration: tpl.duration || "10s",
      }));
    }
    setLeftTab("form");
  }

  function handleReuseHistory(record) {
    const newMode = record.type || "image";
    setMode(newMode);
    if (newMode === "image") {
      setImageForm({ ...DEFAULT_IMAGE_FORM, ...record.form_data });
    } else {
      setVideoForm({ ...DEFAULT_VIDEO_FORM, ...record.form_data, ...record.video_settings });
    }
    setFinalPrompt(record.enhanced_prompt || record.raw_prompt || "");
    setRawPrompt(record.raw_prompt || "");
    setImages([]);
    setLeftTab("form");
  }

  const modeAccent = mode === "image" ? "blue" : "purple";

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900">Grok Image</span>
          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-xs font-semibold">Beta</span>
          {/* Mode switcher */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 ml-4">
            <ModeBtn label="🖼 圖片" active={mode === "image"} color="blue" onClick={() => { setMode("image"); setFinalPrompt(""); setImages([]); }} />
            <ModeBtn label="🎬 影片" active={mode === "video"} color="purple" onClick={() => { setMode("video"); setFinalPrompt(""); setImages([]); }} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user.avatar && <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />}
          <span className="text-sm text-gray-600">{user.name || user.email}</span>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">登出</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-5">
        {/* Left Panel */}
        <div className="w-full max-w-sm space-y-3 flex-shrink-0">
          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 text-sm">
            {[
              { key: "form", label: "表單" },
              { key: "templates", label: "模板" },
              { key: "history", label: "存檔" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setLeftTab(key)}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${
                  leftTab === key ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {leftTab === "form" && (
            mode === "image"
              ? <PromptForm formData={imageForm} setFormData={setImageForm} />
              : <VideoPromptForm formData={videoForm} setFormData={setVideoForm} />
          )}
          {leftTab === "templates" && (
            <TemplateLibrary mode={mode} onSelect={handleTemplateSelect} />
          )}
          {leftTab === "history" && (
            <PromptHistory
              onReuse={handleReuseHistory}
              refreshTrigger={historyTrigger}
            />
          )}

          {leftTab !== "history" && (
            <AIEnhancer
              formData={formData}
              mode={mode}
              onEnhanced={(enhanced) => {
                setFinalPrompt(enhanced);
                setRawPrompt(
                  mode === "image"
                    ? [imageForm.subject, imageForm.style, imageForm.composition, imageForm.lighting, imageForm.details].filter(Boolean).join(", ")
                    : [videoForm.subject, videoForm.motion, videoForm.camera_movement, videoForm.style].filter(Boolean).join(", ")
                );
              }}
            />
          )}
        </div>

        {/* Right Panel */}
        <div className="flex-1 min-w-0">
          <ImagePreview
            mode={mode}
            finalPrompt={finalPrompt}
            setFinalPrompt={setFinalPrompt}
            images={images}
            setImages={setImages}
            formData={formData}
            rawPrompt={rawPrompt}
            onSaved={() => setHistoryTrigger((n) => n + 1)}
          />
        </div>
      </div>
    </div>
  );
}

function ModeBtn({ label, active, color, onClick }) {
  const activeClass = color === "purple"
    ? "bg-white shadow text-purple-700"
    : "bg-white shadow text-blue-700";
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${active ? activeClass : "text-gray-500 hover:text-gray-700"}`}
    >
      {label}
    </button>
  );
}
