import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml.preprocessing")


def preprocess_sales_data(
    raw_sales: List[Dict[str, Any]], 
    filter_category: Optional[str] = None
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Process raw sales transactions into a daily aggregated time series.
    
    Returns:
        (df_daily, metadata):
        df_daily: DataFrame indexed by date with columns:
            ['units', 'revenue', 'orders_count', 'avg_price']
        metadata: Quality checks, sample counts, date ranges, sufficiency flag.
    """
    if not raw_sales or len(raw_sales) == 0:
        return pd.DataFrame(), {
            "is_sufficient": False,
            "total_records": 0,
            "unique_days": 0,
            "message": "No sales transactions found in database."
        }

    # Extract individual line items into flat records
    rows = []
    for sale in raw_sales:
        sale_date = sale.get("date") or sale.get("createdAt")
        if not sale_date:
            continue
            
        items = sale.get("items", [])
        total_amount = float(sale.get("totalAmount", 0.0) or 0.0)
        
        if items and len(items) > 0:
            for item in items:
                qty = float(item.get("qty", 0.0) or 0.0)
                price = float(item.get("price", 0.0) or 0.0)
                product_name = str(item.get("productName", "") or "")
                product_id = str(item.get("product", "") or item.get("productId", "") or "")
                category = str(item.get("category", "") or "")
                
                rows.append({
                    "date": pd.to_datetime(sale_date),
                    "product_id": product_id,
                    "product_name": product_name,
                    "category": category,
                    "qty": max(0.0, qty),
                    "price": max(0.0, price),
                    "revenue": max(0.0, qty * price)
                })
        else:
            # Fallback if transaction items are not expanded
            rows.append({
                "date": pd.to_datetime(sale_date),
                "product_id": "generic",
                "product_name": "General Item",
                "category": "General",
                "qty": 1.0,
                "price": total_amount,
                "revenue": total_amount
            })

    if not rows:
        return pd.DataFrame(), {
            "is_sufficient": False,
            "total_records": len(raw_sales),
            "unique_days": 0,
            "message": "Unable to extract valid line items from sales records."
        }

    df = pd.DataFrame(rows)
    
    # Clean datetime: normalize to date (midnight UTC)
    df["date"] = df["date"].dt.tz_localize(None).dt.floor("D")

    # Optional category filtering
    if filter_category and filter_category != "all":
        df = df[df["category"].str.lower() == filter_category.lower()]
        if df.empty:
            return pd.DataFrame(), {
                "is_sufficient": False,
                "total_records": len(raw_sales),
                "unique_days": 0,
                "message": f"No sales records found for category '{filter_category}'."
            }

    # Sort chronologically
    df = df.sort_values("date")

    # Aggregate by day
    df_daily = df.groupby("date").agg(
        units=("qty", "sum"),
        revenue=("revenue", "sum"),
        orders_count=("qty", "count")
    ).reset_index()

    # Reindex to complete continuous calendar days (fill missing days with 0 demand)
    min_date = df_daily["date"].min()
    max_date = df_daily["date"].max()
    all_dates = pd.date_range(start=min_date, end=max_date, freq="D")
    
    df_daily = df_daily.set_index("date").reindex(all_dates).fillna(0.0).reset_index()
    df_daily.rename(columns={"index": "date"}, inplace=True)
    df_daily["units"] = df_daily["units"].astype(float)
    df_daily["revenue"] = df_daily["revenue"].astype(float)
    df_daily["orders_count"] = df_daily["orders_count"].astype(int)

    # Derived average unit price on selling days
    df_daily["avg_price"] = np.where(
        df_daily["units"] > 0, 
        df_daily["revenue"] / df_daily["units"], 
        0.0
    )
    # Fill 0 price days with forward/backward fill or mean
    mean_price = df[df["qty"] > 0]["price"].mean() if not df[df["qty"] > 0].empty else 2500.0
    df_daily["avg_price"] = df_daily["avg_price"].replace(0.0, np.nan).bfill().ffill().fillna(mean_price)

    unique_days = len(df_daily)
    is_sufficient = unique_days >= 14 and (df_daily["units"].sum() > 0)

    metadata = {
        "is_sufficient": is_sufficient,
        "total_records": len(raw_sales),
        "unique_days": unique_days,
        "start_date": min_date.strftime("%Y-%m-%d"),
        "end_date": max_date.strftime("%Y-%m-%d"),
        "total_units_sold": float(df_daily["units"].sum()),
        "total_revenue": float(df_daily["revenue"].sum()),
        "avg_daily_units": float(df_daily["units"].mean()),
        "avg_unit_price": float(mean_price)
    }

    logger.info(f"Preprocessing completed: {unique_days} continuous days processed. Sufficient: {is_sufficient}")
    return df_daily, metadata


def extract_category_breakdown(
    raw_sales: List[Dict[str, Any]], 
    products: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Extract historical sales performance and stock counts grouped by category.
    """
    # Category stock map from actual Product documents
    cat_stock: Dict[str, Dict[str, Any]] = {}
    for p in products:
        c = p.get("category") or "General"
        if c not in cat_stock:
            cat_stock[c] = {"stock": 0, "products_count": 0, "sample_price": float(p.get("price", 0.0) or 0.0)}
        cat_stock[c]["stock"] += int(p.get("stock", 0) or 0)
        cat_stock[c]["products_count"] += 1

    # Aggregate sold units by category from sales
    cat_sales: Dict[str, Dict[str, float]] = {}
    for s in raw_sales:
        items = s.get("items", [])
        for it in items:
            c = it.get("category")
            if not c:
                # Find category from product catalog if missing in sale item
                pid = str(it.get("product", "") or it.get("productId", ""))
                matching_p = next((p for p in products if str(p.get("_id")) == pid or p.get("productId") == pid), None)
                c = matching_p.get("category") if matching_p else "General"
            
            c = c or "General"
            if c not in cat_sales:
                cat_sales[c] = {"units": 0.0, "revenue": 0.0}
            qty = float(it.get("qty", 0.0) or 0.0)
            price = float(it.get("price", 0.0) or 0.0)
            cat_sales[c]["units"] += qty
            cat_sales[c]["revenue"] += qty * price

    # Merge categories
    all_categories = sorted(list(set(list(cat_stock.keys()) + list(cat_sales.keys()))))
    total_units_all = sum(data.get("units", 0.0) for data in cat_sales.values()) or 1.0

    breakdown = []
    for c in all_categories:
        sales_info = cat_sales.get(c, {"units": 0.0, "revenue": 0.0})
        stock_info = cat_stock.get(c, {"stock": 0, "products_count": 0, "sample_price": 2500.0})
        
        demand_score = int(min(100, max(5, round((sales_info["units"] / total_units_all) * 100))))
        
        breakdown.append({
            "name": c,
            "historical_units": float(sales_info["units"]),
            "historical_revenue": float(sales_info["revenue"]),
            "current_stock": int(stock_info["stock"]),
            "products_count": int(stock_info["products_count"]),
            "demand_score": demand_score,
            "avg_price": float(stock_info["sample_price"])
        })

    return breakdown
