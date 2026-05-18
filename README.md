# photo-app

iOS 17+ 相簿整理、分享、自動剪片 app。

> 完整規格見 [SPEC.md](./SPEC.md)。

## 隱私硬性要求（出貨前不可違反）

- **零網路** — App 全程不向外連線
- **多裝置獨立** — 每支手機獨立，無同步、無裝置 ID
- **拒絕讀取已刪除 / 隱藏照片**
- **不蒐集任何 telemetry / analytics**

實作層保護：
- `Info.plist` 內 `NSAppTransportSecurity` 全鎖（無 exception domain）
- ESLint 規則禁止 import Sentry / Firebase / Amplitude / Mixpanel 等套件
- `npm run check:privacy` 掃 `package.json`，含禁用套件就 fail
- `expo-media-library` 一律包過 `src/features/library/safe-media.ts`

## 專案結構

```
app/                     Expo Router 路由
├── _layout.tsx
└── (tabs)/
    ├── _layout.tsx
    ├── index.tsx        相簿
    ├── collections.tsx  精選集
    ├── movie.tsx        剪片
    └── settings.tsx     設定

src/
├── features/
│   ├── library/         相簿存取（safe-media wrapper）
│   ├── collections/     精選集（M2）
│   └── movie/           剪片模板與流程
├── db/                  SQLite schema
└── types/               TypeScript 共用型別

scripts/
└── check-no-network-deps.mjs   隱私 CI guard

modules/                 v2 將在此放 Swift 原生影片合成模組
```

## 開發指令

```bash
npm install            # 安裝依賴
npm run typecheck      # TypeScript 檢查
npm run lint           # ESLint
npm run check:privacy  # 隱私 guard：掃禁用套件
npm run check:all      # 上述三項一次跑
```

## 部署到 iPhone（給 chi）

**這個 repo 在雲端開發；要看到真實 app 跑在 iPhone 16 Pro 上，要做下面步驟。**
**只有「步驟 4 產 pairing file」需要 Windows + USB 一次，其餘都在手機上。**

### 一次性設定

1. 在手機或電腦註冊 Expo 帳號 → https://expo.dev
2. 📱 iPhone Safari 開 https://sidestore.io，依步驟安裝 SideStore
3. 📱 SideStore 內登入免費 Apple ID
4. 💻 Windows + USB 一次：跑 JitterbugPair 工具產生 `.mobiledevicepairing` pairing file，AirDrop / iCloud 傳到手機，匯入 SideStore
5. 📱 iPhone 設定 → 一般 → 背景 App 重新整理 → 開啟 SideStore

完成後，Windows 可以收起來。

### 每次更新 app

1. Claude 在容器內 push code、跑 `npm run build:dev`（觸發 EAS Build）
2. EAS 雲端編譯 ~10 分鐘，產出 IPA 下載 URL
3. 📱 iPhone Safari 點 `sidestore://install?url=<IPA_URL>` 連結 → SideStore 自動安裝
4. SideStore 每 5–7 天自動重簽，無需介入

完整步驟與圖文：SPEC.md §8.5。

## 給 Claude（開發者注意事項）

- 嚴禁在 `src/` 或 `app/` 直接 `import 'expo-media-library'`，一律走 `src/features/library/safe-media.ts`
- 加新 npm 套件前先確認不在 `scripts/check-no-network-deps.mjs` 的禁用清單
- 影片模板 = 純 TypeScript schema object，新增不需動 Swift code（v2 接 IG 模板時用）
- 任何 PR 必須 `npm run check:all` 通過
