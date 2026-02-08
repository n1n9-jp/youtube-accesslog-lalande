#!/usr/bin/env python3
"""初回バックフィル: 既存全動画のメタデータを一括取得

使い方:
    python scripts/backfill.py
"""
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config.settings import (
    YOUTUBE_API_KEY, CHANNEL_ID, LOG_PATH, API_DAILY_QUOTA_LIMIT,
    SUPABASE_URL, SUPABASE_KEY,
)
from src.db import Database
from src.api_collector import ApiCollector


def main():
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        handlers=[
            logging.FileHandler(str(LOG_PATH), encoding="utf-8"),
            logging.StreamHandler(),
        ],
    )
    logger = logging.getLogger("backfill")

    if not YOUTUBE_API_KEY or YOUTUBE_API_KEY == "YOUR_API_KEY_HERE":
        logger.error("YOUTUBE_API_KEY が設定されていません。config/.env を確認してください。")
        sys.exit(1)

    if not SUPABASE_URL or SUPABASE_URL == "YOUR_SUPABASE_URL_HERE":
        logger.error("SUPABASE_URL/SUPABASE_KEY が設定されていません。config/.env を確認してください。")
        sys.exit(1)

    db = Database(SUPABASE_URL, SUPABASE_KEY)
    db.ensure_schema()
    api = ApiCollector(YOUTUBE_API_KEY, API_DAILY_QUOTA_LIMIT)

    try:
        # 1. 全動画ID取得
        logger.info("全動画IDを取得中...")
        video_ids = api.get_all_video_ids(CHANNEL_ID)
        logger.info(f"合計 {len(video_ids)} 動画を発見")

        # 2. 未登録の動画のみメタデータ取得
        new_ids = db.find_new_video_ids(video_ids)
        logger.info(f"うち {len(new_ids)} 件が未登録")

        if not new_ids:
            logger.info("全動画が既に登録済みです")
            return

        # 3. メタデータ取得・保存
        logger.info("メタデータを取得中...")
        metadata = api.get_video_metadata(new_ids)
        db.insert_video_metadata_batch(metadata)
        logger.info(f"{len(metadata)} 件のメタデータを登録完了")

        # 4. 現在の統計スナップショットも取得
        logger.info("現在の統計を取得中...")
        snapshots = api.get_video_stats(video_ids)
        db.insert_video_snapshots_batch(snapshots)
        logger.info(f"{len(snapshots)} 件の統計を記録完了")

        logger.info(f"API quota使用量: {api.quota.used}/{api.quota.daily_limit}")
    except Exception as e:
        logger.error(f"バックフィル中にエラーが発生: {e}", exc_info=True)
        sys.exit(1)
    finally:
        db.close()

    logger.info("バックフィル完了")


if __name__ == "__main__":
    main()
