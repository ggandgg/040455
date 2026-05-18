# Photo App 規格文件

iOS 相簿整理、分享、自動剪片 app — 規格與技術設計。

> 狀態：草稿 v0.2 — 等待 owner 確認後再開始實作。
> Owner：chi（Windows 開發環境，無 Mac）
> 主要測試裝置：iPhone 16 Pro（A18 Pro、iOS 18+）
> 發佈方式：EAS Build（雲端編譯）→ AltStore for Windows 側載

---

## 1. 產品概述

一個 iOS 17+ app，讀取本機相簿，協助使用者：

1. **瀏覽 / 整理** — 用比系統相簿更彈性的方式檢視、分組、收藏、刪除照片。
2. **分享** — 透過系統 share sheet 將單張或一組照片/影片分享出去。
3. **自動剪片** — 選一批照片與影片，自動產生一支配樂短片，可儲存回相簿或分享。

v1 不做 AI 辨識（人臉/物件/OCR），列入 v2 候選。

---

## 2. 技術棧

| 項目 | 選型 | 備註 |
|---|---|---|
| Framework | **Expo SDK 52+** + React Native 0.76+ | New Architecture (Fabric) 預設開啟 |
| 語言 | TypeScript (strict) | |
| 路由 | Expo Router v4 | 檔案式路由 |
| 狀態管理 | Zustand | 比 Redux 輕量、夠用 |
| UI | NativeWind (Tailwind for RN) + 自訂元件 | |
| 圖片渲染 | `expo-image` | 比 RN `Image` 快、有快取 |
| 相簿存取 | `expo-media-library` | iOS 17 limited library 支援 |
| 影片播放 | `expo-video` | SDK 52 新版（取代 `expo-av`） |
| 分享 | `expo-sharing` | 系統 share sheet |
| 影片合成 | **自製原生模組 (Swift + AVFoundation)** | 見 §7 |
| 開發環境 | **Expo Dev Client + Prebuild**（非 Expo Go） | 因為需要原生模組 |

**為何不是純 Expo Go：** 自動剪片需要 AVFoundation，得寫 Swift 原生模組。Expo Go 沒辦法載入自訂原生程式碼，必須改用 Dev Client + `expo prebuild`。

---

## 3. 功能範圍

### v1（MVP）

#### F1 相簿瀏覽
- 預設顯示「所有照片」網格（3 欄、可切 2/4/5 欄）
- 上方分頁：`所有` / `最愛` / `相簿`
- 點縮圖 → 全螢幕檢視（pinch zoom、左右滑切換）
- 支援系統 album 列表
- 支援 iOS 17 limited library（只授權部分照片時的 UI）

#### F2 整理
- 多選模式：長按進入、可全選/反選
- 批次操作：**收藏 / 取消收藏**、**刪除**（呼叫系統刪除確認）
- 自訂分組「精選集」(Collections) — 存在 app 本機 SQLite，不污染系統相簿
- 排序：日期新→舊 / 日期舊→新 / 檔名

#### F3 分享
- 單張 → 系統 share sheet
- 多選 → 一次分享多檔
- 「精選集」→ 整組分享（自動匯出為 zip 或多檔）

#### F4 自動剪片
- 從相簿選 5–30 個媒體（照片或影片）
- 選擇模板：
  - **節奏 (Beat)** — 快切，每張 0.5–1 秒
  - **柔和 (Mellow)** — 慢切，每張 2–3 秒，含淡入淡出
  - **混合 (Mix)** — 隨機節奏
- 選擇配樂：內建 3–5 首免版稅音樂 / 從相簿選音樂檔案
- 輸出規格：1080p H.264 MP4、最長 60 秒
- 完成後預覽 → 儲存到相簿 / 分享 / 重新生成

### v2（候選，不在本次實作）
- AI 辨識（Vision framework）：人臉、物件、文字
- 智能搜尋（自然語言：「去年在海邊的照片」）
- 雲端備份
- Live Photo / HDR / ProRAW 處理

---

## 4. 畫面與流程

```
┌─────────────────────────────────────────────┐
│ Tab Bar:  [相簿] [精選集] [剪片] [設定]      │
└─────────────────────────────────────────────┘

[相簿] /index
  ├─ 縮圖網格
  ├─ 點縮圖 → /photo/[id]（全螢幕）
  └─ 長按 → 多選模式 (toolbar: 收藏/刪除/分享/加入精選集)

[精選集] /collections
  ├─ 精選集列表（封面 + 名稱 + 張數）
  ├─ 點進去 → /collections/[id]（網格 + 編輯/刪除/分享）
  └─ + 新增

[剪片] /movie
  ├─ Step 1: 選素材 (PhotosPicker)
  ├─ Step 2: 選模板 + 配樂
  ├─ Step 3: 處理中 (progress)
  └─ Step 4: 預覽 → 儲存/分享/重做

[設定] /settings
  ├─ 重新請求相簿權限
  ├─ 縮圖快取大小 / 清除
  └─ 關於
```

---

## 5. 資料模型

App 本機 SQLite（`expo-sqlite`），不複製照片資料，只存引用 ID 與 metadata。

```sql
CREATE TABLE collections (
  id          TEXT PRIMARY KEY,        -- uuid
  name        TEXT NOT NULL,
  cover_asset TEXT,                    -- PHAsset localIdentifier
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE collection_items (
  collection_id TEXT NOT NULL,
  asset_id      TEXT NOT NULL,         -- PHAsset localIdentifier
  position      INTEGER NOT NULL,
  PRIMARY KEY (collection_id, asset_id)
);

CREATE TABLE movie_drafts (
  id          TEXT PRIMARY KEY,
  template    TEXT NOT NULL,           -- 'beat' | 'mellow' | 'mix'
  music_id    TEXT,
  asset_ids   TEXT NOT NULL,           -- JSON array
  created_at  INTEGER NOT NULL
);
```

---

## 6. 權限與隱私

**Info.plist 需要的 keys：**

| Key | 用途 |
|---|---|
| `NSPhotoLibraryUsageDescription` | 讀取照片瀏覽、整理 |
| `NSPhotoLibraryAddUsageDescription` | 把剪好的影片存回相簿 |
| `NSMicrophoneUsageDescription` | （若選相簿影片含原音） |

**iOS 17 行為：**
- 第一次請求時可能拿到 **Limited Library**（使用者只授權部分照片）
- 必須處理：
  - 偵測 `PHAccessLevel.readWrite` vs `addOnly`
  - Limited 狀態時顯示「重新選取可存取的照片」按鈕（呼叫 `PHPhotoLibrary.presentLimitedLibraryPicker`）
- `expo-media-library` 0.x 已支援上述 API

**離線/隱私原則：**
- 所有照片處理 100% 在本機，不上傳任何雲端。
- 不蒐集 telemetry（v1 不接 analytics）。

**Free Apple ID（無 Developer 帳號）的限制 — 與本 app 的關係：**

| Apple 限制 | 影響本 app？ |
|---|---|
| 同時只能側載 3 個 app | ⚠️ 要小心 |
| Provisioning profile 7 天到期，要重簽 | ⚠️ AltStore 自動處理（PC 同網路時） |
| 無 Push Notification | ✅ 本 app 不需要 |
| 無 iCloud / CloudKit | ✅ 本 app 100% 本機 |
| 無 In-App Purchase | ✅ 本 app 不收費 |
| 無 App Groups / Extensions | ✅ 本 app 不需要 |
| Photo Library / AVFoundation / Vision | ✅ **完全可用** |

**結論：** v1 規格的所有功能在 free Apple ID 下都能跑。

---

## 7. 自動剪片技術選型（重點）

### 問題

React Native 生態在 2025 年後沒有可靠的影片合成函式庫：
- `ffmpeg-kit-react-native` 上游於 2025-01 退場
- `react-native-video-processing` 只支援基礎 trim/compress
- `expo-video` 只負責播放

### 方案：自製 Swift 原生模組

用 **Expo Modules API** 包一個 Swift module，內部使用 **AVFoundation**：

```
modules/movie-maker/
├── expo-module.config.json
├── ios/
│   ├── MovieMakerModule.swift     # JS bridge
│   ├── MovieComposer.swift        # AVMutableComposition 組裝
│   ├── Templates.swift            # beat/mellow/mix 參數
│   └── Exporter.swift             # AVAssetExportSession
└── src/
    └── index.ts                   # TypeScript API
```

**JS API 設計：**

```ts
import { MovieMaker } from '@/modules/movie-maker';

const result = await MovieMaker.compose({
  assets: [{ id: 'PHAsset-id-1', kind: 'photo' }, ...],
  template: 'beat',
  musicUri: 'file://...',
  outputDuration: 30,  // seconds, 0 = auto
  onProgress: (p) => console.log(p),  // 0..1
});
// result: { uri: 'file://.../output.mp4', duration, width, height }
```

**Swift 內部用到的 AVFoundation 元件：**
- `AVMutableComposition` — 時間軸組裝
- `AVMutableVideoComposition` — 影像合成（淡入淡出、Ken Burns 效果）
- `CIFilter` — 轉場特效
- `AVAssetExportSession` — 匯出 H.264 MP4

**估時：** 原生模組約 2–3 天可做出 MVP（單一模板、無轉場），完整三模板約 1 週。

### 替代方案（不推薦）
- 後端渲染：違反「100% 本機」原則
- 用 `react-native-skia` 自己渲染每一幀再餵給 AVWriter — 效能與工程複雜度更高

---

## 8. 專案結構

```
040455/
├── app/                          # Expo Router 路由
│   ├── (tabs)/
│   │   ├── index.tsx             # 相簿
│   │   ├── collections.tsx       # 精選集
│   │   ├── movie.tsx             # 剪片
│   │   └── settings.tsx
│   ├── photo/[id].tsx            # 全螢幕檢視
│   ├── collections/[id].tsx
│   └── _layout.tsx
├── src/
│   ├── features/
│   │   ├── library/              # 相簿存取、縮圖
│   │   ├── collections/          # 精選集 CRUD
│   │   ├── movie/                # 剪片流程
│   │   └── share/
│   ├── components/               # 共用 UI
│   ├── db/                       # SQLite schema + queries
│   ├── store/                    # Zustand stores
│   └── utils/
├── modules/
│   └── movie-maker/              # 原生 Swift 模組（見 §7）
├── assets/
│   └── music/                    # 內建配樂
├── ios/                          # `expo prebuild` 後產生
├── app.json
├── package.json
└── tsconfig.json
```

---

## 8.5 Build & 部署流程（Windows + AltStore 路線）

### 一次性設定（chi 在 Windows 上做一次）

1. **註冊 Expo 帳號** — https://expo.dev（免費）
2. **安裝工具**（Windows）
   - Node.js 20+
   - `npm install -g eas-cli`
   - **Apple Devices app**（從 Microsoft Store） — 取代舊 iTunes，AltServer 需要
   - **iCloud for Windows**（從 Microsoft Store）
   - **AltServer for Windows** — https://altstore.io
3. **在 iPhone 16 Pro 上**
   - 安裝 **AltStore** app（透過 AltServer 第一次安裝）
   - 用免費 Apple ID 登入 AltStore
4. **註冊 app bundle ID** — 例如 `com.chi.photoapp`（在 `app.json` 設定）

### 每次要裝新版到手機

```
[Windows 容器內]                [chi 的 Windows PC]            [iPhone 16 Pro]
                                                                      
1. 修改 code                                                         
2. git push                                                          
3. 觸發 EAS Build                                                    
   eas build --platform ios                                          
   --profile development                                             
                                                                     
   (~10 min 雲端編譯)                                                
                                                                     
4. 拿到 .ipa 下載連結 ─────────► 5. 下載 .ipa                       
                                  6. 拖進 AltStore (Windows)        
                                  7. AltServer 自動推送 ──────────► 8. 安裝完成
                                                                     
                                                                     [每 7 天]
                                  AltServer 同網路時自動重簽 ──────► 自動續期
```

### EAS Build 設定（`eas.json`）

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "credentialsSource": "remote"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "credentialsSource": "remote" }
    }
  }
}
```

`distribution: internal` 會產生可側載的 IPA（不走 App Store）。

### EAS Build 免費額度

Expo 免費方案：每月 30 次 iOS build。一般開發節奏夠用；密集 debug 時可能要等隊伍或升級 ($19/月)。

### Bundle ID 與簽章注意事項

- Bundle ID 用免費 Apple ID 簽章時，**同一個 Apple ID 最多 10 個不同 Bundle ID / 7 天**
- AltStore 預設用萬用 wildcard ID，會自動處理
- 若日後升級成 Developer 帳號（$99/年），同樣的 Bundle ID 可無痛轉移上 TestFlight

---

## 9. 開發里程碑

| Milestone | 內容 | 估時 |
|---|---|---|
| M0 | Expo 專案骨架 + Dev Client + Tab navigation + EAS Build 設定 | 1 天 |
| M1 | F1 相簿瀏覽（網格 + 全螢幕 + limited library 處理） | 1.5 天 |
| M2 | F2 整理（多選、收藏、刪除、精選集 CRUD） | 2 天 |
| M3 | F3 分享 | 0.5 天 |
| M4 | 原生模組 `movie-maker` 骨架（單模板、無音樂） | 2 天 |
| M5 | F4 剪片完整流程（三模板 + 音樂 + 匯出） | 3 天 |
| M6 | 修飾、icon、splash、TestFlight 上架準備 | 1 天 |

合計約 **10–11 天** 全職工時，以 1 人開發估算。

---

## 10. 風險與待決議事項

| # | 議題 | 影響 | 備註 |
|---|---|---|---|
| R1 | chi 用 Windows，無 Mac | 高 | 已決定走 **EAS Build 雲端編譯 + AltStore 側載** 路線（見 §8.5） |
| R1a | EAS Build 每次 ~10 分鐘等待 | 中 | 開發節奏會慢；盡量在 container 內先把 TypeScript / lint / test 通過再 push |
| R1b | AltStore 7 天自動重簽 | 中 | chi 需要讓 PC 開著 AltServer 且與 iPhone 在同一 WiFi；偶爾沒重簽到要手動 |
| R2 | EAS Build 免費額度 30/月 | 低 | 一般夠用；若超量可升級或暫停測試 |
| R3 | 同時只能側載 3 個 app（免費 Apple ID） | 低 | 本 app 只佔 1 個 slot |
| R3 | 內建配樂版權來源 | 中 | 候選：YouTube Audio Library / Pixabay / 自製 |
| R4 | iOS 17 limited library 的 UX | 低 | 已在 §6 處理 |
| R5 | v1 不含 AI 辨識，使用者期待落差 | 低 | 需在 onboarding 說明 |
| R6 | Windows 開發體驗：無法跑 iOS Simulator | 中 | 只能靠 EAS build 後在實機測；TypeScript 邏輯部分可寫 unit test 在 container 跑 |

---

## 11. 確認清單

請 owner 確認以下決策（或提出修改意見）：

- [ ] 技術棧 §2（Expo + Dev Client + 原生模組）
- [ ] v1 功能範圍 §3
- [ ] 自動剪片做三個模板（beat / mellow / mix）
- [ ] 內建 3–5 首免版稅配樂
- [ ] 輸出 1080p H.264 MP4、最長 60 秒
- [ ] 不接 analytics、不上雲端
- [ ] **建構路線：EAS Build + AltStore 側載**（§8.5）
- [ ] 從 M0 開始實作

確認後我會建立 Expo 專案骨架（M0），然後逐個 milestone 推進。

### chi 要自己準備的事（不在這個容器裡能做）

| # | 事項 | 何時 |
|---|---|---|
| 1 | 註冊 Expo 帳號 https://expo.dev | M0 前 |
| 2 | Windows PC 安裝 Apple Devices app + iCloud + AltServer | M0 後、第一次裝 app 前 |
| 3 | iPhone 16 Pro 透過 AltServer 安裝 AltStore | 同上 |
| 4 | 在 AltStore 用免費 Apple ID 登入 | 同上 |

我會在 M0 完成時給 chi 詳細圖文指引。

