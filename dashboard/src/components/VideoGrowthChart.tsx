"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  fetchRecentVideos,
  fetchVideoSnapshotsMulti,
  type VideoMeta,
  type VideoSnapshotRow,
} from "@/lib/queries";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

export default function VideoGrowthChart() {
  const [chartData, setChartData] = useState<Record<string, unknown>[]>([]);
  const [videoNames, setVideoNames] = useState<{ id: string; title: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const recentVideos = await fetchRecentVideos(30);
      const topRecent = recentVideos.slice(0, 8); // 最大8本

      if (topRecent.length === 0) {
        setLoading(false);
        return;
      }

      const ids = topRecent.map((v) => v.video_id);
      const snapshots = await fetchVideoSnapshotsMulti(ids, 30);

      // 日付ごとにピボット
      const dateMap = new Map<string, Record<string, unknown>>();
      for (const snap of snapshots) {
        if (!dateMap.has(snap.collected_date)) {
          dateMap.set(snap.collected_date, { date: snap.collected_date });
        }
        dateMap.get(snap.collected_date)![snap.video_id] = snap.view_count;
      }

      const sorted = Array.from(dateMap.values()).sort((a, b) =>
        (a.date as string).localeCompare(b.date as string)
      );

      setChartData(sorted);
      setVideoNames(
        topRecent.map((v) => ({
          id: v.video_id,
          title: v.title.length > 25 ? v.title.slice(0, 25) + "..." : v.title,
        }))
      );
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-96 bg-gray-800 rounded-lg" />;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        直近の動画 - 再生回数推移
      </h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#9CA3AF" }}
              formatter={(value, name) => {
                const video = videoNames.find((v) => v.id === String(name));
                return [Number(value).toLocaleString(), video?.title ?? String(name)];
              }}
            />
            <Legend
              formatter={(value) => {
                const video = videoNames.find((v) => v.id === value);
                return video?.title ?? value;
              }}
              wrapperStyle={{ fontSize: 12 }}
            />
            {videoNames.map((v, i) => (
              <Line
                key={v.id}
                type="monotone"
                dataKey={v.id}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500">
          直近30日以内に公開された動画がありません
        </p>
      )}
    </div>
  );
}
