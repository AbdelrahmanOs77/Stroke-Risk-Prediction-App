import React from 'react';

const CFG = {
  Low:    { color: '#27ae60', bg: '#eafaf1', border: '#a9dfbf', label: 'Low Risk',    icon: '✓' },
  Medium: { color: '#d68910', bg: '#fef9e7', border: '#f9e79f', label: 'Medium Risk', icon: '!' },
  High:   { color: '#c0392b', bg: '#fdedec', border: '#f5b7b1', label: 'High Risk',   icon: '✕' },
};

const GENERAL_ADVICE = {
  Low:    'Your risk level appears low. Keep up regular exercise, a balanced diet, and annual health check-ups.',
  Medium: 'Moderate risk detected. Schedule a check-up with your doctor and monitor your blood pressure and glucose regularly.',
  High:   'High risk detected. Please consult a healthcare professional as soon as possible for a full assessment.',
};

function getPersonalizedTips(formData) {
  if (!formData) return [];
  const tips = [];
  if (Number(formData.age) > 60)
    tips.push('Age is a significant risk factor — more frequent stroke screenings are recommended.');
  if (Number(formData.avg_glucose_level) > 125)
    tips.push('Blood glucose is elevated — consult an endocrinologist about glucose management and diabetes screening.');
  if (Number(formData.bmi) > 30)
    tips.push('BMI indicates obesity — weight management may meaningfully reduce stroke and cardiovascular risk.');
  if (Number(formData.hypertension) === 1)
    tips.push('Manage blood pressure with prescribed medication and a low-sodium diet as advised by your doctor.');
  if (Number(formData.heart_disease) === 1)
    tips.push('Cardiac monitoring is strongly advised — work closely with a cardiologist for ongoing assessment.');
  return tips;
}

function CircleGauge({ pct, color }) {
  const R    = 54;
  const circ = 2 * Math.PI * R;
  const fill = (Math.min(pct, 100) / 100) * circ;

  return (
    <svg width="148" height="148" viewBox="0 0 148 148" className="gauge-svg">
      {/* track */}
      <circle cx="74" cy="74" r={R} fill="none" stroke="#e2e8f0" strokeWidth="12" />
      {/* fill */}
      <circle
        cx="74" cy="74" r={R}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        transform="rotate(-90 74 74)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      {/* percentage text */}
      <text x="74" y="68" textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>
        {pct.toFixed(1)}%
      </text>
      <text x="74" y="88" textAnchor="middle" fontSize="11" fill="#718096">
        probability
      </text>
    </svg>
  );
}

export default function ResultCard({ result, formData }) {
  const { probability, risk_level } = result;
  const cfg  = CFG[risk_level];
  const tips = getPersonalizedTips(formData);

  return (
    <div className="result-card" style={{ background: cfg.bg, borderColor: cfg.border }}>
      {/* header row */}
      <div className="result-header">
        <span className="result-badge" style={{ background: cfg.color }}>{cfg.icon}</span>
        <span className="result-title" style={{ color: cfg.color }}>{cfg.label}</span>
      </div>

      {/* gauge + bar */}
      <div className="gauge-row">
        <CircleGauge pct={probability} color={cfg.color} />
        <div className="gauge-details">
          <p className="prob-label">Stroke Probability</p>
          <div className="prob-bar-track">
            <div className="prob-bar-fill"
              style={{ width: `${Math.min(probability, 100)}%`, background: cfg.color }} />
          </div>
          <p className="prob-value" style={{ color: cfg.color }}>{probability.toFixed(2)}%</p>
        </div>
      </div>

      <p className="result-advice">{GENERAL_ADVICE[risk_level]}</p>

      {tips.length > 0 && (
        <ul className="advice-bullets">
          {tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      )}

      <p className="disclaimer">
        This tool is for informational purposes only and does not replace professional medical advice.
      </p>
    </div>
  );
}
