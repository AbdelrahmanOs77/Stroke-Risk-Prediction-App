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

export async function fetchHistory() {
  const response = await fetch(`${BASE_URL}/history`);
  if (!response.ok) throw new Error('Failed to load history');
  return response.json();
}

export async function deleteHistoryItem(id) {
  const response = await fetch(`${BASE_URL}/history/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete record');
  return response.json();
}

export async function clearHistory() {
  const response = await fetch(`${BASE_URL}/history`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to clear history');
  return response.json();
}

export async function fetchStats() {
  const response = await fetch(`${BASE_URL}/stats`);
  if (!response.ok) throw new Error('Stats not available — re-run train_model.py to generate stats.json');
  return response.json();
}
