"""
Loads the two deployment models exported from the Kaggle notebook:

  1. random_forest.joblib          -- primary model, branded "HoofNet v1.0" in the UI.
                                       Classifies on ResNet50(pooling='avg') features.
  2. efficientnet_lstm_best.keras  -- secondary "deep learning" cross-check model.
                                       Classifies end-to-end on the raw image.

Both files must be copied from Kaggle's /kaggle/working/deployment_models/ into
this backend's MODEL_DIR (see .env.example) before starting the server.
"""
import os
import numpy as np
from PIL import Image
import joblib
import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import preprocess_input as resnet_preprocess
from tensorflow.keras.applications.efficientnet import preprocess_input as effnet_preprocess
from tensorflow.keras.models import load_model

IMG_SIZE = 224
CLASS_NAMES = ["Cow", "Goat", "Sheep"]

_rf_model = None
_eff_model = None
_resnet_feature_extractor = None


def _model_dir() -> str:
    return os.environ.get("MODEL_DIR", "./models")


def load_models():
    """Load the deployment models on first inference request."""
    global _rf_model, _eff_model, _resnet_feature_extractor

    model_dir = _model_dir()
    rf_path = os.path.join(model_dir, "random_forest.joblib")
    eff_path = os.path.join(model_dir, "efficientnet_lstm_best.keras")

    if not os.path.exists(rf_path):
        raise FileNotFoundError(
            f"Missing {rf_path}. Copy random_forest.joblib from Kaggle's "
            "deployment_models/ folder into MODEL_DIR."
        )
    if not os.path.exists(eff_path):
        raise FileNotFoundError(
            f"Missing {eff_path}. Copy efficientnet_lstm_best.keras from Kaggle's "
            "deployment_models/ folder into MODEL_DIR."
        )

    _rf_model = joblib.load(rf_path)
    _eff_model = load_model(eff_path)
    # Same feature extractor architecture used during training/feature extraction
    _resnet_feature_extractor = ResNet50(weights="imagenet", include_top=False, pooling="avg")

    print("Models loaded: random_forest.joblib, efficientnet_lstm_best.keras")


def _load_image_from_bytes(file_bytes: bytes) -> np.ndarray:
    img = Image.open(__import__("io").BytesIO(file_bytes)).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE))
    return np.array(img).astype("float32")


def predict(file_bytes: bytes) -> dict:
    """Runs both models on one image. Returns primary (RF) prediction as the
    main result, plus the EfficientNet cross-check for the report/methodology
    section.
    """
    global _rf_model, _eff_model, _resnet_feature_extractor

    if (
        _rf_model is None
        or _eff_model is None
        or _resnet_feature_extractor is None
    ):
        load_models()

    img_array = _load_image_from_bytes(file_bytes)

    # --- Primary model: Random Forest on ResNet50 pooled features ---
    resnet_input = np.expand_dims(resnet_preprocess(img_array.copy()), axis=0)
    features = _resnet_feature_extractor.predict(resnet_input, verbose=0)
    rf_probs = _rf_model.predict_proba(features)[0]

    rf_pred_idx = int(np.argmax(rf_probs))
    rf_distribution = {
        CLASS_NAMES[i]: round(float(rf_probs[i]) * 100, 1) for i in range(len(CLASS_NAMES))
    }

    # --- Secondary cross-check: EfficientNetB0+LSTM end-to-end ---
    eff_input = np.expand_dims(effnet_preprocess(img_array.copy()), axis=0)
    eff_probs = _eff_model.predict(eff_input, verbose=0)[0]
    eff_pred_idx = int(np.argmax(eff_probs))

    return {
        "predicted_species": CLASS_NAMES[rf_pred_idx],
        "confidence": round(float(rf_probs[rf_pred_idx]) * 100, 1),
        "probability_distribution": rf_distribution,
        "model_version": "HoofNet v1.0",
        "secondary_model_prediction": CLASS_NAMES[eff_pred_idx],
        "secondary_model_confidence": round(float(eff_probs[eff_pred_idx]) * 100, 1),
    }
