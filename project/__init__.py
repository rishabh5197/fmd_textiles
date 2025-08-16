import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect
import os


app = Flask(__name__)

# Often people will also separate these into a separate config.py file 
app.config['SECRET_KEY'] = 'mysecretkey'
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'data.sqlite')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
Migrate(app,db)

csrf = CSRFProtect(app)

login_manager = LoginManager(app)
login_manager.login_view = "spinning.login"
login_manager.login_message_category = "info"

@login_manager.user_loader
def load_user(user_id):
    # Local import here to avoid circular import error
    from project.models import User
    return User.query.get(int(user_id))

# Import and register blueprint after everything else is initialized
from project.spinning.views import spinning_bp
app.register_blueprint(spinning_bp)