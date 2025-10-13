import os
from flask import Flask, jsonify

def create_app():
    app = Flask(__name__)
    upload_folder = '/tmp/data'
    app.config['UPLOAD_FOLDER'] = upload_folder
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
