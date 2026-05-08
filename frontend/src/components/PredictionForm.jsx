import React, { useState, useCallback } from 'react';
import { predictStroke } from '../services/api';

const DEFAULTS = {
  gender: 'Male', age: '', hypertension: '0', heart_disease: '0',
  ever_married: 'Yes', work_type: 'Private', Residence_type: 'Urban',
  avg_glucose_level: '', bmi: '', smoking_status: 'never smoked',
};

// ── field-level validation rules ──────────────────────────────────────────────
function validateField(name, value, allValues) {
  const num = parseFloat(value);
  switch (name) {
    case 'age':
      if (value === '' || isNaN(num)) return 'Age is required.';
      if (num < 1 || num > 120)       return 'Age must be between 1 and 120.';
      return '';
    case 'bmi':
      if (value === '' || isNaN(num)) return 'BMI is required.';
      if (num < 10 || num > 70)       return 'BMI must be between 10 and 70 kg/m².';
      return '';
    case 'avg_glucose_level':
      if (value === '' || isNaN(num)) return 'Glucose level is required.';
      if (num < 40 || num > 600)      return 'Glucose must be between 40 and 600 mg/dL.';
      return '';
    case 'work_type': {
      const age = parseFloat(allValues.age);
      if (!isNaN(age) && age < 15 && !['children', 'Never_worked'].includes(value))
        return 'Patients under 15 must be "children" or "Never_worked".';
      return '';
    }
    case 'ever_married': {
      const age = parseFloat(allValues.age);
      if (!isNaN(age) && age < 18 && value === 'Yes')
        return 'Patients under 18 cannot be married.';
      return '';
    }
    case 'hypertension': {
      const age = parseFloat(allValues.age);
      if (!isNaN(age) && age < 10 && value === '1')
        return 'Hypertension is extremely rare under age 10 — please verify.';
      return '';
    }
    case 'smoking_status': {
      const age = parseFloat(allValues.age);
      if (!isNaN(age) && age < 5 && ['smokes', 'formerly smoked'].includes(value))
        return 'Smoking status invalid for patients under 5.';
      return '';
    }
    default: return '';
  }
}

function validateAll(form) {
  const errs = {};
  Object.keys(form).forEach(k => {
    const msg = validateField(k, form[k], form);
    if (msg) errs[k] = msg;
  });
  return errs;
}

// ── small sub-components ──────────────────────────────────────────────────────
function Field({ label, hint, error, touched, children }) {
  const state = !touched ? '' : error ? 'field-error' : 'field-ok';
  return (
    <div className={`form-group ${state}`}>
      <label>{label}{hint && <span className="field-hint"> ({hint})</span>}</label>
      {children}
      {touched && error && <p className="field-err-msg">{error}</p>}
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="form-section-header">
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

// ── main form ─────────────────────────────────────────────────────────────────
export default function PredictionForm({ onResult }) {
  const [form,    setForm]    = useState(DEFAULTS);
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  const handle = useCallback((e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value, next) }));
    }
    // re-validate dependent fields
    if (name === 'age') {
      ['work_type','ever_married','hypertension','smoking_status'].forEach(dep => {
        if (touched[dep]) {
          setErrors(prev => ({ ...prev, [dep]: validateField(dep, next[dep], next) }));
        }
      });
    }
  }, [form, touched]);

  const blur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value, form) }));
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.keys(DEFAULTS).reduce((a, k) => ({ ...a, [k]: true }), {});
    setTouched(allTouched);
    const allErrors = validateAll(form);
    setErrors(allErrors);
    if (Object.values(allErrors).some(Boolean)) return;

    setLoading(true);
    setApiErr('');
    try {
      const payload = {
        ...form,
        age:               parseFloat(form.age),
        hypertension:      parseInt(form.hypertension),
        heart_disease:     parseInt(form.heart_disease),
        avg_glucose_level: parseFloat(form.avg_glucose_level),
        bmi:               parseFloat(form.bmi),
      };
      const result = await predictStroke(payload);
      onResult(result, payload);
    } catch (err) {
      setApiErr(err.message || 'Failed to connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <form className="prediction-form" onSubmit={handleSubmit} noValidate>

      {/* ── Section 1 ── */}
      <SectionHeader title="Patient Information" subtitle="Basic demographic details" />
      <div className="form-grid">
        <Field label="Gender" error={errors.gender} touched={touched.gender}>
          <select name="gender" value={form.gender} onChange={handle} onBlur={blur}>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </Field>

        <Field label="Age" hint="1 – 120 years" error={errors.age} touched={touched.age}>
          <input type="number" name="age" value={form.age} onChange={handle} onBlur={blur}
            min="1" max="120" placeholder="e.g. 45" />
        </Field>

        <Field label="Ever Married" error={errors.ever_married} touched={touched.ever_married}>
          <select name="ever_married" value={form.ever_married} onChange={handle} onBlur={blur}>
            <option>Yes</option><option>No</option>
          </select>
        </Field>

        <Field label="Residence Type" error={errors.Residence_type} touched={touched.Residence_type}>
          <select name="Residence_type" value={form.Residence_type} onChange={handle} onBlur={blur}>
            <option>Urban</option><option>Rural</option>
          </select>
        </Field>

        <Field label="Work Type" error={errors.work_type} touched={touched.work_type}>
          <select name="work_type" value={form.work_type} onChange={handle} onBlur={blur}>
            <option>Private</option><option>Self-employed</option>
            <option>Govt_job</option><option>children</option><option>Never_worked</option>
          </select>
        </Field>
      </div>

      {/* ── Section 2 ── */}
      <SectionHeader title="Medical Conditions" subtitle="Existing diagnoses and measurements" />
      <div className="form-grid">
        <Field label="Hypertension" error={errors.hypertension} touched={touched.hypertension}>
          <select name="hypertension" value={form.hypertension} onChange={handle} onBlur={blur}>
            <option value="0">No</option><option value="1">Yes</option>
          </select>
        </Field>

        <Field label="Heart Disease" error={errors.heart_disease} touched={touched.heart_disease}>
          <select name="heart_disease" value={form.heart_disease} onChange={handle} onBlur={blur}>
            <option value="0">No</option><option value="1">Yes</option>
          </select>
        </Field>

        <Field label="Avg Glucose Level" hint="40 – 600 mg/dL" error={errors.avg_glucose_level} touched={touched.avg_glucose_level}>
          <input type="number" name="avg_glucose_level" value={form.avg_glucose_level}
            onChange={handle} onBlur={blur} min="40" max="600" step="0.1" placeholder="e.g. 100.5" />
        </Field>

        <Field label="BMI" hint="10 – 70 kg/m²" error={errors.bmi} touched={touched.bmi}>
          <input type="number" name="bmi" value={form.bmi} onChange={handle} onBlur={blur}
            min="10" max="70" step="0.1" placeholder="e.g. 25.0" />
        </Field>
      </div>

      {/* ── Section 3 ── */}
      <SectionHeader title="Lifestyle" subtitle="Smoking history" />
      <div className="form-grid form-grid-single">
        <Field label="Smoking Status" error={errors.smoking_status} touched={touched.smoking_status}>
          <select name="smoking_status" value={form.smoking_status} onChange={handle} onBlur={blur}>
            <option>never smoked</option><option>formerly smoked</option>
            <option>smokes</option><option>Unknown</option>
          </select>
        </Field>
      </div>

      {apiErr && <p className="error-msg">{apiErr}</p>}

      <button type="submit" className="submit-btn" disabled={loading || hasErrors}>
        {loading ? 'Analyzing...' : 'Predict Stroke Risk'}
      </button>
    </form>
  );
}
