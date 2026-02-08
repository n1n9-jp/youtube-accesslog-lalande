# セットアップ & 動作確認ガイド

## 1. Supabase プロジェクト作成

1. https://supabase.com にログインし、「New Project」でプロジェクトを作成
2. 左メニュー **SQL Editor** を開き、`supabase_schema.sql` の内容を貼り付けて **Run** で実行
3. 左メニュー **Project Settings > API** から以下の3つを控える:
   - **Project URL** (例: `https://xxxxx.supabase.co`)
   - **anon public key**
   - **service_role secret key**

## 2. 環境変数の設定

### Python 収集スクリプト用

`config/.env` を編集:

```
YOUTUBE_API_KEY=取得済みのYouTube Data API v3キー
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=service_role_keyをここに
```

### Next.js ダッシュボード用

`dashboard/.env.local` を編集:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon_keyをここに
```

## 3. Python 依存パッケージのインストール

```bash
make setup
```

> `make setup` は Python 仮想環境 (`.venv`) を作成し、依存パッケージをインストールします。macOS では Homebrew Python がグローバル pip を拒否するため、必ず venv 経由で実行してください。

## 4. 初回データ収集（バックフィル）

全動画のメタデータと現在の統計を一括取得する:

```bash
make backfill
```

成功時のログ出力例:

```
全動画IDを取得中...
合計 XXX 動画を発見
うち XXX 件が未登録
メタデータを取得中...
XXX 件のメタデータを登録完了
現在の統計を取得中...
XXX 件の統計を記録完了
```

**確認**: Supabase ダッシュボード > Table Editor で `video_metadata` と `video_snapshots` にデータが入っていること。

## 5. 日次収集の動作確認

```bash
make collect-daily
```

**確認**: `channel_snapshots` にチャンネル統計（登録者数・総再生回数・動画数）が追加されていること。

## 6. スクレイピングの動作確認

```bash
make collect-recent
```

直近7日以内に公開された動画がある場合、`scraped_snapshots` にリアルタイム再生回数が記録される。

## 7. べき等性の確認

```bash
make collect-daily
```

もう一度実行し、`video_snapshots` に同日の重複行が作られないことを確認。UNIQUE制約 + upsert により安全に上書きされる。

## 8. ダッシュボードのローカル動作確認

### 依存パッケージのインストール

```bash
cd dashboard
npm install
```

### 環境変数の確認

`dashboard/.env.local` に以下が設定されていること:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon_keyをここに
```

### 開発サーバーの起動

```bash
npm run dev
```

cd dashboard
npx next dev -p 4040


または、プロジェクトルートから:

```bash
make dashboard
```

### ブラウザで確認

http://localhost:3000 を開いて以下を確認:

- **ヘッダーバナー**: ララチューンの黄色グラデーションバナーが表示される
- **KPIカード**: 登録者数（黄色）・総再生回数（オレンジ）・動画数（レッドオレンジ）が表示される
- **推移グラフ**: 登録者数と総再生回数の折れ線グラフが表示される（初日は1点のみ）
- **動画パフォーマンス**: 直近30日以内に公開された動画の再生回数成長曲線が比較表示される
- **Top 20 ランキング**: サムネイル付きで動画が再生回数順に並ぶ

> 推移グラフはデータが2日分以上たまると線グラフになる。数日間 cron で自動収集を続けると意味のあるグラフになる。

### ローカルでのトラブルシューティング

| 症状 | 対処 |
|---|---|
| 画面が真っ暗で何も表示されない | ブラウザの開発者ツール > Console でエラーを確認 |
| 「データがありません」と表示 | ステップ4〜6を先に実行してデータを投入する |
| グラフが表示されずスケルトンのまま | `.env.local` の Supabase URL / Key が正しいか確認 |

## 9. ダッシュボードのビルド確認

```bash
cd dashboard
npm run build
```

エラーなく完了することを確認。ビルド成功後、以下でプロダクションモードのローカル確認も可能:

```bash
npm run start
```

http://localhost:3000 で本番ビルドの表示を確認できる。

## 10. Vercel デプロイ

1. プロジェクトを GitHub にプッシュ
2. https://vercel.com でリポジトリをインポート
3. **Root Directory** に `dashboard` を指定
4. **Environment Variables** に以下を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. 「Deploy」を実行
6. 発行されたURLでダッシュボードが表示されることを確認

## 11. GitHub Actions による自動収集の登録

PCのスリープに関係なく、GitHub Actions で24時間確実にデータ収集を行う。

### GitHub Secrets の設定

リポジトリの **Settings > Secrets and variables > Actions** で以下の3つを登録:

| Secret名 | 値 |
|---|---|
| `YOUTUBE_API_KEY` | YouTube Data API v3 キー |
| `SUPABASE_URL` | Supabase Project URL (`https://xxxxx.supabase.co`) |
| `SUPABASE_KEY` | Supabase `service_role` キー |

### 自動実行スケジュール

push すると以下のスケジュールで自動実行される:

| ワークフロー | スケジュール | 内容 |
|---|---|---|
| `collect.yml` | 毎日 03:00 JST | 日次データ収集（チャンネル統計 + 全動画統計） |
| `scrape.yml` | 毎日 10:00, 18:00 JST | 新着動画のスクレイピング |

### 手動実行

GitHub リポジトリの **Actions** タブから手動実行も可能:

1. 左サイドバーでワークフローを選択
2. **Run workflow** ボタンをクリック
3. `collect.yml` の場合は `daily` または `recent` を選択して実行

### 動作確認

翌日、Supabase の Table Editor で `channel_snapshots` や `video_snapshots` にデータが自動追加されていればセットアップ完了。

GitHub の **Actions** タブで実行ログも確認できる。

### （オプション）ローカル cron による自動収集

ローカルMacでも cron で収集したい場合:

```bash
make cron-install
```

表示されるエントリを `crontab -e` で登録。ただし Mac がスリープ中は実行されない。

---

## トラブルシューティング

| 症状 | 原因と対処 |
|---|---|
| `YOUTUBE_API_KEY が設定されていません` | `config/.env`（ローカル）または GitHub Secrets に正しいキーが入っているか確認 |
| `SUPABASE_URL/SUPABASE_KEY が設定されていません` | `config/.env`（ローカル）または GitHub Secrets に Supabase の URL と service_role key を設定 |
| `Invalid supabaseUrl` (ビルド時) | `dashboard/.env.local` に `NEXT_PUBLIC_SUPABASE_URL` を設定。ページは `force-dynamic` のため SSG 時には呼ばれないはず |
| backfill で `HttpError 403` | YouTube API のクォータ超過。翌日に再実行するか、Google Cloud Console でクォータ上限を確認 |
| ダッシュボードに「データがありません」 | Supabase のテーブルにデータが入っているか Table Editor で確認。RLS ポリシーが正しく設定されているか確認 |
| GitHub Actions が動かない | リポジトリの Settings > Secrets に3つのキーが登録されているか確認。Actions タブでエラーログを確認 |
