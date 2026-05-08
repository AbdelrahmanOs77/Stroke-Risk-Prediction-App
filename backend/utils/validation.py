VALID_CATEGORICALS = {
    'gender':          ['Male', 'Female', 'Other'],
    'ever_married':    ['Yes', 'No'],
    'work_type':       ['Private', 'Self-employed', 'Govt_job', 'children', 'Never_worked'],
    'Residence_type':  ['Urban', 'Rural'],
    'smoking_status':  ['formerly smoked', 'never smoked', 'smokes', 'Unknown'],
}

# (field, min, max, unit, note)
NUMERIC_RULES = {
    'age':               (1,   120, 'years',   None),
    'bmi':               (10,  70,  'kg/m²',   'Values below 10 or above 70 are not clinically valid'),
    'avg_glucose_level': (40,  600, 'mg/dL',   'Normal fasting: 70–100 | Pre-diabetic: 100–125 | Diabetic: ≥126'),
}


def validate(data):
    errors = {}

    # ── numeric range checks ──────────────────────────────────────────────────
    for field, (lo, hi, unit, _) in NUMERIC_RULES.items():
        val = data.get(field)
        if val is None or not isinstance(val, (int, float)):
            errors[field] = f'Required numeric value.'
        elif val < lo or val > hi:
            errors[field] = f'Must be between {lo} and {hi} {unit}.'

    # ── binary fields ─────────────────────────────────────────────────────────
    for field in ('hypertension', 'heart_disease'):
        if data.get(field) not in (0, 1):
            errors[field] = 'Must be 0 or 1.'

    # ── categorical fields ────────────────────────────────────────────────────
    for field, valid_vals in VALID_CATEGORICALS.items():
        if data.get(field) not in valid_vals:
            errors[field] = f'Must be one of: {", ".join(valid_vals)}.'

    # ── cross-field medical rules ─────────────────────────────────────────────
    age = data.get('age')
    if isinstance(age, (int, float)) and 'age' not in errors:
        if age < 15 and data.get('work_type') not in ('children', 'Never_worked'):
            errors['work_type'] = 'Patients under 15 must have work type "children" or "Never_worked".'
        if age < 18 and data.get('ever_married') == 'Yes':
            errors['ever_married'] = 'Patients under 18 cannot be married.'
        if age < 10 and data.get('hypertension') == 1:
            errors['hypertension'] = 'Hypertension is extremely rare in children under 10. Please verify.'
        if age < 5 and data.get('smoking_status') in ('smokes', 'formerly smoked'):
            errors['smoking_status'] = 'Smoking status is invalid for patients under 5.'

    bmi = data.get('bmi')
    glucose = data.get('avg_glucose_level')

    # Physiologically inconsistent combinations
    if (isinstance(bmi, (int, float)) and bmi < 15 and
            isinstance(glucose, (int, float)) and glucose > 300):
        errors['avg_glucose_level'] = (
            'Extremely high glucose with very low BMI is a rare and critical combination — please verify both values.'
        )

    return errors
