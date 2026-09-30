"""Daily digest of new relevant tenders. Channel is chosen by DIGEST_CHANNEL: telegram | email | both | none.

Telegram: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID       (free; create a bot with @BotFather)
Email   : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, DIGEST_TO [, DIGEST_FROM]  (e.g. Gmail app password)
"""
import os
import smtplib
from email.message import EmailMessage
from typing import Any, Dict, List

import httpx


def format_digest(rows: List[Dict[str, Any]]) -> str:
    if not rows:
        return "No new relevant tenders today."
    lines = [f"{len(rows)} new relevant tender(s):", ""]
    for r in rows:
        lines.append(f"[{r['category']}] {r['title']}")
        lines.append(f"  Entity: {r.get('procuring_entity') or 'n/a'} | Deadline: {r.get('deadline') or 'n/a'} | Source: {r['source_id']}")
        if r.get("source_url"):
            lines.append(f"  {r['source_url']}")
        lines.append("")
    return "\n".join(lines)


def _telegram(text: str) -> None:
    token, chat = os.getenv("TELEGRAM_BOT_TOKEN", ""), os.getenv("TELEGRAM_CHAT_ID", "")
    if not token or not chat:
        raise RuntimeError("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set")
    chunks, buf = [], ""
    for block in text.split("\n\n"):           # Telegram limit is 4096 chars per message
        if len(buf) + len(block) + 2 > 3800 and buf:
            chunks.append(buf)
            buf = ""
        buf += block + "\n\n"
    chunks.append(buf)
    for c in chunks:
        r = httpx.post(f"https://api.telegram.org/bot{token}/sendMessage", timeout=30,
                       json={"chat_id": chat, "text": c.strip(), "disable_web_page_preview": True})
        r.raise_for_status()


def _email(subject: str, text: str) -> None:
    host, to = os.getenv("SMTP_HOST", ""), os.getenv("DIGEST_TO", "")
    if not host or not to:
        raise RuntimeError("SMTP_HOST / DIGEST_TO not set")
    user, pwd = os.getenv("SMTP_USER", ""), os.getenv("SMTP_PASSWORD", "")
    msg = EmailMessage()
    msg["Subject"], msg["To"], msg["From"] = subject, to, os.getenv("DIGEST_FROM", user or to)
    msg.set_content(text)
    with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", "587")), timeout=30) as s:
        s.starttls()
        if user:
            s.login(user, pwd)
        s.send_message(msg)


def send_digest(rows: List[Dict[str, Any]]) -> str:
    """Send via the configured channel. Raises on failure so the rows stay un-notified and retry tomorrow."""
    channel = os.getenv("DIGEST_CHANNEL", "telegram").strip().lower()
    if channel == "none" or not rows:
        return "skipped"
    text = format_digest(rows)
    if channel in ("telegram", "both"):
        _telegram(text)
    if channel in ("email", "both"):
        _email(f"Tender digest: {len(rows)} new", text)
    return channel
