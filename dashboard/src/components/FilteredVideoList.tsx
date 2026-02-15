"use client";

import { VideoMeta } from "@/lib/queries";

type Props = {
    videos: VideoMeta[];
    label: string;
};

export default function FilteredVideoList({ videos, label }: Props) {
    if (videos.length === 0) return null;

    return (
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-foreground">
                    選択中: <span className="text-primary">{label}</span> の動画 ({videos.length}本)
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((v) => (
                    <a
                        key={v.video_id}
                        href={`https://www.youtube.com/watch?v=${v.video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block bg-background rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:shadow-md"
                    >
                        <div className="relative aspect-video">
                            <img
                                src={v.thumbnail_url}
                                alt={v.title}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono">
                                {Math.floor(v.duration_seconds / 60)}:
                                {String(v.duration_seconds % 60).padStart(2, "0")}
                            </div>
                        </div>
                        <div className="p-4">
                            <h4 className="font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2">
                                {v.title}
                            </h4>
                            <p className="text-muted text-sm">
                                {v.published_at ? new Date(v.published_at).toLocaleDateString("ja-JP") : "不明"}
                            </p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
