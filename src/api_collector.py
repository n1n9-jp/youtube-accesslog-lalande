import json
import logging
import re
from datetime import datetime

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from src.models import ChannelSnapshot, ChannelMetadata, VideoMetadata, VideoSnapshot

logger = logging.getLogger(__name__)


class QuotaExhaustedError(Exception):
    pass


class QuotaTracker:
    def __init__(self, daily_limit: int = 10000):
        self.daily_limit = daily_limit
        self.used = 0

    def consume(self, units: int):
        self.used += units
        if self.used > self.daily_limit * 0.9:
            logger.warning(f"API quota at {self.used}/{self.daily_limit}")
        if self.used >= self.daily_limit:
            raise QuotaExhaustedError(f"Daily quota exhausted: {self.used}")

    @property
    def remaining(self) -> int:
        return self.daily_limit - self.used


def _parse_duration(duration_str: str) -> int:
    """ISO 8601 duration (PT1H2M3S) を秒に変換"""
    match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration_str or "")
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds


class ApiCollector:
    def __init__(self, api_key: str, daily_quota_limit: int = 10000):
        self.youtube = build("youtube", "v3", developerKey=api_key)
        self.quota = QuotaTracker(daily_quota_limit)

    def get_channel_stats(self, channel_id: str) -> ChannelSnapshot:
        response = self.youtube.channels().list(
            part="statistics",
            id=channel_id,
        ).execute()
        self.quota.consume(1)

        item = response["items"][0]
        stats = item["statistics"]
        now = datetime.utcnow()
        return ChannelSnapshot(
            channel_id=channel_id,
            subscriber_count=int(stats.get("subscriberCount", 0)),
            total_view_count=int(stats.get("viewCount", 0)),
            video_count=int(stats.get("videoCount", 0)),
            collected_at=now.isoformat(),
            collected_date=now.strftime("%Y-%m-%d"),
        )

    def get_channel_metadata(self, channel_id: str) -> ChannelMetadata:
        response = self.youtube.channels().list(
            part="snippet,brandingSettings",
            id=channel_id,
        ).execute()
        self.quota.consume(1)

        item = response["items"][0]
        snippet = item["snippet"]
        branding = item["brandingSettings"]
        
        # アイコンURL（高解像度を優先）
        thumbnails = snippet.get("thumbnails", {})
        thumb_url = (
            thumbnails.get("high", {}).get("url")
            or thumbnails.get("default", {}).get("url", "")
        )
        
        # バナーURL
        banner_url = branding.get("image", {}).get("bannerExternalUrl", "")
        
        return ChannelMetadata(
            channel_id=channel_id,
            title=snippet.get("title", ""),
            thumbnail_url=thumb_url,
            banner_url=banner_url,
            updated_at=datetime.utcnow().isoformat(),
        )

    def get_uploads_playlist_id(self, channel_id: str) -> str:
        response = self.youtube.channels().list(
            part="contentDetails",
            id=channel_id,
        ).execute()
        self.quota.consume(1)
        return response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

    def get_all_video_ids(self, channel_id: str) -> list[str]:
        """uploads プレイリスト経由で全動画IDを取得（search.listより低コスト）"""
        playlist_id = self.get_uploads_playlist_id(channel_id)
        video_ids = []
        next_page_token = None

        while True:
            response = self.youtube.playlistItems().list(
                part="contentDetails",
                playlistId=playlist_id,
                maxResults=50,
                pageToken=next_page_token,
            ).execute()
            self.quota.consume(1)

            for item in response.get("items", []):
                video_ids.append(item["contentDetails"]["videoId"])

            next_page_token = response.get("nextPageToken")
            if not next_page_token:
                break

        logger.info(f"Found {len(video_ids)} videos in channel")
        return video_ids

    def get_video_stats(self, video_ids: list[str]) -> list[VideoSnapshot]:
        """50件ずつバッチで動画統計を取得"""
        snapshots = []
        now = datetime.utcnow()
        collected_date = now.strftime("%Y-%m-%d")
        collected_at = now.isoformat()

        for i in range(0, len(video_ids), 50):
            batch = video_ids[i:i + 50]
            response = self.youtube.videos().list(
                part="statistics",
                id=",".join(batch),
            ).execute()
            self.quota.consume(1)

            for item in response.get("items", []):
                stats = item["statistics"]
                snapshots.append(VideoSnapshot(
                    video_id=item["id"],
                    view_count=int(stats.get("viewCount", 0)),
                    like_count=int(stats.get("likeCount", 0)),
                    comment_count=int(stats.get("commentCount", 0)),
                    collected_at=collected_at,
                    collected_date=collected_date,
                ))

        return snapshots

    def get_video_metadata(self, video_ids: list[str]) -> list[VideoMetadata]:
        """50件ずつバッチで動画メタデータを取得"""
        metadata_list = []

        for i in range(0, len(video_ids), 50):
            batch = video_ids[i:i + 50]
            response = self.youtube.videos().list(
                part="snippet,contentDetails",
                id=",".join(batch),
            ).execute()
            self.quota.consume(1)

            for item in response.get("items", []):
                snippet = item["snippet"]
                content = item["contentDetails"]
                thumbnails = snippet.get("thumbnails", {})
                thumb_url = (
                    thumbnails.get("maxres", {}).get("url")
                    or thumbnails.get("high", {}).get("url")
                    or thumbnails.get("default", {}).get("url", "")
                )
                metadata_list.append(VideoMetadata(
                    video_id=item["id"],
                    title=snippet.get("title", ""),
                    description=snippet.get("description", ""),
                    published_at=snippet.get("publishedAt", ""),
                    duration_seconds=_parse_duration(content.get("duration", "")),
                    tags=json.dumps(snippet.get("tags", []), ensure_ascii=False),
                    category_id=snippet.get("categoryId", ""),
                    thumbnail_url=thumb_url,
                ))

        return metadata_list
