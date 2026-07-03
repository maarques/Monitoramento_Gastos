# app/routes.py
from flask import Blueprint, jsonify, redirect, render_template, request, send_from_directory, url_for

from .finance import calculate_financial_summary
from . import services

bp = Blueprint("main", __name__)


@bp.route("/", methods=["GET"])
def index():
    files = services.list_spreadsheets()
    return render_template("index.html", files=files)


@bp.route("/upload", methods=["POST"])
def upload():
    uploaded = request.files.get("file")

    if not uploaded or uploaded.filename == "":
        return redirect(url_for("main.index"))

    try:
        filename = services.save_uploaded_file(uploaded)
    except ValueError:
        return redirect(url_for("main.index"))

    return redirect(url_for("main.dashboard", file=filename))


@bp.route("/dashboard")
def dashboard():
    file = request.args.get("file")
    if file == "None":
        file = None

    if file:
        try:
            file = services.normalize_workbook_filename(file)
        except ValueError:
            return redirect(url_for("main.index"))

    data = services.get_structure(file)
    if data is None:
        data = {}

    categories = list(data.keys())
    incomes = services.get_incomes(file)
    summary = calculate_financial_summary(data, incomes).to_dict()
    return render_template(
        "dashboard.html",
        data=data,
        file=file,
        categories=categories,
        incomes=incomes,
        summary=summary,
    )


@bp.route("/dashboard/new")
def new_dashboard():
    summary = calculate_financial_summary({}, []).to_dict()
    return render_template("dashboard.html", file=None, data={}, categories=[], incomes=[], summary=summary)


@bp.route("/api/summary", methods=["GET"])
def api_summary():
    file = request.args.get("file")

    if not file:
        return jsonify({"ok": False, "msg": "Nome de arquivo não fornecido"}), 400

    try:
        file = services.normalize_workbook_filename(file)
    except ValueError:
        return jsonify({"ok": False, "msg": "Nome de arquivo inválido"}), 400

    data = services.get_structure(file)
    incomes = services.get_incomes(file)
    summary = calculate_financial_summary(data, incomes).to_dict()
    return jsonify({"ok": True, "summary": summary})


@bp.route("/api/update_row", methods=["POST"])
def api_update_row():
    payload = request.json or {}
    ok = services.update_row(payload)
    return jsonify({"ok": ok})


@bp.route("/api/add_row", methods=["POST"])
def api_add_row():
    payload = request.json or {}
    new_row = services.add_row(payload)
    return jsonify({"ok": bool(new_row), "row": new_row})


@bp.route("/api/delete_row", methods=["POST"])
def api_delete_row():
    payload = request.json or {}
    ok = services.delete_row(payload)
    return jsonify({"ok": ok})


@bp.route("/api/save", methods=["POST"])
def api_save():
    payload = request.json or {}
    source_file = payload.get("source_file")
    target_file = payload.get("target_file")
    incomes = payload.get("incomes")

    if not target_file:
        return jsonify({"ok": False, "msg": "Nome de arquivo não fornecido"}), 400

    ok = services.save_structure_to_excel(source_file, target_file, incomes=incomes)
    if not ok:
        return jsonify({"ok": False, "msg": "Não foi possível salvar a planilha"}), 400

    safe_target_file = services.normalize_workbook_filename(target_file)
    return jsonify(
        {
            "ok": True,
            "file": safe_target_file,
            "download_url": url_for("main.download_file", file=safe_target_file),
        }
    )


@bp.route("/download/<path:file>", methods=["GET"])
def download_file(file):
    try:
        filename = services.normalize_workbook_filename(file)
        path = services.workbook_path(filename)
    except ValueError:
        return redirect(url_for("main.index"))

    if not path.exists():
        return redirect(url_for("main.index"))

    return send_from_directory(services.DATA_DIR, filename, as_attachment=True)


@bp.route("/api/delete_category", methods=["POST"])
def api_delete_category():
    payload = request.json or {}
    file = payload.get("file")
    category = payload.get("category")
    ok = services.delete_category(file, category)
    return jsonify({"ok": ok})
