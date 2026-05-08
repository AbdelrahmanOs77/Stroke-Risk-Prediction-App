import React from 'react';
import { Link } from 'react-router-dom';

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

      <div className="features">
        <div className="feature-card">
          <h3>Input Health Data</h3>
          <p>Provide age, glucose level, BMI, and medical history through a simple form.</p>
        </div>
        <div className="feature-card">
          <h3>ML Analysis</h3>
          <p>Gradient Boosting model trained on real clinical data with ROC-AUC of 0.81.</p>
        </div>
        <div className="feature-card">
          <h3>Risk Assessment</h3>
          <p>Receive a clear Low / Medium / High stroke risk level with probability score.</p>
        </div>
      </div>
    </div>
  );
}
