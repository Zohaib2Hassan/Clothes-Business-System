import pandas as pd
import numpy as np
from typing import Tuple, List

FEATURE_COLUMNS = [
    "day_of_week",
    "day_of_month",
    "month",
    "is_weekend",
    "day_of_year",
    "lag_1",
    "lag_2",
    "lag_3",
    "lag_7",
    "lag_14",
    "rolling_mean_3",
    "rolling_mean_7",
    "rolling_std_7",
    "sales_velocity"
]


def create_features(df_daily: pd.DataFrame) -> pd.DataFrame:
    """
    Construct time-series predictive features from daily aggregated sales.
    
    CRITICAL: Avoids data leakage by using only strictly past observations
    via lag operators (.shift(1), .shift(2), etc.).
    """
    df = df_daily.copy()
    
    # ── 1. Calendar / Temporal Features ─────────────────────────
    df["day_of_week"] = df["date"].dt.dayofweek
    df["day_of_month"] = df["date"].dt.day
    df["month"] = df["date"].dt.month
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
    df["day_of_year"] = df["date"].dt.dayofyear
    
    # ── 2. Lag Features (Strictly Past Values) ──────────────────
    # Target is units at time t. Lags MUST start from t-1.
    df["lag_1"] = df["units"].shift(1)
    df["lag_2"] = df["units"].shift(2)
    df["lag_3"] = df["units"].shift(3)
    df["lag_7"] = df["units"].shift(7)
    df["lag_14"] = df["units"].shift(14)
    
    # ── 3. Rolling Window Features (Computed over past values only) ──
    # shift(1) ensures the current day's target is NOT part of the window
    df["rolling_mean_3"] = df["units"].shift(1).rolling(window=3, min_periods=1).mean()
    df["rolling_mean_7"] = df["units"].shift(1).rolling(window=7, min_periods=1).mean()
    df["rolling_std_7"] = df["units"].shift(1).rolling(window=7, min_periods=1).std().fillna(0.0)
    
    # ── 4. Short-term Trend / Velocity ───────────────────────────
    # Ratio between recent 3-day average and 7-day average
    mean_7 = df["rolling_mean_7"].replace(0.0, np.nan)
    df["sales_velocity"] = (df["rolling_mean_3"] / mean_7).fillna(1.0)
    # Clip extreme ratios
    df["sales_velocity"] = df["sales_velocity"].clip(lower=0.2, upper=5.0)

    # Backward-fill initial lag rows using expanding mean to preserve sample size
    for col in ["lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "rolling_mean_3", "rolling_mean_7"]:
        df[col] = df[col].bfill().fillna(0.0)

    return df


def prepare_training_data(df_features: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Separate design matrix X and target vector y.
    Target y = 'units' (units sold on that date).
    """
    X = df_features[FEATURE_COLUMNS].copy()
    y = df_features["units"].copy()
    return X, y
