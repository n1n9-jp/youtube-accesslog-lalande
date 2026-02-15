"use client";

import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { fetchAllVideoMetadata, VideoMeta } from "@/lib/queries";

const BINS = [
    { label: "1分未満", min: 0, max: 60 },
    { label: "1-5分", min: 60, max: 300 },
    { label: "5-10分", min: 300, max: 600 },
    { label: "10-20分", min: 600, max: 1200 },
    { label: "20-30分", min: 1200, max: 1800 },
    { label: "30-60分", min: 1800, max: 3600 },
    { label: "60分以上", min: 3600, max: Infinity },
];

const COLORS = [
    "#D45E00",
    "#E03A00",
    "#C22D00",
    "#B34E00",
    "#A06000",
    "#CC4400",
    "#8B3A00",
];

type Props = {
    onSelect?: (label: string, videos: VideoMeta[]) => void;
};

export default function VideoDurationHistogram({ onSelect }: Props) {
    const [allVideos, setAllVideos] = useState<VideoMeta[]>([]);
    const [chartData, setChartData] = useState<{ label: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const videos = await fetchAllVideoMetadata();
                setAllVideos(videos);

                const counts = BINS.map((bin) => ({
                    label: bin.label,
                    count: videos.filter(
                        (v: any) => v.duration_seconds >= bin.min && v.duration_seconds < bin.max
                    ).length,
                }));

                setChartData(counts);
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
                動画の長さの分布
            </h3>
            <div className="h-80 w-full min-h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8D8A0" vertical={false} />
                        <XAxis
                            dataKey="label"
                            stroke="#8A7340"
                            tick={{ fontSize: 12 }}
                            angle={-25}
                            textAnchor="end"
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
                        <Bar
                            dataKey="count"
                            name="動画本数"
                            cursor="pointer"
                            isAnimationActive={false}
                            onClick={(data: any) => {
                                if (!onSelect || !data) return;
                                const label = data.label;
                                const bin = BINS.find((b) => b.label === label);
                                if (!bin) return;

                                const filtered = allVideos.filter(
                                    (v) => v.duration_seconds >= bin.min && v.duration_seconds < bin.max
                                );
                                onSelect(`長さが ${label}`, filtered);
                            }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-sm text-primary font-medium mt-4 cursor-pointer hover:underline">
                ※ 棒をクリックすると対象の動画を表示します
            </p>
        </div>
    );
}
