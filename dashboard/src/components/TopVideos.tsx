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

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
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
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-card rounded-xl h-64" />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return <p className="text-muted">データがありません</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {videos.map((video, i) => (
        <a
          key={video.video_id}
          href={`https://www.youtube.com/watch?v=${video.video_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group"
        >
          {/* Thumbnail */}
          <div className="relative">
            {video.thumbnail_url && (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full aspect-video object-cover"
              />
            )}
            {/* Rank badge */}
            <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
              #{i + 1}
            </span>
            {/* Duration */}
            {video.duration_seconds > 0 && (
              <span className="absolute bottom-1 right-1 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded">
                {formatDuration(video.duration_seconds)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="p-3">
            <h4 className="text-foreground text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {video.title}
            </h4>
            <div className="flex items-center justify-between mt-2">
              <span className="text-accent font-bold text-sm">
                {formatViews(video.view_count)} 回
              </span>
              <span className="text-muted text-xs">
                {video.published_at?.slice(0, 10)}
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
