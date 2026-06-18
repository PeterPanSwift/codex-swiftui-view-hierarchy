# SwiftUI View Hierarchy

將 SwiftUI View 程式碼轉成可互動、可展開收合的階層圖。整個工具在瀏覽器端執行，不會上傳貼入的程式碼。

## 執行

```bash
python3 -m http.server 4173
```

開啟 `http://127.0.0.1:4173`。

## 功能

- 解析常見 SwiftUI 容器、View 與 trailing closure
- 將 `struct ...: View` 型別顯示為階層圖根節點
- 將同一份程式中的自訂 View 呼叫連結到其 `body`，並支援展開收合
- 點擊容器節點展開或收合子 View
- 60%–150% 階層圖縮放
- 「只顯示名稱」模式可隱藏參數及型別補充資訊
- 可自訂全站主題色，讓介面與階層圖同步變色，並在瀏覽器中保存選擇
- 支援整份 `struct ...: View` 或單獨的 View builder 片段
- `⌘ Enter` / `Ctrl Enter` 快速生成
