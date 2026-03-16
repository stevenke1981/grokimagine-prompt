const STYLES = ["photorealistic", "anime", "oil painting", "cyberpunk", "watercolor"];
const COMPOSITIONS = ["close-up", "wide shot", "aerial view"];
const LIGHTINGS = ["natural", "golden hour", "studio", "neon"];

export default function PromptForm({ formData, setFormData }) {
  const update = (key) => (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
      <h2 className="font-semibold text-gray-800">提示詞設定</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          主題 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.subject}
          onChange={update("subject")}
          placeholder="e.g. A majestic lion at sunset"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">風格</label>
          <select
            value={formData.style}
            onChange={update("style")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {STYLES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">構圖</label>
          <select
            value={formData.composition}
            onChange={update("composition")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {COMPOSITIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">光線</label>
          <select
            value={formData.lighting}
            onChange={update("lighting")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {LIGHTINGS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">額外細節</label>
        <textarea
          value={formData.details}
          onChange={update("details")}
          rows={3}
          placeholder="e.g. cinematic, 8K, highly detailed, volumetric lighting"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
      </div>
    </div>
  );
}
