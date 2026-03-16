from flask import Flask
from flask_cors import CORS
from config import Config
from routes.auth import auth_bp, init_oauth
from routes.prompt import prompt_bp
from routes.image import image_bp
from routes.history import history_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.secret_key = Config.SECRET_KEY

    CORS(app, origins=[Config.FRONTEND_URL], supports_credentials=True)

    init_oauth(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(prompt_bp, url_prefix="/api")
    app.register_blueprint(image_bp, url_prefix="/api")
    app.register_blueprint(history_bp, url_prefix="/api")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
