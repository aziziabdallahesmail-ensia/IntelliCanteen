from pathlib import Path

import joblib
from loguru import logger
import pandas as pd
import typer

from intellicanteen.config import MODELS_DIR, PROCESSED_DATA_DIR
from intellicanteen.modeling.models import CanteenMealRegressor

app = typer.Typer()


@app.command()
def main(
    features_path: Path = PROCESSED_DATA_DIR / "processed_data.csv",
    model_path: Path = MODELS_DIR / "model.pkl",
):
    logger.info(f"Loading processed dataset from {features_path}...")
    if not features_path.exists():
        logger.error(f"Processed dataset not found at {features_path}!")
        raise FileNotFoundError(f"{features_path} does not exist.")

    df = pd.read_csv(features_path)

    target_cols = ["breakfast", "launch", "dinner"]
    missing_targets = [col for col in target_cols if col not in df.columns]
    if missing_targets:
        logger.error(f"Missing target columns in dataset: {missing_targets}")
        raise ValueError(f"Dataset must contain target columns: {target_cols}")

    X = df.drop(columns=target_cols)
    y = df[target_cols]

    logger.info("Initializing CanteenMealRegressor...")
    catboost_params = {
        "iterations": 1000,
        "learning_rate": 0.05,
        "depth": 6,
        "loss_function": "RMSE",
        "random_seed": 42,
        "verbose": False,
    }
    regressor = CanteenMealRegressor(catboost_params=catboost_params)

    logger.info("Fitting CanteenMealRegressor (3 separate CatBoost models)...")
    regressor.fit(X, y)

    logger.info(f"Saving trained CanteenMealRegressor to {model_path}...")
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(regressor, model_path)

    logger.success("Model training complete.")


if __name__ == "__main__":
    app()
