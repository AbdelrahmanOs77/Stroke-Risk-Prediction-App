import React, { useState } from 'react';
import jsPDF from 'jspdf';

export default function ExportButton({ result, formData }) {
  const [generating, setGenerating] = useState(false);

  const handleExport = () => {
    setGenerating(true);
    try {
      const doc    = new jsPDF({ unit: 'mm', format: 'a4' });
      const now    = new Date().toLocaleString();
      const margin = 20;
      let y = 20;

      // ── Header ────────────────────────────────────────────────────────────
      doc.setFontSize(20);
      doc.setTextColor(26, 63, 107);
      doc.text('StrokeRisk AI — Patient Report', margin, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(112, 128, 144);
      doc.text(`Generated: ${now}`, margin, y);
      y += 12;

      // ── Risk Result ───────────────────────────────────────────────────────
      const riskColors = { Low: [39, 174, 96], Medium: [214, 137, 16], High: [192, 57, 43] };
      const [r, g, b] = riskColors[result.risk_level] || [100, 100, 100];

      doc.setFontSize(14);
      doc.setTextColor(r, g, b);
      doc.text(`Risk Level: ${result.risk_level} Risk`, margin, y);
      y += 7;

      doc.setFontSize(13);
      doc.text(`Stroke Probability: ${result.probability.toFixed(2)}%`, margin, y);
      y += 12;

      // ── Patient Data Table ────────────────────────────────────────────────
      doc.setFontSize(12);
      doc.setTextColor(26, 63, 107);
      doc.text('Patient Input Summary', margin, y);
      y += 6;

      doc.setDrawColor(200, 200, 210);
      doc.setLineWidth(0.3);
      doc.line(margin, y, 190, y);
      y += 5;

      const fields = [
        ['Gender',            formData.gender],
        ['Age',               `${formData.age} years`],
        ['Hypertension',      formData.hypertension === 1 ? 'Yes' : 'No'],
        ['Heart Disease',     formData.heart_disease === 1 ? 'Yes' : 'No'],
        ['Ever Married',      formData.ever_married],
        ['Work Type',         formData.work_type],
        ['Residence Type',    formData.Residence_type],
        ['Avg Glucose Level', `${formData.avg_glucose_level} mg/dL`],
        ['BMI',               `${formData.bmi} kg/m²`],
        ['Smoking Status',    formData.smoking_status],
      ];

      doc.setFontSize(10);
      fields.forEach(([label, value]) => {
        doc.setTextColor(74, 85, 104);
        doc.text(`${label}:`, margin, y);
        doc.setTextColor(45, 55, 72);
        doc.text(String(value), margin + 58, y);
        y += 6;
      });

      y += 4;
      doc.setDrawColor(200, 200, 210);
      doc.line(margin, y, 190, y);
      y += 8;

      // ── Advice ────────────────────────────────────────────────────────────
      const advice = {
        Low:    'Your risk level appears low. Keep up regular exercise, a balanced diet, and annual health check-ups.',
        Medium: 'Moderate risk detected. Schedule a check-up with your doctor and monitor your blood pressure and glucose regularly.',
        High:   'High risk detected. Please consult a healthcare professional as soon as possible for a full assessment.',
      }[result.risk_level];

      doc.setFontSize(11);
      doc.setTextColor(26, 63, 107);
      doc.text('Clinical Advice:', margin, y);
      y += 6;

      doc.setFontSize(9);
      doc.setTextColor(74, 85, 104);
      const wrapped = doc.splitTextToSize(advice, 170);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 5 + 10;

      // ── Disclaimer ────────────────────────────────────────────────────────
      doc.setFontSize(8);
      doc.setTextColor(160, 174, 192);
      const disclaimer =
        'This report is for informational purposes only and does not constitute medical advice. ' +
        'Consult a qualified healthcare professional for diagnosis and treatment.';
      const dLines = doc.splitTextToSize(disclaimer, 170);
      doc.text(dLines, margin, y);

      doc.save(`stroke-risk-report-${Date.now()}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      className="export-btn"
      onClick={handleExport}
      disabled={generating}
    >
      {generating ? 'Generating PDF...' : '⬇ Export Report as PDF'}
    </button>
  );
}
