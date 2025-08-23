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

    if not entry:
        return "Entry not found", 404

    if request.method == "POST":
        number_of_bales = entry["bales"]

        # update general fields
        entry["country_of_origin"] = request.form.get("country_of_origin", "").strip()
        entry["name_of_cotton"] = request.form.get("name_of_cotton", "").strip()
        entry["invoice_number"] = request.form.get("invoice_number", "").strip()
        entry["party"] = request.form.get("party", "").strip()
        entry["date_of_arrival"] = request.form.get("date_of_arrival", "").strip()
        entry["nt_weight"] = request.form.get("nt_weight", "").strip()
        entry["bci"] = request.form.get("bci", "").strip()

        # update bale variants and recycled info
        variants = []
        recycled_list = []
        for i in range(1, number_of_bales + 1):
            val = request.form.get(f"variant{i}", "").strip()
            recycled_val = request.form.get(f"recycled{i}", "no")  # default no
            variants.append(val if val else "")
            recycled_list.append(recycled_val)

        entry["variants"] = variants
        entry["recycled"] = recycled_list

        # Update session with modified entries
        session["entries"] = entries  

        return redirect(url_for("edit_entry", entry_id=entry_id))

    # GET request → render form
    return render_template(
        "spinning/edit_template.html",
        entry_number=entry["row"],
        entry_fabric=entry["fabric"],
        number_of_bales=entry["bales"],
        variants=entry.get("variants", []),
        country_of_origin=entry.get("country_of_origin", ""),
        name_of_cotton=entry.get("name_of_cotton", ""),
        invoice_number=entry.get("invoice_number", ""),
        party=entry.get("party", ""),
        date_of_arrival=entry.get("date_of_arrival", ""),
        nt_weight=entry.get("nt_weight", ""),
        bci=entry.get("bci", ""),
        recycled=entry.get("recycled", [])
    )

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