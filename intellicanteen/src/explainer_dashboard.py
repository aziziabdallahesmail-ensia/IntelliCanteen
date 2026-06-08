"""
IntelliCanteen — ExplainerHub Dashboard
========================================
Builds interactive SHAP-based explanation dashboards for the
three CatBoost meal prediction models (breakfast, lunch, dinner).

Predictions and targets are shown on the **actual scale** (meal counts),
not the log-transformed training scale.

Usage:
    pip install explainerdashboard
    python src/explainer_dashboard.py

The dashboard will be available at http://localhost:8050
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import joblib

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from explainerdashboard import RegressionExplainer, ExplainerDashboard, ExplainerHub

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
MODEL_PATH = PROJECT_ROOT / "models" / "model.pkl"
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "processed_data.csv"

TARGETS = ["breakfast", "launch", "dinner"]
DISPLAY = {"breakfast": "🥐 Breakfast", "launch": "🍲 Lunch", "dinner": "🍛 Dinner"}
SAMPLE_SIZE = 10_000


# ---------------------------------------------------------------------------
# Actual-scale model wrapper
# ---------------------------------------------------------------------------
class ActualScaleModel:
    """Wraps a CatBoostRegressor so .predict() returns expm1 (real meal counts)."""

    def __init__(self, catboost_model):
        self._model = catboost_model

    def predict(self, X):
        log_preds = self._model.predict(X)
        return np.maximum(0.0, np.expm1(log_preds))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def build_explainer(target, wrapper_model, cb_model, X_target, y_actual):
    """Build a RegressionExplainer for one meal target."""

    # Identify categorical features from CatBoost metadata
    cat_indices = cb_model.get_cat_feature_indices()
    feature_names = list(X_target.columns)
    cats = [feature_names[i] for i in cat_indices] if cat_indices else None

    # Ensure categoricals are string-typed for explainerdashboard
    if cats:
        for c in cats:
            X_target[c] = X_target[c].astype(str)

    print(f"       Features : {len(feature_names)}")
    print(f"       Cats     : {cats or 'none'}")
    print(f"       y range  : [{y_actual.min():.0f} – {y_actual.max():.0f}] meals")

    explainer = RegressionExplainer(
        wrapper_model,
        X_target,
        y_actual,
        cats=cats,
        units="meals",
        # Use a small background set to speed up SHAP calculation
        X_background=X_target.sample(min(200, len(X_target)), random_state=42),
    )
    return explainer


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("  IntelliCanteen — Model Explainer Dashboard")
    print("=" * 60)

    # ---- 1. Load model ----
    print("\n[1/4] Loading model …")
    model = joblib.load(MODEL_PATH)
    print(f"       Targets: {list(model.models.keys())}")

    # ---- 2. Load & sample data ----
    print("\n[2/4] Loading & sampling processed data …")
    df = pd.read_csv(DATA_PATH)
    n = min(SAMPLE_SIZE, len(df))
    df_sample = df.sample(n=n, random_state=42).reset_index(drop=True)
    print(f"       Sampled {n:,} rows from {len(df):,} total")

    # ---- 3. Build one explainer per meal ----
    dashboards = []
    for target in TARGETS:
        print(f"\n[3/4] Building {DISPLAY[target]} explainer …")

        cb_model = model.models[target]

        # Use the wrapper's feature filtering (drops other-target lags, etc.)
        X_target = model._get_target_features(df_sample, target, is_training=False).copy()

        # Actual-scale target
        y_actual = np.maximum(0.0, np.expm1(df_sample[target].values))

        wrapped = ActualScaleModel(cb_model)

        explainer = build_explainer(target, wrapped, cb_model, X_target, y_actual)

        db = ExplainerDashboard(
            explainer,
            title=DISPLAY[target],
            name=target,
            hide_poweredby=True,
        )
        dashboards.append(db)
        print(f"       ✓ {DISPLAY[target]} ready")

    # ---- 4. Launch hub ----
    print(f"\n[4/4] Launching ExplainerHub …")
    print(f"       → http://localhost:8050")
    print(f"       (SHAP values are computed on first load — this may take a few minutes)\n")

    hub = ExplainerHub(
        dashboards,
        title="IntelliCanteen Model Explainer",
        description="SHAP-based explanations for meal demand forecasting models.",
    )
    hub.run(port=8050)


if __name__ == "__main__":
    main()
