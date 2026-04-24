"""DataSphere Flask API — entry point."""

import io
import logging
import os
import sys

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

sys.path.insert(0, os.path.dirname(__file__))

from config import Config
from modules import datagov_fetcher, kaggle_fetcher, uci_fetcher, worldbank_fetcher
from modules.chart_engine import build_chart
from modules.data_processor import dataframe_to_response, process

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _err(msg: str, detail: str = "", code: int = 400):
    """Return a JSON error response."""
    logger.error("API error [%s]: %s | %s", code, msg, detail)
    return jsonify({"error": msg, "detail": detail}), code


@app.after_request
def _log_response(response):
    logger.info("← %s  %s  %s", response.status_code, request.method, request.path)
    return response


@app.before_request
def _log_request():
    logger.info("→ %s  %s  args=%s", request.method, request.path, dict(request.args))


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.route("/api/sources", methods=["GET"])
def get_sources():
    """Return all available data sources and their dataset keys."""
    try:
        return jsonify(
            {
                "kaggle": {
                    "name": "Kaggle",
                    "icon": "kaggle",
                    "description": "Competition & community ML datasets",
                    "requires_auth": True,
                    "datasets": kaggle_fetcher.get_available_datasets(),
                    "dataset_labels": {
                        "titanic": "Titanic Survival",
                        "happiness": "World Happiness Report 2021",
                        "netflix": "Netflix Shows",
                    },
                },
                "worldbank": {
                    "name": "World Bank",
                    "icon": "worldbank",
                    "description": "Global development indicators (2000–2023)",
                    "requires_auth": False,
                    "datasets": list(worldbank_fetcher.get_available_indicators().keys()),
                    "dataset_labels": worldbank_fetcher.get_available_indicators(),
                },
                "uci": {
                    "name": "UCI ML Repository",
                    "icon": "uci",
                    "description": "Classic benchmark ML datasets",
                    "requires_auth": False,
                    "datasets": uci_fetcher.get_available_datasets(),
                    "dataset_labels": {
                        "iris": "Iris Flowers",
                        "breast_cancer": "Breast Cancer Wisconsin",
                        "heart_disease": "Heart Disease",
                    },
                },
                "datagov": {
                    "name": "Data.gov / CDC",
                    "icon": "datagov",
                    "description": "US government open data (CDC Socrata)",
                    "requires_auth": False,
                    "datasets": datagov_fetcher.get_available_datasets(),
                    "dataset_labels": datagov_fetcher.get_dataset_labels(),
                },
            }
        ), 200
    except Exception as exc:
        return _err("Failed to load sources", str(exc), 500)


@app.route("/api/fetch/<source>/<dataset>", methods=["GET"])
def fetch_dataset(source: str, dataset: str):
    """Fetch a dataset from a given source and return standard schema."""
    try:
        fetchers = {
            "kaggle": kaggle_fetcher.fetch_kaggle_dataset,
            "worldbank": worldbank_fetcher.fetch_worldbank_indicator,
            "uci": uci_fetcher.fetch_uci_dataset,
            "datagov": datagov_fetcher.fetch_datagov_dataset,
        }

        if source not in fetchers:
            return _err(f"Unknown source '{source}'", "", 400)

        df: pd.DataFrame = fetchers[source](dataset)

        if df is None or df.empty:
            return _err("Dataset is empty", "", 404)

        return jsonify(dataframe_to_response(df)), 200

    except ValueError as exc:
        return _err(str(exc), "", 400)
    except RuntimeError as exc:
        return _err("Fetch failed", str(exc), 502)
    except Exception as exc:
        return _err("Unexpected error", str(exc), 500)


@app.route("/api/upload", methods=["POST"])
def upload_file():
    """Accept CSV/XLSX multipart upload and return standard schema."""
    try:
        if "file" not in request.files:
            return _err("No file field in request", "", 400)

        file = request.files["file"]
        if not file.filename:
            return _err("Empty filename", "", 400)

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in (".csv", ".xlsx", ".xls"):
            return _err("Invalid file type. Only CSV and XLSX supported.", ext, 400)

        raw = file.read()
        if not raw:
            return _err("File is empty", "", 400)

        df = pd.read_csv(io.BytesIO(raw)) if ext == ".csv" else pd.read_excel(io.BytesIO(raw))

        if len(df.columns) > 50:
            return _err(
                f"Too many columns ({len(df.columns)}). Maximum allowed is 50.", "", 400
            )
        if df.empty:
            return _err("File contains no data rows", "", 400)

        return jsonify(dataframe_to_response(df)), 200

    except Exception as exc:
        return _err("Failed to process file", str(exc), 500)


@app.route("/api/transform", methods=["POST"])
def transform_data():
    """Apply a transformation operation to the provided rows."""
    try:
        body = request.get_json(silent=True) or {}
        data = body.get("data")
        operation = body.get("operation")
        params = body.get("params", {})

        if not data:
            return _err("'data' field is required", "", 400)
        if not operation:
            return _err("'operation' field is required", "", 400)

        df = pd.DataFrame(data)
        result = process(df, operation, params)
        return jsonify(dataframe_to_response(result)), 200

    except ValueError as exc:
        return _err(str(exc), "", 400)
    except Exception as exc:
        return _err("Transform failed", str(exc), 500)


@app.route("/api/chart", methods=["POST"])
def generate_chart():
    """Build and return a Plotly figure JSON from the provided data."""
    try:
        body = request.get_json(silent=True) or {}
        data = body.get("data")
        chart_type = body.get("chart_type", "bar")
        x = body.get("x")
        y = body.get("y")
        color = body.get("color") or None
        title = body.get("title", "")

        if not data:
            return _err("'data' field is required", "", 400)
        if not x and chart_type != "heatmap":
            return _err("'x' axis column is required", "", 400)

        df = pd.DataFrame(data)
        fig = build_chart(df, chart_type, x, y, color, title)
        return jsonify({"figure": fig.to_json()}), 200

    except ValueError as exc:
        return _err(str(exc), "", 400)
    except Exception as exc:
        return _err("Chart generation failed", str(exc), 500)


# ── Dev server ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=Config.FLASK_PORT,
        debug=Config.FLASK_ENV == "development",
    )
