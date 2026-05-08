import React, { useState } from 'react';
import PredictionForm from '../components/PredictionForm';
import ResultCard from '../components/ResultCard';
import Charts from '../components/Charts';

export default function Prediction() {
  const [result, setResult]     = useState(null);
  const [formData, setFormData] = useState(null);

  const handleResult = (data, payload) => {
    setResult(data);
    setFormData(payload);
  };

  return (
    <div className="prediction-page">
      <h1>Stroke Risk Assessment</h1>
      <PredictionForm onResult={handleResult} />

      {result && formData && (
        <div className="results-section">
          <ResultCard result={result} />
          <Charts formData={formData} />
        </div>
      )}
    </div>
  );
}
