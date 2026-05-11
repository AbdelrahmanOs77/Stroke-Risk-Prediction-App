"""
Run this to get a full accuracy report of the saved model.
Usage:  python evaluate_model.py
"""
import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, average_precision_score,
)
from sklearn.preprocessing import LabelEncoder, StandardScaler

DATASET_PATH = r'C:\Users\abdel\Downloads\healthcare-dataset-stroke-data.csv'
MODEL_DIR    = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(MODEL_DIR, 'model.pkl'),   'rb') as f: model    = pickle.load(f)
with open(os.path.join(MODEL_DIR, 'scaler.pkl'),  'rb') as f: scaler   = pickle.load(f)
with open(os.path.join(MODEL_DIR, 'encoder.pkl'), 'rb') as f: encoders = pickle.load(f)

df = pd.read_csv(DATASET_PATH)
df = df.drop('id', axis=1)
df['bmi'] = pd.to_numeric(df['bmi'], errors='coerce')
df['bmi'] = df['bmi'].fillna(df['bmi'].median())

for col, le in encoders.items():
    df[col] = le.transform(df[col].astype(str))

X = df.drop('stroke', axis=1)
y = df['stroke']
X_scaled = scaler.transform(X)

probs  = model.predict_proba(X_scaled)[:, 1]
y_pred = (probs >= 0.25).astype(int)

sep = "=" * 55
print(sep)
print("  STROKE RISK MODEL - EVALUATION REPORT")
print(sep)
print(f"\nDataset  : {len(df)} patients  |  Stroke cases: {y.sum()} ({y.mean()*100:.1f}%)")
print("\n-- Threshold = 0.25 (optimised for recall) --")
print(classification_report(y, y_pred, target_names=['No Stroke', 'Stroke']))

cm = confusion_matrix(y, y_pred)
tn, fp, fn, tp = cm.ravel()
print("Confusion Matrix:")
print(f"  True Negatives  (correct no-stroke): {tn}")
print(f"  False Positives (false alarm):        {fp}")
print(f"  False Negatives (missed strokes):     {fn}  <- minimise this")
print(f"  True Positives  (caught strokes):     {tp}")

print("\n-- Threshold-independent metrics --")
print(f"  ROC-AUC Score         : {roc_auc_score(y, probs):.4f}")
print(f"  Avg Precision (PR-AUC): {average_precision_score(y, probs):.4f}")

cv   = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
aucs = cross_val_score(model, X_scaled, y, cv=cv, scoring='roc_auc')
print(f"  CV ROC-AUC (5-fold)   : {aucs.mean():.4f} +/- {aucs.std():.4f}")

feat_names  = list(X.columns)
coef_matrix = np.array([
    np.abs(cc.estimator.coef_[0])
    for cc in model.calibrated_classifiers_
])
importances = coef_matrix.mean(axis=0)
ranked      = sorted(zip(feat_names, importances), key=lambda x: x[1], reverse=True)

print("\n-- Feature Importances --")
for feat, imp in ranked:
    bar = '#' * int(imp * 50)
    print(f"  {feat:<22} {imp:.4f}  {bar}")

print("\n-- Prediction Sanity Checks --")
cases = [
    ("High-risk (80yo, hypertension, heart disease, high glucose, obese, smoker)",
     {'gender':'Male','age':80,'hypertension':1,'heart_disease':1,'ever_married':'Yes',
      'work_type':'Private','Residence_type':'Urban','avg_glucose_level':230,'bmi':38,'smoking_status':'smokes'}),
    ("Moderate (55yo, hypertension, high glucose)",
     {'gender':'Male','age':55,'hypertension':1,'heart_disease':0,'ever_married':'Yes',
      'work_type':'Private','Residence_type':'Urban','avg_glucose_level':150,'bmi':28,'smoking_status':'formerly smoked'}),
    ("Low-risk (28yo, healthy)",
     {'gender':'Female','age':28,'hypertension':0,'heart_disease':0,'ever_married':'No',
      'work_type':'Private','Residence_type':'Urban','avg_glucose_level':85,'bmi':22,'smoking_status':'never smoked'}),
]

for label, case in cases:
    row = []
    for feat in feat_names:
        val = case[feat]
        if feat in encoders:
            val = encoders[feat].transform([str(val)])[0]
        row.append(float(val))
    row = scaler.transform(np.array(row).reshape(1, -1))
    p = model.predict_proba(row)[0][1] * 100
    level = 'High' if p >= 40 else ('Medium' if p >= 15 else 'Low')
    print(f"  {label}")
    print(f"    -> {p:.1f}% probability -- {level} Risk\n")

print(sep)
