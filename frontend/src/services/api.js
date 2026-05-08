const BASE_URL = 'http://localhost:5000/api';

export async function predictStroke(formData) {
  const response = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  const data = await response.json();

  if (response.status === 422 && data.validation_errors) {
    const msgs = Object.values(data.validation_errors).join(' | ');
    throw new Error(`Validation: ${msgs}`);
  }
  if (!response.ok) throw new Error(data.error || 'Server error');
  return data;
}
