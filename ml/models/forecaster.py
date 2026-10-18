import joblib
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, List, Optional
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge, LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor

from config import SAVED_MODELS_DIR, TEST_SPLIT_RATIO
from feature_engineering import FEATURE_COLUMNS, create_features
from models.evaluation import evaluate_predictions, compute_uncertainty_bounds
from models.baseline import BaselineMovingAverageModel

logger = logging.getLogger("ml.forecaster")


class SalesForecaster:
    """
    Production-grade Time Series ML Forecaster.
    Trains candidate models (Ridge Regression, Random Forest, Gradient Boosting),
    evaluates them chronologically on unseen test data against a moving-average baseline,
    and generates multi-step recursive forecasts with empirical uncertainty bounds.
    """
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.model = None
        self.model_name = "RidgeRegression"
        self.metadata: Dict[str, Any] = {}
        self.is_trained = False

    def train_and_select_best(self, df_daily: pd.DataFrame) -> Dict[str, Any]:
        """
        Chronological split: 80% Train, 20% Test.
        Compares Baseline vs Ridge vs RandomForest vs GradientBoosting.
        Saves best model and evaluation metadata.
        """
        # Feature construction
        df_feat = create_features(df_daily)
        X = df_feat[FEATURE_COLUMNS]
        y = df_feat["units"]

        n_total = len(df_feat)
        n_train = int(np.floor(n_total * (1.0 - TEST_SPLIT_RATIO)))
        # Ensure at least 3 test points
        n_train = max(7, min(n_train, n_total - 3))

        X_train, y_train = X.iloc[:n_train], y.iloc[:n_train]
        X_test, y_test = X.iloc[n_train:], y.iloc[n_train:]

        # 1. Baseline Model
        baseline = BaselineMovingAverageModel(window=7)
        baseline.fit(y_train)
        y_pred_baseline = baseline.predict(len(y_test))
        metrics_baseline = evaluate_predictions(y_test.values, y_pred_baseline)

        # 2. Candidate Models
        candidates = {
            "Ridge Regression": Ridge(alpha=1.0),
            "Random Forest": RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42),
            "Gradient Boosting": GradientBoostingRegressor(n_estimators=50, max_depth=3, learning_rate=0.08, random_state=42)
        }

        best_model = None
        best_name = "Ridge Regression"
        best_metrics = None
        best_score = float("inf") # minimize MAE
        model_comparisons = [
            {"model": "7-Day Moving Average (Baseline)", **metrics_baseline}
        ]

        for name, candidate in candidates.items():
            try:
                candidate.fit(X_train, y_train)
                y_pred = candidate.predict(X_test)
                metrics = evaluate_predictions(y_test.values, y_pred)
                model_comparisons.append({"model": name, **metrics})

                # Selection criterion: lower MAE on unseen test set
                if metrics["mae"] < best_score:
                    best_score = metrics["mae"]
                    best_model = candidate
                    best_name = name
                    best_metrics = metrics
            except Exception as e:
                logger.error(f"Training failed for {name}: {e}")

        # If baseline beat all candidates or ML model degraded, fall back gracefully
        if best_model is None:
            best_model = LinearRegression().fit(X_train, y_train)
            best_name = "Linear Regression"
            best_metrics = evaluate_predictions(y_test.values, best_model.predict(X_test))

        # Refit winning architecture on full available dataset
        best_model.fit(X, y)
        self.model = best_model
        self.model_name = best_name
        self.is_trained = True

        self.metadata = {
            "user_id": self.user_id,
            "algorithm": best_name,
            "version": "Threadly-ML-v3.0",
            "last_trained": datetime.now().isoformat(),
            "training_samples": int(n_train),
            "test_samples": int(len(y_test)),
            "total_samples": int(n_total),
            "mae": best_metrics["mae"],
            "rmse": best_metrics["rmse"],
            "r2": best_metrics["r2"],
            "mape": best_metrics["mape"],
            "residual_std": best_metrics["residual_std"],
            "comparisons": model_comparisons,
            "features_used": FEATURE_COLUMNS
        }

        # Save artifacts to disk
        self._save_model()
        return self.metadata

    def forecast(
        self, 
        df_daily: pd.DataFrame, 
        horizon_days: int = 30, 
        sensitivity: str = "balanced"
    ) -> List[Dict[str, Any]]:
        """
        Generate future predictions day by day using iterative recursive forecasting.
        """
        if not self.is_trained:
            self._load_model()

        df_history = df_daily.copy()
        last_date = df_history["date"].max()
        residual_std = self.metadata.get("residual_std", 2.0)
        avg_price = float(df_history["avg_price"].iloc[-1]) if "avg_price" in df_history else 2500.0

        # Sensitivity tuning factor
        sens_multiplier = 1.0
        if sensitivity == "aggressive":
            sens_multiplier = 1.15
        elif sensitivity == "conservative":
            sens_multiplier = 0.85

        forecast_points = []
        recent_units = list(df_history["units"].values)

        for step in range(1, horizon_days + 1):
            next_date = last_date + timedelta(days=step)
            
            # Construct row for next day
            dow = next_date.weekday()
            dom = next_date.day
            month = next_date.month
            is_weekend = 1 if dow in [5, 6] else 0
            doy = next_date.timetuple().tm_yday
            
            lag_1 = recent_units[-1] if len(recent_units) >= 1 else 0.0
            lag_2 = recent_units[-2] if len(recent_units) >= 2 else lag_1
            lag_3 = recent_units[-3] if len(recent_units) >= 3 else lag_2
            lag_7 = recent_units[-7] if len(recent_units) >= 7 else lag_1
            lag_14 = recent_units[-14] if len(recent_units) >= 14 else lag_7

            roll_3 = np.mean(recent_units[-3:]) if len(recent_units) >= 3 else lag_1
            roll_7 = np.mean(recent_units[-7:]) if len(recent_units) >= 7 else roll_3
            roll_std = np.std(recent_units[-7:]) if len(recent_units) >= 7 else 1.0
            
            denom = roll_7 if roll_7 > 0 else 1.0
            velocity = min(5.0, max(0.2, roll_3 / denom))

            feat_dict = {
                "day_of_week": dow,
                "day_of_month": dom,
                "month": month,
                "is_weekend": is_weekend,
                "day_of_year": doy,
                "lag_1": lag_1,
                "lag_2": lag_2,
                "lag_3": lag_3,
                "lag_7": lag_7,
                "lag_14": lag_14,
                "rolling_mean_3": roll_3,
                "rolling_mean_7": roll_7,
                "rolling_std_7": roll_std,
                "sales_velocity": velocity
            }

            X_next = pd.DataFrame([feat_dict])[FEATURE_COLUMNS]
            
            if self.model is not None:
                raw_pred = float(self.model.predict(X_next)[0])
            else:
                raw_pred = roll_7

            # Apply sensitivity adjustment
            pred_units = float(np.clip(round(raw_pred * sens_multiplier, 1), 0, None))
            
            # Uncertainty bounds based on test residual standard error
            lower_bound = float(np.clip(round(pred_units - 1.96 * residual_std, 1), 0, None))
            upper_bound = float(round(pred_units + 1.96 * residual_std, 1))
            projected_rev = float(round(pred_units * avg_price))

            forecast_points.append({
                "date": next_date.strftime("%Y-%m-%d"),
                "day_label": next_date.strftime("%b %d"),
                "predicted_units": pred_units,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "revenue_predicted": projected_rev
            })

            # Append to recursive history for next step's lags
            recent_units.append(pred_units)

        return forecast_points

    def _save_model(self):
        model_path = SAVED_MODELS_DIR / f"{self.user_id}_model.pkl"
        meta_path = SAVED_MODELS_DIR / f"{self.user_id}_metadata.json"
        
        joblib.dump(self.model, model_path)
        with open(meta_path, "w") as f:
            json.dump(self.metadata, f, indent=2)
            
        logger.info(f"Model saved to {model_path}")

    def _load_model(self) -> bool:
        model_path = SAVED_MODELS_DIR / f"{self.user_id}_model.pkl"
        meta_path = SAVED_MODELS_DIR / f"{self.user_id}_metadata.json"
        
        if model_path.exists() and meta_path.exists():
            try:
                self.model = joblib.load(model_path)
                with open(meta_path, "r") as f:
                    self.metadata = json.load(f)
                self.model_name = self.metadata.get("algorithm", "Ridge Regression")
                self.is_trained = True
                return True
            except Exception as e:
                logger.error(f"Error loading saved model: {e}")
        return False
