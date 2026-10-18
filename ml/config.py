import os
import json
from pathlib import Path
from dotenv import load_dotenv

# Base paths
BASE_DIR = Path(__file__).resolve().parent
SAVED_MODELS_DIR = BASE_DIR / "models" / "saved"
SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Load environment
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

# Try reading from db_config.json if written by Node.js
db_config_file = BASE_DIR / "db_config.json"
dynamic_mongo_uri = None
if db_config_file.exists():
    try:
        with open(db_config_file, "r") as f:
            cfg = json.load(f)
            dynamic_mongo_uri = cfg.get("MONGO_URI")
    except Exception:
        pass

MONGO_URI = os.getenv("MONGO_URI") or dynamic_mongo_uri or "mongodb://127.0.0.1:27017/clothing_assistant_db"
DB_NAME = os.getenv("DB_NAME", "clothing_assistant_db")
PORT = int(os.getenv("ML_PORT", "8000"))
HOST = os.getenv("ML_HOST", "127.0.0.1")

# Machine Learning Constraints
MIN_TRAINING_SAMPLES = 14  # Minimum daily records needed for full ML regression
TEST_SPLIT_RATIO = 0.2     # Chronological test split (20% newest)
