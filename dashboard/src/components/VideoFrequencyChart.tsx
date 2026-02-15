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
import { fetchAllVideoMetadata } from "@/lib/queries";

export default function VideoFrequencyChart() {
    const [chartData, setChartData] = useState<{ month: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const allVideos = await fetchAllVideoMetadata();

            // 月ごとにカウント
            const monthMap = new Map<string, number>();
            allVideos.forEach((v: any) => {
                if (!v.published_at) return;
                const month = v.published_at.slice(0, 7); // YYYY-MM
                monthMap.set(month, (monthMap.get(month) || 0) + 1);
            });

            const sortedData = Array.from(monthMap.entries())
                .map(([month, count]) => ({ month, count }))
                .sort((a, b) => a.month.localeCompare(b.month));

            setChartData(sortedData);
            setLoading(false);
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
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                            activeDot={{ r: 6 }}
                            name="公開本数"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
