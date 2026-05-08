import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function score(value, min, max) {
  return Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
}

export default function Charts({ formData }) {
  const factors = {
    'Age':          score(formData.age, 0, 80),
    'Glucose':      score(formData.avg_glucose_level, 70, 250),
    'BMI':          score(formData.bmi, 15, 45),
    'Hypertension': formData.hypertension === 1 ? 75 : 10,
    'Heart Disease':formData.heart_disease === 1 ? 75 : 10,
  };

  const values = Object.values(factors);

  const data = {
    labels: Object.keys(factors),
    datasets: [{
      label: 'Risk Factor Score (0–100)',
      data: values,
      backgroundColor: values.map(v =>
        v > 60 ? '#e74c3c' : v > 35 ? '#f39c12' : '#27ae60'
      ),
      borderRadius: 4,
    }],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Risk Factor Analysis' },
    },
    scales: {
      y: { beginAtZero: true, max: 100 },
    },
  };

  return (
    <div className="chart-container">
      <Bar data={data} options={options} />
    </div>
  );
}
