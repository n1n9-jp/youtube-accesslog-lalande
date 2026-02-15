# データソース仕様 (Data Sources Specification)

本プロジェクト「ララチューン」で扱っているデータソースの詳細です。

## API経由で取得しているデータ (YouTube Data API v3)

YouTube公式の API を使用して取得している、信頼性の高い統計情報およびメタデータです。

*   **チャンネル統計**
    *   `subscriber_count`: チャンネル登録者数
    *   `total_view_count`: チャンネル全体の総再生回数
    *   `video_count`: 公開済みの動画総数
*   **動画メタデータ** (各動画の基本情報)
    *   `video_id`: 動画の一意識別子
    *   `title`: 動画タイトル
    *   `description`: 動画の説明文
    *   `published_at`: 公開日時
    *   `duration_seconds`: 動画の長さ（秒）
    *   `tags`: 設定されているタグ（JSON形式）
    *   `category_id`: YouTubeカテゴリID
    *   `thumbnail_url`: サムネイル画像のURL
*   **動画日次統計** (`video_snapshots` テーブル)
    *   `view_count`: 再生回数
    *   `like_count`: 高評価数
    *   `comment_count`: コメント数

## API以外（スクレイピング）で取得しているデータ (yt-dlp)

APIの割り当て（クォータ）制限を回避しつつ、よりリアルタイムに近い情報を取得するために `yt-dlp` を使用しています。

*   **動画リアルタイム統計** (`scraped_snapshots` テーブル)
    *   `view_count`: その時点での再生回数
    *   `like_count`: その時点での高評価数

---
*収集日時や、各データの収集・更新間隔については、`scripts/collect.py` および `supabase_schema.sql` を参照してください。*
