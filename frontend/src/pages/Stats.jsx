import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { fetchStats } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Human-readable labels for the 14 model features
const FEATURE_LABELS = {
  gender:              'Gender',
  age:                 'Age',
  hypertension:        'Hypertension',
  heart_disease:       'Heart Disease',
  ever_married:        'Ever Married',
  work_type:           'Work Type',
  Residence_type:      'Residence Type',
  avg_glucose_level:   'Avg Glucose Level',
  bmi:                 'BMI',
  smoking_status:      'Smoking Status',
  age_x_hypertension:  'Age × Hypertension',
  age_x_heart_disease: 'Age × Heart Disease',
  age_x_glucose:       'Age × Glucose',
  clinical_risk_score: 'Clinical Risk Score',
};

export default function Stats() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetchStats()
      .then(data => setStats(data))
      .catch(err  => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading model statistics...</div>;
  if (error)   return (
    <div className="page-error">
      {error}<br />
      Make sure to run <code>python backend/model/train_model.py</code> to generate stats.json.
    </div>
  );
  if (!stats)  return null;

  // ── Feature importance chart ──────────────────────────────────────────────
  const sortedFeatures = Object.entries(stats.feature_importances)
    .sort(([, a], [, b]) => b - a);

  const chartData = {
    labels: sortedFeatures.map(([k]) => FEATURE_LABELS[k] || k),
    datasets: [{
      label: 'Coefficient Magnitude',
      data:  sortedFeatures.map(([, v]) => v),
      backgroundColor: sortedFeatures.map((_, i) =>
        i < 3 ? '#c0392b' : i < 7 ? '#d68910' : '#27ae60'
      ),
      borderRadius: 4,
    }],
  };

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      title:  { display: true, text: 'Feature Importances (LR Coefficient Magnitudes)' },
    },
    scales: { x: { beginAtZero: true } },
  };

  // ── Confusion matrix ──────────────────────────────────────────────────────
  const { tn, fp, fn, tp } = stats.confusion_matrix;
  const total = tn + fp + fn + tp;

  return (
    <div className="stats-page">
      <h1>Model Statistics</h1>

      {/* ── Key metric cards ─────────────────────────────────────── */}
      <div className="stats-cards">
        <div className="stats-card">
          <div className="stats-card-value">{stats.roc_auc}</div>
          <div className="stats-card-label">ROC-AUC</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats.pr_auc}</div>
          <div className="stats-card-label">PR-AUC</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats.cv_mean} &plusmn; {stats.cv_std}</div>
          <div className="stats-card-label">CV ROC-AUC (5-fold)</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats.n_samples.toLocaleString()}</div>
          <div className="stats-card-label">Dataset Size</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats.stroke_rate}%</div>
          <div className="stats-card-label">Stroke Rate in Dataset</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats.threshold}</div>
          <div className="stats-card-label">Decision Threshold</div>
        </div>
      </div>

      {/* ── Feature importance chart ─────────────────────────────── */}
      <div className="stats-section">
        <h2>Feature Importances</h2>
        <div className="stats-chart-wrap">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* ── Confusion matrix ─────────────────────────────────────── */}
      <div className="stats-section">
        <h2>
          Confusion Matrix{' '}
          <span className="stats-subtitle">(threshold = {stats.threshold})</span>
        </h2>
        <div className="cm-grid">
          <div className="cm-cell cm-tn">
            <div className="cm-value">{tn}</div>
            <div className="cm-label">True Negatives</div>
            <div className="cm-sublabel">Correctly predicted no stroke</div>
          </div>
          <div className="cm-cell cm-fp">
            <div className="cm-value">{fp}</div>
            <div className="cm-label">False Positives</div>
            <div className="cm-sublabel">False alarm (no stroke, predicted stroke)</div>
          </div>
          <div className="cm-cell cm-fn">
            <div className="cm-value">{fn}</div>
            <div className="cm-label">False Negatives</div>
            <div className="cm-sublabel">Missed stroke — minimize this</div>
          </div>
          <div className="cm-cell cm-tp">
            <div className="cm-value">{tp}</div>
            <div className="cm-label">True Positives</div>
            <div className="cm-sublabel">Correctly predicted stroke</div>
          </div>
        </div>
        <p className="cm-note">
          Total test samples: {total.toLocaleString()} &nbsp;|&nbsp;
          Sensitivity (Recall): {((tp / (tp + fn)) * 100).toFixed(1)}% &nbsp;|&nbsp;
          Specificity: {((tn / (tn + fp)) * 100).toFixed(1)}%
        </p>
      </div>

      {/* ── Methodology ──────────────────────────────────────────── */}
      <div className="stats-section stats-methodology">
        <h2>Model Methodology</h2>
        <p>
          The model is a <strong>Calibrated Logistic Regression</strong> with isotonic
          regression calibration (5-fold cross-validation). Training uses{' '}
          <strong>SMOTE</strong> (Synthetic Minority Over-sampling Technique) to address
          the severe class imbalance (only ~4.9% of patients experienced a stroke).
          A <code>class_weight='balanced'</code> penalty also emphasizes the minority
          class during optimization.
        </p>
        <p>
          Four <strong>interaction features</strong> are engineered before training:
          age &times; hypertension, age &times; heart disease, age &times; glucose level,
          and a composite clinical risk score. These capture the medically established
          finding that comorbid conditions become significantly more dangerous with
          advancing age.
        </p>
        <p>
          The decision threshold is set to <strong>0.25</strong> (rather than the default
          0.5) to optimize recall — it is clinically preferable to produce false alarms
          than to miss true stroke cases.
        </p>
      </div>
    </div>
  );
}
