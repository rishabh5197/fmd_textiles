from flask import Blueprint, render_template, redirect, url_for, flash, request,session
from flask_login import login_user, logout_user, login_required, current_user
from project.models import User
from project.spinning.forms import BalesForm,FABRIC_CHOICES

spinning_bp = Blueprint("spinning",__name__,template_folder="templates",static_folder="static",url_prefix="/spinning",static_url_path="/spinning/static")

@spinning_bp.route("/")
# @login_required  # Uncomment if login required
def home():
    return render_template("spinning/index.html")

@spinning_bp.route("/add_spinning_bales_and_fibers/add", methods=["GET", "POST"])
def add_data_spinning_bales_and_fibers():
    entries = []
    indices = set()
    for key in request.args.keys():
        # match pattern lines-<index>-type
        if key.startswith("lines-") and key.endswith("-type"):
            parts = key.split("-")
            if len(parts) == 3 and parts[1].isdigit():
                indices.add(int(parts[1]))
    for i in sorted(indices):
        fabric = (request.args.get(f"lines-{i}-type") or "").strip()
        bales_raw = (request.args.get(f"lines-{i}-bales") or "").strip()
        try:
            bales = int(bales_raw) if bales_raw != "" else None
        except ValueError:
            bales = None
        # only append if something was filled
        if fabric or bales is not None:
            entries.append({
                "row": i + 1,           # human-readable row number
                "fabric": fabric or "",
                "bales": bales if bales is not None else ""
            })
    session["entries"] = entries

    total_bales = sum(e["bales"] or 0 for e in entries)

    # Render summary page
    return render_template("spinning/add_spinning_bales_and_fibers.html",entries=entries,total_bales=total_bales)

@spinning_bp.route("/edit/<int:entry_id>")
def edit_entry(entry_id):
     entries = session.get("entries", [])
     entry = next((e for e in entries if e["row"] == entry_id), None)
     return f"Going to Edit :- {entry['row']} - {entry['fabric']} - {entry['bales']}" if entry else "Entry not found"

@spinning_bp.route("/delete_entry/<int:entry_id>")
def delete_entry(entry_id):
     entries = session.get("entries", [])
     entry = next((e for e in entries if e["row"] == entry_id), None)
     return f"Going to Delete :- {entry['row']} - {entry['fabric']} - {entry['bales']}" if entry else "Entry not found"

@spinning_bp.route('/next_page', methods=["POST","GET"])
def next_page():
    return "Next Page"

@spinning_bp.route("/modify", methods=["GET", "POST"])
def modify_actions():
    # Placeholder
    return "<h2>Modify Actions - Coming Soon</h2>"


@spinning_bp.route("/retrieve", methods=["GET"])
def retrieve_actions():
    # Placeholder
    return "<h2>Retrieve Actions - Coming Soon</h2>"