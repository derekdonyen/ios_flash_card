# 記憶卡片 iOS App

React Native / Expo MVP for a customizable memory card app.

## 功能

- 自訂卡片牌組
- 新增提示面與答案面的記憶卡片
- 卡片類型：英文、中文、片語、自訂
- 英文或片語答案可使用 iOS TTS 發音
- 複習模式可選：
  - 提示先
  - 答案先
  - 隨機正反面
- 複習排程：
  - 稍後
  - 1日
  - 3日
  - 7日
  - 1月
- 今日統計：
  - 今日複習數
  - 今日新增數
  - 各排程按鈕次數
  - 連續複習天數

## 技術

- Expo
- React Native
- TypeScript
- expo-sqlite
- expo-speech

## 開發指令

```sh
npm install
npm run ios
```

或先啟動 Expo：

```sh
npm start
```

## 專案結構

```txt
App.tsx
src/
  date.ts
  storage.ts
  types.ts
```

## 下一步建議

- 拆分 UI 元件與 screen 檔案
- 加入卡片編輯功能
- 加入搜尋與 CSV 匯入
- 加入每日提醒通知
- 加入 iCloud/Firebase 同步
