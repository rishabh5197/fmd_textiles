from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from project.models import User
from .forms import LoginForm, RegistrationForm

spinning_bp = Blueprint(
    "spinning",
    __name__,
    template_folder="templates",
    static_folder="static",
    url_prefix=""
)

@spinning_bp.route("/")
def home():
    return render_template("spinning/index.html")

@spinning_bp.route("/login", methods=["GET", "POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        # Dummy lookup (replace with real password check)
        user = User.query.filter_by(email=form.email.data.lower()).first()
        if user:
            login_user(user, remember=form.remember_me.data)
            flash("Logged in!", "success")
            next_url = request.args.get("next") or url_for("spinning.home")
            return redirect(next_url)
        flash("Invalid credentials.", "danger")
    return render_template("base.html", content_title="Login", content=form)

@spinning_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Logged out.", "info")
    return redirect(url_for("spinning.home"))

@spinning_bp.route("/protected")
@login_required
def protected():
    return render_template("base.html", content_title="Protected", content="Only logged-in users can see this.")
