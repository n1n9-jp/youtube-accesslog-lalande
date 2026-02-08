import ChannelOverview from "@/components/ChannelOverview";
import TopVideos from "@/components/TopVideos";
import VideoGrowthChart from "@/components/VideoGrowthChart";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white">
          ラランド YouTube Analytics
        </h1>
        <p className="text-gray-400 mt-1">
          ララチューン【ラランド公式】のアクセス分析ダッシュボード
        </p>
      </header>

      <main className="space-y-10">
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">
            チャンネル概要
          </h2>
          <ChannelOverview />
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">
            動画パフォーマンス
          </h2>
          <VideoGrowthChart />
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-4">ランキング</h2>
          <TopVideos />
        </section>
      </main>

      <footer className="mt-16 py-6 border-t border-gray-700 text-center text-gray-500 text-sm">
        Data collected via YouTube Data API v3 + yt-dlp
      </footer>
    </div>
  );
}
