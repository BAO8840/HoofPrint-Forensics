"""
HoofPrint ML inference.

Deployment models:
  1. random_forest.joblib
     Primary model ("HoofNet v1.0").
     Classifies ResNet50(pooling="avg") features.

  2. efficientnet_lstm_best.keras
     Secondary deep-learning cross-check model.
     Classifies the raw image end-to-end.

Memory strategy:
  - Models are NOT loaded during FastAPI startup.
  - Primary inference and secondary inference are performed sequentially.
  - ResNet50 is released before EfficientNet/LSTM is loaded.
  - EfficientNet/LSTM is released after secondary inference.
  - This reduces peak RAM usage on low-memory deployment environments.
"""

import gc
import io
import os

# Force CPU-only TensorFlow before importing TensorFlow.
# Render's free environment does not provide a CUDA GPU.
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import joblib
import numpy as np
import tensorflow as tf
from PIL import Image

from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import (
    preprocess_input as resnet_preprocess,
)
from tensorflow.keras.applications.efficientnet import (
    preprocess_input as effnet_preprocess,
)
from tensorflow.keras.models import load_model


IMG_SIZE = 224
CLASS_NAMES = ["Cow", "Goat", "Sheep"]


def _model_dir() -> str:
    """
    Return the directory containing the deployment models.

    On Render, MODEL_DIR can be configured as an environment variable.
    Otherwise, ./models is used.
    """
    return os.environ.get("MODEL_DIR", "./models")


def _get_model_paths():
    """
    Resolve and validate both model paths.
    """
    model_dir = _model_dir()

    rf_path = os.path.join(
        model_dir,
        "random_forest.joblib",
    )

    eff_path = os.path.join(
        model_dir,
        "efficientnet_lstm_best.keras",
    )

    if not os.path.exists(rf_path):
        raise FileNotFoundError(
            f"Missing {rf_path}. "
            "Copy random_forest.joblib from Kaggle's "
            "deployment_models/ folder into MODEL_DIR."
        )

    if not os.path.exists(eff_path):
        raise FileNotFoundError(
            f"Missing {eff_path}. "
            "Copy efficientnet_lstm_best.keras from Kaggle's "
            "deployment_models/ folder into MODEL_DIR."
        )

    return rf_path, eff_path


def _load_random_forest(rf_path: str):
    """
    Load the lightweight Random Forest model.
    """
    print("Loading primary Random Forest model...")

    model = joblib.load(rf_path)

    print("Primary Random Forest loaded.")

    return model


def _load_resnet_feature_extractor():
    """
    Load the exact ResNet50 feature extractor used to generate
    the features on which the Random Forest was trained.

    IMPORTANT:
    Do not replace ResNet50 with another architecture because
    the Random Forest expects the ResNet50 feature representation.
    """
    print("Loading ResNet50 feature extractor...")

    model = ResNet50(
        weights="imagenet",
        include_top=False,
        pooling="avg",
    )

    print("ResNet50 feature extractor loaded.")

    return model


def _load_efficientnet(eff_path: str):
    """
    Load the secondary EfficientNet/LSTM model.
    """
    print("Loading secondary EfficientNet/LSTM model...")

    model = load_model(eff_path)

    print("Secondary EfficientNet/LSTM model loaded.")

    return model


def _release_tensorflow_model(model):
    """
    Release a TensorFlow/Keras model and ask Python's garbage
    collector to reclaim memory.

    clear_session() also clears Keras' global state.
    """
    try:
        del model
    except Exception:
        pass

    tf.keras.backend.clear_session()
    gc.collect()


def _load_image_from_bytes(file_bytes: bytes) -> np.ndarray:
    """
    Convert uploaded image bytes into a 224x224 RGB float32 array.
    """
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")

    img = img.resize(
        (IMG_SIZE, IMG_SIZE),
        Image.Resampling.BILINEAR,
    )

    return np.asarray(
        img,
        dtype=np.float32,
    )


def _run_primary_model(
    img_array: np.ndarray,
    rf_path: str,
):
    """
    Run the primary HoofNet v1.0 pipeline.

    Pipeline:

        Image
          ↓
        ResNet50
          ↓
        Global Average Pooling
          ↓
        Random Forest
          ↓
        Species + probability distribution

    ResNet50 and the Random Forest are released before the
    secondary model is loaded.
    """

    rf_model = None
    resnet_model = None

    try:
        # ---------------------------------------------------------
        # Load primary models
        # ---------------------------------------------------------
        rf_model = _load_random_forest(rf_path)

        resnet_model = _load_resnet_feature_extractor()

        # ---------------------------------------------------------
        # Prepare ResNet50 input
        # ---------------------------------------------------------
        resnet_input = np.expand_dims(
            resnet_preprocess(img_array.copy()),
            axis=0,
        )

        # ---------------------------------------------------------
        # Extract ResNet50 features
        # ---------------------------------------------------------
        print("Extracting ResNet50 features...")

        features = resnet_model.predict(
            resnet_input,
            verbose=0,
        )

        # ---------------------------------------------------------
        # Random Forest prediction
        # ---------------------------------------------------------
        print("Running HoofNet Random Forest prediction...")

        rf_probs = rf_model.predict_proba(features)[0]

        rf_pred_idx = int(np.argmax(rf_probs))

        rf_distribution = {
            CLASS_NAMES[i]: round(
                float(rf_probs[i]) * 100,
                1,
            )
            for i in range(len(CLASS_NAMES))
        }

        primary_species = CLASS_NAMES[rf_pred_idx]

        primary_confidence = round(
            float(rf_probs[rf_pred_idx]) * 100,
            1,
        )

        return (
            primary_species,
            primary_confidence,
            rf_distribution,
        )

    finally:
        # ---------------------------------------------------------
        # Release TensorFlow ResNet model BEFORE secondary model.
        # ---------------------------------------------------------
        if resnet_model is not None:
            print("Releasing ResNet50 from memory...")
            _release_tensorflow_model(resnet_model)

        # Release the Random Forest object.
        if rf_model is not None:
            del rf_model

        # Release temporary arrays.
        try:
            del features
        except UnboundLocalError:
            pass

        try:
            del resnet_input
        except UnboundLocalError:
            pass

        gc.collect()


def _run_secondary_model(
    img_array: np.ndarray,
    eff_path: str,
):
    """
    Run the secondary EfficientNet/LSTM cross-check model.

    This model is deliberately loaded AFTER the ResNet50 model
    has been released to reduce peak RAM usage.
    """

    eff_model = None

    try:
        # ---------------------------------------------------------
        # Load secondary model
        # ---------------------------------------------------------
        eff_model = _load_efficientnet(eff_path)

        # ---------------------------------------------------------
        # Prepare EfficientNet input
        # ---------------------------------------------------------
        eff_input = np.expand_dims(
            effnet_preprocess(img_array.copy()),
            axis=0,
        )

        # ---------------------------------------------------------
        # Secondary prediction
        # ---------------------------------------------------------
        print("Running EfficientNet/LSTM cross-check...")

        eff_probs = eff_model.predict(
            eff_input,
            verbose=0,
        )[0]

        eff_pred_idx = int(np.argmax(eff_probs))

        secondary_species = CLASS_NAMES[eff_pred_idx]

        secondary_confidence = round(
            float(eff_probs[eff_pred_idx]) * 100,
            1,
        )

        return (
            secondary_species,
            secondary_confidence,
        )

    finally:
        # ---------------------------------------------------------
        # Release EfficientNet/LSTM after inference.
        # ---------------------------------------------------------
        if eff_model is not None:
            print("Releasing EfficientNet/LSTM from memory...")
            _release_tensorflow_model(eff_model)

        try:
            del eff_input
        except UnboundLocalError:
            pass

        try:
            del eff_probs
        except UnboundLocalError:
            pass

        gc.collect()


def predict(file_bytes: bytes) -> dict:
    """
    Run both HoofPrint models sequentially.

    Primary:
        ResNet50 → Random Forest

    Secondary:
        EfficientNet/LSTM

    The primary model remains the official HoofNet v1.0 result.
    The secondary model remains an independent cross-check.

    Models are intentionally NOT kept permanently in memory.
    This is important for low-memory deployment environments.
    """

    # -------------------------------------------------------------
    # Validate model files
    # -------------------------------------------------------------
    rf_path, eff_path = _get_model_paths()

    # -------------------------------------------------------------
    # Decode uploaded image ONCE.
    # -------------------------------------------------------------
    img_array = _load_image_from_bytes(file_bytes)

    try:
        # =========================================================
        # PHASE 1 — PRIMARY MODEL
        # =========================================================
        (
            primary_species,
            primary_confidence,
            rf_distribution,
        ) = _run_primary_model(
            img_array,
            rf_path,
        )

        print(
            f"Primary result: "
            f"{primary_species} ({primary_confidence}%)"
        )

        # =========================================================
        # PHASE 2 — SECONDARY MODEL
        #
        # ResNet50 has already been released before we get here.
        # =========================================================
        (
            secondary_species,
            secondary_confidence,
        ) = _run_secondary_model(
            img_array,
            eff_path,
        )

        print(
            f"Secondary result: "
            f"{secondary_species} ({secondary_confidence}%)"
        )

        # =========================================================
        # FINAL RESPONSE
        #
        # Response structure is intentionally unchanged so the
        # existing frontend does not need to be modified.
        # =========================================================
        return {
            "predicted_species": primary_species,
            "confidence": primary_confidence,
            "probability_distribution": rf_distribution,
            "model_version": "HoofNet v1.0",
            "secondary_model_prediction": secondary_species,
            "secondary_model_confidence": secondary_confidence,
        }

    finally:
        # Release the uploaded image array.
        del img_array

        gc.collect()