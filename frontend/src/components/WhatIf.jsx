import React, { useState, useEffect } from 'react';
import { predictStroke } from '../services/api';

const DEBOUNCE_MS = 400;

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function WhatIf({ formData, originalResult }) {
  const [sliders, setSliders] = useState({
    age:               Number(formData.age),
    avg_glucose_level: Number(formData.avg_glucose_level),
    bmi:               Number(formData.bmi),
    hypertension:      Number(formData.hypertension),
    heart_disease:     Number(formData.heart_disease),
  });

  const [whatIfResult, setWhatIfResult] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const debouncedSliders = useDebounce(sliders, DEBOUNCE_MS);

  // Re-predict whenever debounced sliders change
  useEffect(() => {
    const payload = {
      ...formData,
      age:               debouncedSliders.age,
      avg_glucose_level: debouncedSliders.avg_glucose_level,
      bmi:               debouncedSliders.bmi,
      hypertension:      debouncedSliders.hypertension,
      heart_disease:     debouncedSliders.heart_disease,
    };

    setLoading(true);
    setError('');
    predictStroke(payload)
      .then(res => setWhatIfResult(res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSliders]);

  const handleSlider = (e) => {
    const { name, value } = e.target;
    setSliders(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const handleToggle = (field) => {
    setSliders(prev => ({ ...prev, [field]: prev[field] === 1 ? 0 : 1 }));
  };

  const delta = whatIfResult
    ? (whatIfResult.probability - originalResult.probability).toFixed(2)
    : null;

  const deltaNum   = delta !== null ? parseFloat(delta) : null;
  const deltaColor = deltaNum > 0 ? '#c0392b' : deltaNum < 0 ? '#27ae60' : '#718096';

  return (
    <div className="whatif-container">
      <h3 className="whatif-title">What-If Scenario Analyzer</h3>
      <p className="whatif-subtitle">
        Adjust the sliders to see how changes in key risk factors affect your stroke probability in real time.
      </p>

      <div className="whatif-controls">
        {/* Age slider */}
        <div className="whatif-field">
          <label>Age: <strong>{sliders.age}</strong> years</label>
          <input type="range" name="age" min="1" max="120" step="1"
            value={sliders.age} onChange={handleSlider} />
        </div>

        {/* Glucose slider */}
        <div className="whatif-field">
          <label>Avg Glucose: <strong>{sliders.avg_glucose_level.toFixed(0)}</strong> mg/dL</label>
          <input type="range" name="avg_glucose_level" min="40" max="600" step="1"
            value={sliders.avg_glucose_level} onChange={handleSlider} />
        </div>

        {/* BMI slider */}
        <div className="whatif-field">
          <label>BMI: <strong>{Number(sliders.bmi).toFixed(1)}</strong> kg/m²</label>
          <input type="range" name="bmi" min="10" max="70" step="0.5"
            value={sliders.bmi} onChange={handleSlider} />
        </div>

        {/* Hypertension toggle */}
        <div className="whatif-field whatif-toggle-field">
          <label>Hypertension</label>
          <button
            className={`whatif-toggle ${sliders.hypertension === 1 ? 'active' : ''}`}
            onClick={() => handleToggle('hypertension')}
          >
            {sliders.hypertension === 1 ? 'Yes' : 'No'}
          </button>
        </div>

        {/* Heart Disease toggle */}
        <div className="whatif-field whatif-toggle-field">
          <label>Heart Disease</label>
          <button
            className={`whatif-toggle ${sliders.heart_disease === 1 ? 'active' : ''}`}
            onClick={() => handleToggle('heart_disease')}
          >
            {sliders.heart_disease === 1 ? 'Yes' : 'No'}
          </button>
        </div>
      </div>

      {/* Results comparison */}
      <div className="whatif-results">
        <div className="whatif-col">
          <p className="whatif-col-label">Original</p>
          <p className="whatif-prob" style={{ color: '#2b6cb0' }}>
            {originalResult.probability.toFixed(2)}%
          </p>
          <p className="whatif-level">{originalResult.risk_level} Risk</p>
        </div>

        <div className="whatif-arrow">
          {loading ? (
            <span className="whatif-loading">...</span>
          ) : (
            deltaNum !== null && (
              <span className="whatif-delta" style={{ color: deltaColor }}>
                {deltaNum > 0 ? `+${delta}` : delta}%
              </span>
            )
          )}
        </div>

        <div className="whatif-col">
          <p className="whatif-col-label">What-If</p>
          {whatIfResult ? (
            <>
              <p className="whatif-prob" style={{ color: '#2b6cb0' }}>
                {whatIfResult.probability.toFixed(2)}%
              </p>
              <p className="whatif-level">{whatIfResult.risk_level} Risk</p>
            </>
          ) : (
            <p className="whatif-prob" style={{ color: '#a0aec0' }}>—</p>
          )}
        </div>
      </div>

      {error && <p className="whatif-error">{error}</p>}
    </div>
  );
}
