from __future__ import annotations

import json
import time
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.config.settings import settings


_cache: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_ttl_seconds = 300


def _get_json(url: str, headers: dict[str, str] | None = None) -> dict[str, Any]:
    req = Request(url, headers=headers or {})
    with urlopen(req, timeout=20) as resp:  # nosec - external URL is provider API
        raw = resp.read().decode("utf-8")
    return json.loads(raw)


def fetch_jobs(*, q: str = "", location: str = "", job_type: str = "") -> list[dict[str, Any]]:
    if not settings.jobs_api_key:
        raise ValueError("Jobs API key not configured")

    key = f"jobs:{q}:{location}:{job_type}"
    now = time.time()
    cached = _cache.get(key)
    if cached and now - cached[0] < _ttl_seconds:
        return cached[1]

    # Adzuna-style endpoint (as an example). If your key/provider differs, we’ll adapt the URL/fields.
    # This implementation is intentionally provider-agnostic-ish and can be swapped later.
    params = {
        "app_id": settings.jobs_api_id,
        "app_key": settings.jobs_api_key,
        "results_per_page": 25,
        "what": q or "software",
    }
    if location:
        params["where"] = location

    data = _get_json(f"https://api.adzuna.com/v1/api/jobs/us/search/1?{urlencode(params)}")
    results = data.get("results") or []

    out: list[dict[str, Any]] = []
    for idx, r in enumerate(results, start=1):
        out.append(
            {
                "id": idx,
                "job_id": str(r.get("id") or ""),
                "title": str(r.get("title") or ""),
                "company": str((r.get("company") or {}).get("display_name") or ""),
                "location": str((r.get("location") or {}).get("display_name") or ""),
                "type": job_type or "Full-time",
                "salary": str(r.get("salary_is_predicted") and "Market" or ""),
                "description": str(r.get("description") or "")[:260],
                "url": str(r.get("redirect_url") or ""),
                "saved": False,
            }
        )

    _cache[key] = (now, out)
    return out

