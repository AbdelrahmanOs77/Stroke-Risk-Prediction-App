"""
SQLite persistence for prediction history.
Uses only Python's built-in sqlite3 — no SQLAlchemy required.
"""
import os
import sqlite3
import json
from datetime import datetime

_HERE    = os.path.dirname(os.path.abspath(__file__))   # backend/utils/
_BACKEND = os.path.dirname(_HERE)                        # backend/
DB_PATH  = os.path.join(_BACKEND, 'history.db')


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create table if it does not exist. Called once at app startup."""
    conn = _get_conn()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   TEXT    NOT NULL,
            input_data  TEXT    NOT NULL,
            probability REAL    NOT NULL,
            risk_level  TEXT    NOT NULL,
            prediction  INTEGER NOT NULL
        )
    ''')
    conn.commit()
    conn.close()


def save_prediction(input_data: dict, result: dict):
    """
    Persist one prediction row.
    input_data — raw payload dict sent to /api/predict
    result     — dict returned by the model (probability, risk_level, prediction)
    """
    conn = _get_conn()
    conn.execute(
        '''INSERT INTO predictions
           (timestamp, input_data, probability, risk_level, prediction)
           VALUES (?, ?, ?, ?, ?)''',
        (
            datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
            json.dumps(input_data),
            result['probability'],
            result['risk_level'],
            result['prediction'],
        )
    )
    conn.commit()
    conn.close()


def get_history(limit: int = 50):
    """Return the last `limit` predictions, newest first."""
    conn = _get_conn()
    rows = conn.execute(
        'SELECT * FROM predictions ORDER BY id DESC LIMIT ?', (limit,)
    ).fetchall()
    conn.close()
    records = []
    for r in rows:
        records.append({
            'id':          r['id'],
            'timestamp':   r['timestamp'],
            'input_data':  json.loads(r['input_data']),
            'probability': r['probability'],
            'risk_level':  r['risk_level'],
            'prediction':  r['prediction'],
        })
    return records


def delete_prediction(record_id: int) -> bool:
    """Delete one record by id. Returns True if a row was actually deleted."""
    conn = _get_conn()
    cursor = conn.execute('DELETE FROM predictions WHERE id = ?', (record_id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def clear_history():
    """Delete all rows from the predictions table."""
    conn = _get_conn()
    conn.execute('DELETE FROM predictions')
    conn.commit()
    conn.close()
