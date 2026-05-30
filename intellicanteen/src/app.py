from __future__ import annotations

import calendar
import csv
import math
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import pandas as pd
from flask import Flask, jsonify, request

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
MODEL_PATH = PROJECT_ROOT / "models" / "model.pkl"
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "processed_data.csv"

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from intellicanteen.modeling.models import CanteenMealRegressor

CATEGORY_COLUMNS = [
    "Bread & Bakery",
    "Rice & Pasta",
    "Legumes",
    "Poultry",
    "Red Meat",
    "Fish & Seafood",
    "Eggs",
    "Dairy & Cheese",
    "Vegetables & Salads",
    "Soups & Broths",
    "Cooked Dishes & Stews",
    "Potato Dishes",
    "Fruits",
    "Sweets & Desserts",
    "Beverages",
    "Condiments & Spreads",
]

LAG_COLUMNS = [
    "breakfast_last_day",
    "breakfast_last_week",
    "breakfast_avg_previous",
    "launch_last_day",
    "launch_last_week",
    "launch_avg_previous",
    "dinner_last_day",
    "dinner_last_week",
    "dinner_avg_previous",
]

ALL_FEATURES = [
    "dou_code",
    "resto_name",
    *CATEGORY_COLUMNS,
    *LAG_COLUMNS,
    "month",
    "year",
    "is_weekend",
    "is_month_start",
    "is_month_end",
    "day_of_week_sin",
    "day_of_week_cos",
    "day_of_month_sin",
    "day_of_month_cos",
    "month_sin",
    "month_cos",
]

app = Flask(__name__, static_folder=".", static_url_path="")

_model = None
_restaurants = None


def get_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
        main_module = sys.modules.get("__main__")
        if main_module is not None and not hasattr(main_module, "CanteenMealRegressor"):
            setattr(main_module, "CanteenMealRegressor", CanteenMealRegressor)
        _model = joblib.load(MODEL_PATH)
    return _model


_restaurants = None
_dou_codes = None


def load_metadata(limit: int = 10000) -> Tuple[list[str], list[str], bool, str | None]:
    global _restaurants, _dou_codes
    if _restaurants is not None and _dou_codes is not None:
        return _restaurants, _dou_codes, False, None

    if not DATA_PATH.exists():
        return [], [], False, f"Metadata file not found at {DATA_PATH}"

    restaurants = set()
    dou_codes = set()
    truncated = False

    with DATA_PATH.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            resto = (row.get("resto_name") or "").strip()
            if resto:
                restaurants.add(resto)
            
            code = (row.get("dou_code") or "").strip()
            if code:
                try:
                    code_val = str(int(float(code)))
                except ValueError:
                    code_val = code
                dou_codes.add(code_val)
                
            if len(restaurants) >= limit and len(dou_codes) >= limit:
                truncated = True
                break

    _restaurants = sorted(list(restaurants))
    _dou_codes = sorted(list(dou_codes), key=lambda x: (not x.isdigit(), int(x) if x.isdigit() else x))
    return _restaurants, _dou_codes, truncated, None


def get_restaurants(limit: int = 10000) -> Tuple[list[str], bool, str | None]:
    restos, _, truncated, warning = load_metadata(limit)
    return restos, truncated, warning


def get_dou_codes(limit: int = 10000) -> Tuple[list[str], bool, str | None]:
    _, codes, truncated, warning = load_metadata(limit)
    return codes, truncated, warning



def safe_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def build_feature_row(payload: Dict[str, Any]) -> Tuple[Dict[str, Any], list[str]]:
    errors = []
    row: Dict[str, Any] = {feature: 0.0 for feature in ALL_FEATURES}

    date_str = str(payload.get("date", "")).strip()
    if not date_str:
        errors.append("date")
        date = None
    else:
        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            errors.append("date")
            date = None

    resto_name = str(payload.get("resto_name", "")).strip()
    if not resto_name:
        errors.append("resto_name")
    row["resto_name"] = resto_name

    dou_code_raw = str(payload.get("dou_code", "")).strip()
    if not dou_code_raw:
        errors.append("dou_code")
    else:
        try:
            row["dou_code"] = int(dou_code_raw)
        except ValueError:
            row["dou_code"] = dou_code_raw

    categories = payload.get("categories", {}) or {}
    for feature in CATEGORY_COLUMNS:
        row[feature] = max(0.0, safe_float(categories.get(feature, 0)))

    lags = payload.get("lags", {}) or {}
    for feature in LAG_COLUMNS:
        raw_value = max(0.0, safe_float(lags.get(feature, 0)))
        row[feature] = math.log1p(raw_value)

    if date:
        day_of_week = date.weekday()
        day_of_month = date.day
        month = date.month
        year = date.year
        last_day = calendar.monthrange(year, month)[1]

        row["month"] = month
        row["year"] = year
        row["is_weekend"] = 1 if day_of_week in (4, 5) else 0
        row["is_month_start"] = 1 if day_of_month == 1 else 0
        row["is_month_end"] = 1 if day_of_month == last_day else 0

        row["day_of_week_sin"] = math.sin(2 * math.pi * day_of_week / 7)
        row["day_of_week_cos"] = math.cos(2 * math.pi * day_of_week / 7)
        row["day_of_month_sin"] = math.sin(2 * math.pi * day_of_month / 31)
        row["day_of_month_cos"] = math.cos(2 * math.pi * day_of_month / 31)
        row["month_sin"] = math.sin(2 * math.pi * month / 12)
        row["month_cos"] = math.cos(2 * math.pi * month / 12)

    return row, errors


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/api/predict", methods=["POST"])
def predict():
    payload = request.get_json(silent=True) or {}
    row, errors = build_feature_row(payload)

    if errors:
        missing = ", ".join(sorted(set(errors)))
        return jsonify({"error": f"Missing or invalid fields: {missing}."}), 400

    model = get_model()
    features_df = pd.DataFrame([row], columns=ALL_FEATURES)

    preds = model.predict(features_df)
    if isinstance(preds, pd.DataFrame):
        pred_row = preds.iloc[0].to_dict()
    else:
        targets = getattr(model, "targets", ["breakfast", "launch", "dinner"])
        if hasattr(preds, "__len__") and len(preds) == len(targets):
            pred_row = dict(zip(targets, preds))
        else:
            pred_row = {"breakfast": preds}

    pred_log = {key: float(value) for key, value in pred_row.items()}
    pred_counts = {key: max(0.0, math.expm1(value)) for key, value in pred_log.items()}
    pred_rounded = {key: int(round(value)) for key, value in pred_counts.items()}

    return jsonify(
        {
            "predictions_log": pred_log,
            "predictions": pred_counts,
            "predictions_rounded": pred_rounded,
        }
    )


@app.route("/api/restaurants", methods=["GET"])
def restaurants():
    names, truncated, warning = get_restaurants()
    payload: Dict[str, Any] = {"restaurants": names}
    if truncated:
        payload["truncated"] = True
    if warning:
        payload["warning"] = warning
    return jsonify(payload)


@app.route("/api/dou_codes", methods=["GET"])
def dou_codes():
    codes, truncated, warning = get_dou_codes()
    payload: Dict[str, Any] = {"dou_codes": codes}
    if truncated:
        payload["truncated"] = True
    if warning:
        payload["warning"] = warning
    return jsonify(payload)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
