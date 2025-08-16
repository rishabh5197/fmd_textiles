from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate  # not required, but handy
from flask_wtf.csrf import CSRFProtect
from project.spinning.views import spinning_bp
import os

# Global extensions (they'll be initialized with the app in create_app)
db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()
csrf = CSRFProtect()

def create_app(config_object: str | None = None) -> Flask:
    """
    Application factory.
    You can pass a dotted-path config object string or rely on defaults/env vars.
    """
    app = Flask(__name__, template_folder=None, static_folder=None)

    # ---- Basic config (safe defaults) ----
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

    # Flask-Login defaults (you can customize)
    login_manager.login_view = "spinning.login"
    login_manager.login_message_category = "info"

    # ---- Register blueprints ----
    
    app.register_blueprint(spinning_bp)

    # ---- Jinja global base template path (optional) ----
    # We’ll point templates/static via blueprint; base.html is inside Spinning/templates

    return app

# Flask-Login user loader — imported here to avoid circulars
from project.models import User  # noqa: E402

@login_manager.user_loader
def load_user(user_id: str):
    return User.query.get(int(user_id))
