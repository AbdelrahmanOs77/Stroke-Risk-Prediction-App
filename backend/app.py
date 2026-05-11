from flask import Flask
from flask_cors import CORS
from routes.predict import predict_bp
from routes.history import history_bp
from routes.stats   import stats_bp
from utils.db import init_db

app = Flask(__name__)
CORS(app)

# Initialize SQLite DB on startup
init_db()

app.register_blueprint(predict_bp, url_prefix='/api')
app.register_blueprint(history_bp, url_prefix='/api')
app.register_blueprint(stats_bp,   url_prefix='/api')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
