import React, { useEffect, useState, useCallback } from 'react';
import { fetchHistory, deleteHistoryItem, clearHistory } from '../services/api';

const RISK_COLORS = { Low: '#27ae60', Medium: '#d68910', High: '#c0392b' };

export default function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchHistory()
      .then(data => setRecords(data))
      .catch(err  => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    try {
      await deleteHistoryItem(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all prediction history? This cannot be undone.')) return;
    try {
      await clearHistory();
      setRecords([]);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="page-loading">Loading history...</div>;
  if (error)   return <div className="page-error">{error}</div>;

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>Prediction History</h1>
        {records.length > 0 && (
          <button className="clear-btn" onClick={handleClearAll}>Clear All</button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="history-empty">
          <p>No predictions yet. Run an assessment to see results here.</p>
        </div>
      ) : (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Timestamp (UTC)</th>
                <th>Age</th>
                <th>Glucose</th>
                <th>BMI</th>
                <th>Hypertension</th>
                <th>Heart Disease</th>
                <th>Probability</th>
                <th>Risk Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td className="td-timestamp">{r.timestamp}</td>
                  <td>{r.input_data.age}</td>
                  <td>{r.input_data.avg_glucose_level}</td>
                  <td>{r.input_data.bmi}</td>
                  <td>{r.input_data.hypertension === 1 ? 'Yes' : 'No'}</td>
                  <td>{r.input_data.heart_disease === 1 ? 'Yes' : 'No'}</td>
                  <td><strong>{r.probability.toFixed(2)}%</strong></td>
                  <td>
                    <span
                      className="risk-badge"
                      style={{ background: RISK_COLORS[r.risk_level] }}
                    >
                      {r.risk_level}
                    </span>
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(r.id)}
                      title="Delete this record"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
