from flask import Flask, jsonify
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)

@app.get('/')
def hello():
    return jsonify(message=f"Hello from Flask 3.1", framework="15-flask", version="1.0.0")

@app.get('/health')
def health():
    return jsonify(status='ok', version='1.0.0')

@app.get('/health/live')
def liveness():
    return jsonify(status='ok')

@app.get('/health/ready')
def readiness():
    return jsonify(status='ok')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '8080')))
