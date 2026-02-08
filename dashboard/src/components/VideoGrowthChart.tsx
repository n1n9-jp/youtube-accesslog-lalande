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
  "#D45E00",
  "#E03A00",
  "#C22D00",
  "#B34E00",
  "#A06000",
  "#CC4400",
  "#8B3A00",
  "#D47000",
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
    return <div className="animate-pulse h-96 bg-card rounded-xl" />;
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        直近の動画 - 再生回数推移
      </h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8D8A0" />
            <XAxis
              dataKey="date"
              stroke="#8A7340"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#8A7340"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFDF5",
                border: "1px solid #E8B800",
                borderRadius: "8px",
                color: "#2A1F00",
              }}
              labelStyle={{ color: "#8A7340" }}
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
        <p className="text-muted">
          直近30日以内に公開された動画がありません
        </p>
      )}
    </div>
  );
}
