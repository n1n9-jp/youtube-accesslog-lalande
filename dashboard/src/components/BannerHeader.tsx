"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchChannelMetadata, type ChannelMetadata } from "@/lib/queries";

interface BannerHeaderProps {
    channelId: string;
}

export default function BannerHeader({ channelId }: BannerHeaderProps) {
    const [metadata, setMetadata] = useState<ChannelMetadata | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await fetchChannelMetadata(channelId);
                setMetadata(data);
            } catch (error) {
                console.error("Failed to fetch channel metadata:", error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [channelId]);

    if (loading) {
        return (
            <div className="w-full h-48 md:h-64 bg-muted animate-pulse rounded-b-2xl mb-8" />
        );
    }

    if (!metadata) return null;

    return (
        <div className="relative mb-8">
            {/* Banner Image */}
            <div className="relative w-full h-48 md:h-64 overflow-hidden rounded-b-3xl border-b border-border shadow-lg">
                {metadata.banner_url ? (
                    <img
                        src={metadata.banner_url}
                        alt="Channel Banner"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
                )}
                {/* Overlay for better readability if needed */}
                <div className="absolute inset-0 bg-black/10" />
            </div>

            {/* Profile Icon and Info Overlay */}
            <div className="absolute -bottom-6 left-6 md:left-10 flex items-end space-x-4">
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background overflow-hidden shadow-xl bg-background">
                    {metadata.thumbnail_url ? (
                        <img
                            src={metadata.thumbnail_url}
                            alt={metadata.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-4xl">
                            {metadata.title.charAt(0)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
