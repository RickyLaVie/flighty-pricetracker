## Why

手動追蹤機票價格既耗時又容易錯過特價。用戶需要一套自動化系統，能持續監控自訂航線的價格變動，並在出現優惠時即時透過 Line Bot 通知，讓用戶不錯過任何特價機會。

## What Changes

- 新增 Web App 供用戶設定追蹤航線、查看價格走勢圖及管理通知規則
- 新增 Playwright 爬蟲引擎，定時從 Google Flights 與 Skyscanner 抓取票價
- 新增分級通知系統：低於平均價 20% / 30% 發送便宜機票通知，低於 40% 發送異常特價警報
- 新增 Line Bot 整合，接收推播通知並可與 Bot 互動查詢當前追蹤狀態
- 新增排程系統：每 4 小時（隨機偏移 ±30 分鐘）自動抓取一次，凌晨 0~6 點暫停，起飛日 ≤ 7 天的航線改為每 2 小時一次

## Non-Goals

- 不支援訂票功能（僅追蹤與通知，不做代訂）
- 不整合 Skyscanner / Google Flights 以外的來源（如 Kayak、直接航空公司官網）
- 不提供手機原生 App（iOS/Android），僅 Web App + Line Bot
- 不支援多用戶帳號系統，採單用戶或小圈子共用設計

## Capabilities

### New Capabilities

- `route-tracking`: 用戶可新增、編輯、刪除追蹤航線（出發地、目的地、日期範圍）
- `price-scraping`: 定時從 Google Flights 與 Skyscanner 抓取票價並儲存歷史紀錄
- `price-alerting`: 根據分級規則（-20% / -30% / -40% vs 平均價）判斷是否觸發通知
- `line-bot-notification`: 透過 Line Messaging API 推送通知，並支援查詢指令
- `price-history-dashboard`: Web App 展示價格走勢圖與目前追蹤清單

### Modified Capabilities

(none)

## Impact

- Affected specs: route-tracking, price-scraping, price-alerting, line-bot-notification, price-history-dashboard
- Affected code:
  - New: src/app/ (Next.js pages and API routes)
  - New: src/components/ (React UI components)
  - New: src/lib/scraper/ (Playwright scraping engine)
  - New: src/lib/scheduler/ (node-cron scheduling logic)
  - New: src/lib/alerting/ (price comparison and alert rules)
  - New: src/lib/linebot/ (Line Messaging API integration)
  - New: prisma/schema.prisma (database schema)
  - New: openspec/specs/route-tracking/spec.md
  - New: openspec/specs/price-scraping/spec.md
  - New: openspec/specs/price-alerting/spec.md
  - New: openspec/specs/line-bot-notification/spec.md
  - New: openspec/specs/price-history-dashboard/spec.md
