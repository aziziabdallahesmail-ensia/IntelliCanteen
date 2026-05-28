from catboost import CatBoostRegressor
from catboost.utils import get_gpu_device_count
import numpy as np
import pandas as pd


class CanteenMealRegressor:
    """
    A custom regressor that wraps three separate CatBoostRegressor models
    for breakfast, launch (lunch), and dinner.

    It automatically filters out lag features of other meals, drops constant/zero
    columns in the training set for each target, and routes prediction requests
    to the correct model.
    """

    def __init__(self, catboost_params=None):
        self.catboost_params = catboost_params or {}
        self.targets = ["breakfast", "launch", "dinner"]
        self.models = {}
        self.feature_cols = {}
        self.dropped_cols = {}

        # Configure GPU/CPU fallback
        if "task_type" not in self.catboost_params:
            try:
                gpu_count = get_gpu_device_count()
                if gpu_count > 0:
                    self.catboost_params["task_type"] = "GPU"
                else:
                    self.catboost_params["task_type"] = "CPU"
            except Exception:
                self.catboost_params["task_type"] = "CPU"

    def _get_target_features(self, X, target, is_training=True):
        """
        Helper to filter features for a specific target by dropping other targets
        and other targets' lag features.
        """
        # Ensure we don't modify the original DataFrame
        X_target = X.copy()

        # Drop all target columns if they are present in features
        for t in self.targets:
            if t in X_target.columns:
                X_target = X_target.drop(columns=[t])

        # Lag columns to drop (all lag columns except for the target's lag columns)
        other_targets = [t for t in self.targets if t != target]
        lag_cols_to_drop = []
        for ot in other_targets:
            lag_cols_to_drop.extend([f"{ot}_last_day", f"{ot}_last_week", f"{ot}_avg_previous"])

        # Drop lag columns of other targets if they exist in X
        lag_cols_to_drop = [c for c in lag_cols_to_drop if c in X_target.columns]
        if lag_cols_to_drop:
            X_target = X_target.drop(columns=lag_cols_to_drop)

        if is_training:
            # Drop zero or constant columns (columns with all 0s or <= 1 unique value)
            dropped = []
            for col in X_target.columns:
                if (X_target[col] == 0).all() or X_target[col].nunique() <= 1:
                    dropped.append(col)

            if dropped:
                X_target = X_target.drop(columns=dropped)

            self.dropped_cols[target] = dropped
            self.feature_cols[target] = X_target.columns.tolist()
        else:
            # Keep only the features that were used during training
            active_cols = self.feature_cols.get(target, X_target.columns.tolist())
            # Ensure we only select features that exist
            active_cols = [c for c in active_cols if c in X_target.columns]
            X_target = X_target[active_cols]

        return X_target

    def fit(self, X, y):
        """
        Fits 3 separate models on X and y.
        y should be a pandas DataFrame or 2D array containing the columns
        'breakfast', 'launch', and 'dinner'.
        """
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X)
        if not isinstance(y, pd.DataFrame):
            y = pd.DataFrame(y, columns=self.targets)

        for target in self.targets:
            print(f"Training model for target: {target}...")
            # Get target-specific features
            X_target = self._get_target_features(X, target, is_training=True)
            y_target = y[target]

            # Identify categorical features dynamically
            cat_features = X_target.select_dtypes(include=["object", "category"]).columns.tolist()

            # Print dropped columns if any
            if self.dropped_cols[target]:
                print(
                    f"  Target '{target}': Dropped constant/zero columns: {self.dropped_cols[target]}"
                )
            print(
                f"  Target '{target}': Training with {X_target.shape[1]} features (categorical: {cat_features})."
            )

            # Copy parameters and set cat_features
            model_params = self.catboost_params.copy()
            model_params["cat_features"] = cat_features

            # Instantiate and fit
            model = CatBoostRegressor(**model_params)
            model.fit(X_target, y_target)
            self.models[target] = model

        return self

    def predict(self, X, meal_type=None):
        """
        Predicts using the correct model(s).

        Parameters:
        - X: pandas DataFrame or array
        - meal_type: str, one of 'breakfast', 'launch', 'dinner', or None.
          If specified, predicts only for that meal type.
          If None and 'meal_type' is a column in X, dynamically routes each row.
          Otherwise, returns predictions for all 3 meal types.
        """
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X)

        # Case 1: Specific meal type is requested as parameter
        if meal_type is not None:
            if meal_type not in self.targets:
                raise ValueError(f"meal_type must be one of {self.targets}, got {meal_type}")
            X_target = self._get_target_features(X, meal_type, is_training=False)
            return self.models[meal_type].predict(X_target)

        # Case 2: X contains a 'meal_type' column
        if "meal_type" in X.columns:
            preds = np.zeros(len(X))
            for target in self.targets:
                mask = X["meal_type"] == target
                if mask.any():
                    X_subset = X[mask]
                    X_target = self._get_target_features(X_subset, target, is_training=False)
                    preds[mask] = self.models[target].predict(X_target)
            return preds

        # Case 3: No meal_type specified and not in column, predict all 3 targets
        preds_all = {}
        for target in self.targets:
            X_target = self._get_target_features(X, target, is_training=False)
            preds_all[target] = self.models[target].predict(X_target)

        return pd.DataFrame(preds_all, index=X.index)
