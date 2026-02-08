.PHONY: setup collect-daily collect-recent backfill dashboard

PROJECT_DIR = $(shell dirname $(realpath $(MAKEFILE_LIST)))
VENV = $(PROJECT_DIR)/.venv
PYTHON = $(VENV)/bin/python
PIP = $(VENV)/bin/pip

# Python仮想環境作成 + 依存パッケージインストール
setup:
	python3 -m venv $(VENV)
	$(PIP) install -r requirements.txt

# 初回バックフィル（全動画メタデータ + 現在統計）
backfill:
	$(PYTHON) scripts/backfill.py

# 日次データ収集（API経由で全動画統計）
collect-daily:
	$(PYTHON) scripts/collect.py --mode daily

# 新着動画の高頻度スクレイピング
collect-recent:
	$(PYTHON) scripts/collect.py --mode recent

# ダッシュボード開発サーバー起動
dashboard:
	cd dashboard && npm run dev

# ダッシュボードビルド
dashboard-build:
	cd dashboard && npm run build

# crontabに収集スケジュールを登録
cron-install:
	@echo "以下をcrontabに追加してください (crontab -e):"
	@echo ""
	@echo "# ラランド YouTube 日次データ収集 (毎日 03:00 JST)"
	@echo "0 3 * * * cd $(PROJECT_DIR) && $(PYTHON) scripts/collect.py --mode daily >> data/collect.log 2>&1"
	@echo ""
	@echo "# 新着動画の高頻度スクレイピング (10:00, 18:00 JST)"
	@echo "0 10,18 * * * cd $(PROJECT_DIR) && $(PYTHON) scripts/collect.py --mode recent >> data/collect.log 2>&1"
