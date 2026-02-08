import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / "config" / ".env")

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
CHANNEL_ID = "UCuWdyc0Mp7zRZd6KSPguCsA"  # ララチューン【ラランド公式】

# Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")  # service_role key（サーバーサイド用）

LOG_PATH = BASE_DIR / "data" / "collect.log"

# API収集パラメータ
API_DAILY_QUOTA_LIMIT = 10000
VIDEO_BATCH_SIZE = 50  # videos.list は1リクエストで最大50件

# スクレイピングパラメータ
SCRAPE_DELAY_MIN = 3.0  # 秒
SCRAPE_DELAY_MAX = 5.0
SCRAPE_MAX_REQUESTS_PER_RUN = 50
SCRAPE_RECENT_DAYS = 7  # 直近N日以内の動画を対象
