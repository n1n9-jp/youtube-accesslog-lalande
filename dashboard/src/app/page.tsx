"use client";

import { useState } from "react";
import ChannelOverview from "@/components/ChannelOverview";
import TopVideos from "@/components/TopVideos";
import VideoGrowthChart from "@/components/VideoGrowthChart";
import VideoSmallMultiples from "@/components/VideoSmallMultiples";
import VideoFrequencyChart from "@/components/VideoFrequencyChart";
import VideoDurationHistogram from "@/components/VideoDurationHistogram";
import FilteredVideoList from "@/components/FilteredVideoList";
import { VideoMeta } from "@/lib/queries";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"performance" | "analysis">("performance");
  const [selectedVideos, setSelectedVideos] = useState<VideoMeta[]>([]);
  const [filterLabel, setFilterLabel] = useState("");

  const handleSelectVideos = (label: string, videos: VideoMeta[]) => {
    setFilterLabel(label);
    setSelectedVideos(videos);

    // スクロールさせて気づきやすくする
    setTimeout(() => {
      const element = document.getElementById("filtered-list");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
          ララチューン
        </h1>
        <p className="text-muted mt-1 font-medium">
          ラランド公式 YouTube Analytics
        </p>
      </header>

      {/* タブUI */}
      <div className="flex space-x-2 mb-10 border-b border-border">
        <button
          onClick={() => {
            setActiveTab("performance");
            setSelectedVideos([]);
          }}
          className={`px-4 py-2 font-semibold transition-colors relative ${activeTab === "performance"
              ? "text-foreground"
              : "text-muted hover:text-foreground"
            }`}
        >
          パフォーマンス
          {activeTab === "performance" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-foreground" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-4 py-2 font-semibold transition-colors relative ${activeTab === "analysis"
              ? "text-foreground"
              : "text-muted hover:text-foreground"
            }`}
        >
          メタデータ分析
          {activeTab === "analysis" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-foreground" />
          )}
        </button>
      </div>

      <main className="space-y-10">
        {activeTab === "performance" ? (
          <>
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                チャンネル概要
              </h2>
              <ChannelOverview />
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                動画パフォーマンス
              </h2>
              <VideoGrowthChart />
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                動画ごとのパフォーマンス (Small Multiples)
              </h2>
              <VideoSmallMultiples />
            </section>

            <section>
              <TopVideos />
            </section>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  動画公開頻度
                </h2>
                <VideoFrequencyChart onSelect={handleSelectVideos} />
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  動画の長さの分布
                </h2>
                <VideoDurationHistogram onSelect={handleSelectVideos} />
              </section>
            </div>

            <div id="filtered-list">
              <FilteredVideoList videos={selectedVideos} label={filterLabel} />
            </div>
          </>
        )}
      </main>

      <footer className="mt-16 py-6 border-t border-border text-center text-muted text-sm">
        Data collected via YouTube Data API v3 + yt-dlp
      </footer>
    </div>
  );
}
