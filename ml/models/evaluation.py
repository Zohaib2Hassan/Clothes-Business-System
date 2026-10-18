import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Dict, Any, Tuple

def evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Any]:
    """
    Compute rigorous time-series regression evaluation metrics.
    
    METRICS MEANING:
    - MAE (Mean Absolute Error): Average absolute magnitude of errors in units.
    - RMSE (Root Mean Squared Error): Square root of mean squared error; penalizes large errors.
    - R² (Coefficient of Determination): Proportion of variance explained by model.
      Note: R² can be negative for models that perform worse than horizontal mean line.
    - Residual Std: Standard deviation of residuals, used for empirical uncertainty bands.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    
    # Clip negative predictions to 0 (units sold cannot be negative)
    y_pred = np.clip(y_pred, 0, None)
    
    n_samples = len(y_true)
    if n_samples < 2:
        return {
            "mae": 0.0,
            "rmse": 0.0,
            "r2": 0.0,
            "mape": 0.0,
            "residual_std": 1.0,
            "n_samples": n_samples
        }

    mae = float(mean_absolute_error(y_true, y_pred))
    mse = float(mean_squared_error(y_true, y_pred))
    rmse = float(np.sqrt(mse))
    
    # Calculate R² score
    # If all true values are identical, r2 is undefined/0
    var_true = np.var(y_true)
    if var_true > 1e-6:
        r2 = float(r2_score(y_true, y_pred))
    else:
        r2 = 0.0

    # Clean MAPE (filter out zero actuals to avoid division by zero)
    non_zero_mask = y_true > 0
    if np.sum(non_zero_mask) > 0:
        mape = float(np.mean(np.abs((y_true[non_zero_mask] - y_pred[non_zero_mask]) / y_true[non_zero_mask])) * 100.0)
    else:
        mape = 0.0

    # Residual standard deviation for empirical confidence bounds
    residuals = y_true - y_pred
    residual_std = float(np.std(residuals)) if len(residuals) > 1 else max(1.0, mae)

    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "r2": round(r2, 3),
        "mape": round(mape, 1),
        "residual_std": round(residual_std, 2),
        "n_samples": n_samples
    }


def compute_uncertainty_bounds(
    predictions: np.ndarray, 
    residual_std: float, 
    multiplier: float = 1.96
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Calculate empirical uncertainty bounds based on model residual variance.
    95% empirical interval: y_hat ± 1.96 * residual_std.
    Bounded below by 0.
    """
    margin = multiplier * residual_std
    lower_bound = np.clip(predictions - margin, 0, None)
    upper_bound = predictions + margin
    return lower_bound, upper_bound
