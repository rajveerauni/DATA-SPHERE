"""Fetch World Bank development indicators via the public REST API."""

import requests
import pandas as pd

from config import Config

_WB_BASE = Config.WORLDBANK_API_BASE
_START_YEAR = 2000
_END_YEAR = 2023
_PAGE_SIZE = 5000


def fetch_worldbank_indicator(indicator_code: str) -> pd.DataFrame:
    """Return a tidy DataFrame for one World Bank indicator.

    Columns: country, year, indicator, value

    Args:
        indicator_code: A key from Config.WORLDBANK_INDICATORS (e.g. 'NY.GDP.MKTP.CD').

    Raises:
        ValueError: Unknown indicator code or empty result.
        RuntimeError: API request failure.
    """
    if indicator_code not in Config.WORLDBANK_INDICATORS:
        raise ValueError(
            f"Unknown indicator '{indicator_code}'. "
            f"Available: {list(Config.WORLDBANK_INDICATORS.keys())}"
        )

    url = f"{_WB_BASE}/country/all/indicator/{indicator_code}"
    params = {
        "format": "json",
        "date": f"{_START_YEAR}:{_END_YEAR}",
        "per_page": _PAGE_SIZE,
    }

    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise RuntimeError(f"World Bank API request failed: {exc}") from exc

    payload = response.json()

    # World Bank wraps response as [metadata_dict, data_list]
    if not isinstance(payload, list) or len(payload) < 2 or not payload[1]:
        raise ValueError(f"No data returned for indicator '{indicator_code}'")

    records = payload[1]
    rows = []
    for rec in records:
        if rec.get("value") is not None:
            rows.append(
                {
                    "country": rec["country"]["value"],
                    "year": rec["date"],
                    "indicator": Config.WORLDBANK_INDICATORS[indicator_code],
                    "value": float(rec["value"]),
                }
            )

    df = pd.DataFrame(rows)
    if df.empty:
        raise ValueError(f"All values null for indicator '{indicator_code}'")

    return df[["country", "year", "indicator", "value"]]


def get_available_indicators() -> dict:
    """Return the indicator code → label mapping."""
    return Config.WORLDBANK_INDICATORS
