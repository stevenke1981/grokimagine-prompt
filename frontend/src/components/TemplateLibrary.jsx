import { useEffect, useState } from "react";
import axios from "axios";

export default function TemplateLibrary({ onSelect, mode = "image" }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("全部");

  useEffect(() => {
    setLoading(true);
    setActiveCategory("全部");
    axios
      .get(`/api/templates?mode=${mode}`, { withCredentials: true })
      .then((r) => setTemplates(r.data))
      .finally(() => setLoading(false));
  }, [mode]);

  const categories = ["全部", ...new Set(templates.map((t) => t.category))];
  const filtered =
    activeCategory === "全部"
      ? templates
      : templates.filter((t) => t.category === activeCategory);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-center h-48">
        <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
      <h2 className="font-semibold text-gray-800">預設模板庫</h2>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {filtered.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl)}
            className={`w-full text-left p-3 rounded-xl border border-gray-100 transition-colors group ${
              mode === "video"
                ? "hover:border-purple-300 hover:bg-purple-50"
                : "hover:border-blue-300 hover:bg-blue-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-medium text-sm text-gray-800 ${
                mode === "video" ? "group-hover:text-purple-700" : "group-hover:text-blue-700"
              }`}>
                {tpl.name}
              </span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {tpl.category}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">{tpl.subject}</p>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {tpl.style && <Tag mode={mode}>{tpl.style}</Tag>}
              {mode === "video" ? (
                <>
                  {tpl.motion && <Tag mode={mode}>{tpl.motion}</Tag>}
                  {tpl.duration && <Tag mode={mode}>{tpl.duration}</Tag>}
                </>
              ) : (
                tpl.lighting && <Tag mode={mode}>{tpl.lighting}</Tag>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Tag({ children, mode }) {
  const cls = mode === "video"
    ? "bg-purple-50 text-purple-600"
    : "bg-orange-50 text-orange-600";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>
      {children}
    </span>
  );
}
