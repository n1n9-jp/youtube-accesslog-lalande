import logging
import random
import time
from datetime import datetime

import yt_dlp

from src.models import ScrapedSnapshot

logger = logging.getLogger(__name__)


class ScrapeCollector:
    def __init__(self, delay_min: float = 3.0, delay_max: float = 5.0):
        self.delay_min = delay_min
        self.delay_max = delay_max
        self._call_count = 0

    def get_live_stats(self, video_id: str) -> ScrapedSnapshot | None:
        """yt-dlp で動画のリアルタイム統計を取得"""
        url = f"https://www.youtube.com/watch?v={video_id}"
        opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "extract_flat": False,
        }

        # レート制限
        if self._call_count > 0:
            delay = random.uniform(self.delay_min, self.delay_max)
            time.sleep(delay)
        self._call_count += 1

        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)

            view_count = info.get("view_count")
            if view_count is None:
                logger.warning(f"{video_id}: view_count が取得できませんでした")
                return None

            return ScrapedSnapshot(
                video_id=video_id,
                view_count=view_count,
                like_count=info.get("like_count"),
                collected_at=datetime.utcnow().isoformat(),
            )
        except yt_dlp.utils.DownloadError as e:
            logger.warning(f"{video_id}: ダウンロードエラー - {e}")
            raise
        except Exception as e:
            logger.warning(f"{video_id}: 予期しないエラー - {e}")
            raise
