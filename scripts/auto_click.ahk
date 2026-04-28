; ==== 自動校準版：左側欄位定位點擊 ====
; F1 = 第 1 列、F2 = 最後一列、F3 = 開始（自動讀 data.csv 算列數與列高）
; Esc = 中斷

CoordMode, Mouse, Screen
SetMouseDelay, 10

startX := ""
startY := ""
endY := ""
running := false

F1::
MouseGetPos, startX, startY
ToolTip 第一列 %startX% , %startY%
Sleep 700
ToolTip
return

F2::
MouseGetPos, , endY
ToolTip 最後一列 Y=%endY%
Sleep 700
ToolTip
return

F3::
if (startX = "" || startY = "" || endY = "")
{
    MsgBox 請先 F1 標第一列、F2 標最後一列
    return
}

if (startY > endY)
{
    tmp := startY
    startY := endY
    endY := tmp
}

FileRead, csv, data.csv
if (ErrorLevel)
{
    MsgBox 找不到 data.csv（請放在腳本同資料夾）
    return
}
StringReplace, csv, csv, `r,, All
rows := StrSplit(csv, "`n")
rowCount := 0
for i, r in rows
    if (Trim(r) != "")
        rowCount++

if (rowCount < 2)
{
    MouseMove, startX, startY, 0
    MouseClick, left
    return
}

rowHeight := (endY - startY) / (rowCount - 1)
ToolTip rowCount=%rowCount%`nrowHeight=%rowHeight%
Sleep 800
ToolTip

running := true
Loop %rowCount%
{
    if (!running)
        break
    y := startY + (A_Index - 1) * rowHeight
    MouseMove, startX, Round(y), 0
    MouseClick, left
    Sleep 30
}
running := false
return

Esc::
running := false
return
