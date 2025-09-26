from flask import Flask

def create_app():
    app = Flask(__name__, template_folder="../templates", static_folder="../static")
    app.config['UPLOAD_FOLDER'] = "data"
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
    app.config['SECRET_KEY'] = "trocar_para_uma_chave_secreta"
    from .routes import bp
    app.register_blueprint(bp)
    return app
