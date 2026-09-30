"""Deterministic coverage check and rule-based red flags. No LLM involved."""
import re
from typing import Any, Dict, List, Optional, Tuple

from backend.tor.parsers import DATE_RE, MONEY_RE, PERCENT_RE
from backend.tor.textutil import SourceDoc, ascii_digits

OBLIGATION_EN = ["must", "shall", "required", "mandatory", "should", "will be", "not less than",
                 "minimum", "at least"]
OBLIGATION_BN = ["অবশ্যই", "আবশ্যক", "বাধ্যতামূলক", "কমপক্ষে", "ন্যূনতম", "নূন্যতম", "প্রয়োজন", "হতে হবে"]
_OBL_RE = re.compile(r"(?<![A-Za-z])(" + "|".join(re.escape(w) for w in OBLIGATION_EN) + r")(?![A-Za-z])", re.IGNORECASE)
_OBL_BN_RE = re.compile("|".join(re.escape(w) for w in OBLIGATION_BN))
_AMOUNT_RE = re.compile(r"(?:BDT|Tk\.?|Taka|৳|USD|US\$|\$|EUR|€)\s*\d|\d[\d,\.]*\s*(?:lakhs?|lacs?|crores?|million|BDT|Tk\b|Taka|USD)", re.IGNORECASE)


def trigger_reasons(sentence: str) -> List[str]:
    s = ascii_digits(sentence)
    reasons: List[str] = []
    m = _OBL_RE.search(s)
    if m:
        reasons.append(f"obligation: '{m.group(1).lower()}'")
    m = _OBL_BN_RE.search(s)
    if m:
        reasons.append(f"obligation: '{m.group(0)}'")
    if DATE_RE.search(s):
        reasons.append("date")
    if _AMOUNT_RE.search(s):
        reasons.append("amount")
    if PERCENT_RE.search(s):
        reasons.append("percentage")
    return reasons


def find_unmapped(doc: SourceDoc, spans: List[Tuple[int, int]]) -> List[Dict[str, Any]]:
    """Sentences with obligations/dates/amounts/percentages not overlapped by any verified item."""
    unmapped = []
    for u in doc.units:
        reasons = trigger_reasons(u.text)
        if not reasons:
            continue
        length = max(1, u.end - u.start)
        linked = False
        for qs, qe in spans:
            overlap = min(u.end, qe) - max(u.start, qs)
            if overlap > 0 and (overlap >= 0.4 * length or overlap >= 0.8 * (qe - qs)):
                linked = True
                break
        if not linked:
            unmapped.append({"page": u.page, "sentence": u.text, "reasons": reasons})
    return unmapped


_RULE_FLAGS = [
    ("penalty", re.compile(r"liquidated damages|penalt(?:y|ies)|forfeit|blacklist|debar|black-list|জরিমানা|কালো তালিকা", re.IGNORECASE)),
    ("unusual", re.compile(r"sole discretion|reserves? the right to (?:reject|cancel|terminate|amend)|without (?:assigning|giving) any reason|"
                           r"unlimited liability|indemnif|\bexclusiv(?:e|ity)\b|non-?compete|intellectual property (?:rights )?(?:shall )?(?:vest|belong)", re.IGNORECASE)),
    ("ambiguous", re.compile(r"\bto be (?:decided|determined|advised|confirmed)\b|\bTBD\b|\bTBC\b|as (?:deemed )?necessary|as may be required|from time to time", re.IGNORECASE)),
]


def rule_based_red_flags(doc: SourceDoc) -> List[Dict[str, Any]]:
    """Red flags found by pattern; the quote is the source sentence itself, so it is verbatim by construction."""
    flags = []
    for u in doc.units:
        for kind, rx in _RULE_FLAGS:
            m = rx.search(u.text)
            if m:
                flags.append({"section": "red_flags", "label": f"{kind} clause (rule-based)", "value": m.group(0),
                              "source_quote": u.text[:600], "page": u.page, "start": u.start,
                              "end": min(u.end, u.start + 600), "origin": "rule"})
    return flags
