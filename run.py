from app import create_app
from app.routes import bp as main_bp

app = create_app()
app.register_blueprint(main_bp)

if __name__ == "__main__":
    app.run(debug=True)
