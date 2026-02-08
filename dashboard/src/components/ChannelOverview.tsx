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
    return <div className="animate-pulse h-64 bg-card rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {latest && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <p className="text-muted text-sm">登録者数</p>
            <p className="text-3xl font-bold text-primary">
              {formatNumber(latest.subscriber_count)}
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <p className="text-muted text-sm">総再生回数</p>
            <p className="text-3xl font-bold text-accent">
              {formatNumber(latest.total_view_count)}
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <p className="text-muted text-sm">動画数</p>
            <p className="text-3xl font-bold text-accent-red">
              {latest.video_count.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Subscriber Trend */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">登録者数推移</h3>
        {snapshots.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={snapshots}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8D8A0" />
              <XAxis
                dataKey="collected_date"
                stroke="#8A7340"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="#8A7340"
                tick={{ fontSize: 12 }}
                tickFormatter={formatNumber}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFDF5",
                  border: "1px solid #E8B800",
                  borderRadius: "8px",
                  color: "#2A1F00",
                }}
                labelStyle={{ color: "#8A7340" }}
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  "登録者数",
                ]}
              />
              <Line
                type="monotone"
                dataKey="subscriber_count"
                stroke="#D45E00"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted">データがありません</p>
        )}
      </div>

      {/* Total Views Trend */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          総再生回数推移
        </h3>
        {snapshots.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={snapshots}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8D8A0" />
              <XAxis
                dataKey="collected_date"
                stroke="#8A7340"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="#8A7340"
                tick={{ fontSize: 12 }}
                tickFormatter={formatNumber}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFDF5",
                  border: "1px solid #E8B800",
                  borderRadius: "8px",
                  color: "#2A1F00",
                }}
                labelStyle={{ color: "#8A7340" }}
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  "総再生回数",
                ]}
              />
              <Line
                type="monotone"
                dataKey="total_view_count"
                stroke="#E03A00"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted">データがありません</p>
        )}
      </div>
    </div>
  );
}
