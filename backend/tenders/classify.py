"""Two-stage tender classification: keywords first (English + Bangla), LLM only when ambiguous."""
import json
import re
from typing import Any, Dict, List, Optional, Tuple

from backend.services.llm_client import chat_json

CATEGORIES = ["Statutory Audit", "Internal Audit", "Management Audit", "Forensic Audit", "Special/Performance Audit",
              "IT Audit", "IT Services/Systems", "Tax & VAT", "Accounting/Bookkeeping", "Payroll",
              "Financial/Management Consultancy", "Feasibility Study", "Valuation", "Due Diligence",
              "Training/Capacity Building", "Other-Relevant", "Irrelevant"]

# Specific categories. Patterns are case-insensitive regexes. A "T:" prefix means: match the title only
# (bare words like tax/VAT/ERP also appear in boilerplate of unrelated goods tenders).
KEYWORDS: Dict[str, List[str]] = {
    "Statutory Audit": [r"statutory audit", r"external audit", r"financial statements? audit", r"audit of (?:the )?financial statements?",
                        r"annual audit", r"independent audit", r"audit of accounts", r"certified financial statements",
                        r"বহিঃনিরীক্ষা", r"বাহ্যিক নিরীক্ষা", r"আর্থিক বিবরণীর নিরীক্ষা", r"বার্ষিক নিরীক্ষা"],
    "Internal Audit": [r"internal audit", r"অভ্যন্তরীণ নিরীক্ষা", r"অভ্যন্তরীণ অডিট"],
    "Management Audit": [r"management audit", r"operational audit", r"ব্যবস্থাপনা নিরীক্ষা"],
    "Forensic Audit": [r"forensic", r"fraud (?:investigation|audit|examination)", r"ফরেনসিক"],
    "Special/Performance Audit": [r"special audit", r"performance audit", r"compliance audit", r"value[- ]for[- ]money audit",
                                  r"বিশেষ নিরীক্ষা", r"কর্মসম্পাদন নিরীক্ষা"],
    "IT Audit": [r"\bit audit", r"information systems? audit", r"cyber ?security audit", r"iso 27001", r"pci[- ]?dss", r"vulnerability assessment",
                 r"penetration test", r"আইটি অডিট"],
    "IT Services/Systems": [r"T:\berp\b", r"software (?:development|solution|system)", r"information system", r"web(?:site)? development",
                            r"mobile app", r"T:\bmis\b", r"digital transformation", r"system integrator", r"সফটওয়্যার", r"তথ্যপ্রযুক্তি সেবা"],
    "Tax & VAT": [r"T:\btax\b", r"T:\bvat\b", r"T:ভ্যাট", r"T:আয়কর", r"T:income tax", r"tax (?:advisory|compliance|return|consultan)", r"transfer pricing", r"কর পরামর্শ"],
    "Accounting/Bookkeeping": [r"bookkeeping", r"book-keeping", r"accounting (?:service|support|software|outsourc)", r"accounts? outsourc", r"হিসাব রক্ষণ", r"হিসাবরক্ষণ"],
    "Payroll": [r"payroll", r"বেতন প্রক্রিয়া"],
    "Financial/Management Consultancy": [r"financial (?:consult|advis)", r"management consult", r"business advisory", r"organi[sz]ational (?:review|assessment)",
                                         r"institutional assessment", r"pillar assessment", r"due diligence assessment", r"আর্থিক পরামর্শ", r"ব্যবস্থাপনা পরামর্শ"],
    "Feasibility Study": [r"feasibility", r"সম্ভাব্যতা"],
    "Valuation": [r"\b(?:re)?valuation\b", r"asset valuation", r"মূল্যায়ন প্রতিবেদন", r"সম্পদ মূল্যায়ন"],
    "Due Diligence": [r"due diligence"],
    "Training/Capacity Building": [r"capacity (?:building|development)", r"\btraining (?:service|provider|program)", r"training on (?:accounting|finance|audit|tax)",
                                   r"প্রশিক্ষণ", r"সক্ষমতা"],
}
# Weak hints: relevant-looking but not enough to pick a category -> LLM decides.
WEAK = [r"\baudit", r"audit(?:or|ing)", r"consultan(?:cy|t|ts)\b", r"consulting", r"\b(?:consulting|audit|auditing|accounting|professional|service) firms?\b",
        r"chartered accountant", r"\bCA firm", r"\bCPA\b", r"expression of interest", r"\beoi\b", r"financial (?:management|review|assessment)",
        r"নিরীক্ষা", r"অডিট", r"পরামর্শক", r"পরামর্শ", r"ফার্ম", r"চার্টার্ড অ্যাকাউন্ট্যান্ট", r"চার্টার্ড একাউন্ট্যান্ট"]

_KW = {c: [(p.startswith("T:"), re.compile(p[2:] if p.startswith("T:") else p, re.IGNORECASE)) for p in ps]
       for c, ps in KEYWORDS.items()}
_WEAK = [re.compile(p, re.IGNORECASE) for p in WEAK]
BD_RE = re.compile(r"bangladesh|dhaka|chattogram|chittagong|sylhet|khulna|rajshahi|barishal|barisal|rangpur|mymensingh|বাংলাদেশ|ঢাকা|চট্টগ্রাম", re.IGNORECASE)
OPEN_INTL_RE = re.compile(r"international competitive|open to (?:all|eligible) (?:countries|firms)|open international|all eligible countries|unrestricted", re.IGNORECASE)
RESTRICT_RE = re.compile(r"\bnational (?:competitive )?(?:bidding|only)|(?:only|restricted to) (?:local|national|[A-Z][a-z]+ )(?:firms|nationals)", re.IGNORECASE)


def keyword_pass(title: str, text: str) -> Tuple[Optional[str], bool]:
    """Returns (category, ambiguous). category None + ambiguous False means Irrelevant."""
    scores: Dict[str, int] = {}
    for cat, rxs in _KW.items():
        s = sum(3 * bool(rx.search(title)) + (0 if title_only else bool(rx.search(text))) for title_only, rx in rxs)
        if s:
            scores[cat] = s
    if scores:
        ranked = sorted(scores.items(), key=lambda kv: -kv[1])
        if len(ranked) == 1 or ranked[0][1] >= 2 * ranked[1][1]:
            return ranked[0][0], False
        return None, True
    if any(rx.search(title) or rx.search(text) for rx in _WEAK):
        return None, True
    return None, False


def bangladesh_status(t: Dict[str, Any], bd_only: bool) -> Optional[str]:
    """'bangladesh' | 'open_international' | None (drop)."""
    blob = f"{t.get('country') or ''} {t['title']} {t.get('entity') or ''} {t.get('text') or ''}"
    if bd_only or BD_RE.search(blob):
        return "bangladesh"
    if OPEN_INTL_RE.search(blob) and not RESTRICT_RE.search(blob):
        return "open_international"
    return None


async def llm_pass(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Classify ambiguous items in batches. Mutates items with category/classified_by."""
    system = ("You classify tender notices for a Bangladeshi chartered accountancy / advisory firm. "
              f"Allowed categories (exact spelling): {json.dumps(CATEGORIES)}. "
              "Use 'Irrelevant' for goods, works, construction, supplies and anything a CA/advisory firm would not bid on. "
              "Use 'Other-Relevant' for relevant professional services that fit no specific category. "
              'Reply ONLY with JSON: {"results":[{"id":<int>,"category":"<category>"}]}. Do not invent details.')
    for i in range(0, len(items), 8):
        batch = items[i:i + 8]
        payload = [{"id": k, "title": t["title"][:200], "entity": (t.get("entity") or "")[:100], "text": (t.get("text") or "")[:600]}
                   for k, t in enumerate(batch)]
        parsed, meta = await chat_json("tender_classification", system, json.dumps(payload, ensure_ascii=False), "classify tenders")
        by_id = {}
        if isinstance(parsed, dict):
            for r in parsed.get("results") or []:
                if isinstance(r, dict) and r.get("category") in CATEGORIES:
                    by_id[r.get("id")] = r["category"]
        for k, t in enumerate(batch):
            if k in by_id:
                t["category"], t["classified_by"] = by_id[k], f"llm:{meta.get('model')}"
            else:  # LLM unavailable or invalid answer: keep it for human review rather than silently dropping
                t["category"], t["classified_by"] = "Other-Relevant", "keyword-ambiguous (LLM unavailable)"
    return items


async def classify_all(tenders: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    ambiguous = []
    for t in tenders:
        cat, amb = keyword_pass(t["title"], t.get("text") or "")
        if amb:
            ambiguous.append(t)
        else:
            t["category"], t["classified_by"] = cat or "Irrelevant", "keyword"
    if ambiguous:
        await llm_pass(ambiguous)
    return tenders
