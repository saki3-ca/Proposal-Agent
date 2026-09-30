"""Supabase storage through the PostgREST HTTP API (service-role key from env, server-side only)."""
import os
import re
from typing import Any, Dict, List, Optional

import httpx


def _cfg() -> tuple:
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_KEY", "").strip()
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    return f"{url}/rest/v1/tenders", {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}


def dedupe_key(title: str, entity: str, deadline: Optional[str]) -> str:
    norm = lambda s: re.sub(r"[^\wঀ-৿]+", " ", (s or "").lower()).strip()
    return f"{norm(title)}|{norm(entity)}|{deadline or ''}"


def to_row(t: Dict[str, Any]) -> Dict[str, Any]:
    text = t.get("text") or ""
    return {"dedupe_key": t["dedupe_key"], "title": t["title"], "procuring_entity": t.get("entity") or None,
            "country": t.get("country") or "Bangladesh", "category": t["category"], "classified_by": t.get("classified_by"),
            "bd_eligibility": t.get("bd_eligibility"), "published_date": t.get("published"), "deadline": t.get("deadline"),
            "deadline_time": t.get("deadline_time"), "source_id": t["source_id"], "source_url": t.get("url"),
            "document_url": t.get("document_url"), "summary": text[:300] or t["title"][:300], "raw_snippet": text[:1500]}


def insert_new(tenders: List[Dict[str, Any]]) -> int:
    """Insert rows, silently skipping ones already stored (same dedupe_key). Returns number of new rows."""
    if not tenders:
        return 0
    url, headers = _cfg()
    rows = [to_row(t) for t in tenders]
    r = httpx.post(url, params={"on_conflict": "dedupe_key"}, timeout=60,
                   headers={**headers, "Prefer": "resolution=ignore-duplicates,return=representation"}, json=rows)
    r.raise_for_status()
    return len(r.json())


def unnotified() -> List[Dict[str, Any]]:
    url, headers = _cfg()
    r = httpx.get(url, headers=headers, timeout=60, params={"notified": "eq.false", "order": "deadline.asc.nullslast", "limit": "500"})
    r.raise_for_status()
    return r.json()


def mark_notified(ids: List[str]) -> None:
    if not ids:
        return
    url, headers = _cfg()
    r = httpx.patch(url, headers=headers, timeout=60, params={"id": f"in.({','.join(ids)})"}, json={"notified": True})
    r.raise_for_status()


def list_tenders(limit: int = 1000) -> List[Dict[str, Any]]:
    url, headers = _cfg()
    r = httpx.get(url, headers=headers, timeout=60, params={"order": "deadline.asc.nullslast", "limit": str(limit)})
    r.raise_for_status()
    return r.json()
