"""Offline tests for tender classification / filtering / dedupe."""
import asyncio

from backend.tenders.classify import bangladesh_status, classify_all, keyword_pass
from backend.tenders.run import dedupe


def test_keyword_pass_specific_and_bangla():
    assert keyword_pass("Selection of Firm for Statutory Audit of FY 2025-26", "") == ("Statutory Audit", False)
    assert keyword_pass("Internal Audit services", "")[0] == "Internal Audit"
    assert keyword_pass("কারিগরি নিরীক্ষা", "")[1] is True          # generic Bangla audit word -> ambiguous, LLM decides
    assert keyword_pass("Forensic audit of provident fund", "")[0] == "Forensic Audit"
    assert keyword_pass("Supply of office furniture", "price inclusive of VAT and income tax") == (None, False)
    assert keyword_pass("Construction of bridge", "bid evaluation committee and evaluation of works") == (None, False)  # 'evaluation' is not 'valuation'


def test_classify_without_llm_key_keeps_ambiguous_for_review(monkeypatch):
    for k in ("GROQ_API_KEY", "GEMINI_API_KEY", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"):
        monkeypatch.delenv(k, raising=False)
    ts = [{"title": "Consultancy services for project", "text": ""}, {"title": "Supply of laptops", "text": ""},
          {"title": "Tax advisory services", "text": ""}]
    out = asyncio.run(classify_all(ts))
    assert [t["category"] for t in out] == ["Other-Relevant", "Irrelevant", "Tax & VAT"]
    assert out[0]["classified_by"].startswith("keyword-ambiguous")


def test_bangladesh_filter():
    t = {"title": "Audit of X", "entity": "", "text": "Dhaka office", "country": None}
    assert bangladesh_status(t, False) == "bangladesh"
    assert bangladesh_status({"title": "Audit", "text": "International competitive bidding, open to all eligible countries"}, False) == "open_international"
    assert bangladesh_status({"title": "Audit in Kenya", "text": "National bidding only"}, False) is None


def test_dedupe_across_sources():
    a = {"title": "Audit of  ABC Ltd.", "entity": "ABC", "deadline": "2026-10-10", "source_id": "x"}
    b = {"title": "audit of abc ltd", "entity": "abc", "deadline": "2026-10-10", "source_id": "y"}
    c = {"title": "audit of abc ltd", "entity": "abc", "deadline": "2026-11-10", "source_id": "y"}
    assert len(dedupe([a, b, c])) == 2


def test_worldbank_adapter_parses_notice(monkeypatch):
    from backend.tenders import adapters

    class R:
        def json(self):
            return {"procnotices": [{"id": "OP1", "bid_description": "Consulting services for financial audit", "notice_type": "Request for Expressions of Interest",
                                     "submission_deadline_date": "2026-11-05T00:00:00Z", "noticedate": "2026-10-01T00:00:00Z",
                                     "contact_organization": "LGED", "project_ctry_name": "Bangladesh"}]}
    monkeypatch.setattr(adapters, "polite_get", lambda *a, **k: R())
    out = adapters.fetch_worldbank({"url": "http://x", "params": {}}, "ua", 0)
    assert out[0]["deadline"] == "2026-11-05" and out[0]["entity"] == "LGED" and out[0]["published"] == "2026-10-01"
