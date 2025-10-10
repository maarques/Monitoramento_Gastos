from flask import Flask
from pathlib import Path
import os

def create_app():
    app = Flask(__name__, template_folder="../templates", static_folder="../static")
    app.config['UPLOAD_FOLDER'] = str(Path.cwd() / "data")
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    from . import routes
    app.register_blueprint(routes.bp)

    return app