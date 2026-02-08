import { getSupabase } from "./supabase";

export type ChannelSnapshot = {
  collected_date: string;
  subscriber_count: number;
  total_view_count: number;
  video_count: number;
};

export type VideoMeta = {
  video_id: string;
  title: string;
  published_at: string;
  duration_seconds: number;
  thumbnail_url: string;
};

export type VideoSnapshotRow = {
  video_id: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  collected_date: string;
};

export async function fetchChannelSnapshots(
  days: number = 90
): Promise<ChannelSnapshot[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { data, error } = await getSupabase()
    .from("channel_snapshots")
    .select("collected_date, subscriber_count, total_view_count, video_count")
    .gte("collected_date", cutoff.toISOString().slice(0, 10))
    .order("collected_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchLatestChannelSnapshot(): Promise<ChannelSnapshot | null> {
  const { data, error } = await getSupabase()
    .from("channel_snapshots")
    .select("collected_date, subscriber_count, total_view_count, video_count")
    .order("collected_date", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function fetchTopVideos(
  limit: number = 20
): Promise<(VideoMeta & { view_count: number })[]> {
  // 最新日の統計を取得
  const { data: latestDate } = await getSupabase()
    .from("video_snapshots")
    .select("collected_date")
    .order("collected_date", { ascending: false })
    .limit(1)
    .single();

  if (!latestDate) return [];

  const { data: snapshots, error: snapError } = await getSupabase()
    .from("video_snapshots")
    .select("video_id, view_count")
    .eq("collected_date", latestDate.collected_date)
    .order("view_count", { ascending: false })
    .limit(limit);

  if (snapError || !snapshots) return [];

  const videoIds = snapshots.map((s) => s.video_id);
  const { data: metas } = await getSupabase()
    .from("video_metadata")
    .select("video_id, title, published_at, duration_seconds, thumbnail_url")
    .in("video_id", videoIds);

  const metaMap = new Map((metas ?? []).map((m) => [m.video_id, m]));
  return snapshots.map((s) => ({
    ...(metaMap.get(s.video_id) ?? {
      video_id: s.video_id,
      title: "",
      published_at: "",
      duration_seconds: 0,
      thumbnail_url: "",
    }),
    view_count: s.view_count,
  }));
}

export async function fetchVideoGrowth(
  videoId: string,
  days: number = 30
): Promise<VideoSnapshotRow[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { data, error } = await getSupabase()
    .from("video_snapshots")
    .select("video_id, view_count, like_count, comment_count, collected_date")
    .eq("video_id", videoId)
    .gte("collected_date", cutoff.toISOString().slice(0, 10))
    .order("collected_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchRecentVideos(
  days: number = 30
): Promise<VideoMeta[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { data, error } = await getSupabase()
    .from("video_metadata")
    .select("video_id, title, published_at, duration_seconds, thumbnail_url")
    .gte("published_at", cutoff.toISOString())
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchVideoSnapshotsMulti(
  videoIds: string[],
  days: number = 30
): Promise<VideoSnapshotRow[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const { data, error } = await getSupabase()
    .from("video_snapshots")
    .select("video_id, view_count, like_count, comment_count, collected_date")
    .in("video_id", videoIds)
    .gte("collected_date", cutoff.toISOString().slice(0, 10))
    .order("collected_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
