import logging
from typing import Dict, Any, Optional

from database import fetch_user_sales
from data_preprocessing import preprocess_sales_data
from models.forecaster import SalesForecaster

logger = logging.getLogger("ml.training_service")


def train_user_model(user_id: str, custom_uri: Optional[str] = None) -> Dict[str, Any]:
    """
    Orchestrate model training for a specific user:
    1. Fetch sales from MongoDB
    2. Preprocess & check sufficiency
    3. Train candidate models, evaluate chronologically, select best
    4. Save artifacts
    """
    logger.info(f"Initiating model training for user: {user_id}")
    sales = fetch_user_sales(user_id, custom_uri)
    df_daily, meta = preprocess_sales_data(sales)

    if not meta["is_sufficient"]:
        return {
            "success": False,
            "user_id": user_id,
            "message": "Insufficient historical sales data for reliable Machine Learning training. At least 14 days of transaction history is required.",
            "data_quality": meta
        }

    forecaster = SalesForecaster(user_id=user_id)
    training_meta = forecaster.train_and_select_best(df_daily)

    return {
        "success": True,
        "user_id": user_id,
        "message": f"Successfully trained and selected {training_meta['algorithm']} model.",
        "modelMeta": training_meta,
        "data_quality": meta
    }
