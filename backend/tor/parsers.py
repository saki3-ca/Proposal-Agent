"""Deterministic parsing of dates, money, durations, marks. The LLM never computes these.

Every parser takes the raw text exactly as it appears in the tender and returns a
parsed dict or None. Ambiguity is reported, not guessed away.
"""
import re
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional

from backend.tor.textutil import ascii_digits

_BN_MONTHS = {
    "জানুয়ারি": "January", "জানুয়ারী": "January", "ফেব্রুয়ারি": "February", "ফেব্রুয়ারী": "February",
    "মার্চ": "March", "এপ্রিল": "April", "মে": "May", "জুন": "June", "জুলাই": "July",
    "আগস্ট": "August", "আগষ্ট": "August", "সেপ্টেম্বর": "September", "অক্টোবর": "October",
    "নভেম্বর": "November", "ডিসেম্বর": "December",
}
_MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec"
_MONTH_NUM = {m: i + 1 for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"])}

DATE_RE = re.compile(
    rf"(?P<dmy>\b\d{{1,2}}(?:st|nd|rd|th)?[\s,\-]+(?:of\s+)?(?P<m1>{_MONTHS})\.?[\s,\-]+(?P<y1>\d{{4}})\b)"
    rf"|(?P<mdy>\b(?P<m2>{_MONTHS})\.?\s+(?P<d2>\d{{1,2}})(?:st|nd|rd|th)?,?\s+(?P<y2>\d{{4}})\b)"
    rf"|(?P<num>\b(?P<a>\d{{1,2}})[/.\-](?P<b>\d{{1,2}})[/.\-](?P<y3>\d{{4}}|\d{{2}})\b)"
    rf"|(?P<iso>\b(?P<y4>\d{{4}})-(?P<m4>\d{{2}})-(?P<d4>\d{{2}})\b)",
    re.IGNORECASE)
TIME_RE = re.compile(r"\b(\d{1,2})[:.](\d{2})\s*(a\.?m\.?|p\.?m\.?)?(?=\W|$)|\b(\d{1,2})\s*(a\.?m\.?|p\.?m\.?)(?=\W|$)", re.IGNORECASE)

MONEY_RE = re.compile(
    r"(?P<cur1>BDT|Tk\.?|Taka|৳|USD|US\$|\$|EUR|€|GBP|£)?\s*(?P<num>\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+(?:\.\d+)?)"
    r"\s*(?P<unit>lakhs?|lacs?|crores?|million|billion|thousand|k)?\s*(?P<cur2>BDT|Tk\.?|Taka|USD|EUR|GBP)?",
    re.IGNORECASE)
_UNITS = {"lakh": 10**5, "lakhs": 10**5, "lac": 10**5, "lacs": 10**5, "crore": 10**7, "crores": 10**7,
          "million": 10**6, "billion": 10**9, "thousand": 10**3, "k": 10**3}
_CUR = {"bdt": "BDT", "tk": "BDT", "tk.": "BDT", "taka": "BDT", "৳": "BDT", "usd": "USD", "us$": "USD", "$": "USD",
        "eur": "EUR", "€": "EUR", "gbp": "GBP", "£": "GBP"}

DURATION_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(?:\([^)]*\)\s*)?(calendar\s+)?(days?|weeks?|months?|years?)\b", re.IGNORECASE)
PERCENT_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(?:%|percent\b|per\s*cent\b)", re.IGNORECASE)
MARKS_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(?:marks?|points?|pts?)?", re.IGNORECASE)


def _prep(raw: str) -> str:
    text = ascii_digits(raw or "")
    for bn, en in _BN_MONTHS.items():
        text = text.replace(bn, en)
    return text


def parse_datetime(raw: str) -> Optional[Dict[str, Any]]:
    """{'date': 'YYYY-MM-DD', 'time': 'HH:MM'|None, 'ambiguous': bool, 'all_dates': [...]} or None."""
    text = _prep(raw)
    found: List[Dict[str, Any]] = []
    for m in DATE_RE.finditer(text):
        try:
            if m.group("dmy"):
                d = int(re.match(r"\d+", m.group("dmy")).group())
                mo, y = _month_number(m.group("m1")), int(m.group("y1"))
                found.append({"date": date(y, mo, d), "ambiguous": False, "span": m.span()})
            elif m.group("mdy"):
                found.append({"date": date(int(m.group("y2")), _month_number(m.group("m2")), int(m.group("d2"))),
                              "ambiguous": False, "span": m.span()})
            elif m.group("num"):
                a, b, y = int(m.group("a")), int(m.group("b")), int(m.group("y3"))
                y += 2000 if y < 100 else 0
                if a > 12 and b <= 12:
                    d, mo, amb = a, b, False
                elif b > 12 and a <= 12:
                    d, mo, amb = b, a, False
                else:
                    d, mo, amb = a, b, a != b  # Bangladesh convention is day-first; flag if it could be month-first
                found.append({"date": date(y, mo, d), "ambiguous": amb, "span": m.span()})
            elif m.group("iso"):
                found.append({"date": date(int(m.group("y4")), int(m.group("m4")), int(m.group("d4"))),
                              "ambiguous": False, "span": m.span()})
        except (ValueError, KeyError):
            continue
    if not found:
        return None
    first = found[0]
    tail = text[first["span"][1]:]
    head = text[:first["span"][0]]
    time_str = None
    for chunk in (tail, head):
        tm = TIME_RE.search(chunk)
        if tm:
            if tm.group(1):
                hh, mm, ap = int(tm.group(1)), int(tm.group(2)), tm.group(3)
            else:
                hh, mm, ap = int(tm.group(4)), 0, tm.group(5)
            if ap:
                ap = ap.lower().replace(".", "")
                if ap == "pm" and hh < 12:
                    hh += 12
                if ap == "am" and hh == 12:
                    hh = 0
            if 0 <= hh <= 23 and 0 <= mm <= 59:
                time_str = f"{hh:02d}:{mm:02d}"
                break
    return {"date": first["date"].isoformat(), "time": time_str, "ambiguous": first["ambiguous"],
            "all_dates": [f["date"].isoformat() for f in found]}


def _month_number(name: str) -> int:
    n = name.lower().rstrip(".")
    for full, num in _MONTH_NUM.items():
        if full.startswith(n[:3]):
            return num
    raise KeyError(name)


def parse_money(raw: str) -> Optional[Dict[str, Any]]:
    """{'amount': '500000', 'currency': 'BDT'|None, 'percent': None} or {'percent': '2.5'}; None if nothing found."""
    text = _prep(raw)
    pm = PERCENT_RE.search(text)
    best = None
    for m in MONEY_RE.finditer(text):
        cur = m.group("cur1") or m.group("cur2")
        unit = (m.group("unit") or "").lower()
        if not cur and not unit and "," not in m.group("num") and not pm:
            # bare small numbers ("3 copies") are not money
            if Decimal(m.group("num").replace(",", "") or 0) < 1000:
                continue
        try:
            value = Decimal(m.group("num").replace(",", ""))
        except InvalidOperation:
            continue
        value *= _UNITS.get(unit, 1)
        cand = {"amount": format(value.normalize(), "f"), "currency": _CUR.get((cur or "").lower()), "percent": None}
        if best is None or cur:
            best = cand
            if cur:
                break
    if pm and (best is None or not best["currency"]):
        return {"amount": None, "currency": None, "percent": pm.group(1)}
    return best


def parse_duration(raw: str) -> Optional[Dict[str, Any]]:
    text = ascii_digits(raw or "")
    m = DURATION_RE.search(text)
    if not m:
        return None
    unit = m.group(3).lower().rstrip("s")
    return {"value": m.group(1), "unit": unit, "calendar": bool(m.group(2))}


def parse_marks(raw: str) -> Optional[Dict[str, Any]]:
    text = ascii_digits(raw or "")
    pm = PERCENT_RE.search(text)
    if pm:
        return {"value": pm.group(1), "kind": "percent"}
    m = MARKS_RE.search(text)
    return {"value": m.group(1), "kind": "marks"} if m else None


def parse_years(raw: str) -> Optional[Dict[str, Any]]:
    text = ascii_digits(raw or "")
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:\+\s*)?(?:years?|yrs?)", text, re.IGNORECASE)
    return {"years": m.group(1)} if m else None


# Which parser applies to which key fact
FACT_PARSERS = {
    "submission_deadline": parse_datetime,
    "pre_bid_meeting": parse_datetime,
    "bid_security": parse_money,
    "validity_period": parse_duration,
    "contract_duration": parse_duration,
}
