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
import { fetchAllVideoMetadata, VideoMeta } from "@/lib/queries";

type Props = {
    onSelect?: (label: string, videos: VideoMeta[]) => void;
};

export default function VideoFrequencyChart({ onSelect }: Props) {
    const [allVideos, setAllVideos] = useState<VideoMeta[]>([]);
    const [chartData, setChartData] = useState<{ month: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const videos = await fetchAllVideoMetadata();
                setAllVideos(videos);

                const monthMap = new Map<string, number>();
                videos.forEach((v: any) => {
                    if (!v.published_at) return;
                    const month = v.published_at.slice(0, 7); // YYYY-MM
                    monthMap.set(month, (monthMap.get(month) || 0) + 1);
                });

                const sortedData = Array.from(monthMap.entries())
                    .map(([month, count]) => ({ month, count }))
                    .sort((a, b) => a.month.localeCompare(b.month));

                setChartData(sortedData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return <div className="animate-pulse h-80 bg-card rounded-xl" />;
    }

    return (
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">
                月別動画公開本数
            </h3>
            <div className="h-80 w-full min-h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        onClick={(data) => {
                            if (!onSelect || !data || !data.activeLabel) return;
                            const month = String(data.activeLabel);
                            const filtered = allVideos.filter((v) => v.published_at?.startsWith(month));
                            onSelect(`${month} 公開`, filtered);
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8D8A0" vertical={false} />
                        <XAxis
                            dataKey="month"
                            stroke="#8A7340"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            stroke="#8A7340"
                            tick={{ fontSize: 12 }}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#FFFDF5",
                                border: "1px solid #E8B800",
                                borderRadius: "8px",
                                color: "#2A1F00",
                            }}
                            labelStyle={{ color: "#8A7340" }}
                        />
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#D45E00"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#D45E00" }}
                            activeDot={{ r: 6, cursor: "pointer" }}
                            name="公開本数"
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="text-sm text-primary font-medium mt-4 cursor-pointer hover:underline">
                ※ グラフの点をクリックすると対象の動画を表示します
            </p>
        </div>
    );
}
