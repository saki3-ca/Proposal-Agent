"""Text normalisation, sentence splitting and the page-aware SourceDoc.

SourceDoc.full is the single coordinate system used for quote verification and
coverage: it is the whitespace-normalised source text, page by page.
"""
import re
import unicodedata
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

_ZERO_WIDTH = dict.fromkeys(map(ord, "​‌‍⁠﻿­"), None)
_PUNCT_MAP = str.maketrans({
    "‘": "'", "’": "'", "“": '"', "”": '"',
    "–": "-", "—": "-", "−": "-", " ": " ", "•": "*",
})
_BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")


def normalize(text: str) -> str:
    """NFC, drop zero-width chars, unify quotes/dashes, collapse all whitespace to one space."""
    text = unicodedata.normalize("NFC", text or "").translate(_ZERO_WIDTH).translate(_PUNCT_MAP)
    return re.sub(r"\s+", " ", text).strip()


def ascii_digits(text: str) -> str:
    """Bangla digits -> ASCII digits (for parsing/matching only, never for display)."""
    return (text or "").translate(_BN_DIGITS)


_LIST_START = re.compile(r"^\s*(?:[•\-–*·o]\s+|\(?[0-9]{1,2}[.)]\s|\(?[a-zA-Z]\)\s|[ivx]{1,4}[.)]\s|\d+\.\d+)")
_SENT_END = re.compile(r"[.!?।:;]\s*$")


def split_units(page_text: str) -> List[str]:
    """Split a page into sentence-ish units without altering any characters.

    Hard line wraps inside a sentence are joined; bullets, numbered items, blank
    lines and sentence punctuation start a new unit.
    """
    units: List[str] = []
    buf = ""
    for line in (page_text or "").splitlines():
        if not line.strip():
            if buf:
                units.append(buf)
                buf = ""
            continue
        starts_new = bool(_LIST_START.match(line)) or (buf and _SENT_END.search(buf))
        if buf and starts_new:
            units.append(buf)
            buf = ""
        buf = f"{buf} {line.strip()}" if buf else line.strip()
    if buf:
        units.append(buf)
    out: List[str] = []
    for u in units:
        # split on sentence punctuation followed by whitespace (incl. Bangla danda)
        out.extend(p for p in re.split(r"(?<=[.!?।])\s+", u) if p.strip())
    return out


@dataclass
class Unit:
    page: int
    text: str
    start: int
    end: int


@dataclass
class SourceDoc:
    filename: str
    pages: Dict[int, str]              # page number -> raw text
    method: str = "unknown"
    units: List[Unit] = field(default_factory=list)
    full: str = ""
    _nospace: str = ""
    _nospace_map: List[int] = field(default_factory=list)
    _page_starts: List[Tuple[int, int]] = field(default_factory=list)

    def build(self) -> "SourceDoc":
        parts: List[str] = []
        pos = 0
        self.units, self._page_starts = [], []
        for pno in sorted(self.pages):
            first = True
            for u in split_units(self.pages[pno]):
                n = normalize(u)
                if not n:
                    continue
                if first:
                    self._page_starts.append((pos, pno))
                    first = False
                self.units.append(Unit(pno, n, pos, pos + len(n)))
                parts.append(n)
                pos += len(n) + 1
        self.full = " ".join(parts)
        chars, idx = [], []
        for i, ch in enumerate(self.full):
            if not ch.isspace():
                chars.append(ch)
                idx.append(i)
        self._nospace, self._nospace_map = "".join(chars), idx
        return self

    def page_at(self, offset: int) -> int:
        page = self._page_starts[0][1] if self._page_starts else 1
        for start, pno in self._page_starts:
            if start <= offset:
                page = pno
            else:
                break
        return page

    def locate(self, quote: str, claimed_page: Optional[int] = None) -> Optional[Tuple[int, int, int]]:
        """Find `quote` verbatim (whitespace-normalised). Returns (start, end, page) or None.

        Falls back to a whitespace-insensitive match because PDF extractors sometimes
        add or drop spaces; the characters themselves must still match exactly.
        """
        nq = normalize(quote)
        if len(nq) < 12:
            return None
        hits = [m.start() for m in re.finditer(re.escape(nq), self.full)]
        spans = [(h, h + len(nq)) for h in hits]
        if not spans:
            nq2 = re.sub(r"\s+", "", nq)
            for m in re.finditer(re.escape(nq2), self._nospace):
                s = self._nospace_map[m.start()]
                e = self._nospace_map[m.end() - 1] + 1
                spans.append((s, e))
        if not spans:
            return None
        if claimed_page is not None:
            for s, e in spans:
                if self.page_at(s) == claimed_page:
                    return s, e, claimed_page
        s, e = spans[0]
        return s, e, self.page_at(s)
