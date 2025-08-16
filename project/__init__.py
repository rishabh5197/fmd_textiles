from flask import Flask, app
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect
import os
from project.models import *   
from project.spinning.views import spinning_bp

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()
csrf = CSRFProtect()

def create_app(config_object: str | None = None) -> Flask:
    app = Flask(__name__, template_folder=None, static_folder=None)

    # ---- Basic config ----
    app.config.setdefault("SECRET_KEY", os.getenv("SECRET_KEY", "dev-secret-change-me"))
    app.config.setdefault("SQLALCHEMY_DATABASE_URI", os.getenv("DATABASE_URL", "sqlite:///app.db"))

    #  -------------------------------- Postgres SQL -------------------------------------------
    # For example, PostgreSQL running locally
    # app.config.setdefault(
    # "SQLALCHEMY_DATABASE_URI",
    # os.getenv("DATABASE_URL", "postgresql://username:password@localhost:5432/dbname")
    # )


    # Fetch each part from env vars, with sensible defaults if you want
    # pg_host = os.getenv("PG_HOST", "localhost")
    # pg_port = os.getenv("PG_PORT", "5432")
    # pg_db = os.getenv("PG_DATABASE", "mydatabase")
    # pg_user = os.getenv("PG_USERNAME", "myuser")
    # pg_pass = os.getenv("PG_PASSWORD", "mypassword")

    # # Build the PostgreSQL URI string
    # postgres_uri = f"postgresql://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}"

    # app.config.setdefault("SQLALCHEMY_DATABASE_URI", postgres_uri)
    # app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)
    #  -------------------------------- Postgres SQL -------------------------------------------


    #  -------------------------------- For MY SQL -------------------------------------------
    # app = Flask(__name__)

    # mysql_host = os.getenv("MYSQL_HOST", "localhost")
    # mysql_port = os.getenv("MYSQL_PORT", "3306")
    # mysql_db = os.getenv("MYSQL_DATABASE", "mydatabase")
    # mysql_user = os.getenv("MYSQL_USERNAME", "myuser")
    # mysql_pass = os.getenv("MYSQL_PASSWORD", "mypassword")

    # # Format for MySQL URI:
    # # "mysql+mysqlclient://<username>:<password>@<host>:<port>/<dbname>"
    # # If using PyMySQL driver, replace mysqlclient with pymysql

    # mysql_uri = f"mysql+mysqlclient://{mysql_user}:{mysql_pass}@{mysql_host}:{mysql_port}/{mysql_db}"
    # # If using PyMySQL:
    # # mysql_uri = f"mysql+pymysql://{mysql_user}:{mysql_pass}@{mysql_host}:{mysql_port}/{mysql_db}"

    # app.config.setdefault("SQLALCHEMY_DATABASE_URI", mysql_uri)
    # app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)

    #  -------------------------------- For MY SQL -------------------------------------------

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
    

    # ---- Register blueprints AFTER extensions/models ----
    
    app.register_blueprint(spinning_bp)
    return app

# Define the user loader with a *local import* to avoid module-level cycles
@login_manager.user_loader
def load_user(user_id: str):
    return User.query.get(int(user_id))
