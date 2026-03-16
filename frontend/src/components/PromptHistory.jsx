import { useEffect, useState, useCallback } from "react";
import axios from "axios";

export default function PromptHistory({ onReuse, refreshTrigger }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "image" | "video"

  const load = useCallback(() => {
    setLoading(true);
    axios
      .get("/api/prompts", { withCredentials: true })
      .then((r) => setRecords(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  async function handleDelete(id) {
    await axios.delete(`/api/prompts/${id}`, { withCredentials: true });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  const filtered = filter === "all" ? records : records.filter((r) => r.type === filter);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">提示詞存檔</h2>
        <button onClick={load} className="text-xs text-gray-400 hover:text-gray-600">
          ↻ 重整
        </button>
      </div>

      {/* Filter */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
        {["all", "image", "video"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
              filter === f ? "bg-white shadow text-gray-800" : "text-gray-500"
            }`}
          >
            {{ all: "全部", image: "圖片", video: "影片" }[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-300 py-10 text-sm">
          <p>還沒有存檔</p>
          <p className="text-xs mt-1">生成圖片後自動存入</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {filtered.map((r) => (
            <HistoryCard
              key={r.id}
              record={r}
              onReuse={onReuse}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryCard({ record, onReuse, onDelete }) {
  const date = new Date(record.created_at * 1000).toLocaleString("zh-TW", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const isVideo = record.type === "video";

  return (
    <div className="border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors group">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isVideo
              ? "bg-purple-100 text-purple-600"
              : "bg-blue-100 text-blue-600"
          }`}>
            {isVideo ? "影片" : "圖片"}
          </span>
          <span className="text-xs text-gray-400">{date}</span>
        </div>
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs"
        >
          刪除
        </button>
      </div>

      {/* Images preview */}
      {record.images?.length > 0 && (
        <div className="flex gap-1 mb-2 overflow-x-auto">
          {record.images.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
            />
          ))}
        </div>
      )}

      {/* Prompt */}
      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
        {record.enhanced_prompt || record.raw_prompt}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        {record.form_data?.style && <Tag>{record.form_data.style}</Tag>}
        {record.form_data?.lighting && <Tag>{record.form_data.lighting}</Tag>}
        {record.video_settings?.duration && <Tag>{record.video_settings.duration}</Tag>}
      </div>

      <button
        onClick={() => onReuse(record)}
        className="w-full text-xs text-center py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
      >
        重用此提示詞
      </button>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
      {children}
    </span>
  );
}
