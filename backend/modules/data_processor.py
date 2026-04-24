"""Data transformation operations applied to pandas DataFrames."""

import numpy as np
import pandas as pd


# ── Standard API response schema ─────────────────────────────────────────────

def dataframe_to_response(df: pd.DataFrame) -> dict:
    """Serialize a DataFrame to the standard API response schema.

    Returns:
        dict with keys: columns, rows, shape, dtypes, nulls, summary
    """
    if df is None or df.empty:
        raise ValueError("DataFrame is empty")

    dtypes = {col: str(df[col].dtype) for col in df.columns}
    nulls = {col: int(df[col].isnull().sum()) for col in df.columns}

    summary: dict = {}
    for col in df.select_dtypes(include=[np.number]).columns:
        series = df[col].dropna()
        summary[col] = {
            "min": float(series.min()) if len(series) else None,
            "max": float(series.max()) if len(series) else None,
            "mean": float(series.mean()) if len(series) else None,
            "std": float(series.std()) if len(series) else None,
        }

    safe_df = df.head(500).replace({np.nan: None, np.inf: None, -np.inf: None})

    return {
        "columns": df.columns.tolist(),
        "rows": safe_df.to_dict(orient="records"),
        "shape": list(df.shape),
        "dtypes": dtypes,
        "nulls": nulls,
        "summary": summary,
    }


# ── Individual transform operations ──────────────────────────────────────────

def _apply_filter(df: pd.DataFrame, params: dict) -> pd.DataFrame:
    """Filter rows by one or more column conditions.

    params keys:
        filters: list of {column, operator, value}
    """
    for f in params.get("filters", []):
        col = f.get("column")
        op = f.get("operator", "eq")
        val = f.get("value")

        if col not in df.columns:
            raise ValueError(f"Column '{col}' not found")

        if op == "eq":
            df = df[df[col] == val]
        elif op == "ne":
            df = df[df[col] != val]
        elif op == "gt":
            df = df[df[col] > val]
        elif op == "lt":
            df = df[df[col] < val]
        elif op == "gte":
            df = df[df[col] >= val]
        elif op == "lte":
            df = df[df[col] <= val]
        elif op == "contains":
            df = df[df[col].astype(str).str.contains(str(val), na=False, case=False)]
        elif op == "in":
            df = df[df[col].isin(val)]
        elif op == "between":
            df = df[df[col].between(float(val[0]), float(val[1]))]
        else:
            raise ValueError(f"Unknown filter operator '{op}'")

    return df


def _apply_dropna(df: pd.DataFrame, params: dict) -> pd.DataFrame:
    """Drop rows that contain null values.

    params keys:
        subset: list of columns to check (None = all columns)
    """
    subset = params.get("subset") or None
    return df.dropna(subset=subset)


def _apply_groupby(df: pd.DataFrame, params: dict) -> pd.DataFrame:
    """Group by one or more columns and aggregate.

    params keys:
        columns: list of columns to group by
        agg_column: target column to aggregate (None = all numeric)
        agg_func: mean | sum | count | min | max
    """
    group_cols = params.get("columns", [])
    agg_col = params.get("agg_column")
    agg_func = params.get("agg_func", "mean")

    valid_funcs = {"mean", "sum", "count", "min", "max"}
    if agg_func not in valid_funcs:
        raise ValueError(f"Unknown agg_func '{agg_func}'. Use one of {valid_funcs}")
    if not group_cols:
        raise ValueError("groupby requires at least one column in 'columns'")

    if agg_col:
        if agg_col not in df.columns:
            raise ValueError(f"agg_column '{agg_col}' not found")
        return df.groupby(group_cols)[agg_col].agg(agg_func).reset_index()

    numeric_cols = [
        c for c in df.select_dtypes(include=[np.number]).columns if c not in group_cols
    ]
    if not numeric_cols:
        raise ValueError("No numeric columns available to aggregate")
    return df.groupby(group_cols)[numeric_cols].agg(agg_func).reset_index()


def _apply_normalize(df: pd.DataFrame, params: dict) -> pd.DataFrame:
    """Min-max normalize numeric columns to [0, 1].

    params keys:
        columns: list of columns to normalize (None = all numeric)
    """
    cols = params.get("columns") or df.select_dtypes(include=[np.number]).columns.tolist()
    result = df.copy()
    for col in cols:
        if col not in result.columns:
            raise ValueError(f"Column '{col}' not found")
        if not pd.api.types.is_numeric_dtype(result[col]):
            continue
        col_min = result[col].min()
        col_max = result[col].max()
        if col_max != col_min:
            result[col] = (result[col] - col_min) / (col_max - col_min)
        else:
            result[col] = 0.0
    return result


def _apply_correlation(df: pd.DataFrame, params: dict) -> pd.DataFrame:
    """Return the Pearson correlation matrix for numeric columns.

    params: unused (kept for uniform signature)
    """
    numeric = df.select_dtypes(include=[np.number])
    if numeric.empty:
        raise ValueError("No numeric columns found for correlation")
    return numeric.corr().reset_index().rename(columns={"index": "column"})


# ── Dispatch table ────────────────────────────────────────────────────────────

_OPERATIONS = {
    "filter": _apply_filter,
    "dropna": _apply_dropna,
    "groupby": _apply_groupby,
    "normalize": _apply_normalize,
    "correlation": _apply_correlation,
}


def process(df: pd.DataFrame, operation: str, params: dict) -> pd.DataFrame:
    """Apply a named transformation to df and return the result.

    Args:
        df: Input DataFrame.
        operation: One of filter | dropna | groupby | normalize | correlation.
        params: Operation-specific parameters dict.

    Raises:
        ValueError: Unknown operation or bad params.
    """
    if operation not in _OPERATIONS:
        raise ValueError(
            f"Unknown operation '{operation}'. Available: {list(_OPERATIONS.keys())}"
        )
    return _OPERATIONS[operation](df, params)
