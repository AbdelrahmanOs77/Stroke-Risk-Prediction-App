"""
Trains a Logistic Regression model with clinical interaction features and SMOTE.

Why this approach:
- Logistic Regression is well-calibrated: probabilities are meaningful.
- Interaction features (age x hypertension, age x heart_disease, age x glucose)
  force the model to learn that clinical conditions become far more dangerous
  with advancing age — matching established medical knowledge.
- SMOTE balances the heavy class imbalance (4.9% stroke rate).
- class_weight='balanced' adds a second layer of minority-class emphasis.
"""
import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, roc_auc_score, average_precision_score, confusion_matrix
from imblearn.over_sampling import SMOTE

DATASET_PATH = r'C:\Users\abdel\Downloads\healthcare-dataset-stroke-data.csv'

# ── load & clean ──────────────────────────────────────────────────────────────
df = pd.read_csv(DATASET_PATH)
df = df.drop('id', axis=1)
df['bmi'] = pd.to_numeric(df['bmi'], errors='coerce')
df['bmi'] = df['bmi'].fillna(df['bmi'].median())

# ── encode categoricals ───────────────────────────────────────────────────────
categorical_cols = ['gender', 'ever_married', 'work_type', 'Residence_type', 'smoking_status']
encoders = {}
for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    encoders[col] = le

# ── interaction features ──────────────────────────────────────────────────────
# These let the model capture that clinical conditions are far more dangerous
# combined with age, matching validated stroke risk score research.
df['age_x_hypertension']  = df['age'] * df['hypertension']
df['age_x_heart_disease'] = df['age'] * df['heart_disease']
df['age_x_glucose']       = df['age'] * (df['avg_glucose_level'] / 100.0)
df['clinical_risk_score'] = (
    df['hypertension'] +
    df['heart_disease'] +
    (df['age'] > 60).astype(int) +
    (df['avg_glucose_level'] > 125).astype(int)
)

X = df.drop('stroke', axis=1)
y = df['stroke']

print(f"Features ({len(X.columns)}): {list(X.columns)}")
print(f"Class distribution: No-stroke={( y==0).sum()}  Stroke={(y==1).sum()} ({y.mean()*100:.1f}%)")

# ── scale ─────────────────────────────────────────────────────────────────────
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ── SMOTE on training split ───────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)
smote = SMOTE(random_state=42, k_neighbors=5)
X_res, y_res = smote.fit_resample(X_train, y_train)
print(f"\nAfter SMOTE — 0: {(y_res==0).sum()}  1: {(y_res==1).sum()}")

# ── train Logistic Regression ─────────────────────────────────────────────────
base_lr = LogisticRegression(
    class_weight='balanced',
    C=0.3,           # moderate regularisation — avoids overfitting SMOTE noise
    max_iter=2000,
    solver='lbfgs',
    random_state=42,
)
# Isotonic calibration makes probabilities better reflect true event rates
model = CalibratedClassifierCV(base_lr, method='isotonic', cv=5)
model.fit(X_res, y_res)

# ── evaluate ──────────────────────────────────────────────────────────────────
probs  = model.predict_proba(X_test)[:, 1]
y_pred = (probs >= 0.25).astype(int)

print(f"\nROC-AUC (test): {roc_auc_score(y_test, probs):.4f}")
print(classification_report(y_test, y_pred, target_names=['No Stroke', 'Stroke']))

cv_auc = cross_val_score(model, X_scaled, y, cv=StratifiedKFold(5, shuffle=True, random_state=42), scoring='roc_auc')
print(f"CV ROC-AUC (5-fold): {cv_auc.mean():.4f} +/- {cv_auc.std():.4f}")

# ── sanity checks ─────────────────────────────────────────────────────────────
feat_names = list(X.columns)
cases = [
    ("HIGH  — 80yo M, HTN, HD, glucose=250, obese, smoker",
     {'gender':'Male','age':80,'hypertension':1,'heart_disease':1,'ever_married':'Yes',
      'work_type':'Private','Residence_type':'Urban','avg_glucose_level':250,'bmi':35,'smoking_status':'smokes'}),
    ("HIGH  — 75yo F, HTN, HD, glucose=220, normal BMI, never smoked",
     {'gender':'Female','age':75,'hypertension':1,'heart_disease':1,'ever_married':'Yes',
      'work_type':'Self-employed','Residence_type':'Rural','avg_glucose_level':220,'bmi':24,'smoking_status':'never smoked'}),
    ("MED   — 55yo M, HTN, glucose=150",
     {'gender':'Male','age':55,'hypertension':1,'heart_disease':0,'ever_married':'Yes',
      'work_type':'Private','Residence_type':'Urban','avg_glucose_level':150,'bmi':28,'smoking_status':'formerly smoked'}),
    ("LOW   — 28yo F, no risk factors",
     {'gender':'Female','age':28,'hypertension':0,'heart_disease':0,'ever_married':'No',
      'work_type':'Private','Residence_type':'Urban','avg_glucose_level':85,'bmi':22,'smoking_status':'never smoked'}),
]

print("\n-- Sanity checks --")
for label, case in cases:
    # add interactions
    case['age_x_hypertension']  = case['age'] * case['hypertension']
    case['age_x_heart_disease'] = case['age'] * case['heart_disease']
    case['age_x_glucose']       = case['age'] * (case['avg_glucose_level'] / 100.0)
    case['clinical_risk_score'] = (
        case['hypertension'] + case['heart_disease'] +
        (1 if case['age'] > 60 else 0) +
        (1 if case['avg_glucose_level'] > 125 else 0)
    )
    for col, le in encoders.items():
        case[col] = le.transform([str(case[col])])[0]
    row = scaler.transform(np.array([case[f] for f in feat_names]).reshape(1, -1))
    p = model.predict_proba(row)[0][1] * 100
    level = 'HIGH' if p >= 40 else ('MED' if p >= 15 else 'LOW')
    print(f"  Expected {label[:4]} -> got {p:.1f}% [{level}]  {'OK' if label[:4].strip()==level else 'FAIL'}")

# ── save ──────────────────────────────────────────────────────────────────────
model_dir = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(model_dir, 'model.pkl'),   'wb') as f: pickle.dump(model,    f)
with open(os.path.join(model_dir, 'scaler.pkl'),  'wb') as f: pickle.dump(scaler,   f)
with open(os.path.join(model_dir, 'encoder.pkl'), 'wb') as f: pickle.dump(encoders, f)
print("\nSaved: model.pkl  scaler.pkl  encoder.pkl")

# ── stats.json ────────────────────────────────────────────────────────────────
probs_test  = model.predict_proba(X_test)[:, 1]
y_pred_test = (probs_test >= 0.25).astype(int)

roc = float(roc_auc_score(y_test, probs_test))
pr  = float(average_precision_score(y_test, probs_test))

cv_s = cross_val_score(
    model, X_scaled, y,
    cv=StratifiedKFold(5, shuffle=True, random_state=42),
    scoring='roc_auc'
)

cm_vals = confusion_matrix(y_test, y_pred_test)
tn, fp, fn, tp = cm_vals.ravel()

# Average absolute LR coefficients across the 5 calibrated sub-estimators
coef_matrix = np.array([
    np.abs(cc.estimator.coef_[0])
    for cc in model.calibrated_classifiers_
])
mean_coefs = coef_matrix.mean(axis=0)
feat_importances = {
    feat: float(round(imp, 6))
    for feat, imp in zip(feat_names, mean_coefs)
}

stats_data = {
    'roc_auc':            round(roc, 4),
    'pr_auc':             round(pr,  4),
    'cv_mean':            round(float(cv_s.mean()), 4),
    'cv_std':             round(float(cv_s.std()),  4),
    'confusion_matrix':   {'tn': int(tn), 'fp': int(fp), 'fn': int(fn), 'tp': int(tp)},
    'feature_importances': feat_importances,
    'threshold':          0.25,
    'n_samples':          int(len(df)),
    'stroke_rate':        round(float(y.mean() * 100), 2),
}

stats_path = os.path.join(model_dir, 'stats.json')
with open(stats_path, 'w') as f:
    json.dump(stats_data, f, indent=2)
print(f"Saved: stats.json  (ROC-AUC={roc:.4f}  PR-AUC={pr:.4f})")
