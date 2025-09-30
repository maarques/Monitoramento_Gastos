from flask import Blueprint, render_template, request, jsonify
from . import services

bp = Blueprint("main", __name__)

@bp.route("/", methods=["GET"])
def index():
    return render_template("index.html", files=services.list_spreadsheets())

@bp.route("/upload", methods=["POST"])
def upload():
    uploaded_file = request.files.get("file")
    if not uploaded_file:
        "Nenhum Arquivo Encontrado", 400

    services.save_uploaded_file(uploaded_file)  
    return render_template("dashboard.html", data={}, file = uploaded_file)  
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
