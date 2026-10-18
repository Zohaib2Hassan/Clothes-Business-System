import logging
import sys
from pathlib import Path

# Add ml root to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from config import PORT, HOST
from services.forecast_service import generate_user_forecast
from services.training_service import train_user_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ml.api")

app = FastAPI(
    title="Threadly Clothing Business - Machine Learning Forecasting Engine",
    description="Dedicated Machine Learning Service for Time-Series Sales & Demand Forecasting",
    version="3.0.0"
)

# Enable CORS for internal Node.js backend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    userId: str = Field(..., description="MongoDB User ObjectId")
    horizon: int = Field(30, description="Forecast horizon in days (7, 15, 30, 60, 90, 180)")
    category: str = Field("all", description="Product category filter")
    sensitivity: str = Field("balanced", description="Prediction sensitivity (conservative, balanced, aggressive)")
    mongoUri: Optional[str] = Field(None, description="Optional custom MongoDB URI")


class TrainRequest(BaseModel):
    userId: str = Field(..., description="MongoDB User ObjectId")
    mongoUri: Optional[str] = Field(None, description="Optional custom MongoDB URI")


@app.get("/health")
def health_check():
    """Health check endpoint to verify ML microservice availability."""
    return {
        "status": "healthy",
        "service": "Threadly ML Forecasting Engine",
        "engine": "scikit-learn",
        "version": "3.0.0"
    }


@app.post("/predict")
def predict_endpoint(req: PredictRequest):
    """
    Generate multi-horizon sales, demand, and revenue forecasts.
    Uses trained Machine Learning models (Ridge / Random Forest / Gradient Boosting)
    on real historical business transactions from MongoDB.
    """
    try:
        logger.info(f"Received predict request: user={req.userId}, horizon={req.horizon}, cat={req.category}")
        result = generate_user_forecast(
            user_id=req.userId,
            horizon=req.horizon,
            category=req.category,
            sensitivity=req.sensitivity,
            custom_uri=req.mongoUri
        )
        return result
    except Exception as e:
        logger.error(f"Prediction error for user {req.userId}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"ML Forecasting Engine Error: {str(e)}")


@app.post("/train")
def train_endpoint(req: TrainRequest):
    """
    Trigger full chronological model retraining, candidate model comparison,
    and artifact serialization for a business owner.
    """
    try:
        logger.info(f"Received train request for user: {req.userId}")
        result = train_user_model(user_id=req.userId, custom_uri=req.mongoUri)
        return result
    except Exception as e:
        logger.error(f"Training error for user {req.userId}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"ML Training Engine Error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)
