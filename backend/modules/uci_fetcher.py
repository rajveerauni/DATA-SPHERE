"""Fetch classic ML datasets from the UCI ML Repository."""

import pandas as pd

from config import Config


def fetch_uci_dataset(dataset_key: str) -> pd.DataFrame:
    """Download a UCI dataset and return features + target merged.

    Args:
        dataset_key: One of the keys in Config.UCI_DATASETS.

    Raises:
        ValueError: Unknown key or empty result.
        RuntimeError: Download or merge failure.
    """
    if dataset_key not in Config.UCI_DATASETS:
        raise ValueError(
            f"Unknown UCI dataset '{dataset_key}'. "
            f"Available: {list(Config.UCI_DATASETS.keys())}"
        )

    dataset_id = Config.UCI_DATASETS[dataset_key]

    try:
        from ucimlrepo import fetch_ucirepo  # noqa: PLC0415
        dataset = fetch_ucirepo(id=dataset_id)
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch UCI dataset id={dataset_id}: {exc}") from exc

    features = dataset.data.features
    targets = dataset.data.targets

    if features is None or features.empty:
        raise ValueError(f"UCI dataset '{dataset_key}' returned empty features")

    if targets is not None and not targets.empty:
        df = pd.concat([features.reset_index(drop=True), targets.reset_index(drop=True)], axis=1)
    else:
        df = features.reset_index(drop=True)

    return df


def get_available_datasets() -> list[str]:
    """Return list of configured UCI dataset keys."""
    return list(Config.UCI_DATASETS.keys())
