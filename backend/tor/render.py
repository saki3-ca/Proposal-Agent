"""Snapshot -> Markdown (for the Gradio tab). Page numbers sit next to every item."""
from typing import Any, Dict, List

TITLES = {
    "key_facts": "Key facts", "eligibility": "Eligibility criteria", "evaluation": "Evaluation criteria",
    "scope": "Scope of work", "deliverables": "Deliverables", "timeline": "Timeline",
    "team": "Team / key personnel requirements", "documents": "Required documents checklist",
    "red_flags": "Red flags",
}
FIELD_TITLES = {
    "client": "Client", "tender_id": "Tender ID", "submission_deadline": "Submission deadline",
    "submission_method": "Submission method", "bid_security": "Bid security / earnest money",
    "pre_bid_meeting": "Pre-bid meeting", "validity_period": "Validity period",
    "contract_duration": "Contract duration", "contact": "Contact",
}


def cell(text: Any) -> str:
    return str(text or "").replace("|", "\\|").replace("\n", " ").strip()


def parsed_text(p: Any) -> str:
    if not p:
        return ""
    if "date" in p:
        s = p["date"] + (f" {p['time']}" if p.get("time") else "")
        return s + (" (day/month order ambiguous)" if p.get("ambiguous") else "")
    if "amount" in p:
        if p.get("amount"):
            return f"{p['amount']} {p.get('currency') or ''}".strip()
        return f"{p['percent']}%"
    if "unit" in p:
        return f"{p['value']} {p['unit']}(s)"
    if "years" in p:
        return f"{p['years']} years"
    if "kind" in p:
        return f"{p['value']}{'%' if p['kind'] == 'percent' else ' marks'}"
    return ""


def snapshot_to_markdown(snap: Dict[str, Any]) -> str:
    meta, out = snap["meta"], []
    c = meta["counts"]
    models = ", ".join(f"{m['provider']}/{m['model']}" for m in meta["models_used"]) or "none (no LLM output)"
    out.append(f"## Tender Snapshot - {meta['filename']}\n")
    out.append(f"Pages: {meta['pages']} | Text extraction: {meta['extraction_method']} | Model(s): {models}  \n"
               f"Verified items: {c['verified_items']} | Dropped (quote not found): {c['dropped_quotes']} | "
               f"Unmapped sentences: {c['unmapped_sentences']}\n")
    if meta["chunk_errors"]:
        out.append(f"**WARNING: {len(meta['chunk_errors'])} chunk(s) failed and were not analysed "
                   f"(pages {', '.join('%d-%d' % tuple(e['pages']) for e in meta['chunk_errors'])}). "
                   f"This snapshot is incomplete - rely on the Unmapped list.**\n")

    out.append("### Key facts\n")
    facts = {}
    for f in snap["key_facts"]:
        facts.setdefault(f["label"], []).append(f)
    out.append("| Field | Value | Parsed (by code) | Page | Source quote |\n|---|---|---|---|---|")
    for field, title in FIELD_TITLES.items():
        rows = facts.get(field)
        if not rows:
            out.append(f"| {title} | *not found in document* | | | |")
            continue
        for r in rows:
            out.append(f"| {title} | {cell(r['value'])} | {cell(parsed_text(r.get('parsed')))} | p.{r['page']} | \"{cell(r['source_quote'])}\" |")
    out.append("")

    out.append("### Evaluation criteria\n")
    if snap["evaluation"]:
        out.append("| Criterion | Marks / weight (raw) | Parsed | Page | Source quote |\n|---|---|---|---|---|")
        for r in snap["evaluation"]:
            out.append(f"| {cell(r['label'])} | {cell(r['value'])} | {cell(parsed_text(r.get('parsed')))} | p.{r['page']} | \"{cell(r['source_quote'])}\" |")
    else:
        out.append("*none found*")
    out.append("")

    out.append("### Team / key personnel requirements\n")
    if snap["team"]:
        out.append("| Position | Qualification | Experience (raw) | Parsed | Page | Source quote |\n|---|---|---|---|---|---|")
        for r in snap["team"]:
            out.append(f"| {cell(r['label'])} | {cell(r.get('qualification'))} | {cell(r['value'])} | {cell(parsed_text(r.get('parsed')))} | p.{r['page']} | \"{cell(r['source_quote'])}\" |")
    else:
        out.append("*none found*")
    out.append("")

    for section in ("eligibility", "scope", "deliverables", "timeline", "documents", "red_flags"):
        out.append(f"### {TITLES[section]}\n")
        if not snap[section]:
            out.append("*none found*\n")
            continue
        for r in snap[section]:
            label = f"**{r['label']}** - " if r.get("label") else ""
            tag = " *(rule-based)*" if r.get("origin") == "rule" and section == "red_flags" and "rule-based" not in r.get("label", "") else ""
            out.append(f"- {label}\"{cell(r['source_quote'])}\" **(p.{r['page']})**{tag}")
        out.append("")

    out.append("### Unmapped - review\n")
    out.append("Sentences with obligation words, dates, amounts or percentages that no extracted item covers. "
               "Check these by hand.\n")
    if snap["unmapped"]:
        out.append("| Page | Sentence | Why flagged |\n|---|---|---|")
        for u in snap["unmapped"]:
            out.append(f"| p.{u['page']} | {cell(u['sentence'])} | {cell(', '.join(u['reasons']))} |")
    else:
        out.append("*nothing unmapped*")
    return "\n".join(out)
