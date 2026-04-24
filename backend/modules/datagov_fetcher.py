"""Fetch US government open datasets via Socrata / CDC open data APIs.

Note: catalog.data.gov CKAN search is deprecated. These datasets are served
directly via Socrata endpoints on data.cdc.gov (no API key required).
"""

import pandas as pd
import requests

_TIMEOUT = 30
_ROW_LIMIT = 500
_HEADERS = {"User-Agent": "DataSphere/1.0 (portfolio project)"}

# Verified working Socrata endpoints (as of 2026)
_ENDPOINTS: dict[str, dict] = {
    "nutrition_obesity": {
        "label": "CDC Nutrition, Physical Activity & Obesity",
        "url": "https://data.cdc.gov/resource/hn4x-zwk7.json",
        "description": "BRFSS data on adult obesity, diet, and physical activity by state",
    },
    "covid_vaccination": {
        "label": "CDC COVID-19 Vaccinations by County",
        "url": "https://data.cdc.gov/resource/8xkx-amqh.json",
        "description": "COVID-19 vaccination coverage by US county (CDC)",
    },
}


def fetch_datagov_dataset(dataset_key: str) -> pd.DataFrame:
    """Fetch a US government open dataset by key.

    Args:
        dataset_key: One of the keys in the _ENDPOINTS dict.

    Raises:
        ValueError: Unknown dataset key.
        RuntimeError: HTTP or parse failure.
    """
    if dataset_key not in _ENDPOINTS:
        raise ValueError(
            f"Unknown dataset '{dataset_key}'. "
            f"Available: {list(_ENDPOINTS.keys())}"
        )

    endpoint = _ENDPOINTS[dataset_key]
    params = {"$limit": _ROW_LIMIT}

    try:
        response = requests.get(
            endpoint["url"], params=params, headers=_HEADERS, timeout=_TIMEOUT
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise RuntimeError(
            f"Failed to fetch '{dataset_key}' from {endpoint['url']}: {exc}"
        ) from exc

    records = response.json()
    if not records:
        raise ValueError(f"Dataset '{dataset_key}' returned empty records")

    df = pd.DataFrame(records)

    # Drop Socrata geometry columns which are nested dicts
    geo_cols = [c for c in df.columns if df[c].apply(lambda x: isinstance(x, dict)).any()]
    df.drop(columns=geo_cols, inplace=True, errors="ignore")

    return df


def get_available_datasets() -> list[str]:
    """Return list of configured dataset keys."""
    return list(_ENDPOINTS.keys())


def get_dataset_labels() -> dict[str, str]:
    """Return key → human label mapping."""
    return {k: v["label"] for k, v in _ENDPOINTS.items()}
