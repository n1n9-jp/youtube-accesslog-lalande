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
import { fetchRecentVideos, fetchVideoSnapshotsMulti } from "@/lib/queries";

export default function VideoSmallMultiples() {
    const [videoData, setVideoData] = useState<
        {
            videoId: string;
            title: string;
            data: { date: string; view_count: number }[];
        }[]
    >([]);
    const [globalMax, setGlobalMax] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            // 直近の動画を12本取得
            const recentVideos = await fetchRecentVideos(30);
            const topRecent = recentVideos.slice(0, 12);

            if (topRecent.length === 0) {
                setLoading(false);
                return;
            }

            const ids = topRecent.map((v) => v.video_id);
            const snapshots = await fetchVideoSnapshotsMulti(ids, 30);

            // 動画IDごとにデータをグループ化
            const dataMap = new Map<
                string,
                { date: string; view_count: number }[]
            >();

            // 初期化
            topRecent.forEach((v) => {
                dataMap.set(v.video_id, []);
            });

            // データを詰め込む
            snapshots.forEach((snap) => {
                const list = dataMap.get(snap.video_id);
                if (list) {
                    list.push({
                        date: snap.collected_date.slice(5), // MD only for small chart
                        view_count: snap.view_count,
                    });
                }
            });

            let maxViews = 0;
            // 各動画のデータを日付順にソート (null除外)
            const processedData = topRecent.map((v) => {
                const list = dataMap.get(v.video_id) || [];
                list.sort((a, b) => a.date.localeCompare(b.date));
                list.forEach(d => {
                    if (d.view_count > maxViews) maxViews = d.view_count;
                });
                return {
                    videoId: v.video_id,
                    title: v.title,
                    data: list,
                };
            });

            setGlobalMax(maxViews);
            setVideoData(processedData);
            setLoading(false);
        }

        load();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="animate-pulse h-48 bg-card rounded-xl border border-border"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videoData.map((video) => (
                    <div
                        key={video.videoId}
                        className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col h-64"
                    >
                        <h4
                            className="text-sm font-medium text-foreground mb-2 line-clamp-2 h-10 leading-tight"
                            title={video.title}
                        >
                            {video.title}
                        </h4>
                        <div className="flex-1 w-full min-h-0">
                            {video.data.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={video.data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#E8D8A0"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#8A7340"
                                            tick={{ fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval="preserveStartEnd"
                                            minTickGap={10}
                                        />
                                        <YAxis
                                            stroke="#8A7340"
                                            tick={{ fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v) =>
                                                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()
                                            }
                                            domain={[0, Math.ceil(globalMax / 1000) * 1000]}
                                            width={40}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#FFFDF5",
                                                border: "1px solid #E8B800",
                                                borderRadius: "8px",
                                                color: "#2A1F00",
                                                fontSize: "12px",
                                                padding: "4px 8px",
                                            }}
                                            labelStyle={{ color: "#8A7340", marginBottom: "2px" }}
                                            itemStyle={{ padding: 0 }}
                                            formatter={(value: any) => [
                                                Number(value).toLocaleString(),
                                                "Views",
                                            ]}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="view_count"
                                            stroke="#D45E00"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs text-muted">
                                    No Data
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
