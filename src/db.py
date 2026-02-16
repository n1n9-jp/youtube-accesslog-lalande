from datetime import datetime
from supabase import create_client, Client

from src.models import ChannelSnapshot, ChannelMetadata, VideoMetadata, VideoSnapshot, ScrapedSnapshot


class Database:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.client: Client = create_client(supabase_url, supabase_key)

    def ensure_schema(self):
        """Supabaseではマイグレーションで事前にテーブルを作成するため、ここでは何もしない"""
        pass

    def close(self):
        pass

    # ── チャンネルスナップショット ──

    def insert_channel_snapshot(self, snap: ChannelSnapshot):
        self.client.table("channel_snapshots").upsert(
            {
                "channel_id": snap.channel_id,
                "subscriber_count": snap.subscriber_count,
                "total_view_count": snap.total_view_count,
                "video_count": snap.video_count,
                "collected_date": snap.collected_date,
                "collected_at": snap.collected_at,
            },
            on_conflict="channel_id,collected_date",
        ).execute()

    def insert_channel_metadata(self, meta: ChannelMetadata):
        self.client.table("channel_metadata").upsert(
            {
                "channel_id": meta.channel_id,
                "title": meta.title,
                "thumbnail_url": meta.thumbnail_url,
                "banner_url": meta.banner_url,
                "updated_at": meta.updated_at,
            },
            on_conflict="channel_id",
        ).execute()

    # ── 動画メタデータ ──

    def insert_video_metadata(self, meta: VideoMetadata):
        now = datetime.utcnow().isoformat()
        existing = (
            self.client.table("video_metadata")
            .select("first_seen_at")
            .eq("video_id", meta.video_id)
            .execute()
        )
        first_seen = existing.data[0]["first_seen_at"] if existing.data else now

        self.client.table("video_metadata").upsert(
            {
                "video_id": meta.video_id,
                "title": meta.title,
                "description": meta.description,
                "published_at": meta.published_at,
                "duration_seconds": meta.duration_seconds,
                "tags": meta.tags,
                "category_id": meta.category_id,
                "thumbnail_url": meta.thumbnail_url,
                "first_seen_at": first_seen,
                "updated_at": now,
            },
            on_conflict="video_id",
        ).execute()

    def insert_video_metadata_batch(self, metas: list[VideoMetadata]):
        for m in metas:
            self.insert_video_metadata(m)

    def find_new_video_ids(self, video_ids: list[str]) -> list[str]:
        existing = set()
        for i in range(0, len(video_ids), 100):
            batch = video_ids[i:i + 100]
            result = (
                self.client.table("video_metadata")
                .select("video_id")
                .in_("video_id", batch)
                .execute()
            )
            existing.update(r["video_id"] for r in result.data)
        return [vid for vid in video_ids if vid not in existing]

    # ── 動画スナップショット ──

    def insert_video_snapshot(self, snap: VideoSnapshot):
        self.client.table("video_snapshots").upsert(
            {
                "video_id": snap.video_id,
                "view_count": snap.view_count,
                "like_count": snap.like_count,
                "comment_count": snap.comment_count,
                "collected_date": snap.collected_date,
                "collected_at": snap.collected_at,
            },
            on_conflict="video_id,collected_date",
        ).execute()

    def insert_video_snapshots_batch(self, snaps: list[VideoSnapshot]):
        # Supabase upsert はバッチ対応
        rows = [
            {
                "video_id": s.video_id,
                "view_count": s.view_count,
                "like_count": s.like_count,
                "comment_count": s.comment_count,
                "collected_date": s.collected_date,
                "collected_at": s.collected_at,
            }
            for s in snaps
        ]
        # 500件ずつバッチ処理（Supabaseの制限対応）
        for i in range(0, len(rows), 500):
            batch = rows[i:i + 500]
            self.client.table("video_snapshots").upsert(
                batch, on_conflict="video_id,collected_date"
            ).execute()

    # ── スクレイピングスナップショット ──

    def insert_scraped_snapshot(self, snap: ScrapedSnapshot):
        self.client.table("scraped_snapshots").insert(
            {
                "video_id": snap.video_id,
                "view_count": snap.view_count,
                "like_count": snap.like_count,
                "collected_at": snap.collected_at,
            }
        ).execute()

    # ── クエリヘルパー ──

    def get_recent_video_ids(self, days: int = 7) -> list[str]:
        from datetime import timedelta
        cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
        result = (
            self.client.table("video_metadata")
            .select("video_id")
            .gte("published_at", cutoff)
            .order("published_at", desc=True)
            .execute()
        )
        return [r["video_id"] for r in result.data]

    def get_all_video_ids(self) -> list[str]:
        result = (
            self.client.table("video_metadata")
            .select("video_id")
            .order("published_at", desc=True)
            .execute()
        )
        return [r["video_id"] for r in result.data]
