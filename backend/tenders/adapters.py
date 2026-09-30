"""Source adapters: turn one source config into a list of raw tender dicts.

Raw tender keys: title, entity, country, published, deadline, deadline_time, url,
document_url, text.  Dates are ISO strings (YYYY-MM-DD) or None.
"""
import logging
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

from backend.tenders.fetch import polite_get
from backend.tor.parsers import parse_datetime

logger = logging.getLogger("tenders.adapters")
DOC_EXT = (".pdf", ".docx", ".doc")


def _date(raw: Any) -> Dict[str, Optional[str]]:
    """Parse a date string with the same deterministic parser used for ToRs, or ISO via dateutil."""
    if not raw:
        return {"date": None, "time": None}
    raw = str(raw).strip()
    m = re.match(r"(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?", raw)
    if m:
        return {"date": m.group(1), "time": m.group(2)}
    p = parse_datetime(raw)
    return {"date": p["date"], "time": p["time"]} if p else {"date": None, "time": None}


def _clean(text: Any) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", str(text or ""))).strip()


def fetch_rss(src: Dict[str, Any], ua: str, delay: float) -> List[Dict[str, Any]]:
    import feedparser
    if not src.get("url"):
        raise ValueError("no feed url configured")
    r = polite_get(src["url"], ua, delay)
    feed = feedparser.parse(r.content)
    out = []
    for e in feed.entries:
        pub = _date(e.get("published") or e.get("updated"))
        link = e.get("link", "")
        text = _clean(e.get("summary") or e.get("description") or "")
        out.append({"title": _clean(e.get("title")), "entity": _clean(e.get("author")), "country": None,
                    "published": pub["date"], "deadline": None, "deadline_time": None, "url": link,
                    "document_url": link if link.lower().endswith(DOC_EXT) else None, "text": text})
    return out


def fetch_worldbank(src: Dict[str, Any], ua: str, delay: float) -> List[Dict[str, Any]]:
    r = polite_get(src["url"], ua, delay, params=src.get("params"))
    data = r.json()
    notices = data.get("procnotices") or data.get("notices") or []
    out = []
    for n in notices:
        title = n.get("bid_description") or n.get("project_name") or n.get("notice_type") or ""
        deadline = _date(n.get("submission_deadline_date") or n.get("submission_date"))
        pub = _date(n.get("noticedate"))
        nid = n.get("id", "")
        url = n.get("url") or (f"https://projects.worldbank.org/en/projects-operations/procurement-detail/{nid}" if nid else "")
        text = _clean(" ".join(str(n.get(k) or "") for k in
                               ("project_name", "bid_description", "notice_type", "procurement_method_name", "notice_text")))
        out.append({"title": _clean(title), "entity": _clean(n.get("contact_organization") or n.get("borrower")),
                    "country": n.get("project_ctry_name") or "Bangladesh", "published": pub["date"],
                    "deadline": deadline["date"], "deadline_time": deadline["time"], "url": url,
                    "document_url": None, "text": text})
    return out


def fetch_html(src: Dict[str, Any], ua: str, delay: float) -> List[Dict[str, Any]]:
    from bs4 import BeautifulSoup
    r = polite_get(src["url"], ua, delay)
    soup = BeautifulSoup(r.text, "lxml")
    fields = src.get("fields", {})

    def pick(node, spec: Optional[str]) -> str:
        if not spec:
            return ""
        sel, _, attr = spec.partition("@")
        el = node.select_one(sel) if sel else node
        if el is None:
            return ""
        return (el.get(attr) or "") if attr else el.get_text(" ", strip=True)

    out = []
    for node in soup.select(src["item_selector"]):
        title = pick(node, fields.get("title"))
        if not title:
            continue
        link = urljoin(src["url"], pick(node, fields.get("link")) or "")
        dl, pub = _date(pick(node, fields.get("deadline"))), _date(pick(node, fields.get("published")))
        out.append({"title": _clean(title), "entity": _clean(pick(node, fields.get("entity"))), "country": None,
                    "published": pub["date"], "deadline": dl["date"], "deadline_time": dl["time"], "url": link,
                    "document_url": link if link.lower().endswith(DOC_EXT) else None,
                    "text": _clean(node.get_text(" ", strip=True))})
    return out


ADAPTERS = {"rss": fetch_rss, "worldbank_api": fetch_worldbank, "html": fetch_html}
