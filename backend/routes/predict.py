import os
import sys
import pickle
from flask import Blueprint, request, jsonify

# Resolve paths from this file's location — works regardless of cwd
_HERE      = os.path.dirname(os.path.abspath(__file__))   # …/backend/routes/
_BACKEND   = os.path.dirname(_HERE)                        # …/backend/
MODEL_DIR  = os.path.join(_BACKEND, 'model')

sys.path.insert(0, _BACKEND)
from utils.preprocessing import preprocess_input
from utils.validation import validate

predict_bp = Blueprint('predict', __name__)

# Load artifacts once at startup and confirm feature count
with open(os.path.join(MODEL_DIR, 'model.pkl'),   'rb') as f: model    = pickle.load(f)
with open(os.path.join(MODEL_DIR, 'scaler.pkl'),  'rb') as f: scaler   = pickle.load(f)
with open(os.path.join(MODEL_DIR, 'encoder.pkl'), 'rb') as f: encoders = pickle.load(f)

print(f"[startup] MODEL_DIR     = {MODEL_DIR}")
print(f"[startup] scaler features = {scaler.n_features_in_}")
print(f"[startup] model type      = {type(model).__name__}")


@predict_bp.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    errors = validate(data)
    if errors:
        return jsonify({'validation_errors': errors}), 422

    try:
        processed   = preprocess_input(data, encoders, scaler)
        probability = float(model.predict_proba(processed)[0][1])
        prediction  = 1 if probability >= 0.25 else 0

        if probability < 0.20:
            risk_level = 'Low'
        elif probability < 0.50:
            risk_level = 'Medium'
        else:
            risk_level = 'High'

        return jsonify({
            'prediction':  prediction,
            'probability': round(probability * 100, 2),
            'risk_level':  risk_level,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400
