-- Supabase SQL Editor で実行してテーブルを作成してください

-- チャンネル日次スナップショット
CREATE TABLE channel_snapshots (
    id BIGSERIAL PRIMARY KEY,
    channel_id TEXT NOT NULL,
    subscriber_count INTEGER,
    total_view_count BIGINT,
    video_count INTEGER,
    collected_date TEXT NOT NULL,
    collected_at TEXT NOT NULL,
    UNIQUE(channel_id, collected_date)
);

-- 動画メタデータ
CREATE TABLE video_metadata (
    video_id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    published_at TEXT,
    duration_seconds INTEGER,
    tags TEXT,
    category_id TEXT,
    thumbnail_url TEXT,
    first_seen_at TEXT,
    updated_at TEXT
);

-- 動画日次統計（コアテーブル）
CREATE TABLE video_snapshots (
    id BIGSERIAL PRIMARY KEY,
    video_id TEXT NOT NULL REFERENCES video_metadata(video_id),
    view_count INTEGER,
    like_count INTEGER,
    comment_count INTEGER,
    collected_date TEXT NOT NULL,
    collected_at TEXT NOT NULL,
    UNIQUE(video_id, collected_date)
);

-- スクレイピング高頻度データ
CREATE TABLE scraped_snapshots (
    id BIGSERIAL PRIMARY KEY,
    video_id TEXT NOT NULL REFERENCES video_metadata(video_id),
    view_count INTEGER,
    like_count INTEGER,
    collected_at TEXT NOT NULL
);

-- インデックス
CREATE INDEX idx_video_snapshots_date ON video_snapshots(collected_date);
CREATE INDEX idx_video_snapshots_video ON video_snapshots(video_id);
CREATE INDEX idx_channel_snapshots_date ON channel_snapshots(collected_date);
CREATE INDEX idx_scraped_snapshots_video ON scraped_snapshots(video_id);

-- RLS（Row Level Security）を有効化 - Next.jsからの読み取りアクセス用
ALTER TABLE channel_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_snapshots ENABLE ROW LEVEL SECURITY;

-- anon キーでの読み取りを許可（ダッシュボード表示用）
CREATE POLICY "Allow public read" ON channel_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON video_metadata FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON video_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON scraped_snapshots FOR SELECT USING (true);
