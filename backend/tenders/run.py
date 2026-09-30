"""Daily tender scrape. Run by GitHub Actions cron:  python -m backend.tenders.run [--dry-run]

fetch (robots-checked) -> Bangladesh filter -> classify (keywords, then LLM if ambiguous)
-> drop Irrelevant -> dedupe (title + entity + deadline) -> Supabase -> Telegram/e-mail digest.
Prints a per-source report, including which sources were skipped and why.
"""
import argparse
import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

import yaml
from dotenv import load_dotenv

load_dotenv()

from backend.tenders import digest, store  # noqa: E402
from backend.tenders.adapters import ADAPTERS  # noqa: E402
from backend.tenders.classify import bangladesh_status, classify_all  # noqa: E402
from backend.tenders.fetch import Skip, user_agent  # noqa: E402

logger = logging.getLogger("tenders.run")
SOURCES_FILE = Path(__file__).resolve().parents[2] / "config" / "sources.yaml"


def load_sources() -> Dict[str, Any]:
    with open(SOURCES_FILE, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def collect(cfg: Dict[str, Any]) -> tuple:
    """Fetch every enabled source. Returns (tenders, report)."""
    ua, delay = user_agent(cfg["user_agent"]), float(cfg.get("delay_seconds", 2))
    tenders: List[Dict[str, Any]] = []
    report: List[Dict[str, Any]] = []
    for src in cfg["sources"]:
        entry = {"id": src["id"], "name": src["name"], "status": "", "detail": "", "fetched": 0, "kept_bd": 0}
        report.append(entry)
        if not src.get("enabled"):
            entry.update(status="skipped", detail=(src.get("note") or "disabled").strip())
            continue
        try:
            raw = ADAPTERS[src["type"]](src, ua, delay)
        except Skip as exc:
            entry.update(status="skipped", detail=str(exc))
            continue
        except Exception as exc:  # one broken source must not stop the run
            logger.exception("source %s failed", src["id"])
            entry.update(status="error", detail=f"{exc.__class__.__name__}: {exc}")
            continue
        entry.update(status="ok", fetched=len(raw))
        for t in raw:
            status = bangladesh_status(t, bool(src.get("bd_only")))
            if src.get("bd_filter") == "text" and status is None:
                continue
            if status is None:
                continue
            t.update(source_id=src["id"], bd_eligibility=status)
            tenders.append(t)
            entry["kept_bd"] += 1
    return tenders, report


def dedupe(tenders: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen, out = set(), []
    for t in tenders:
        t["dedupe_key"] = store.dedupe_key(t["title"], t.get("entity", ""), t.get("deadline"))
        if t["dedupe_key"] not in seen:
            seen.add(t["dedupe_key"])
            out.append(t)
    return out


async def main(dry_run: bool) -> int:
    cfg = load_sources()
    tenders, report = collect(cfg)
    tenders = await classify_all(tenders)
    relevant = dedupe([t for t in tenders if t["category"] != "Irrelevant"])
    summary: Dict[str, Any] = {"sources": report, "bd_candidates": len(tenders), "relevant_after_dedupe": len(relevant)}

    have_db = bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_KEY"))
    if dry_run or not have_db:
        summary["stored"] = f"not stored ({'dry run' if dry_run else 'SUPABASE_* not set'})"
        for t in relevant:
            print(f"[{t['category']}] {t['title'][:90]} | {t.get('entity')} | deadline {t.get('deadline')} | {t['source_id']}")
    else:
        summary["new_rows"] = store.insert_new(relevant)
        pending = store.unnotified()
        try:
            summary["digest"] = digest.send_digest(pending)
            if summary["digest"] != "skipped":
                store.mark_notified([r["id"] for r in pending])
        except Exception as exc:
            summary["digest"] = f"FAILED ({exc}); rows stay un-notified and will be retried next run"
    text = json.dumps(summary, indent=2, ensure_ascii=False)
    print(text)
    step = os.getenv("GITHUB_STEP_SUMMARY")
    if step:
        with open(step, "a", encoding="utf-8") as f:
            f.write("### Tender run\n```json\n" + text + "\n```\n")
    enabled = [r for r in report if r["status"] != "skipped"]
    return 1 if enabled and all(r["status"] == "error" for r in enabled) else 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    sys.exit(asyncio.run(main(ap.parse_args().dry_run)))
