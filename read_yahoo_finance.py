#!/usr/bin/env python3
"""
Yahoo Finance 股票資訊讀取工具

使用 yfinance 套件取得即時股價、歷史數據、公司資訊等。

安裝依賴：pip install -r requirements.txt
執行：python read_yahoo_finance.py
"""

import sys

try:
    import yfinance as yf
except ImportError:
    print("請先安裝 yfinance：pip install yfinance")
    sys.exit(1)

import json
from datetime import datetime


def get_stock_price(symbol):
    """取得股票即時報價。"""
    ticker = yf.Ticker(symbol)
    info = ticker.info

    if not info or "shortName" not in info:
        print(f"找不到股票代碼：{symbol}")
        return

    print(f"\n{'=' * 60}")
    print(f"  {info.get('shortName', 'N/A')} ({symbol.upper()})")
    print(f"{'=' * 60}")
    print(f"  目前價格：{info.get('currentPrice', info.get('regularMarketPrice', 'N/A'))} {info.get('currency', '')}")
    print(f"  開盤價：  {info.get('open', info.get('regularMarketOpen', 'N/A'))}")
    print(f"  最高價：  {info.get('dayHigh', info.get('regularMarketDayHigh', 'N/A'))}")
    print(f"  最低價：  {info.get('dayLow', info.get('regularMarketDayLow', 'N/A'))}")
    print(f"  前收盤價：{info.get('previousClose', info.get('regularMarketPreviousClose', 'N/A'))}")
    print(f"  成交量：  {info.get('volume', info.get('regularMarketVolume', 'N/A')):,}" if isinstance(info.get('volume', info.get('regularMarketVolume')), (int, float)) else f"  成交量：  N/A")
    print(f"  市值：    {info.get('marketCap', 'N/A'):,}" if isinstance(info.get('marketCap'), (int, float)) else f"  市值：    N/A")
    print(f"  52週最高：{info.get('fiftyTwoWeekHigh', 'N/A')}")
    print(f"  52週最低：{info.get('fiftyTwoWeekLow', 'N/A')}")
    print(f"  本益比：  {info.get('trailingPE', 'N/A')}")
    print(f"  殖利率：  {info.get('dividendYield', 'N/A')}")
    print(f"{'=' * 60}")


def get_history(symbol, period="1mo"):
    """取得歷史價格數據。"""
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period)

    if hist.empty:
        print(f"找不到 {symbol} 的歷史數據。")
        return

    print(f"\n{symbol.upper()} 歷史價格（{period}）：")
    print(f"{'日期':<12} {'開盤':>10} {'最高':>10} {'最低':>10} {'收盤':>10} {'成交量':>14}")
    print("-" * 70)

    for date, row in hist.iterrows():
        date_str = date.strftime("%Y-%m-%d")
        print(f"{date_str:<12} {row['Open']:>10.2f} {row['High']:>10.2f} {row['Low']:>10.2f} {row['Close']:>10.2f} {int(row['Volume']):>14,}")


def get_company_info(symbol):
    """取得公司基本資訊。"""
    ticker = yf.Ticker(symbol)
    info = ticker.info

    if not info or "shortName" not in info:
        print(f"找不到股票代碼：{symbol}")
        return

    print(f"\n{'=' * 60}")
    print(f"  公司資訊：{info.get('shortName', 'N/A')}")
    print(f"{'=' * 60}")
    print(f"  產業：    {info.get('industry', 'N/A')}")
    print(f"  部門：    {info.get('sector', 'N/A')}")
    print(f"  國家：    {info.get('country', 'N/A')}")
    print(f"  員工數：  {info.get('fullTimeEmployees', 'N/A'):,}" if isinstance(info.get('fullTimeEmployees'), int) else f"  員工數：  N/A")
    print(f"  網站：    {info.get('website', 'N/A')}")

    summary = info.get("longBusinessSummary", "")
    if summary:
        print(f"\n  公司簡介：")
        # 每行最多 56 字元
        words = summary.split()
        line = "  "
        for word in words:
            if len(line) + len(word) + 1 > 58:
                print(line)
                line = "  " + word
            else:
                line += " " + word if line.strip() else "  " + word
        if line.strip():
            print(line)
    print(f"{'=' * 60}")


def compare_stocks(symbols):
    """比較多支股票。"""
    print(f"\n{'股票':<8} {'名稱':<20} {'價格':>10} {'漲跌%':>10} {'市值':>16}")
    print("-" * 68)

    for symbol in symbols:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        if not info or "shortName" not in info:
            print(f"{symbol:<8} 找不到資料")
            continue

        price = info.get("currentPrice", info.get("regularMarketPrice", 0))
        prev = info.get("previousClose", info.get("regularMarketPreviousClose", 0))
        change_pct = ((price - prev) / prev * 100) if prev else 0
        market_cap = info.get("marketCap", 0)

        name = info.get("shortName", "N/A")[:18]
        cap_str = f"{market_cap:>16,}" if isinstance(market_cap, (int, float)) and market_cap else f"{'N/A':>16}"

        print(f"{symbol.upper():<8} {name:<20} {price:>10.2f} {change_pct:>+9.2f}% {cap_str}")


def get_major_indices():
    """顯示主要指數。"""
    indices = {
        "^GSPC": "S&P 500",
        "^DJI": "道瓊工業",
        "^IXIC": "納斯達克",
        "^TWII": "台灣加權",
        "^HSI": "恆生指數",
        "^N225": "日經 225",
    }

    print(f"\n主要市場指數：")
    print(f"{'代碼':<8} {'名稱':<12} {'點數':>12} {'漲跌%':>10}")
    print("-" * 46)

    for symbol, name in indices.items():
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="2d")
            if hist.empty or len(hist) < 1:
                print(f"{symbol:<8} {name:<12} {'N/A':>12}")
                continue

            current = hist["Close"].iloc[-1]
            prev = hist["Close"].iloc[-2] if len(hist) >= 2 else current
            change_pct = ((current - prev) / prev * 100) if prev else 0
            print(f"{symbol:<8} {name:<12} {current:>12,.2f} {change_pct:>+9.2f}%")
        except Exception:
            print(f"{symbol:<8} {name:<12} {'錯誤':>12}")


def main():
    """主程式 - 互動式股票查詢工具。"""
    print("Yahoo Finance 股票資訊讀取工具")
    print("=" * 40)

    while True:
        print("\n選項：")
        print("  1. 查詢股票即時報價")
        print("  2. 查看歷史價格")
        print("  3. 查看公司資訊")
        print("  4. 比較多支股票")
        print("  5. 主要市場指數")
        print("  q. 離開")

        choice = input("\n請選擇 (1/2/3/4/5/q): ").strip()

        if choice == "1":
            symbol = input("輸入股票代碼 (例如 AAPL, 2330.TW): ").strip()
            if symbol:
                get_stock_price(symbol)

        elif choice == "2":
            symbol = input("輸入股票代碼: ").strip()
            period = input("時間範圍 (1d/5d/1mo/3mo/6mo/1y/2y/5y，預設 1mo): ").strip() or "1mo"
            if symbol:
                get_history(symbol, period)

        elif choice == "3":
            symbol = input("輸入股票代碼: ").strip()
            if symbol:
                get_company_info(symbol)

        elif choice == "4":
            symbols_str = input("輸入多個股票代碼，用逗號分隔 (例如 AAPL,MSFT,GOOGL): ").strip()
            if symbols_str:
                symbols = [s.strip() for s in symbols_str.split(",") if s.strip()]
                compare_stocks(symbols)

        elif choice == "5":
            get_major_indices()

        elif choice.lower() == "q":
            print("再見！")
            break

        else:
            print("無效選項，請重新選擇。")


if __name__ == "__main__":
    main()
