"use client";

import { useState } from "react";
import ChannelOverview from "@/components/ChannelOverview";
import TopVideos from "@/components/TopVideos";
import VideoGrowthChart from "@/components/VideoGrowthChart";
import VideoNormalizedGrowthChart from "@/components/VideoNormalizedGrowthChart";
import BannerHeader from "@/components/BannerHeader";
import VideoSmallMultiples from "@/components/VideoSmallMultiples";
import VideoFrequencyChart from "@/components/VideoFrequencyChart";
import VideoDurationHistogram from "@/components/VideoDurationHistogram";
import VideoMetricHistogram, { MetricType } from "@/components/VideoMetricHistogram";
import FilteredVideoList from "@/components/FilteredVideoList";
import { VideoWithStats } from "@/lib/queries";

const CHANNEL_ID = "UCuWdyc0Mp7zRZd6KSPguCsA";

const VIEW_BINS = [
  { label: "1万未満", min: 0, max: 10000 },
  { label: "1-5万", min: 10000, max: 50000 },
  { label: "5-10万", min: 50000, max: 100000 },
  { label: "10-30万", min: 100000, max: 300000 },
  { label: "30-50万", min: 300000, max: 500000 },
  { label: "50-100万", min: 500000, max: 1000000 },
  { label: "100万以上", min: 1000000, max: Infinity },
];

const LIKE_BINS = [
  { label: "100未満", min: 0, max: 100 },
  { label: "100-500", min: 100, max: 500 },
  { label: "500-1k", min: 500, max: 1000 },
  { label: "1k-5k", min: 1000, max: 5000 },
  { label: "5k-10k", min: 5000, max: 10000 },
  { label: "10k以上", min: 10000, max: Infinity },
];

const COMMENT_BINS = [
  { label: "10未満", min: 0, max: 10 },
  { label: "10-50", min: 10, max: 50 },
  { label: "50-100", min: 50, max: 100 },
  { label: "100-500", min: 100, max: 500 },
  { label: "500-1k", min: 500, max: 1000 },
  { label: "1k以上", min: 1000, max: Infinity },
];

const METRIC_COLORS = ["#D45E00", "#E03A00", "#C22D00", "#B34E00", "#A06000", "#CC4400", "#8B3A00"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"performance" | "analysis">("performance");
  const [selectedVideos, setSelectedVideos] = useState<VideoWithStats[]>([]);
  const [filterLabel, setFilterLabel] = useState("");

  const handleSelectVideos = (label: string, videos: VideoWithStats[]) => {
    // 公開日の新しい順にソート
    const sorted = [...videos].sort((a, b) => {
      return (b.published_at || "").localeCompare(a.published_at || "");
    });
    setFilterLabel(label);
    setSelectedVideos(sorted);

    // スクロールさせて気づきやすくする
    setTimeout(() => {
      const element = document.getElementById("filtered-list");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen pb-10 max-w-7xl mx-auto space-y-0">
      <BannerHeader channelId={CHANNEL_ID} />

      <div className="px-6 md:px-10 mt-12">
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
            onClick={() => {
              setActiveTab("analysis");
              setSelectedVideos([]);
            }}
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
                <div className="grid grid-cols-1 gap-8">
                  <VideoGrowthChart />
                  <VideoNormalizedGrowthChart />
                </div>
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

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    再生回数の分布
                  </h2>
                  <VideoMetricHistogram
                    metric="view_count"
                    title="再生回数の分布"
                    bins={VIEW_BINS}
                    colors={METRIC_COLORS}
                    onSelect={handleSelectVideos}
                  />
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    高評価数の分布
                  </h2>
                  <VideoMetricHistogram
                    metric="like_count"
                    title="高評価数の分布"
                    bins={LIKE_BINS}
                    colors={METRIC_COLORS}
                    onSelect={handleSelectVideos}
                  />
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    コメント数の分布
                  </h2>
                  <VideoMetricHistogram
                    metric="comment_count"
                    title="コメント数の分布"
                    bins={COMMENT_BINS}
                    colors={METRIC_COLORS}
                    onSelect={handleSelectVideos}
                  />
                </section>
              </div>

              <div id="filtered-list">
                <FilteredVideoList videos={selectedVideos} label={filterLabel} />
              </div>
            </>
          )}
        </main>

        <footer className="mt-16 py-6 px-6 md:px-10 border-t border-border text-center text-muted text-sm">
          Data collected via YouTube Data API v3 + yt-dlp
        </footer>
      </div>
    </div>
  );
}
