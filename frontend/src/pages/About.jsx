import React from 'react';

export default function About() {
  return (
    <div className="about-page">
      <h1>About This Tool</h1>

      <section className="about-section">
        <h2>About the Model</h2>
        <p>
          This application uses a <strong>Calibrated Logistic Regression</strong> model.
          Logistic Regression was chosen because its probability outputs are directly
          meaningful: a 30% output genuinely reflects a 30% estimated stroke risk.
          Isotonic calibration via 5-fold cross-validation further refines these
          probability estimates to align with observed event rates in the dataset.
        </p>
        <p>
          The model is regularized with <code>C=0.3</code> (moderate L2 penalty) using
          the LBFGS solver with a maximum of 2,000 iterations. Calibration wraps five
          independently fitted base estimators whose probability outputs are averaged,
          producing a more stable final prediction.
        </p>
      </section>

      <section className="about-section">
        <h2>Dataset</h2>
        <p>
          The model was trained on the{' '}
          <a
            href="https://www.kaggle.com/datasets/fedesoriano/stroke-prediction-dataset"
            target="_blank"
            rel="noopener noreferrer"
          >
            Kaggle Stroke Prediction Dataset
          </a>
          , which contains <strong>5,110 patient records</strong> with 11 clinical and
          demographic attributes. The stroke rate in this dataset is approximately{' '}
          <strong>4.9%</strong> (249 stroke cases), reflecting real-world class imbalance
          that the model explicitly compensates for.
        </p>
        <p>
          Missing BMI values (approximately 201 records) are imputed with the dataset
          median. Categorical variables (gender, marital status, work type, residence
          type, smoking status) are label-encoded consistently between training and
          inference.
        </p>
      </section>

      <section className="about-section">
        <h2>How Risk Is Calculated</h2>
        <p>
          Beyond the 10 raw clinical features, four <strong>interaction features</strong>{' '}
          are computed and fed to the model:
        </p>
        <ul className="about-list">
          <li>
            <strong>Age &times; Hypertension</strong> — captures that hypertension
            dramatically increases stroke risk specifically in older patients.
          </li>
          <li>
            <strong>Age &times; Heart Disease</strong> — cardiac conditions compound
            with age to elevate risk.
          </li>
          <li>
            <strong>Age &times; Glucose Level / 100</strong> — elevated glucose is
            more dangerous in older patients.
          </li>
          <li>
            <strong>Clinical Risk Score</strong> — a composite integer (0–4) counting
            how many of the following are true: hypertension present, heart disease
            present, age over 60, average glucose over 125 mg/dL.
          </li>
        </ul>
        <p>
          All 14 features are standardized using a <code>StandardScaler</code> fitted
          on the full training set before being passed to the model.
        </p>
        <p>
          The decision threshold is <strong>0.25</strong>. A patient is flagged as
          "stroke predicted" if their probability exceeds this value. Risk levels are:
          below 20% = <strong>Low</strong>, 20–49% = <strong>Medium</strong>,
          50%+ = <strong>High</strong>.
        </p>
      </section>

      <section className="about-section about-disclaimer">
        <h2>Limitations and Disclaimer</h2>
        <ul className="about-list">
          <li>
            This tool is for <strong>educational and informational purposes only</strong>.
            It does not constitute medical advice, diagnosis, or treatment.
          </li>
          <li>
            The model was trained on a single publicly available dataset with known
            limitations (moderate size, single-source data). Results may not generalize
            to all populations.
          </li>
          <li>
            A low predicted risk does not mean no risk. A high predicted risk does not
            mean a stroke will occur. Always consult a qualified healthcare professional
            for clinical decisions.
          </li>
          <li>
            The model cannot account for factors not in the dataset (e.g., family
            history, medication, cholesterol levels, physical activity).
          </li>
        </ul>
      </section>
    </div>
  );
}
