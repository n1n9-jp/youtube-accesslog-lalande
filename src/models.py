from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class ChannelSnapshot:
    channel_id: str
    subscriber_count: int
    total_view_count: int
    video_count: int
    collected_at: str  # ISO 8601
    collected_date: str  # YYYY-MM-DD


@dataclass
class VideoMetadata:
    video_id: str
    title: str
    description: str
    published_at: str
    duration_seconds: int
    tags: str  # JSON配列のテキスト
    category_id: str
    thumbnail_url: str


@dataclass
class VideoSnapshot:
    video_id: str
    view_count: int
    like_count: int
    comment_count: int
    collected_at: str
    collected_date: str


@dataclass
class ScrapedSnapshot:
    video_id: str
    view_count: int
    like_count: Optional[int]
    collected_at: str
