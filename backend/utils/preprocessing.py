import numpy as np

# Must match the column order used during training exactly
FEATURE_ORDER = [
    'gender', 'age', 'hypertension', 'heart_disease', 'ever_married',
    'work_type', 'Residence_type', 'avg_glucose_level', 'bmi', 'smoking_status',
    # engineered interaction features
    'age_x_hypertension',
    'age_x_heart_disease',
    'age_x_glucose',
    'clinical_risk_score',
]


def _add_interactions(row: dict) -> dict:
    """Add the same interaction features used at training time."""
    age     = float(row['age'])
    htn     = float(row['hypertension'])
    hd      = float(row['heart_disease'])
    glucose = float(row['avg_glucose_level'])

    row['age_x_hypertension']  = age * htn
    row['age_x_heart_disease'] = age * hd
    row['age_x_glucose']       = age * (glucose / 100.0)
    row['clinical_risk_score'] = (
        htn +
        hd +
        (1 if age > 60 else 0) +
        (1 if glucose > 125 else 0)
    )
    return row


def preprocess_input(data: dict, encoders: dict, scaler) -> np.ndarray:
    data = _add_interactions(dict(data))
    row = []
    for feature in FEATURE_ORDER:
        value = data[feature]
        if feature in encoders:
            value = encoders[feature].transform([str(value)])[0]
        row.append(float(value))
    return scaler.transform(np.array(row).reshape(1, -1))
