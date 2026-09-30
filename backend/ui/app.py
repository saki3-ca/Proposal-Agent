"""Minimal Gradio UI mounted on the FastAPI app. One tab per feature, default styling."""
import asyncio
import datetime as dt
import os
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import gradio as gr

from backend.tor.analyzer import analyze
from backend.tor.export import to_docx, to_xlsx
from backend.tor.pages import load_source
from backend.tor.render import snapshot_to_markdown

MAX_DOWNLOAD_BYTES = 30 * 1024 * 1024
TABLE_COLS = ["Category", "Title", "Entity", "Deadline", "Published", "Source", "Link", "ToR document"]


async def _analyze_bytes(data: bytes, filename: str) -> Tuple[str, Optional[str], Optional[str]]:
    try:
        doc = await asyncio.to_thread(load_source, data, filename)
    except Exception as exc:
        return f"**Could not read the document:** {exc}", None, None
    snap = await analyze(doc)
    md = snapshot_to_markdown(snap)
    return md, await asyncio.to_thread(to_xlsx, snap), await asyncio.to_thread(to_docx, snap)


def _dl(path: Optional[str]):
    return gr.DownloadButton(value=path, interactive=bool(path))


async def analyze_upload(file):
    if not file:
        return "Upload a tender / ToR first.", "", _dl(None), _dl(None)
    path = file if isinstance(file, str) else file.name
    with open(path, "rb") as f:
        data = f.read()
    md, xlsx, docx = await _analyze_bytes(data, os.path.basename(path))
    return "Done.", md, _dl(xlsx), _dl(docx)


# ---------------------------------------------------------------- tenders
def _load_rows(categories, sources, date_from, date_to, hide_past) -> Tuple[List[Dict[str, Any]], str]:
    from backend.tenders import store
    try:
        rows = store.list_tenders()
    except Exception as exc:
        return [], f"Could not load tenders: {exc}"
    today = dt.date.today().isoformat()
    out = []
    for r in rows:
        d = r.get("deadline")
        if categories and r["category"] not in categories:
            continue
        if sources and r["source_id"] not in sources:
            continue
        if hide_past and d and d < today:
            continue
        if date_from and (not d or d < date_from.strip()):
            continue
        if date_to and (not d or d > date_to.strip()):
            continue
        out.append(r)
    out.sort(key=lambda r: (r.get("deadline") is None, r.get("deadline") or ""))  # nearest deadline first, unknown last
    return out, f"{len(out)} tender(s), nearest deadline first."


def refresh_tenders(categories, sources, date_from, date_to, hide_past):
    rows, msg = _load_rows(categories, sources, date_from, date_to, hide_past)
    table = [[r["category"], r["title"], r.get("procuring_entity") or "", r.get("deadline") or "", r.get("published_date") or "",
              r["source_id"], r.get("source_url") or "", "yes" if r.get("document_url") else "no"] for r in rows]
    return table, rows, msg


def select_row(rows: List[Dict[str, Any]], evt: gr.SelectData):
    idx = evt.index[0] if isinstance(evt.index, (list, tuple)) else evt.index
    return rows[idx] if rows and idx < len(rows) else None


async def analyze_tender(selected: Optional[Dict[str, Any]]):
    tabs = gr.Tabs(selected="tor")
    if not selected:
        return "Select a tender row first.", "", _dl(None), _dl(None), gr.Tabs()
    url = selected.get("document_url")
    if not url:
        return ("This tender has no downloadable document (only a notice page). Open the source link and upload the ToR manually.",
                "", _dl(None), _dl(None), gr.Tabs())
    from backend.tenders.fetch import Skip, polite_get, user_agent
    from backend.tenders.run import load_sources
    cfg = load_sources()
    try:
        r = await asyncio.to_thread(polite_get, url, user_agent(cfg["user_agent"]), float(cfg.get("delay_seconds", 2)))
    except Skip as exc:
        return f"Could not download the document: {exc}", "", _dl(None), _dl(None), gr.Tabs()
    if len(r.content) > MAX_DOWNLOAD_BYTES:
        return "Document is larger than 30 MB; upload it manually.", "", _dl(None), _dl(None), gr.Tabs()
    name = os.path.basename(urlparse(url).path) or "tender.pdf"
    md, xlsx, docx = await _analyze_bytes(r.content, name)
    return f"Analysed {name} from tender: {selected['title'][:80]}", md, _dl(xlsx), _dl(docx), tabs


def build_ui() -> gr.Blocks:
    from backend.tenders.classify import CATEGORIES
    with gr.Blocks(title="Proposal Agent") as ui:
        gr.Markdown("# Proposal Agent")
        with gr.Tabs() as tabs:
            with gr.Tab("ToR Analyzer", id="tor"):
                upload = gr.File(label="Tender / ToR (PDF, DOCX, scanned image)",
                                 file_types=[".pdf", ".docx", ".png", ".jpg", ".jpeg", ".tif", ".tiff"])
                go = gr.Button("Analyze", variant="primary")
                status = gr.Markdown()
                snapshot = gr.Markdown()
                with gr.Row():
                    xlsx_btn = gr.DownloadButton("Download XLSX", interactive=False)
                    docx_btn = gr.DownloadButton("Download DOCX", interactive=False)
                go.click(analyze_upload, upload, [status, snapshot, xlsx_btn, docx_btn])

            with gr.Tab("Tenders", id="tenders"):
                with gr.Row():
                    f_cat = gr.Dropdown([c for c in CATEGORIES if c != "Irrelevant"], multiselect=True, label="Category")
                    f_src = gr.Dropdown(["worldbank", "undp", "ungm", "adb", "egp", "newspapers"], multiselect=True, label="Source",
                                        allow_custom_value=True)
                with gr.Row():
                    f_from = gr.Textbox(label="Deadline from (YYYY-MM-DD)")
                    f_to = gr.Textbox(label="Deadline to (YYYY-MM-DD)")
                    f_hide = gr.Checkbox(True, label="Hide past deadlines")
                    refresh = gr.Button("Refresh", variant="primary")
                msg = gr.Markdown()
                table = gr.Dataframe(headers=TABLE_COLS, interactive=False, wrap=True)
                rows_state, sel_state = gr.State([]), gr.State(None)
                analyze_btn = gr.Button("Analyze ToR for selected tender")
                tender_status = gr.Markdown()
                inputs = [f_cat, f_src, f_from, f_to, f_hide]
                refresh.click(refresh_tenders, inputs, [table, rows_state, msg])
                table.select(select_row, rows_state, sel_state)
                analyze_btn.click(analyze_tender, sel_state, [status, snapshot, xlsx_btn, docx_btn, tabs]).then(
                    lambda s: s, status, tender_status)
    return ui
