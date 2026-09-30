"""ToR Analyzer: chunked LLM extraction followed by deterministic verification.

The LLM only proposes items. Nothing reaches the snapshot unless its `source_quote`
is found verbatim in the source (rule 1-2). Page numbers are taken from where the
quote is actually found, dates/money are parsed by code (rule 5), and sentences the
extraction missed are listed as "unmapped" (rule 3).
"""
import asyncio
import logging
from datetime import date
from typing import Any, Awaitable, Callable, Dict, List, Optional, Tuple

from backend.services.llm_client import chat_json
from backend.tor.coverage import find_unmapped, rule_based_red_flags
from backend.tor.parsers import FACT_PARSERS, parse_duration, parse_marks, parse_years
from backend.tor.textutil import SourceDoc, normalize

logger = logging.getLogger("tor.analyzer")

KEY_FIELDS = ["client", "tender_id", "submission_deadline", "submission_method", "bid_security",
              "pre_bid_meeting", "validity_period", "contract_duration", "contact"]
MULTI_VALUE_FIELDS = {"contact", "submission_method"}
LIST_SECTIONS = ["eligibility", "scope", "deliverables", "timeline", "documents", "red_flags"]
SECTIONS = ["key_facts", "eligibility", "evaluation", "scope", "deliverables", "timeline", "team",
            "documents", "red_flags"]
MAX_CHUNK_CHARS = 9000
MIN_QUOTE_CHARS = 12

SYSTEM_PROMPT = f"""You extract facts from tender documents / Terms of Reference. The text may mix Bangla and English.

HARD RULES
1. Extract only what the text explicitly states. Never infer, compute, convert or calculate anything (no date arithmetic, no totals, no currency conversion).
2. Every item MUST include "source_quote": an exact, contiguous copy of the text (max 400 characters, same language and characters as the source - do not translate, fix spelling or merge lines) and "page": the number from the nearest preceding "=== PAGE n ===" marker.
3. "value", "marks_raw", "experience_raw" must be copied exactly as written and must appear inside source_quote.
4. If you are not sure something is stated, leave it out. An item without a real quote will be discarded.
5. The text may repeat across overlapping page ranges; that is fine.

Return ONLY JSON of this shape (omit nothing, use [] when none):
{{
 "key_facts": [{{"field": one of {KEY_FIELDS}, "value": "...", "source_quote": "...", "page": 1}}],
 "eligibility": [{{"source_quote": "...", "page": 1}}],
 "evaluation": [{{"criterion": "...", "marks_raw": "e.g. 30 marks / 20%", "source_quote": "...", "page": 1}}],
 "scope": [{{"source_quote": "...", "page": 1}}],
 "deliverables": [{{"source_quote": "...", "page": 1}}],
 "timeline": [{{"source_quote": "...", "page": 1}}],
 "team": [{{"position": "...", "qualification_raw": "...", "experience_raw": "e.g. at least 10 years", "source_quote": "...", "page": 1}}],
 "documents": [{{"document": "...", "source_quote": "...", "page": 1}}],
 "red_flags": [{{"issue": "short reason", "source_quote": "...", "page": 1}}]
}}

Section guidance:
- key_facts: client (procuring organisation), tender_id (reference/RFP/tender number), submission_deadline (date AND time if given), submission_method, bid_security (bid security / earnest money / tender security), pre_bid_meeting, validity_period (bid validity), contract_duration, contact (names/emails/phones for queries).
- eligibility: who may bid (registration, experience, turnover, legal status, conflicts of interest).
- evaluation: each evaluation/selection criterion with its marks or weight (QCBS technical/financial split, sub-criteria, pass marks).
- scope: scope of work / services. deliverables: outputs/reports. timeline: milestones and dated/periodic deadlines.
- team: one item per key personnel position with qualification and required years of experience.
- documents: each document the bidder must submit.
- red_flags: very short deadlines, unusual or one-sided clauses, penalty/liquidated damages, blacklisting, unclear or contradictory wording. "issue" is your short reason; the quote must be the clause itself."""

LLMFn = Callable[..., Awaitable[Tuple[Optional[Any], Dict[str, Any]]]]


def build_chunks(doc: SourceDoc, max_chars: int = MAX_CHUNK_CHARS) -> List[Dict[str, Any]]:
    """Overlapping chunks that respect page boundaries: the last page of a chunk opens the next."""
    segments: List[Tuple[int, str]] = []
    for pno in sorted(doc.pages):
        text = doc.pages[pno]
        if not text.strip():
            continue
        if len(text) <= max_chars:
            segments.append((pno, text))
        else:
            lines, buf = text.splitlines(), ""
            for ln in lines:
                if len(buf) + len(ln) > max_chars and buf:
                    segments.append((pno, buf))
                    buf = ""
                buf += ln + "\n"
            if buf.strip():
                segments.append((pno, buf))

    chunks: List[Dict[str, Any]] = []
    i = 0
    while i < len(segments):
        j, size = i, 0
        while j < len(segments) and (size + len(segments[j][1]) <= max_chars or j == i):
            size += len(segments[j][1])
            j += 1
        group = segments[i:j]
        chunks.append({"pages": (group[0][0], group[-1][0]),
                       "text": "\n\n".join(f"=== PAGE {p} ===\n{t}" for p, t in group)})
        if j >= len(segments):
            break
        i = j - 1 if j - 1 > i else j  # one-segment overlap
    return chunks


def _within(raw: str, quote: str) -> bool:
    nr, nq = normalize(raw), normalize(quote)
    if not nr:
        return False
    return nr in nq or nr.replace(" ", "") in nq.replace(" ", "")


def _as_int(v: Any) -> Optional[int]:
    try:
        return int(str(v).strip())
    except (TypeError, ValueError):
        return None


def _verify_item(doc: SourceDoc, section: str, raw: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Return (verified_item, None) or (None, drop_reason)."""
    quote = str(raw.get("source_quote") or "")
    if not quote.strip():
        return None, "no source_quote"
    loc = doc.locate(quote, _as_int(raw.get("page")))
    if loc is None:
        return None, "quote not found in source" if len(normalize(quote)) >= MIN_QUOTE_CHARS else "quote too short to verify"
    start, end, page = loc
    item: Dict[str, Any] = {"section": section, "source_quote": normalize(quote), "page": page,
                            "start": start, "end": end, "origin": "llm", "label": "", "value": "",
                            "claimed_page": _as_int(raw.get("page"))}

    if section == "key_facts":
        field = str(raw.get("field") or "").strip()
        value = str(raw.get("value") or "").strip()
        if field not in KEY_FIELDS:
            return None, f"unknown key fact field '{field}'"
        if not _within(value, quote):
            return None, "value not found inside its own quote"
        item.update(label=field, value=value)
        parser = FACT_PARSERS.get(field)
        item["parsed"] = parser(value) if parser else None
    elif section == "evaluation":
        marks = str(raw.get("marks_raw") or "").strip()
        if marks and not _within(marks, quote):
            return None, "marks_raw not found inside its own quote"
        item.update(label=str(raw.get("criterion") or "").strip(), value=marks, parsed=parse_marks(marks) if marks else None)
    elif section == "team":
        exp = str(raw.get("experience_raw") or "").strip()
        qual = str(raw.get("qualification_raw") or "").strip()
        if exp and not _within(exp, quote):
            return None, "experience_raw not found inside its own quote"
        if qual and not _within(qual, quote):
            qual = ""  # soft field: blank rather than show unverified wording
        item.update(label=str(raw.get("position") or "").strip(), value=exp, qualification=qual,
                    parsed=parse_years(exp) if exp else None)
    elif section == "documents":
        item.update(label=str(raw.get("document") or "").strip())
    elif section == "red_flags":
        item.update(label=str(raw.get("issue") or "").strip())
    else:
        item.update(label="")
    return item, None


def _dedupe(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Drop items whose span is inside an already-kept span of the same section (and same label for key facts)."""
    kept: List[Dict[str, Any]] = []
    for it in sorted(items, key=lambda x: (x["start"], -(x["end"] - x["start"]))):
        dup = False
        for k in kept:
            if k["section"] != it["section"]:
                continue
            same_span = it["start"] >= k["start"] and it["end"] <= k["end"]
            if same_span and (it["section"] not in ("key_facts", "team", "evaluation") or k["label"].lower() == it["label"].lower()):
                dup = True
                break
        if not dup:
            kept.append(it)
    return kept


def _same_value(a: Dict[str, Any], b: Dict[str, Any]) -> bool:
    pa, pb = a.get("parsed"), b.get("parsed")
    if pa and pb:
        if "date" in pa and "date" in pb:
            return pa["date"] == pb["date"] and pa.get("time") == pb.get("time")
        return pa == pb
    return normalize(a["value"]).lower() == normalize(b["value"]).lower()


def _consolidate_key_facts(facts: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """One value per field (earliest page wins); differing candidates become alternates + a conflict flag."""
    out: List[Dict[str, Any]] = []
    conflicts: List[Dict[str, Any]] = []
    for field in KEY_FIELDS:
        cands = sorted((f for f in facts if f["label"] == field), key=lambda x: (x["page"], x["start"]))
        if not cands:
            continue
        if field in MULTI_VALUE_FIELDS:
            seen = set()
            for c in cands:
                key = normalize(c["value"]).lower()
                if key not in seen:
                    seen.add(key)
                    out.append(c)
            continue
        primary = cands[0]
        primary["alternates"] = []
        for c in cands[1:]:
            if not _same_value(primary, c):
                primary["alternates"].append({"value": c["value"], "page": c["page"], "source_quote": c["source_quote"]})
        if primary["alternates"]:
            alts = "; ".join(f"'{a['value']}' (p.{a['page']})" for a in primary["alternates"])
            conflicts.append({"section": "red_flags", "label": f"Conflicting values for {field}: '{primary['value']}' (p.{primary['page']}) vs {alts}",
                              "value": "", "source_quote": primary["source_quote"], "page": primary["page"],
                              "start": primary["start"], "end": primary["end"], "origin": "rule"})
        out.append(primary)
    return out, conflicts


def _deadline_flag(facts: List[Dict[str, Any]], today: date) -> Optional[Dict[str, Any]]:
    for f in facts:
        if f["label"] == "submission_deadline" and f.get("parsed"):
            d = date.fromisoformat(f["parsed"]["date"])
            days = (d - today).days
            if days < 7:
                msg = (f"Deadline {f['parsed']['date']} is {days} day(s) after the analysis date {today.isoformat()} (under 7 days)"
                       if days >= 0 else f"Deadline {f['parsed']['date']} is already past as of the analysis date {today.isoformat()}")
                return {"section": "red_flags", "label": msg + " [computed by code]", "value": f["value"],
                        "source_quote": f["source_quote"], "page": f["page"], "start": f["start"], "end": f["end"], "origin": "rule"}
    return None


async def _extract_chunk(chunk: Dict[str, Any], llm: LLMFn, sem: asyncio.Semaphore, filename: str) -> Tuple[Optional[Dict[str, Any]], Dict[str, Any]]:
    user = f"Document: {filename}\nPages in this excerpt: {chunk['pages'][0]}-{chunk['pages'][1]}\n\n{chunk['text']}\n\nReturn the JSON."
    purpose = f"pages {chunk['pages'][0]}-{chunk['pages'][1]}"
    async with sem:
        for _ in range(2):  # one retry on unparseable / failed output
            parsed, meta = await llm("tor_extraction", SYSTEM_PROMPT, user, purpose)
            if isinstance(parsed, dict):
                return parsed, meta
    return None, meta


async def analyze(doc: SourceDoc, llm: LLMFn = chat_json, today: Optional[date] = None,
                  concurrency: int = 2) -> Dict[str, Any]:
    today = today or date.today()
    chunks = build_chunks(doc)
    sem = asyncio.Semaphore(concurrency)
    results = await asyncio.gather(*[_extract_chunk(c, llm, sem, doc.filename) for c in chunks])

    verified: List[Dict[str, Any]] = []
    dropped: List[Dict[str, Any]] = []
    proposed = 0
    models, chunk_errors = [], []
    for chunk, (parsed, meta) in zip(chunks, results):
        if meta.get("model") and meta.get("model") not in [m["model"] for m in models]:
            models.append({"provider": meta.get("provider"), "model": meta.get("model")})
        if parsed is None:
            chunk_errors.append({"pages": chunk["pages"], "error": meta.get("error") or "no output"})
            continue
        for section in SECTIONS:
            for raw in parsed.get(section) or []:
                if not isinstance(raw, dict):
                    continue
                proposed += 1
                item, reason = _verify_item(doc, section, raw)
                if item is None:
                    record = {"section": section, "reason": reason, "page": raw.get("page"),
                              "source_quote": str(raw.get("source_quote") or "")[:300],
                              "label": str(raw.get("field") or raw.get("criterion") or raw.get("position") or raw.get("document") or raw.get("issue") or "")}
                    dropped.append(record)
                    logger.warning("Dropped %s item (%s): %r", section, reason, record["source_quote"][:120])
                else:
                    verified.append(item)

    verified = _dedupe(verified)
    facts, conflicts = _consolidate_key_facts([v for v in verified if v["section"] == "key_facts"])
    rest = [v for v in verified if v["section"] != "key_facts"]

    extra_flags = conflicts + rule_based_red_flags(doc)
    dl = _deadline_flag(facts, today)
    if dl:
        extra_flags.append(dl)
    llm_flag_spans = [(v["start"], v["end"]) for v in rest if v["section"] == "red_flags"]
    for flag in extra_flags:
        is_pattern_flag = "rule-based" in flag["label"]
        if is_pattern_flag and any(min(flag["end"], e) - max(flag["start"], s) > 0 for s, e in llm_flag_spans):
            continue  # the LLM already flagged this clause
        rest.append(flag)

    items = facts + rest
    snapshot: Dict[str, Any] = {"meta": {}, **{s: [] for s in SECTIONS}}
    for it in sorted(items, key=lambda x: (x["page"], x["start"])):
        snapshot[it["section"]].append(it)
    snapshot["key_facts"].sort(key=lambda x: KEY_FIELDS.index(x["label"]))

    unmapped = find_unmapped(doc, [(i["start"], i["end"]) for i in items])
    snapshot["unmapped"] = unmapped
    snapshot["dropped"] = dropped
    snapshot["meta"] = {
        "filename": doc.filename, "pages": len(doc.pages), "extraction_method": doc.method,
        "analysis_date": today.isoformat(), "chunks": len(chunks), "chunk_errors": chunk_errors,
        "models_used": models,
        "counts": {"proposed_by_llm": proposed, "verified_items": len(items), "dropped_quotes": len(dropped),
                   "unmapped_sentences": len(unmapped)},
    }
    return snapshot
