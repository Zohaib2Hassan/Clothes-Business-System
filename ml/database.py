import json
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
from bson import ObjectId
from config import MONGO_URI, DB_NAME, BASE_DIR

_client_cache: Dict[str, MongoClient] = {}

def get_mongo_client(custom_uri: Optional[str] = None) -> MongoClient:
    """
    Get or create a cached PyMongo client.
    Prefers custom_uri if provided, otherwise checks db_config.json, then config.MONGO_URI.
    """
    uri = custom_uri
    if not uri:
        # Check if Node server wrote an updated URI to db_config.json
        cfg_file = BASE_DIR / "db_config.json"
        if cfg_file.exists():
            try:
                with open(cfg_file, "r") as f:
                    cfg = json.load(f)
                    uri = cfg.get("MONGO_URI")
            except Exception:
                pass

    if not uri:
        uri = MONGO_URI

    if uri not in _client_cache:
        _client_cache[uri] = MongoClient(uri, serverSelectionTimeoutMS=5000)

    return _client_cache[uri]


def fetch_user_sales(user_id: str, custom_uri: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Fetch all sales transactions for a given user from the MongoDB Sales collection.
    Matches the Mongoose Sale model schema.
    """
    client = get_mongo_client(custom_uri)
    db = client[DB_NAME]
    
    query: Dict[str, Any] = {}
    try:
        query["user"] = ObjectId(user_id)
    except Exception:
        query["user"] = user_id

    # Sort chronologically by date
    sales_cursor = db.sales.find(query).sort("date", 1)
    sales = list(sales_cursor)
    
    # Convert BSON ObjectIds to string for clean serialization
    for s in sales:
        s["_id"] = str(s["_id"])
        s["user"] = str(s["user"])
        if "customer" in s and s["customer"]:
            s["customer"] = str(s["customer"])
        if "items" in s:
            for item in s["items"]:
                if "product" in item and item["product"]:
                    item["product"] = str(item["product"])
                    
    return sales


def fetch_user_products(user_id: str, custom_uri: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Fetch all product documents for a given user from the MongoDB Product collection.
    """
    client = get_mongo_client(custom_uri)
    db = client[DB_NAME]
    
    query: Dict[str, Any] = {}
    try:
        query["user"] = ObjectId(user_id)
    except Exception:
        query["user"] = user_id

    products_cursor = db.products.find(query)
    products = list(products_cursor)
    
    for p in products:
        p["_id"] = str(p["_id"])
        p["user"] = str(p["user"])
        
    return products
