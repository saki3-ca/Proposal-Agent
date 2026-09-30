"""Check every configured source: robots.txt, reachability, and how many items the adapter parses.

    python -m backend.tenders.verify_sources
Run it from a machine with open internet (or the 'Verify tender sources' GitHub Action) and copy the
results into config/sources.yaml (`verified`, `enabled`). Disabled sources are tested too, so you can
decide whether to turn them on.
"""
import logging

from backend.tenders.adapters import ADAPTERS
from backend.tenders.fetch import Skip, user_agent
from backend.tenders.run import load_sources


def main() -> None:
    cfg = load_sources()
    ua, delay = user_agent(cfg["user_agent"]), float(cfg.get("delay_seconds", 2))
    for src in cfg["sources"]:
        if not src.get("url") or src.get("item_selector") == "TODO":
            print(f"{src['id']:12} NOT CONFIGURED (needs url / selectors)")
            continue
        try:
            items = ADAPTERS[src["type"]](src, ua, delay)
            sample = items[0]["title"][:70] if items else "-"
            verdict = "OK" if items else "REACHABLE BUT 0 ITEMS PARSED (fix selectors)"
            print(f"{src['id']:12} {verdict}: {len(items)} items; first: {sample!r}")
        except Skip as exc:
            print(f"{src['id']:12} SKIP: {exc}")
        except Exception as exc:
            print(f"{src['id']:12} ERROR: {exc.__class__.__name__}: {exc}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.WARNING)
    main()
