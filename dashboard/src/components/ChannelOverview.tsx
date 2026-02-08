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
} from "recharts";
import {
  fetchChannelSnapshots,
  fetchLatestChannelSnapshot,
  type ChannelSnapshot,
} from "@/lib/queries";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function ChannelOverview() {
  const [snapshots, setSnapshots] = useState<ChannelSnapshot[]>([]);
  const [latest, setLatest] = useState<ChannelSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchChannelSnapshots(90), fetchLatestChannelSnapshot()])
      .then(([snaps, lat]) => {
        setSnapshots(snaps);
        setLatest(lat);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-800 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {latest && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">登録者数</p>
            <p className="text-3xl font-bold text-white">
              {formatNumber(latest.subscriber_count)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">総再生回数</p>
            <p className="text-3xl font-bold text-white">
              {formatNumber(latest.total_view_count)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">動画数</p>
            <p className="text-3xl font-bold text-white">
              {latest.video_count.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Subscriber Trend */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">登録者数推移</h3>
        {snapshots.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={snapshots}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="collected_date"
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                tickFormatter={formatNumber}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#9CA3AF" }}
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  "登録者数",
                ]}
              />
              <Line
                type="monotone"
                dataKey="subscriber_count"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">データがありません</p>
        )}
      </div>

      {/* Total Views Trend */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          総再生回数推移
        </h3>
        {snapshots.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={snapshots}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="collected_date"
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fontSize: 12 }}
                tickFormatter={formatNumber}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#9CA3AF" }}
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  "総再生回数",
                ]}
              />
              <Line
                type="monotone"
                dataKey="total_view_count"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">データがありません</p>
        )}
      </div>
    </div>
  );
}
