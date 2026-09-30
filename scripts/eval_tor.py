"""Run the ToR Analyzer over test_data/tor_samples and print the accuracy counters.

    python scripts/eval_tor.py              # real LLM (needs GEMINI_API_KEY etc.)
    python scripts/eval_tor.py --no-llm     # ingestion + coverage only: shows how many
                                            # sentences a zero-extraction run would leave unmapped
    python scripts/eval_tor.py path/to/some_tor.pdf ...
"""
import argparse
import asyncio
import glob
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv  # noqa: E402

load_dotenv()

from backend.tor.analyzer import analyze  # noqa: E402
from backend.tor.pages import load_source  # noqa: E402


async def _no_llm(*_a, **_k):
    return {}, {"provider": None, "model": None, "error": "--no-llm"}


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="*")
    ap.add_argument("--no-llm", action="store_true")
    args = ap.parse_args()
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    files = args.files or sorted(glob.glob(os.path.join(root, "test_data", "tor_samples", "*")))
    print(f"{'file':52} {'pages':>5} {'proposed':>8} {'extracted':>9} {'dropped':>7} {'unmapped':>8}  model(s)")
    for path in files:
        with open(path, "rb") as f:
            doc = load_source(f.read(), os.path.basename(path))
        snap = await analyze(doc, llm=_no_llm) if args.no_llm else await analyze(doc)
        c, m = snap["meta"]["counts"], snap["meta"]
        models = ",".join(x["model"] for x in m["models_used"]) or "-"
        print(f"{m['filename'][:52]:52} {m['pages']:>5} {c['proposed_by_llm']:>8} {c['verified_items']:>9} "
              f"{c['dropped_quotes']:>7} {c['unmapped_sentences']:>8}  {models}")
        print(f"    text extraction: {m['extraction_method']}")
        for d in snap["dropped"]:
            print(f"    DROPPED [{d['section']}] {d['reason']}: {d['source_quote'][:90]!r}")
        for e in m["chunk_errors"]:
            print(f"    CHUNK FAILED pages {e['pages']}: {e['error']}")


if __name__ == "__main__":
    asyncio.run(main())
