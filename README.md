---
title: Proposal Agent
emoji: 📄
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Proposal Agent — Tender & Proposal Assistant

FastAPI backend with a minimal Gradio UI (served at `/`). Tabs:

1. **ToR Analyzer** – upload a tender/ToR → a verified "Tender Snapshot" with page numbers, an *Unmapped – review* list, XLSX/DOCX downloads.
2. **Tenders** – tenders found by the daily Tender Finder bot (stored in Supabase), with filters and an *Analyze ToR* action.
3. *Proposal Generator* – not built yet (waiting for Features 1–2 to be confirmed).

## Run locally
```bash
cp .env.example .env            # fill in keys
pip install -r backend/requirements.txt
uvicorn backend.main:app --port 7860      # UI at http://localhost:7860/ , API docs at /docs
```
Optional for scanned Bangla: install Tesseract with the `ben` language pack.

## Tests / accuracy check
```bash
pytest backend/test_tor_accuracy.py backend/test_tenders.py
python scripts/eval_tor.py            # needs an LLM key; prints extracted / dropped-quote / unmapped counts per sample ToR
python scripts/eval_tor.py --no-llm   # ingestion + coverage only
```

## Tender Finder bot
```bash
python -m backend.tenders.verify_sources   # which sources are reachable / parse (run from an open network)
python -m backend.tenders.run --dry-run    # fetch + classify, no DB, no digest
python -m backend.tenders.run              # full run (what the GitHub Action does daily)
```
Sources live in `config/sources.yaml`; model names in `config/models.yaml`.
Supabase schema: `supabase/migrations/20260930_tenders.sql`.

## Deploy
* **Hugging Face Space** (Docker SDK, port 7860): `.github/workflows/deploy-space.yml` pushes on every push to `main`.
  Needs GitHub secret `HF_TOKEN`, variable `HF_SPACE` (`user/space-name`); add the API keys + `SUPABASE_*` as **Space secrets**.
* **Daily scraper**: `.github/workflows/tenders-daily.yml` (cron) – needs the secrets listed in the file.

See `PROPOSAL_AGENT_GUIDE.md` for the original architecture notes (its React frontend sections are obsolete).
