# Photo App 規格文件

iOS 相簿整理、分享、自動剪片 app — 規格與技術設計。

> 狀態：草稿 v0.4 — 等待 owner 確認後再開始實作。
> Owner：chi（手機優先，Windows 僅一次性輔助、無 Mac）
> 主要測試裝置：iPhone 16 Pro（A18 Pro、iOS 18+）
> 發佈方式：EAS Build（雲端編譯）→ SideStore（手機端側載，無需 PC 重簽）

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

**離線/隱私原則（強化版，硬性要求）：**

| 原則 | 實作 |
|---|---|
| **零網路** | App 啟動到關閉，**不發出任何外連請求**。包含 telemetry、crash report、remote config、廣告、字型 CDN |
| **每支手機獨立** | 多支手機各自獨立安裝、各自本機 SQLite、不同步、不識別、不關聯。沒有「裝置 ID」、沒有帳號系統 |
| **拒絕已刪除照片** | iOS「最近刪除」相簿 PhotoKit 本來就不開放讀取，不額外請求；明確不請求 `NSPhotoLibraryAccessibilityUsageDescription` |
| **拒絕隱藏照片** | 所有 `PHFetchOptions` 強制設 `includeHiddenAssets = false`，UI 也不提供「顯示隱藏」開關 |
| **不蒐集 metadata** | 不讀 EXIF 的 GPS 經緯度做任何用途；只用日期/解析度顯示 |

### 技術強制手段

**1. App Transport Security — 全面拒絕對外連線**

`Info.plist`：
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
</dict>
<!-- 且不加任何 NSExceptionDomains -->
```

加上 **Outgoing Network Connections** 不申請任何 entitlement。Production build 完全沒有 client-side network code（dev build 才有 Metro bundler 連線，且僅本機 LAN）。

**2. 拒絕第三方追蹤 SDK — 套件白名單**

| 用途 | 採用 | 拒絕 |
|---|---|---|
| 路由 | expo-router | — |
| 相簿 | expo-media-library | — |
| 影片 | expo-video（純播放） | — |
| 分享 | expo-sharing（系統 sheet） | — |
| Crash | **不接** | Sentry、Bugsnag、Firebase Crashlytics |
| Analytics | **不接** | Amplitude、Mixpanel、PostHog、Segment、GA |
| Remote Config | **不接** | Firebase Remote Config |
| Ads | **不接** | AdMob、Facebook Audience |

CI 會跑一個 script 掃 `package.json`，含上述任一字串就 fail。

**3. 隱藏與已刪除照片 — 程式碼層防護**

所有 `expo-media-library` 呼叫一律包一層 wrapper：

```ts
// src/features/library/safe-media.ts
import * as MediaLibrary from 'expo-media-library';

const FORBIDDEN_ALBUMS = ['Hidden', '已隱藏', 'Recently Deleted', '最近刪除'];

export async function safeGetAssets(opts: Omit<MediaLibrary.AssetsOptions, 'album'>) {
  return MediaLibrary.getAssetsAsync({
    ...opts,
    // expo-media-library 不直接讀隱藏相簿；
    // 額外用 album 過濾雙重保險
  });
}

export async function safeGetAlbums() {
  const albums = await MediaLibrary.getAlbumsAsync();
  return albums.filter(a => !FORBIDDEN_ALBUMS.includes(a.title));
}
```

UI 不顯示「隱藏」「最近刪除」相簿，且 `getAssetsAsync` 預設不含隱藏資產（PhotoKit 預設行為）。

**4. 多裝置獨立的具體含義**

- App 不產生任何 install UUID、不寫 keychain
- SQLite 檔案路徑為 sandbox 內，無備份到 iCloud (`NSURLIsExcludedFromBackupKey = true`)
- 如 chi 同時用 iPhone A 和 iPhone B 安裝這個 app：
  - A 的精選集 B 看不到
  - A 不知道 B 的存在
  - 兩台都不向任何伺服器報到

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

## 8.5 Build & 部署流程（SideStore 路線，手機獨立）

### 整體思路

SideStore 是 AltStore 的「無 PC」分支：手機端跑一個本機 WireGuard 通道幫自己重簽。設定完成後，**Windows 完全可有可無**。

### 一次性設定（Windows 只在這一步出現，之後就退場）

#### 步驟 1：建立 Expo 帳號與 Bundle ID
- 註冊 https://expo.dev（免費）
- `app.json` 設定 bundle id，例如 `com.chi.photoapp`

#### 步驟 2：iPhone 安裝 SideStore（不需要 PC）
- 用 Safari 開 https://sidestore.io
- 依官方步驟透過免費 Apple ID 安裝 SideStore（一次性，過程在手機上完成）
- 在 SideStore 內用免費 Apple ID 登入

#### 步驟 3：產生 pairing file（**這一步要 Windows 一次**）

SideStore 需要一個「pairing file」才能在手機上自重簽。產生方式：

| 方法 | 是否需 PC | 說明 |
|---|---|---|
| **JitterbugPair for Windows** | ✅ 一次 | chi 用 USB 把 iPhone 接到 Windows PC，跑 JitterbugPair 工具產出 `.mobiledevicepairing` 檔，AirDrop 或 iCloud 傳到手機，匯入 SideStore |
| **付費線上服務** | ❌ | 例如 SideStore 文件列出的第三方 web service，付小額美金代產生 |

- chi 選 JitterbugPair（免費）這條路：**就這一次需要 Windows + USB 線**
- 之後 PC 可以擺一邊不管它

#### 步驟 4：開啟 SideStore 背景刷新
- iPhone 設定 → SideStore → 開啟「背景 App 重新整理」
- 設定 → 通用 → 背景 App 重新整理 → SideStore = 開
- 之後 SideStore 會在背景每幾天自動重簽，**完全在手機本機完成**，不發送任何照片資料到外部

### 平常開發 / 更新流程（手機獨立）

```
[Claude 在容器內]                                    [chi 的 iPhone 16 Pro]
                                                              
1. 修改 code                                                  
2. git push                                                   
3. 觸發 EAS Build (從容器跑 eas-cli)                          
                                                              
   (~10 min 雲端編譯)                                         
                                                              
4. EAS Build 完成，產出 .ipa 與下載 URL                      
                                                              
5. Claude 把 IPA URL 用 sidestore:// scheme 包好             
   告訴 chi                                          ────────►  6. chi 在手機 Safari 點連結
                                                                  SideStore 自動接手下載 + 安裝
                                                                  
                                                                  (整個流程手機上完成)
                                                                  
                                                              [每 ~5 天]
                                                              SideStore 背景自動重簽
                                                              無需任何外部裝置介入
```

**關鍵點：** SideStore 支援 `sidestore://install?url=<ipa_url>` 這種深層連結。在手機 Safari 點下去就會跳到 SideStore 開始安裝。整個過程完全在手機內。

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

### Bundle ID 與簽章

- 免費 Apple ID 限制：同帳號最多 3 個側載 app、每組憑證 7 天到期
- SideStore 在手機上跑 WireGuard 通道 → 用 Apple ID 的 developer cert 重簽 → 完全本機完成
- 重簽過程**不傳照片資料、不傳 app 內容**，只跟 Apple developer API 取憑證

### EAS Build 免費額度

Expo 免費方案：每月 30 次 iOS build。一般開發節奏夠用；密集 debug 時可能要等隊伍或升級 ($19/月)。

### SideStore 路線的風險（誠實揭露）

| 風險 | 緩解 |
|---|---|
| SideStore 是社群維護，未來可能因 iOS 更新失效 | 屆時可改 AltStore（PC 介入）或升級 Apple Developer 走 TestFlight |
| 第一次設定要 Windows + USB 線（JitterbugPair 步驟） | 一次性，之後不用 |
| 免費 Apple ID 限 3 個側載 app 同時存在 | 本 app 只佔 1 slot |
| 7 天重簽萬一沒有網路 → app 暫時打不開 | 重新進有網路環境即可（重簽過程**不傳照片資料**，只跟 Apple 簽章伺服器拿憑證；符合 §6 隱私要求） |
| 重簽期間需短暫連網（Apple developer cert API） | 這個連線**僅 SideStore 自己用**，本 app 仍維持零網路 |

### 一句話總結

> Windows + USB 用一次（產 pairing file），之後 chi 的 iPhone 16 Pro 自給自足。
> 想換新版時手機點一下 SideStore 連結即可。每 5–7 天系統自己背景重簽。

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
| R1 | chi 無 Mac、且希望手機獨立操作 | 高 | 走 **EAS Build + SideStore** 路線：Windows 只在第一次產 pairing file 時用一次，之後手機自重簽（見 §8.5） |
| R1a | EAS Build 每次 ~10 分鐘等待 | 中 | 開發節奏會慢；盡量在 container 內先把 TypeScript / lint / test 通過再 push |
| R1b | SideStore 7 天自動重簽需偶爾連網 | 中 | 重簽僅與 Apple 簽章伺服器通訊，**不傳 app 內容、不傳照片** |
| R1c | SideStore 是第三方專案，未來可能因 iOS 更新失效 | 中 | 若發生：退路 1 = 改 AltStore，退路 2 = 升級 Apple Developer + TestFlight |
| R2 | EAS Build 免費額度 30/月 | 低 | 一般夠用；若超量可升級或暫停測試 |
| R3 | 同時只能側載 3 個 app（免費 Apple ID） | 低 | 本 app 只佔 1 個 slot |
| R3 | 內建配樂版權來源 | 中 | 候選：YouTube Audio Library / Pixabay / 自製 |
| R4 | iOS 17 limited library 的 UX | 低 | 已在 §6 處理 |
| R5 | v1 不含 AI 辨識，使用者期待落差 | 低 | 需在 onboarding 說明 |
| R6 | Windows 開發體驗：無法跑 iOS Simulator | 中 | 只能靠 EAS build 後在實機測；TypeScript 邏輯部分可寫 unit test 在 container 跑 |
| R7 | 零網路要求 — 需阻擋第三方相依間接連網 | 中 | CI 套件白名單腳本 + ATS 全鎖；上 release 前用 Charles/proxy 驗證實際零流量 |
| R8 | 隱藏照片誤讀 | 中 | 一律走 `safe-media` wrapper，禁止直接 import `expo-media-library`；ESLint 規則檔強制 |
| R9 | 多裝置間使用者期望同步 | 低 | Onboarding 明確告知「本 app 不同步、無雲端」|

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
- [ ] **零網路 / 多裝置獨立 / 拒絕隱藏與已刪除照片** 為硬性需求（§6）
- [ ] 從 M0 開始實作

確認後我會建立 Expo 專案骨架（M0），然後逐個 milestone 推進。

### chi 要自己準備的事（不在這個容器裡能做）

| # | 事項 | 在哪做 | 何時 |
|---|---|---|---|
| 1 | 註冊 Expo 帳號 https://expo.dev | 手機或 PC 瀏覽器都行 | M0 前 |
| 2 | iPhone 安裝 SideStore（依 sidestore.io 步驟） | 📱 手機 | M0 完成、第一次裝 app 前 |
| 3 | SideStore 內登入免費 Apple ID | 📱 手機 | 同上 |
| 4 | 產生 pairing file（**僅這一步要 Windows + USB**） | 💻 Windows 一次 | 同上 |
| 5 | 把 pairing file 匯入 SideStore | 📱 手機 | 同上 |
| 6 | 開啟 SideStore 背景刷新權限 | 📱 手機 | 同上 |

✅ 上述完成後，**Windows 就可以收起來**了。之後 chi 只要在手機 Safari 點安裝連結就能更新 app。

我會在 M0 完成時給 chi 中文圖文指引。

