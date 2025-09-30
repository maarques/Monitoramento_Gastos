from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from app import services, create_app

bp = Blueprint("main", __name__)

@bp.route("/", methods=["GET"])
def index():
    return render_template("index.html", files=services.list_spreadsheets())

@bp.route("/upload", methods=["POST"])
def upload():
    pass

@bp.route("/dashboard")
def dashboard():
    file = request.args.get("file")
    data = services.read_excel_to_structure(file)
    return render_template("dashboard.html", data=data, file=file)

@bp.route("/api/update_row", methods=["POST"])
def api_update_row():
    payload = request.json
    success = services.update_row(payload)
    return jsonify({"ok": success})

@bp.route("/api/save", methods=["POST"])
def api_save():
    file = request.json.get("file")
    services.save_structure_to_excel(file)
    return jsonify({"ok": True})

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)    
