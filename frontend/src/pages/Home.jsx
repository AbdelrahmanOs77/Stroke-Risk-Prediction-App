import React from 'react';
import { Link } from 'react-router-dom';

const STATS = [
  { value: '5,110', label: 'Patients in Dataset' },
  { value: '0.83',  label: 'ROC-AUC Score'       },
  { value: '14',    label: 'Features Analyzed'    },
];

export default function Home() {
  return (
    <div className="home-page">
      <div className="hero">
        <h1>Stroke Risk Prediction</h1>
        <p>
          Enter your health data to receive an AI-powered stroke risk assessment
          based on a model trained on over 5,000 patient records.
        </p>
        <Link to="/predict" className="cta-btn">Start Assessment</Link>
      </div>

      <div className="stats-row">
        {STATS.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="features">
        <div className="feature-card">
          <h3>Input Health Data</h3>
          <p>Provide age, glucose level, BMI, and medical history through a validated clinical form.</p>
        </div>
        <div className="feature-card">
          <h3>ML Analysis</h3>
          <p>Calibrated Logistic Regression with clinical interaction features, trained on real patient data with ROC-AUC of 0.83.</p>
        </div>
        <div className="feature-card">
          <h3>Risk Assessment</h3>
          <p>Receive a clear Low / Medium / High stroke risk level with probability score and personalized recommendations.</p>
        </div>
      </div>
    </div>
  );
}
