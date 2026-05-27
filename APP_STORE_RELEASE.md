# App Store 正式發佈 Checklist

## 1. 重新產生正式版 Build

```sh
npx eas-cli build --platform ios --profile production --clear-cache
```

Build 完成後上傳：

```sh
npx eas-cli submit --platform ios --profile production --latest
```

## 2. App Store Connect 必填資料

- App Name：記憶卡片
- Subtitle：自訂牌組與間隔複習
- Category：Education
- Content Rights：不包含第三方授權內容
- Age Rating：依 App Store Connect 問卷填寫；此 App 通常可選低年齡分級
- Pricing：Free 或選擇付費價格
- Availability：選擇要上架的國家/地區
- Support URL：需要一個公開網址
- Privacy Policy URL：需要一個公開網址

## 3. 建議 App Store 文案

### Promotional Text

用自己的提示與答案建立記憶卡片，透過稍後、1日、3日、7日與1月排程安排複習。

### Description

記憶卡片是一款簡潔的自訂 flashcard 學習工具，適合用來記憶英文單字、片語、中文提示、面試題或任何需要反覆練習的內容。

你可以建立不同牌組，自行輸入提示面與答案面，並在複習時選擇從提示或答案開始。每張卡片複習後，可以選擇稍後、1日、3日、7日或1月後再次出現，讓記憶安排更符合自己的節奏。

主要功能：
- 自訂卡片牌組
- 提示面與答案面自由輸入
- 英文與片語發音
- 提示先、答案先或隨機複習
- 複習排程：稍後、1日、3日、7日、1月
- 每日記憶狀況統計
- 本地儲存，可離線使用

### Keywords

flashcard,記憶卡片,單字,英文,片語,學習,複習,背單字,spaced repetition

### What's New

正式首版推出：支援自訂牌組、卡片複習、英文發音與每日統計。

## 4. App Privacy 建議填法

目前版本沒有帳號、雲端同步、廣告、第三方分析，也沒有把使用者資料傳到伺服器。

若 App Store Connect 詢問是否收集資料：

- Data Collected：No
- Tracking：No

如果未來加入雲端同步、登入、分析、Crash reporting 或廣告，隱私標示需要更新。

## 5. 審查資訊

- Sign-in required：No
- Review Notes：This app is a local flashcard learning tool. Users can create decks, add cards, review them with spaced intervals, use English text-to-speech, and view daily review statistics. No login is required.

## 6. 截圖

至少準備 iPhone 截圖。建議 3-5 張：

1. 首頁與今日待複習
2. 牌組詳情與卡片列表
3. 新增卡片
4. 複習翻卡畫面
5. 每日統計
