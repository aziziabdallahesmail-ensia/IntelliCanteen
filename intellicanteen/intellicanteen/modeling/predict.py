from pathlib import Path

import joblib
from loguru import logger
import pandas as pd
import typer

from intellicanteen.config import MODELS_DIR, PROCESSED_DATA_DIR

app = typer.Typer()


@app.command()
def main(
    features_path: Path = PROCESSED_DATA_DIR
    / "processed_data.csv",  # default to processed_data if no test_features exists
    model_path: Path = MODELS_DIR / "model.pkl",
    predictions_path: Path = PROCESSED_DATA_DIR / "test_predictions.csv",
):
    logger.info(f"Loading model from {model_path}...")
    if not model_path.exists():
        logger.error(f"Model file not found at {model_path}!")
        raise FileNotFoundError(f"{model_path} does not exist. Please run training first.")

    model = joblib.load(model_path)

    logger.info(f"Loading features from {features_path}...")
    if not features_path.exists():
        logger.error(f"Features file not found at {features_path}!")
        raise FileNotFoundError(f"{features_path} does not exist.")

    df = pd.read_csv(features_path)

    # Drop target columns if they are present in features
    target_cols = ["breakfast", "launch", "dinner"]
    X = df.copy()
    for col in target_cols:
        if col in X.columns:
            X = X.drop(columns=[col])

    logger.info("Performing inference with CanteenMealRegressor...")
    predictions = model.predict(X)

    logger.info(f"Saving predictions to {predictions_path}...")
    predictions_path.parent.mkdir(parents=True, exist_ok=True)
    predictions.to_csv(predictions_path, index=False)

    logger.success("Inference complete.")


if __name__ == "__main__":
    app()
