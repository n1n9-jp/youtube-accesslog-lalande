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
import { fetchAllVideoStats, VideoWithStats } from "@/lib/queries";

export type MetricType = "view_count" | "like_count" | "comment_count";

type Bin = {
    label: string;
    min: number;
    max: number;
};

type Props = {
    metric: MetricType;
    title: string;
    bins: Bin[];
    colors: string[];
    onSelect?: (label: string, videos: any[]) => void;
};

export default function VideoMetricHistogram({ metric, title, bins, colors, onSelect }: Props) {
    const [allData, setAllData] = useState<VideoWithStats[]>([]);
    const [chartData, setChartData] = useState<{ label: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await fetchAllVideoStats();
                setAllData(data);

                const counts = bins.map((bin) => ({
                    label: bin.label,
                    count: data.filter(
                        (v) => v[metric] >= bin.min && v[metric] < bin.max
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
    }, [metric, bins]);

    if (loading) {
        return <div className="animate-pulse h-80 bg-card rounded-xl" />;
    }

    return (
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">
                {title}
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
                            tick={{ fontSize: 11 }}
                            angle={-25}
                            textAnchor="end"
                            interval={0}
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
                                const bin = bins.find((b) => b.label === label);
                                if (!bin) return;

                                const filtered = allData.filter(
                                    (v) => v[metric] >= bin.min && v[metric] < bin.max
                                );
                                onSelect(`${title}: ${label}`, filtered);
                            }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
