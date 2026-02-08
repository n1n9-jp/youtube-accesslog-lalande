# YouTube アクセスログ収集ツール - 実装プラン

## Context

ラランド公式YouTubeチャンネル（ララチューン【ラランド公式】, `UCuWdyc0Mp7zRZd6KSPguCsA`）のアクセスデータを日次で収集・蓄積し、アクセス数向上のための分析基盤を構築する。YouTube Data API v3 による公式データ取得に加え、yt-dlp を用いたスクレイピングで新着動画の高頻度計測を行い、公開直後のアクセス推移を細かく把握できるようにする。

収集データは **Supabase** (PostgreSQL) に保存し、**Next.js + Recharts** で構築したダッシュボードを **Vercel** にデプロイして可視化する。

---

## 技術スタック

| レイヤー | 技術 | 理由 |
|---|---|---|
| データ収集 | Python 3.11+ | データ収集・分析のエコシステムが充実 |
| YouTube API | `google-api-python-client` | Google公式ライブラリ |
| スクレイピング | `yt-dlp`（Pythonライブラリとして使用） | YouTube抽出に特化、アンチボット対策に対応 |
| DB | **Supabase** (PostgreSQL) | クラウドホスティング、Next.jsから直接参照可能、RLS対応 |
| ダッシュボード | **Next.js 16 + Recharts + Tailwind CSS** | Vercelデプロイ対応、インタラクティブなWeb UI |
| デプロイ | **Vercel** | Next.jsとの親和性、ゼロコンフィグデプロイ |
| 設定管理 | `.env` + `python-dotenv` / `.env.local` | APIキーをコードから分離 |
| スケジューリング | cron (macOS crontab) | デーモン不要、シンプルで確実 |

---

## アーキテクチャ

```
┌─────────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Python 収集スクリプト  │────▶│   Supabase   │◀────│  Next.js (Vercel)│
│  (ローカルPC / cron)  │     │  (PostgreSQL) │     │   ダッシュボード   │
└─────────────────────┘     └──────────────┘     └─────────────────┘
  - YouTube Data API v3                             - Recharts グラフ
  - yt-dlp スクレイピング                             - チャンネル概要
                                                    - 動画ランキング
                                                    - 成長曲線比較
```

- **Python収集スクリプト**: ローカルPCでcron実行。Supabaseに `service_role` キーで書き込み
- **Next.js ダッシュボード**: Vercelにデプロイ。Supabaseに `anon` キー（読み取り専用）で参照
- **Supabase**: RLSで読み取りのみ公開。書き込みは `service_role` キー経由のみ

---

## ディレクトリ構成

```
youtube_accesslog_lalande/
├── config/
│   ├── .env                    # Python用: YouTube APIキー + Supabase credentials (git対象外)
│   └── settings.py             # チャンネルID、Supabase接続、収集パラメータ
├── src/
│   ├── __init__.py
│   ├── api_collector.py        # YouTube Data API v3 による収集
│   ├── scrape_collector.py     # yt-dlp による補足データ収集
│   ├── db.py                   # Supabase クライアント・upsert/クエリヘルパー
│   └── models.py               # dataclass定義 (ChannelSnapshot, VideoMetadata, VideoSnapshot, ScrapedSnapshot)
├── scripts/
│   ├── collect.py              # メインCLI: --mode daily | --mode recent
│   └── backfill.py             # 初回用: 既存全動画メタデータ + 統計の一括取得
├── dashboard/                  # Next.js アプリケーション (Vercelデプロイ対象)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # lang="ja", メタデータ設定
│   │   │   ├── page.tsx        # メインページ (force-dynamic)
│   │   │   └── globals.css     # ダークテーマベース
│   │   ├── components/
│   │   │   ├── ChannelOverview.tsx    # KPIカード + 登録者数/総再生回数の折れ線グラフ
│   │   │   ├── TopVideos.tsx          # 再生回数Top20ランキング（サムネ付き）
│   │   │   └── VideoGrowthChart.tsx   # 直近30日公開動画の成長曲線オーバーレイ（最大8本）
│   │   └── lib/
│   │       ├── supabase.ts     # Supabaseクライアント（遅延初期化でSSGエラー回避）
│   │       └── queries.ts      # データ取得クエリ関数群
│   ├── .env.local              # Next.js用: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
│   ├── package.json
│   └── .gitignore
├── data/                       # ログ出力先 (git対象外)
├── supabase_schema.sql         # Supabase テーブル作成SQL（RLSポリシー含む）
├── requirements.txt            # Python依存パッケージ
├── Makefile
├── PLAN.md
└── .gitignore
```

---

## データベーススキーマ（Supabase / PostgreSQL）

テーブル作成は `supabase_schema.sql` を Supabase SQL Editor で実行。

### `channel_snapshots` - チャンネル日次スナップショット
| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | BIGSERIAL | PK | 自動採番 |
| channel_id | TEXT | NOT NULL | チャンネルID |
| subscriber_count | INTEGER | | 登録者数 |
| total_view_count | BIGINT | | 総再生回数 |
| video_count | INTEGER | | 動画数 |
| collected_date | TEXT | NOT NULL, UNIQUE(channel_id, collected_date) | 収集日 (YYYY-MM-DD) |
| collected_at | TEXT | NOT NULL | 収集日時 (ISO 8601) |

### `video_metadata` - 動画メタデータ
| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| video_id | TEXT | PK | 動画ID |
| title | TEXT | | タイトル |
| description | TEXT | | 説明文 |
| published_at | TEXT | | 公開日時 |
| duration_seconds | INTEGER | | 動画の長さ（秒） |
| tags | TEXT | | タグ（JSON配列） |
| category_id | TEXT | | カテゴリID |
| thumbnail_url | TEXT | | サムネイルURL |
| first_seen_at | TEXT | | 初回検出日時 |
| updated_at | TEXT | | 最終更新日時 |

### `video_snapshots` - 動画日次統計（コアテーブル）
| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | BIGSERIAL | PK | 自動採番 |
| video_id | TEXT | NOT NULL, FK → video_metadata | 動画ID |
| view_count | INTEGER | | 再生回数 |
| like_count | INTEGER | | 高評価数 |
| comment_count | INTEGER | | コメント数 |
| collected_date | TEXT | NOT NULL, UNIQUE(video_id, collected_date) | 収集日 |
| collected_at | TEXT | NOT NULL | 収集日時 |

### `scraped_snapshots` - スクレイピング高頻度データ
| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | BIGSERIAL | PK | 自動採番 |
| video_id | TEXT | NOT NULL, FK → video_metadata | 動画ID |
| view_count | INTEGER | | リアルタイム再生回数 |
| like_count | INTEGER | | 高評価数 |
| collected_at | TEXT | NOT NULL | 収集日時（1日複数回あり得る） |

### RLS ポリシー
- 全テーブルでRLS有効化
- `anon` キーに対して SELECT のみ許可（ダッシュボード読み取り用）
- 書き込みは `service_role` キー経由（Python収集スクリプト）のみ

---

## セットアップ手順

### 1. Supabase プロジェクト作成
1. https://supabase.com でプロジェクトを作成
2. SQL Editor で `supabase_schema.sql` を実行
3. Settings > API から以下を取得:
   - Project URL → `SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_KEY`（Python収集スクリプト用）

### 2. Python 環境セットアップ
```bash
make setup   # pip install -r requirements.txt
```

`config/.env` を編集:
```
YOUTUBE_API_KEY=your_youtube_api_key
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_service_role_key
```

### 3. 初回データ収集
```bash
make backfill       # 全動画メタデータ + 現在統計を一括取得
make collect-daily  # 日次収集の動作確認
```

### 4. ダッシュボード（ローカル確認）
```bash
cd dashboard
npm install
```

`dashboard/.env.local` を編集:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

```bash
npm run dev   # http://localhost:3000 で確認
```

### 5. Vercel デプロイ
1. GitHubにpush
2. Vercelでリポジトリをインポート（**Root Directory: `dashboard`**）
3. Environment Variables に以下を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. デプロイ実行

### 6. cron 登録
```bash
make cron-install   # 登録すべきcrontabエントリを表示
```

表示される内容:
```
# ラランド YouTube 日次データ収集 (毎日 03:00 JST)
0 3 * * * cd /path/to/project && python3 scripts/collect.py --mode daily >> data/collect.log 2>&1

# 新着動画の高頻度スクレイピング (10:00, 18:00 JST)
0 10,18 * * * cd /path/to/project && python3 scripts/collect.py --mode recent >> data/collect.log 2>&1
```

---

## Makefile ターゲット一覧

| ターゲット | コマンド | 説明 |
|---|---|---|
| `make setup` | `pip3 install -r requirements.txt` | Python依存パッケージのインストール |
| `make backfill` | `python3 scripts/backfill.py` | 初回バックフィル（全動画メタデータ + 統計） |
| `make collect-daily` | `python3 scripts/collect.py --mode daily` | 全動画の日次統計スナップショット |
| `make collect-recent` | `python3 scripts/collect.py --mode recent` | 新着動画のスクレイピング高頻度取得 |
| `make dashboard` | `cd dashboard && npm run dev` | ダッシュボード開発サーバー起動 |
| `make dashboard-build` | `cd dashboard && npm run build` | ダッシュボード本番ビルド |
| `make cron-install` | (表示のみ) | crontab登録コマンドを出力 |

---

## データ収集戦略: API vs スクレイピング

### YouTube Data API v3 で取得（日次 03:00 JST）
- チャンネル登録者数・総再生回数 (`channels.list` part=statistics)
- 全動画の再生回数・高評価数・コメント数 (`videos.list` part=statistics, 50件バッチ)
- 新動画のメタデータ (`videos.list` part=snippet,contentDetails)
- **日次クォータ使用量: ~33ユニット**（10,000上限に対して余裕あり）

### yt-dlp で取得（新着動画のみ 10:00, 18:00 JST）
- 直近7日以内の動画のリアルタイム再生回数
- リクエスト間隔: 3〜5秒のランダムディレイ
- 1回の実行につき最大50リクエスト
- 公開直後のアクセス推移をより細かく把握

---

## ダッシュボード構成

| セクション | コンポーネント | 内容 |
|---|---|---|
| チャンネル概要 | `ChannelOverview.tsx` | KPIカード（登録者数・総再生回数・動画数）+ 登録者数推移グラフ + 総再生回数推移グラフ |
| 動画パフォーマンス | `VideoGrowthChart.tsx` | 直近30日以内に公開された動画（最大8本）の再生回数成長曲線をオーバーレイ比較 |
| ランキング | `TopVideos.tsx` | 再生回数Top 20（サムネイル・投稿日・再生時間・再生回数付き、YouTubeリンク付き） |

---

## Python依存パッケージ (`requirements.txt`)

```
google-api-python-client>=2.100.0
google-auth>=2.23.0
yt-dlp>=2024.01.01
supabase>=2.0.0
python-dotenv>=1.0.0
```

## Dashboard依存パッケージ（主要）

```
next 16.x
react 19.x
@supabase/supabase-js
recharts
tailwindcss
```

---

## 環境変数一覧

### Python収集スクリプト (`config/.env`)
| 変数名 | 説明 |
|---|---|
| `YOUTUBE_API_KEY` | YouTube Data API v3 キー |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_KEY` | Supabase `service_role` キー（書き込み用） |

### Next.jsダッシュボード (`dashboard/.env.local`)
| 変数名 | 説明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase `anon` キー（読み取り専用） |

---

## 検証方法

1. `make backfill` → Supabaseの `video_metadata` に全動画が入ることを確認
2. `make collect-daily` → `channel_snapshots` と `video_snapshots` にデータ挿入を確認
3. `make collect-recent` → `scraped_snapshots` に新着動画のデータが入ることを確認
4. 同じコマンドを2回実行 → 重複が作られないことを確認（upsert + UNIQUE制約によるべき等性）
5. `make dashboard` → http://localhost:3000 でグラフ表示を確認
6. `make dashboard-build` → Next.jsビルドがエラーなく完了することを確認
7. Vercelにデプロイ → 本番URLでダッシュボードが動作することを確認
