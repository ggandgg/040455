#!/usr/bin/env python3
"""
Gmail Reader - 使用 Gmail API 讀取 Gmail 郵件

使用前設定步驟：
1. 前往 https://console.cloud.google.com/
2. 建立專案並啟用 Gmail API
3. 建立 OAuth 2.0 憑證（桌面應用程式類型）
4. 下載憑證 JSON 檔案並命名為 credentials.json，放在此腳本同目錄下
5. 安裝依賴套件：pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
6. 執行：python read_gmail.py
"""

import os
import base64
import sys
from datetime import datetime
from email.utils import parsedate_to_datetime

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# 如果修改了 SCOPES，請刪除 token.json 重新授權
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_PATH = os.path.join(SCRIPT_DIR, "token.json")
CREDENTIALS_PATH = os.path.join(SCRIPT_DIR, "credentials.json")


def authenticate():
    """處理 Gmail API 認證流程。"""
    creds = None

    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_PATH):
                print("錯誤：找不到 credentials.json")
                print("請從 Google Cloud Console 下載 OAuth 2.0 憑證檔案")
                print(f"並放置於：{CREDENTIALS_PATH}")
                sys.exit(1)

            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_PATH, "w") as token:
            token.write(creds.to_json())

    return creds


def get_message_body(payload):
    """從郵件 payload 中提取純文字內容。"""
    body = ""

    if payload.get("mimeType") == "text/plain" and payload.get("body", {}).get("data"):
        body = base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8", errors="replace")
    elif payload.get("parts"):
        for part in payload["parts"]:
            if part.get("mimeType") == "text/plain" and part.get("body", {}).get("data"):
                body = base64.urlsafe_b64decode(part["body"]["data"]).decode("utf-8", errors="replace")
                break
            elif part.get("parts"):
                body = get_message_body(part)
                if body:
                    break

    return body


def get_header(headers, name):
    """從郵件標頭中取得指定欄位的值。"""
    for header in headers:
        if header["name"].lower() == name.lower():
            return header["value"]
    return ""


def list_messages(service, max_results=10, query=""):
    """列出並顯示最近的郵件。"""
    results = service.users().messages().list(
        userId="me", maxResults=max_results, q=query
    ).execute()

    messages = results.get("messages", [])

    if not messages:
        print("沒有找到郵件。")
        return

    print(f"找到 {len(messages)} 封郵件：\n")
    print("=" * 80)

    for msg_info in messages:
        msg = service.users().messages().get(
            userId="me", id=msg_info["id"], format="full"
        ).execute()

        headers = msg.get("payload", {}).get("headers", [])
        subject = get_header(headers, "Subject") or "(無主旨)"
        sender = get_header(headers, "From")
        date_str = get_header(headers, "Date")
        snippet = msg.get("snippet", "")

        # 解析日期
        try:
            date_obj = parsedate_to_datetime(date_str)
            date_formatted = date_obj.strftime("%Y-%m-%d %H:%M")
        except Exception:
            date_formatted = date_str

        print(f"日期：{date_formatted}")
        print(f"寄件者：{sender}")
        print(f"主旨：{subject}")
        print(f"摘要：{snippet[:120]}...")
        print("-" * 80)


def read_message(service, msg_id):
    """讀取指定郵件的完整內容。"""
    msg = service.users().messages().get(
        userId="me", id=msg_id, format="full"
    ).execute()

    headers = msg.get("payload", {}).get("headers", [])
    subject = get_header(headers, "Subject") or "(無主旨)"
    sender = get_header(headers, "From")
    to = get_header(headers, "To")
    date_str = get_header(headers, "Date")
    body = get_message_body(msg.get("payload", {}))

    print("=" * 80)
    print(f"主旨：{subject}")
    print(f"寄件者：{sender}")
    print(f"收件者：{to}")
    print(f"日期：{date_str}")
    print("=" * 80)
    print(body if body else "(無法取得純文字內容)")
    print("=" * 80)


def main():
    """主程式 - 互動式 Gmail 讀取工具。"""
    print("Gmail Reader - Gmail 郵件讀取工具")
    print("=" * 40)

    creds = authenticate()
    service = build("gmail", "v1", credentials=creds)

    # 取得信箱資訊
    profile = service.users().getProfile(userId="me").execute()
    print(f"\n已連接帳戶：{profile.get('emailAddress')}")
    print(f"總郵件數：{profile.get('messagesTotal')}")
    print(f"未讀郵件數：{profile.get('threadsTotal')}\n")

    while True:
        print("\n選項：")
        print("  1. 顯示最新郵件")
        print("  2. 搜尋郵件")
        print("  3. 只看未讀郵件")
        print("  4. 輸入郵件 ID 讀取完整內容")
        print("  q. 離開")

        choice = input("\n請選擇 (1/2/3/4/q): ").strip()

        if choice == "1":
            num = input("要顯示幾封？(預設 10): ").strip()
            num = int(num) if num.isdigit() else 10
            list_messages(service, max_results=num)

        elif choice == "2":
            query = input("輸入搜尋條件 (例如：from:someone@example.com 或 subject:重要): ").strip()
            if query:
                list_messages(service, max_results=10, query=query)

        elif choice == "3":
            list_messages(service, max_results=10, query="is:unread")

        elif choice == "4":
            msg_id = input("輸入郵件 ID: ").strip()
            if msg_id:
                read_message(service, msg_id)

        elif choice.lower() == "q":
            print("再見！")
            break

        else:
            print("無效選項，請重新選擇。")


if __name__ == "__main__":
    main()
