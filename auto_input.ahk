; ==== 自動輸入 data.csv ====
; F1 = 開始輸入、F2 = 暫停、F3 = 繼續、Esc = 緊急停止
;
; CSV 欄位順序（每列 6 欄）：
;   1.PM體溫  2.呼吸  3.脈搏  4.收縮壓  5.舒張壓  6.血氧
; Tab 規則：
;   欄 1-4：value + Tab
;   欄 5  ：value + Tab x2
;   欄 6  ：value + Tab x6   (跳到下一列第 1 欄)

SendMode Input
SetKeyDelay, -1
SetBatchLines, -1
SetWinDelay, -1

paused := false
stop := false

Esc::
stop := true
paused := false
ToolTip 已緊急停止
Sleep 800
ToolTip
return

F2::
paused := true
ToolTip 已暫停 (按 F3 繼續)
return

F3::
paused := false
ToolTip 繼續輸入
Sleep 500
ToolTip
return

F1::
stop := false
paused := false

FileRead, csv, data.csv
if (ErrorLevel)
{
    MsgBox 找不到 data.csv
    return
}
StringReplace, csv, csv, `r,, All
rows := StrSplit(csv, "`n")

total := 0
for i, r in rows
    if (Trim(r) != "")
        total++

count := 0
for index, row in rows
{
    if (stop)
        break
    while (paused)
        Sleep 50

    row := Trim(row)
    if (row = "")
        continue

    count++
    if (Mod(count, 20) = 0)
        ToolTip 輸入中: %count% / %total%

    fields := StrSplit(row, ",")
    Loop % fields.Length()
    {
        if (stop)
            break
        while (paused)
            Sleep 50

        value := fields[A_Index]
        if (A_Index <= 4)
            SendInput % value . "{Tab}"
        else if (A_Index = 5)
            SendInput % value . "{Tab 2}"
        else if (A_Index = 6)
            SendInput % value . "{Tab 6}"
    }
}

ToolTip 完成輸入 (%count% 筆)
Sleep 1500
ToolTip
return
