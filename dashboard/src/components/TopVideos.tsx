"use client";

import { useEffect, useState } from "react";
import { fetchTopVideos, type VideoMeta } from "@/lib/queries";

type TopVideo = VideoMeta & { view_count: number };

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TopVideos() {
  const [videos, setVideos] = useState<TopVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopVideos(20)
      .then(setVideos)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse h-96 bg-gray-800 rounded-lg" />;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        再生回数 Top 20
      </h3>
      {videos.length > 0 ? (
        <div className="space-y-3">
          {videos.map((video, i) => (
            <div
              key={video.video_id}
              className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="text-gray-400 font-mono w-8 text-right">
                {i + 1}
              </span>
              {video.thumbnail_url && (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-24 h-14 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <a
                  href={`https://www.youtube.com/watch?v=${video.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white text-sm font-medium hover:text-blue-400 truncate block"
                >
                  {video.title}
                </a>
                <div className="flex gap-3 text-xs text-gray-400 mt-1">
                  <span>{video.published_at?.slice(0, 10)}</span>
                  {video.duration_seconds > 0 && (
                    <span>{formatDuration(video.duration_seconds)}</span>
                  )}
                </div>
              </div>
              <span className="text-white font-semibold whitespace-nowrap">
                {video.view_count.toLocaleString()} 回
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">データがありません</p>
      )}
    </div>
  );
}
