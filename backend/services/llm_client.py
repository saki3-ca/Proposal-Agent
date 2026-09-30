"""Thin, config-driven LLM helper for the ToR analyzer and tender classifier.

Reuses AiProviderService for the actual HTTP calls. Model names come from
config/models.yaml. Every call is logged (logger + logs/model_usage.jsonl) so each
output can be traced to the model that produced it.
"""
import json
import logging
import re
import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import yaml

from backend.services.ai_provider import AiProviderService

logger = logging.getLogger("llm_client")

ROOT = Path(__file__).resolve().parents[2]
MODELS_CONFIG = ROOT / "config" / "models.yaml"
USAGE_LOG = ROOT / "logs" / "model_usage.jsonl"


def load_task_config(task: str) -> Dict[str, Any]:
    with open(MODELS_CONFIG, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    if task not in cfg.get("tasks", {}):
        raise KeyError(f"Task '{task}' is not defined in {MODELS_CONFIG}")
    return cfg["tasks"][task]


def parse_json_loose(raw: str) -> Optional[Any]:
    """Parse JSON from an LLM reply, tolerating code fences and trailing commas."""
    if not raw or not raw.strip():
        return None
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.IGNORECASE).strip()
    candidates = [text]
    s, e = text.find("{"), text.rfind("}")
    if s != -1 and e > s:
        candidates.append(text[s:e + 1])
    s, e = text.find("["), text.rfind("]")
    if s != -1 and e > s:
        candidates.append(text[s:e + 1])
    for cand in candidates:
        for attempt in (cand, re.sub(r",\s*([}\]])", r"\1", cand)):
            try:
                return json.loads(attempt)
            except Exception:
                continue
    return None


def _log_usage(record: Dict[str, Any]) -> None:
    logger.info("LLM call: %s", record)
    try:
        USAGE_LOG.parent.mkdir(parents=True, exist_ok=True)
        with open(USAGE_LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except OSError as exc:  # a read-only filesystem must never break a run
        logger.warning("Could not write model usage log: %s", exc)


async def chat_json(task: str, system: str, user: str, purpose: str = "") -> Tuple[Optional[Any], Dict[str, Any]]:
    """Call the task's primary model, then its backup. Returns (parsed_json_or_None, meta).

    meta always says which provider/model produced the output (or why none did).
    """
    cfg = load_task_config(task)
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    attempts = [(cfg["provider"], cfg["model"])]
    if cfg.get("backup_provider"):
        attempts.append((cfg["backup_provider"], cfg["backup_model"]))

    meta: Dict[str, Any] = {"task": task, "purpose": purpose, "provider": None, "model": None,
                            "fallback_used": False, "error": None}
    for idx, (provider, model) in enumerate(attempts):
        started = time.time()
        res = await AiProviderService._execute_provider(
            provider, messages, model=model,
            temperature=cfg.get("temperature", 0.0), max_tokens=cfg.get("max_tokens", 4096))
        stamp = time.strftime("%Y-%m-%dT%H:%M:%S")
        if not res.get("success"):
            meta["error"] = res.get("error")
            _log_usage({"ts": stamp, "task": task, "purpose": purpose, "provider": provider,
                        "model": model, "ok": False, "error": str(res.get("error"))[:300]})
            continue
        parsed = parse_json_loose(res.get("content", ""))
        meta.update({"provider": res.get("provider", provider), "model": res.get("model", model),
                     "fallback_used": idx > 0, "error": None if parsed is not None else "unparseable JSON"})
        _log_usage({"ts": stamp, "task": task, "purpose": purpose, "provider": meta["provider"],
                    "model": meta["model"], "ok": parsed is not None,
                    "seconds": round(time.time() - started, 2)})
        if parsed is not None:
            return parsed, meta
    return None, meta
