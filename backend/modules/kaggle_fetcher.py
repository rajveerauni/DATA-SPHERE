"""Fetch datasets from Kaggle using the official API."""

import os
import tempfile
import pandas as pd

from config import Config


def _inject_credentials() -> None:
    """Set Kaggle credentials in environment before any kaggle import."""
    os.environ["KAGGLE_USERNAME"] = Config.KAGGLE_USERNAME
    os.environ["KAGGLE_KEY"] = Config.KAGGLE_KEY


def fetch_kaggle_dataset(dataset_key: str) -> pd.DataFrame:
    """Download and return a Kaggle dataset as a DataFrame.

    Credentials must be in KAGGLE_USERNAME / KAGGLE_KEY env vars (or .env).
    They are injected before the kaggle module is imported to satisfy
    kaggle >=2.0 which validates credentials at import time.

    Args:
        dataset_key: One of the keys defined in Config.KAGGLE_DATASETS.

    Raises:
        ValueError: On missing credentials or unknown dataset key.
        RuntimeError: On download or parse failure.
    """
    if not Config.KAGGLE_USERNAME or not Config.KAGGLE_KEY:
        raise ValueError("Kaggle API key missing or invalid")

    if dataset_key not in Config.KAGGLE_DATASETS:
        raise ValueError(
            f"Unknown Kaggle dataset '{dataset_key}'. "
            f"Available: {list(Config.KAGGLE_DATASETS.keys())}"
        )

    # Inject before import — kaggle >=2.0 authenticates on module load
    _inject_credentials()

    try:
        import kaggle  # noqa: PLC0415
    except Exception as exc:
        raise ValueError(f"Kaggle authentication failed: {exc}") from exc

    slug = Config.KAGGLE_DATASETS[dataset_key]

    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            kaggle.api.dataset_download_files(slug, path=tmpdir, unzip=True)
        except Exception as exc:
            raise RuntimeError(
                f"Failed to download Kaggle dataset '{slug}': {exc}"
            ) from exc

        csv_files = [f for f in os.listdir(tmpdir) if f.endswith(".csv")]
        if not csv_files:
            raise RuntimeError(f"No CSV files found after downloading '{slug}'")

        # Prefer train.csv if present, otherwise take the first file
        target = next((f for f in csv_files if "train" in f.lower()), csv_files[0])
        df = pd.read_csv(os.path.join(tmpdir, target))

    if df.empty:
        raise RuntimeError("Downloaded dataset is empty")

    return df


def get_available_datasets() -> list[str]:
    """Return list of configured Kaggle dataset keys."""
    return list(Config.KAGGLE_DATASETS.keys())
