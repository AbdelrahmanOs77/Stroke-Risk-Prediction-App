import os
import json
from flask import Blueprint, jsonify

_HERE     = os.path.dirname(os.path.abspath(__file__))
_BACKEND  = os.path.dirname(_HERE)
MODEL_DIR = os.path.join(_BACKEND, 'model')

stats_bp   = Blueprint('stats', __name__)
STATS_PATH = os.path.join(MODEL_DIR, 'stats.json')


@stats_bp.route('/stats', methods=['GET'])
def get_stats():
    if not os.path.exists(STATS_PATH):
        return jsonify({
            'error': 'stats.json not found. Re-run train_model.py to generate it.'
        }), 404
    with open(STATS_PATH, 'r') as f:
        data = json.load(f)
    return jsonify(data)
