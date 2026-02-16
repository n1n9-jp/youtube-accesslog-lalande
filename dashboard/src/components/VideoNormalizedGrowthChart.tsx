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

export default function VideoNormalizedGrowthChart() {
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
            // 公開日から最大30日分追いたいので、スナップショットも多めに取得
            const snapshots = await fetchVideoSnapshotsMulti(ids, 60);

            // 公開日マップを作成
            const publishDateMap = new Map(
                topRecent.map((v) => [v.video_id, new Date(v.published_at.split("T")[0])])
            );

            // 経過日数ごとにピボット
            // { daysSince: 0, "video_id1": 100, "video_id2": 200 }
            const daysMap = new Map<number, Record<string, unknown>>();

            for (const snap of snapshots) {
                const pubDate = publishDateMap.get(snap.video_id);
                if (!pubDate) continue;

                const collDate = new Date(snap.collected_date);
                const diffTime = collDate.getTime() - pubDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) continue; // 公開前のデータは除外

                if (!daysMap.has(diffDays)) {
                    daysMap.set(diffDays, { daysSince: diffDays });
                }
                daysMap.get(diffDays)![snap.video_id] = snap.view_count;
            }

            const sorted = Array.from(daysMap.values()).sort((a, b) =>
                (a.daysSince as number) - (b.daysSince as number)
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
                新着動画 - 公開からの成長比較
            </h3>
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8D8A0" />
                        <XAxis
                            dataKey="daysSince"
                            stroke="#8A7340"
                            tick={{ fontSize: 12 }}
                            label={{ value: "経過日数", position: "insideBottomRight", offset: -5, fontSize: 12 }}
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
                            labelFormatter={(label) => `公開から ${label} 日目`}
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
                                connectNulls={true}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-muted">
                    比較可能なデータがありません
                </p>
            )}
        </div>
    );
}
