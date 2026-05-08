from __future__ import annotations

import json
import time
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.config.settings import settings


# Simple in-process cache (good enough for dev/demo)
_cache: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_ttl_seconds = 300


def _get_json(url: str, headers: dict[str, str] | None = None) -> dict[str, Any]:
    req = Request(url, headers=headers or {})
    with urlopen(req, timeout=20) as resp:  # nosec - external URL is provider API
        raw = resp.read().decode("utf-8")
    return json.loads(raw)


def fetch_news(*, category: str = "All") -> list[dict[str, Any]]:
    if not settings.news_api_key:
        raise ValueError("News API key not configured")

    key = f"news:{category}"
    now = time.time()
    cached = _cache.get(key)
    if cached and now - cached[0] < _ttl_seconds:
        return cached[1]

    # NewsAPI.org style endpoint
    q = {
        "apiKey": settings.news_api_key,
        "pageSize": "30",
        "language": "en",
    }
    if category and category != "All":
        # Map UI categories to keyword query
        q["q"] = category
    else:
        q["q"] = "technology OR education OR AI OR science"

    data = _get_json(f"https://newsapi.org/v2/everything?{urlencode(q)}")
    articles = data.get("articles") or []

    out: list[dict[str, Any]] = []
    for idx, a in enumerate(articles, start=1):
        title = str(a.get("title") or "")
        if not title:
            continue
        out.append(
            {
                "id": idx,
                "title": title,
                "summary": str(a.get("description") or a.get("content") or "")[:240],
                "category": category if category != "All" else "Technology",
                "image": str(a.get("urlToImage") or ""),
                "url": str(a.get("url") or ""),
            }
        )

    _cache[key] = (now, out)
    return out

