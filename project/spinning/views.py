from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from project.models import User
from .forms import LoginForm, RegistrationForm

spinning_bp = Blueprint("spinning",__name__,template_folder="templates",static_folder="static",url_prefix="")

@spinning_bp.route("/")
# @login_required
def home():
    return render_template("spinning/index.html")