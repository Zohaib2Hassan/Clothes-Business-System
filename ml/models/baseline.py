import numpy as np
import pandas as pd
from typing import Dict, Any

class BaselineMovingAverageModel:
    """
    Benchmark Baseline Model using a 7-day Simple Moving Average.
    Provides an empirical baseline to compare against trained Machine Learning models.
    """
    def __init__(self, window: int = 7):
        self.window = window
        self.mean_demand = 0.0
        self.recent_history = []

    def fit(self, y_train: pd.Series):
        if len(y_train) == 0:
            self.mean_demand = 0.0
            return self
        self.mean_demand = float(np.mean(y_train))
        self.recent_history = list(y_train.tail(self.window).values)
        return self

    def predict(self, steps: int) -> np.ndarray:
        if not self.recent_history:
            return np.full(steps, self.mean_demand)
        
        preds = []
        hist = list(self.recent_history)
        for _ in range(steps):
            next_val = float(np.mean(hist[-self.window:]))
            preds.append(next_val)
            hist.append(next_val)
            
        return np.array(preds)


class NaivePersistenceModel:
    """
    Naive Baseline: Predicts that tomorrow's sales will equal today's sales.
    """
    def __init__(self):
        self.last_value = 0.0

    def fit(self, y_train: pd.Series):
        self.last_value = float(y_train.iloc[-1]) if len(y_train) > 0 else 0.0
        return self

    def predict(self, steps: int) -> np.ndarray:
        return np.full(steps, self.last_value)
