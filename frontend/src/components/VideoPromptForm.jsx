const MOTIONS = [
  "slow zoom in", "slow zoom out", "pan left", "pan right",
  "tilt up", "tilt down", "tracking shot", "static",
];
const CAMERA_MOVEMENTS = [
  "static", "dolly forward", "dolly backward", "orbit", "handheld", "crane up", "crane down",
];
const STYLES = ["cinematic", "anime", "photorealistic", "cyberpunk", "watercolor", "documentary"];
const DURATIONS = ["5s", "10s", "15s", "30s"];
const ENVIRONMENTS = [
  "urban street", "nature forest", "space", "underwater", "indoor studio",
  "desert", "snowy mountain", "futuristic city",
];
const LIGHTINGS = ["natural daylight", "golden hour", "night neon", "studio", "dramatic shadow", "foggy"];

export default function VideoPromptForm({ formData, setFormData }) {
  const update = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
      <h2 className="font-semibold text-gray-800">影片提示詞設定</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          主題 / 場景 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.subject || ""}
          onChange={update("subject")}
          placeholder="e.g. A samurai walking through a rainy neon city"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select label="動作 / 動態" value={formData.motion} onChange={update("motion")} options={MOTIONS} color="purple" />
        <Select label="攝影機運動" value={formData.camera_movement} onChange={update("camera_movement")} options={CAMERA_MOVEMENTS} color="purple" />
        <Select label="視覺風格" value={formData.style} onChange={update("style")} options={STYLES} color="purple" />
        <Select label="時長" value={formData.duration} onChange={update("duration")} options={DURATIONS} color="purple" />
        <Select label="環境" value={formData.environment} onChange={update("environment")} options={ENVIRONMENTS} color="purple" />
        <Select label="光線" value={formData.lighting} onChange={update("lighting")} options={LIGHTINGS} color="purple" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">額外細節</label>
        <textarea
          value={formData.details || ""}
          onChange={update("details")}
          rows={2}
          placeholder="e.g. slow motion rain drops, lens flare, 4K, film grain"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
        />
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options, color }) {
  const ring = color === "purple" ? "focus:ring-purple-400" : "focus:ring-blue-400";
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value || ""}
        onChange={onChange}
        className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ring}`}
      >
        <option value="">— 不指定 —</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
