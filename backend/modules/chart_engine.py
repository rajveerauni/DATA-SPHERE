"""Generate Plotly figures from DataFrames."""

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

_TEMPLATE = "plotly_dark"

_LAYOUT_OVERRIDES = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(color="#e2e8f0", family="Inter, sans-serif"),
    margin=dict(l=50, r=30, t=60, b=50),
)


def _finalize(fig: go.Figure) -> go.Figure:
    """Apply consistent dark-theme layout overrides."""
    fig.update_layout(**_LAYOUT_OVERRIDES)
    return fig


def _bar(df: pd.DataFrame, x: str, y: str, color: str | None, title: str) -> go.Figure:
    """Bar chart."""
    return _finalize(px.bar(df, x=x, y=y, color=color, title=title, template=_TEMPLATE))


def _line(df: pd.DataFrame, x: str, y: str, color: str | None, title: str) -> go.Figure:
    """Line chart."""
    return _finalize(px.line(df, x=x, y=y, color=color, title=title, template=_TEMPLATE))


def _scatter(df: pd.DataFrame, x: str, y: str, color: str | None, title: str) -> go.Figure:
    """Scatter plot."""
    return _finalize(
        px.scatter(df, x=x, y=y, color=color, title=title, template=_TEMPLATE)
    )


def _histogram(df: pd.DataFrame, x: str, y: str | None, color: str | None, title: str) -> go.Figure:
    """Histogram (y ignored)."""
    return _finalize(px.histogram(df, x=x, color=color, title=title, template=_TEMPLATE))


def _heatmap(df: pd.DataFrame, x: str | None, y: str | None, color: str | None, title: str) -> go.Figure:
    """Correlation heatmap — uses all numeric columns."""
    numeric = df.select_dtypes(include=[np.number])
    if numeric.empty:
        raise ValueError("No numeric columns available for heatmap")
    corr = numeric.corr()
    return _finalize(
        px.imshow(
            corr,
            text_auto=".2f",
            title=title or "Correlation Heatmap",
            template=_TEMPLATE,
            color_continuous_scale="RdBu_r",
            zmin=-1,
            zmax=1,
        )
    )


def _box(df: pd.DataFrame, x: str, y: str, color: str | None, title: str) -> go.Figure:
    """Box plot."""
    return _finalize(px.box(df, x=x, y=y, color=color, title=title, template=_TEMPLATE))


def _pie(df: pd.DataFrame, x: str, y: str | None, color: str | None, title: str) -> go.Figure:
    """Pie chart — x=names, y=values."""
    return _finalize(px.pie(df, names=x, values=y, title=title, template=_TEMPLATE))


_BUILDERS = {
    "bar": _bar,
    "line": _line,
    "scatter": _scatter,
    "histogram": _histogram,
    "heatmap": _heatmap,
    "box": _box,
    "pie": _pie,
}


def build_chart(
    df: pd.DataFrame,
    chart_type: str,
    x: str | None,
    y: str | None,
    color: str | None = None,
    title: str = "",
) -> go.Figure:
    """Dispatch to the appropriate chart builder and return a Plotly Figure.

    Args:
        df: Data to visualize.
        chart_type: One of bar | line | scatter | histogram | heatmap | box | pie.
        x: Column for the x-axis (or names for pie / heatmap can be None).
        y: Column for the y-axis (can be None for histogram/heatmap).
        color: Optional column to use for color grouping.
        title: Chart title string.

    Raises:
        ValueError: Unknown chart_type or missing required columns.
    """
    if chart_type not in _BUILDERS:
        raise ValueError(
            f"Unknown chart_type '{chart_type}'. Available: {list(_BUILDERS.keys())}"
        )

    # Validate columns for chart types that require them
    needs_x = chart_type not in ("heatmap",)
    needs_y = chart_type in ("bar", "line", "scatter", "box", "pie")

    if needs_x and x and x not in df.columns:
        raise ValueError(f"Column '{x}' not found in dataset")
    if needs_y and y and y not in df.columns:
        raise ValueError(f"Column '{y}' not found in dataset")
    if color and color not in df.columns:
        raise ValueError(f"Color column '{color}' not found in dataset")

    return _BUILDERS[chart_type](df, x=x, y=y, color=color, title=title)
