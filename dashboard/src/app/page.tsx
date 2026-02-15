import ChannelOverview from "@/components/ChannelOverview";
import TopVideos from "@/components/TopVideos";
import VideoGrowthChart from "@/components/VideoGrowthChart";
import VideoSmallMultiples from "@/components/VideoSmallMultiples";
import VideoFrequencyChart from "@/components/VideoFrequencyChart";
import VideoDurationHistogram from "@/components/VideoDurationHistogram";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
          ララチューン
        </h1>
        <p className="text-muted mt-1 font-medium">
          ラランド公式 YouTube Analytics
        </p>
      </header>

      <main className="space-y-10">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              動画公開頻度
            </h2>
            <VideoFrequencyChart />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              動画の長さの分布
            </h2>
            <VideoDurationHistogram />
          </section>
        </div>
      </main>

      <footer className="mt-16 py-6 border-t border-border text-center text-muted text-sm">
        Data collected via YouTube Data API v3 + yt-dlp
      </footer>
    </div>
  );
}
