#!/usr/bin/env python3
"""YouTube データ収集メインスクリプト

使い方:
    python scripts/collect.py --mode daily    # 全動画の日次スナップショット
    python scripts/collect.py --mode recent   # 新着動画の高頻度スクレイピング
"""
import argparse
import logging
import sys
import time
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config.settings import (
    YOUTUBE_API_KEY, CHANNEL_ID, LOG_PATH,
    SUPABASE_URL, SUPABASE_KEY,
    API_DAILY_QUOTA_LIMIT, SCRAPE_RECENT_DAYS,
)
from src.db import Database
from src.api_collector import ApiCollector, QuotaExhaustedError


def setup_logging():
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        handlers=[
            logging.FileHandler(str(LOG_PATH), encoding="utf-8"),
            logging.StreamHandler(),
        ],
    )


def collect_daily(db: Database):
    """全動画の日次スナップショット収集"""
    logger = logging.getLogger("collect.daily")

    if not YOUTUBE_API_KEY or YOUTUBE_API_KEY == "YOUR_API_KEY_HERE":
        logger.error("YOUTUBE_API_KEY が設定されていません。config/.env を確認してください。")
        sys.exit(1)

    if not SUPABASE_URL or SUPABASE_URL == "YOUR_SUPABASE_URL_HERE":
        logger.error("SUPABASE_URL が設定されていません。config/.env を確認してください。")
        sys.exit(1)

    api = ApiCollector(YOUTUBE_API_KEY, API_DAILY_QUOTA_LIMIT)

    # 1. チャンネル統計
    logger.info("チャンネル統計を取得中...")
    channel = api.get_channel_stats(CHANNEL_ID)
    db.insert_channel_snapshot(channel)
    logger.info(
        f"チャンネル: 登録者 {channel.subscriber_count:,}, "
        f"総再生 {channel.total_view_count:,}, "
        f"動画数 {channel.video_count}"
    )

    # 2. 全動画ID取得 & 新動画検出
    logger.info("動画一覧を取得中...")
    video_ids = api.get_all_video_ids(CHANNEL_ID)
    new_ids = db.find_new_video_ids(video_ids)

    if new_ids:
        logger.info(f"新規動画 {len(new_ids)} 件のメタデータを取得中...")
        metadata = api.get_video_metadata(new_ids)
        db.insert_video_metadata_batch(metadata)
        logger.info(f"新規動画 {len(new_ids)} 件を登録")

    # 3. 全動画の統計スナップショット
    logger.info(f"全 {len(video_ids)} 動画の統計を取得中...")
    try:
        snapshots = api.get_video_stats(video_ids)
        db.insert_video_snapshots_batch(snapshots)
        logger.info(f"{len(snapshots)} 件の統計を記録")
    except QuotaExhaustedError as e:
        logger.warning(f"APIクォータ超過: {e}")

    logger.info(f"API quota使用量: {api.quota.used}/{api.quota.daily_limit}")


def collect_recent(db: Database):
    """新着動画のスクレイピング高頻度収集"""
    logger = logging.getLogger("collect.recent")

    recent_ids = db.get_recent_video_ids(days=SCRAPE_RECENT_DAYS)
    if not recent_ids:
        logger.info("直近の新着動画はありません")
        return

    logger.info(f"直近 {SCRAPE_RECENT_DAYS} 日の動画 {len(recent_ids)} 件をスクレイピング中...")

    try:
        from src.scrape_collector import ScrapeCollector
        scraper = ScrapeCollector()

        for video_id in recent_ids:
            try:
                snap = scraper.get_live_stats(video_id)
                if snap:
                    db.insert_scraped_snapshot(snap)
                    logger.info(f"  {video_id}: {snap.view_count:,} views")
            except Exception as e:
                logger.warning(f"  {video_id}: スクレイピング失敗 - {e}")

        logger.info("スクレイピング完了")
    except ImportError:
        logger.warning("yt-dlp がインストールされていません。pip install yt-dlp を実行してください。")


def main():
    parser = argparse.ArgumentParser(description="YouTube データ収集")
    parser.add_argument(
        "--mode",
        choices=["daily", "recent"],
        required=True,
        help="収集モード: daily=全動画日次, recent=新着スクレイピング",
    )
    args = parser.parse_args()

    setup_logging()
    logger = logging.getLogger("collect")
    logger.info(f"=== 収集開始: mode={args.mode} ===")

    if not SUPABASE_URL or SUPABASE_URL == "YOUR_SUPABASE_URL_HERE":
        logging.getLogger("collect").error(
            "SUPABASE_URL/SUPABASE_KEY が設定されていません。config/.env を確認してください。"
        )
        sys.exit(1)

    db = Database(SUPABASE_URL, SUPABASE_KEY)
    db.ensure_schema()

    try:
        if args.mode == "daily":
            collect_daily(db)
        elif args.mode == "recent":
            collect_recent(db)
    except Exception as e:
        logger.error(f"収集中にエラーが発生: {e}", exc_info=True)
        sys.exit(1)
    finally:
        db.close()

    logger.info(f"=== 収集完了: mode={args.mode} ===")


if __name__ == "__main__":
    main()
