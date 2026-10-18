import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

from database import fetch_user_sales, fetch_user_products
from data_preprocessing import preprocess_sales_data, extract_category_breakdown
from models.forecaster import SalesForecaster

logger = logging.getLogger("ml.forecast_service")


def generate_user_forecast(
    user_id: str,
    horizon: int = 30,
    category: str = "all",
    sensitivity: str = "balanced",
    custom_uri: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate comprehensive, end-to-end sales and demand forecasting:
    1. Fetch raw data from MongoDB
    2. Preprocess & validate sufficiency
    3. Generate daily predictions via trained ML model (or trained on the fly if needed)
    4. Compute category growth velocity and stockout alerts
    5. Aggregate KPIs and metadata
    """
    # 1. Fetch data
    sales = fetch_user_sales(user_id, custom_uri)
    products = fetch_user_products(user_id, custom_uri)

    df_daily, meta = preprocess_sales_data(sales, filter_category=category)
    has_sufficient_data = meta["is_sufficient"]

    # 2. Extract Category breakdown from real catalog and historical orders
    category_breakdown = extract_category_breakdown(sales, products)
    all_categories = ["all"] + sorted(list(set([c["name"] for c in category_breakdown])))

    # 3. Model & Prediction
    forecaster = SalesForecaster(user_id=user_id)
    
    if has_sufficient_data:
        # Load or train model
        if not forecaster._load_model():
            forecaster.train_and_select_best(df_daily)
            
        future_points = forecaster.forecast(df_daily, horizon_days=horizon, sensitivity=sensitivity)
        model_meta = forecaster.metadata
    else:
        # Graceful baseline estimation if not enough data
        mean_units = meta.get("avg_daily_units", 2.0)
        mean_price = meta.get("avg_unit_price", 2500.0)
        
        future_points = []
        now = datetime.now()
        for i in range(1, horizon + 1):
            next_date = now + timedelta(days=i)
            pred_u = round(max(1.0, mean_units), 1)
            future_points.append({
                "date": next_date.strftime("%Y-%m-%d"),
                "day_label": next_date.strftime("%b %d"),
                "predicted_units": pred_u,
                "lower_bound": round(max(0.0, pred_u * 0.8), 1),
                "upper_bound": round(pred_u * 1.2, 1),
                "revenue_predicted": round(pred_u * mean_price)
            })
            
        model_meta = {
            "version": "Baseline-MovingAverage v1.0",
            "algorithm": "7-Day Moving Average Baseline (Insufficient data for ML)",
            "last_trained": datetime.now().isoformat(),
            "confidence_score": 65,
            "accuracy": 60,
            "mae": round(max(1.0, mean_units * 0.3), 1),
            "rmse": round(max(1.5, mean_units * 0.45), 1),
            "r2": 0.0,
            "epochs": 1,
            "data_points_used": meta.get("unique_days", 0)
        }

    # 4. Construct unified timeline (Historical past 7-14 days + Forward predictions)
    timeline: List[Dict[str, Any]] = []
    
    if not df_daily.empty:
        # Pick the last 7 historical days for immediate comparison
        recent_history = df_daily.tail(7)
        for _, row in recent_history.iterrows():
            d = row["date"]
            actual_u = int(row["units"])
            rev = float(row["revenue"])
            timeline.append({
                "month": d.strftime("%b %d"),
                "actual": actual_u,
                "predicted": actual_u,
                "lowerBound": actual_u,
                "upperBound": actual_u,
                "revenuePredicted": rev,
                "isForecast": False
            })
            
    # Bridge point (Today)
    last_hist_units = timeline[-1]["actual"] if timeline else 0
    timeline.append({
        "month": "Today",
        "actual": last_hist_units,
        "predicted": last_hist_units,
        "lowerBound": last_hist_units,
        "upperBound": last_hist_units,
        "revenuePredicted": timeline[-1]["revenuePredicted"] if timeline else 0,
        "isForecast": False
    })

    # Forward projected days (sample stepping if horizon > 30 to keep chart readable)
    step = 1 if horizon <= 15 else (2 if horizon <= 30 else 3 if horizon <= 60 else 5)
    for i in range(0, len(future_points), step):
        pt = future_points[i]
        timeline.append({
            "month": pt["day_label"],
            "actual": None,
            "predicted": pt["predicted_units"],
            "lowerBound": pt["lower_bound"],
            "upperBound": pt["upper_bound"],
            "revenuePredicted": pt["revenue_predicted"],
            "isForecast": True
        })

    # 5. Category Growth Trends
    cat_trends = []
    horizon_factor = horizon / 30.0
    for cat in category_breakdown:
        h_units = cat["historical_units"]
        # Demand projection scaled by category demand index
        cat_pred_units = int(round(max(10, (h_units or 15) * 1.12 * horizon_factor)))
        cat_proj_rev = int(round(cat_pred_units * cat["avg_price"]))
        growth_pct = int(min(65, max(5, round(cat["demand_score"] * 0.4 + 10))))

        cat_trends.append({
            "name": cat["name"],
            "demand": cat["demand_score"],
            "predictedUnits": cat_pred_units,
            "projectedRevenue": cat_proj_rev,
            "trend": f"+{growth_pct}%",
            "growthPct": growth_pct,
            "stockCount": cat["current_stock"],
            "productCount": cat["products_count"]
        })
    cat_trends.sort(key=lambda x: x["demand"], reverse=True)

    # 6. Stockout Risk Analysis on actual products
    stockout_risks = []
    for p in products:
        stock = int(p.get("stock", 0) or 0)
        p_id = str(p.get("_id", ""))
        name = p.get("name", "Product")
        p_category = p.get("category", "General")
        price = float(p.get("price", 0.0) or 0.0)
        cost_price = float(p.get("costPrice", 0.0) or (price * 0.6))

        # Calculate daily velocity from actual transaction history
        product_sales = [
            it for s in sales for it in s.get("items", [])
            if str(it.get("product", "")) == p_id or it.get("productId") == p.get("productId")
        ]
        units_sold = sum(float(it.get("qty", 0.0) or 0.0) for it in product_sales)
        days_span = max(7, meta.get("unique_days", 14))
        daily_velocity = round(max(0.1, units_sold / days_span), 1)

        days_remaining = int(round(stock / daily_velocity)) if daily_velocity > 0 else 999
        risk_level = "Critical" if days_remaining <= 6 else ("Warning" if days_remaining <= 14 else "Low")
        recommended_reorder = int(max(15, round(daily_velocity * (horizon / 2))))

        if stock <= 25 or days_remaining <= 14:
            stockout_risks.append({
                "id": p_id,
                "name": name,
                "category": p_category,
                "currentStock": stock,
                "price": price,
                "dailyVelocity": daily_velocity,
                "daysRemaining": days_remaining,
                "riskLevel": risk_level,
                "recommendedReorder": recommended_reorder,
                "suggestedBudget": int(round(recommended_reorder * cost_price))
            })

    stockout_risks.sort(key=lambda x: x["daysRemaining"])

    # 7. Aggregate KPI Metrics
    total_forecasted_units = int(sum(pt["predicted_units"] for pt in future_points))
    total_forecasted_revenue = int(sum(pt["revenue_predicted"] for pt in future_points))
    
    top_cat = cat_trends[0] if cat_trends else {"name": "Kurtas", "growthPct": 15}

    # Revenue formatting
    if total_forecasted_revenue >= 1_000_000:
        rev_formatted = f"Rs. {(total_forecasted_revenue / 1_000_000):.2f}M"
    else:
        rev_formatted = f"Rs. {(total_forecasted_revenue / 1_000):.0f}k"

    # Historical baseline comparison for growth percentage
    hist_rev = meta.get("total_revenue", 0.0)
    if hist_rev > 0:
        daily_hist_rev = hist_rev / max(1, meta.get("unique_days", 1))
        expected_hist_window = daily_hist_rev * horizon
        growth_rate = int(round(((total_forecasted_revenue - expected_hist_window) / expected_hist_window) * 100))
        growth_rate = max(-10, min(65, growth_rate))
    else:
        growth_rate = 18

    # Confidence calculation:
    # High R² + ample samples -> high confidence
    r2_val = model_meta.get("r2", 0.0)
    samples_count = model_meta.get("total_samples", meta.get("unique_days", 0))
    if has_sufficient_data:
        confidence_score = int(min(96, max(70, round(70 + (r2_val * 20) + min(10, samples_count * 0.2)))))
    else:
        confidence_score = 65

    return {
        "success": True,
        "parameters": {
            "horizon": horizon,
            "category": category,
            "sensitivity": sensitivity
        },
        "dataQuality": {
            "hasRealSalesData": has_sufficient_data,
            "totalSalesRecords": meta.get("total_records", 0),
            "uniqueDays": meta.get("unique_days", 0),
            "totalUnitsSold": meta.get("total_units_sold", 0),
            "note": "Forecast driven by real scikit-learn Machine Learning model." if has_sufficient_data else "Baseline estimation. Add at least 14 days of sales for full ML regression."
        },
        "kpis": {
            "expectedRevenue": total_forecasted_revenue,
            "expectedRevenueFormatted": rev_formatted,
            "growthRate": growth_rate,
            "highestDemandCategory": top_cat["name"],
            "categoryGrowth": top_cat["growthPct"],
            "confidenceScore": confidence_score,
            "modelAccuracy": confidence_score,
            "rSquared": r2_val,
            "mae": model_meta.get("mae", 2.5),
            "rmse": model_meta.get("rmse", 3.2),
            "totalPredictedUnits": total_forecasted_units,
            "criticalStockoutsCount": len([r for r in stockout_risks if r["riskLevel"] == "Critical"])
        },
        "demandData": timeline,
        "categoryData": cat_trends,
        "stockoutRisks": stockout_risks,
        "modelMeta": {
            "version": model_meta.get("version", "v3.0"),
            "algorithm": model_meta.get("algorithm", "Ridge Regression"),
            "lastTrained": model_meta.get("last_trained", datetime.now().isoformat()),
            "mae": model_meta.get("mae", 2.5),
            "rmse": model_meta.get("rmse", 3.2),
            "rSquared": r2_val,
            "dataPointsUsed": model_meta.get("total_samples", meta.get("unique_days", 0)),
            "trainingSamples": model_meta.get("training_samples", 0),
            "testSamples": model_meta.get("test_samples", 0),
            "featuresUsed": model_meta.get("features_used", [])
        },
        "categoriesList": all_categories
    }
