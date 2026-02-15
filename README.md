# ララチューン (Lalande YouTube Analytics)

ラランド公式 YouTube チャンネルのデータを収集・可視化するためのダッシュボードプロジェクトです。
YouTube Data API v3 と `yt-dlp` を組み合わせて、詳細なパフォーマンス分析を可能にします。

## データソースについて

本プロジェクトでは、公式API経由のデータと、スクレイピングによるリアルタイムデータの2種類を組み合わせて使用しています。

### API経由で取得しているデータ (YouTube Data API v3)
公式APIを使用して、定期的（日次など）に信頼性の高いデータを取得しています。

*   **チャンネル統計**
    *   チャンネル登録者数 (`subscriberCount`)
    *   総再生回数 (`viewCount`)
    *   総動画本数 (`videoCount`)
*   **動画メタデータ**
    *   動画ID・タイトル・説明文
    *   公開日時
    *   動画の長さ (Duration)
    *   タグ設定
    *   カテゴリID
    *   サムネイル画像URL
*   **動画統計（日次推移）**
    *   再生回数
    *   高評価数
    *   コメント数

### API以外（スクレイピング）で取得しているデータ (yt-dlp)
APIの割り当て（クォータ）を節約しつつ、より高頻度な更新が必要な指標を `yt-dlp` を用いて取得しています。

*   **動画リアルタイム統計**
    *   再生回数 (View Count)
    *   高評価数 (Like Count)

## プロジェクト構成

*   `dashboard/`: Next.js を使用した可視化ダッシュボード
*   `src/`: データ収集用の Python モジュール
    *   `api_collector.py`: YouTube Data API v3 を使用したデータ収集
    *   `scrape_collector.py`: `yt-dlp` を使用したスクレイピング収集
*   `scripts/`: 収集実行用スクリプト
*   `supabase_schema.sql`: データベース（Supabase/PostgreSQL）のスキーマ定義

## 開発環境の起動

ダッシュボードを起動するには以下の手順を実行してください。

```bash
cd dashboard
npm install
npx next dev -p 8080
```
