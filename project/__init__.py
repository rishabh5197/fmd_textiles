from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect
import os

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()
csrf = CSRFProtect()

def create_app(config_object: str | None = None) -> Flask:
    app = Flask(__name__, template_folder=None, static_folder=None)

    # ---- Basic config ----
    app.config.setdefault("SECRET_KEY", os.getenv("SECRET_KEY", "dev-secret-change-me"))
    app.config.setdefault("SQLALCHEMY_DATABASE_URI", os.getenv("DATABASE_URL", "sqlite:///app.db"))
    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)
    app.config.setdefault("WTF_CSRF_ENABLED", True)

    if config_object:
        app.config.from_object(config_object)

    # ---- Init extensions ----
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)

    login_manager.login_view = "spinning.login"
    login_manager.login_message_category = "info"

    # ---- Import models AFTER db is ready ----
    # (This ensures model classes bind to the right db and avoids circular imports)
    from . import models  # noqa: F401

    # ---- Register blueprints AFTER extensions/models ----
    from .spinning.views import spinning_bp
    app.register_blueprint(spinning_bp)

    return app

# Define the user loader with a *local import* to avoid module-level cycles
@login_manager.user_loader
def load_user(user_id: str):
    from .models import User
    return User.query.get(int(user_id))
