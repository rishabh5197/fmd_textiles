from flask import Blueprint, render_template
from flask_login import login_user, logout_user, login_required, current_user
from project.models import User
from project.spinning.forms import LoginForm, RegistrationForm

spinning_bp = Blueprint("spinning",__name__,template_folder="templates",static_folder="static",url_prefix="",static_url_path="/spinning/static")

@spinning_bp.route("/")
# @login_required  # Uncomment if login required
def home():
    return render_template("spinning/index.html")