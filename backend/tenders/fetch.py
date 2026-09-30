"""Polite HTTP: identifies itself, honours robots.txt, rate-limits per host."""
import os
import time
import urllib.robotparser
from typing import Dict, Optional, Tuple
from urllib.parse import urlparse

import httpx

_robots: Dict[str, Optional[urllib.robotparser.RobotFileParser]] = {}
_last_hit: Dict[str, float] = {}


class Skip(Exception):
    """Raised when a source must be skipped (robots disallow, unreachable, login wall)."""


def user_agent(cfg_ua: str) -> str:
    contact = os.getenv("TENDERBOT_CONTACT", "").strip()
    return cfg_ua.replace("TENDERBOT_CONTACT", contact or "unset")


def _robots_for(url: str, ua: str) -> Optional[urllib.robotparser.RobotFileParser]:
    host = urlparse(url)
    base = f"{host.scheme}://{host.netloc}"
    if base in _robots:
        return _robots[base]
    rp = urllib.robotparser.RobotFileParser()
    try:
        r = httpx.get(base + "/robots.txt", headers={"User-Agent": ua}, timeout=20, follow_redirects=True)
        if r.status_code in (401, 403):
            rp.disallow_all = True      # stdlib semantics: access to robots.txt denied -> treat as disallow
        elif r.status_code >= 400:
            rp.allow_all = True         # no robots.txt -> allowed
        else:
            rp.parse(r.text.splitlines())
    except httpx.HTTPError as exc:
        raise Skip(f"robots.txt unreachable ({exc.__class__.__name__}: {exc})")
    _robots[base] = rp
    return rp


def polite_get(url: str, ua: str, delay: float = 2.0, params: Optional[dict] = None,
               check_robots: bool = True) -> httpx.Response:
    if check_robots:
        rp = _robots_for(url, ua)
        if rp is not None and not rp.can_fetch(ua, url):
            raise Skip(f"robots.txt disallows {url}")
    host = urlparse(url).netloc
    wait = delay - (time.time() - _last_hit.get(host, 0))
    if wait > 0:
        time.sleep(wait)
    try:
        r = httpx.get(url, headers={"User-Agent": ua, "Accept": "*/*"}, params=params, timeout=30, follow_redirects=True)
    except httpx.HTTPError as exc:
        raise Skip(f"unreachable ({exc.__class__.__name__}: {exc})")
    _last_hit[host] = time.time()
    if r.status_code in (401, 403):
        raise Skip(f"HTTP {r.status_code} (login or access required)")
    if r.status_code >= 400:
        raise Skip(f"HTTP {r.status_code}")
    final = str(r.url).lower()
    if any(k in final for k in ("/login", "/signin", "/sign-in")):
        raise Skip("redirected to a login page")
    return r
