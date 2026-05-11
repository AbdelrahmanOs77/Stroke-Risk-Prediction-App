import os
import sys
from flask import Blueprint, jsonify

_HERE    = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.dirname(_HERE)
sys.path.insert(0, _BACKEND)

from utils.db import get_history, delete_prediction, clear_history

history_bp = Blueprint('history', __name__)


@history_bp.route('/history', methods=['GET'])
def list_history():
    records = get_history(limit=50)
    return jsonify(records)


@history_bp.route('/history/<int:record_id>', methods=['DELETE'])
def delete_one(record_id):
    deleted = delete_prediction(record_id)
    if deleted:
        return jsonify({'message': 'Deleted'}), 200
    return jsonify({'error': 'Record not found'}), 404


@history_bp.route('/history', methods=['DELETE'])
def delete_all():
    clear_history()
    return jsonify({'message': 'History cleared'}), 200
