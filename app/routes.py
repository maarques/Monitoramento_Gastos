# app/routes.py
from flask import Blueprint, render_template, request, jsonify, redirect, url_for, current_app
from . import services
from .utils import safe_filename

bp = Blueprint("main", __name__)

@bp.route("/", methods=["GET"])
def index():
    files = services.list_spreadsheets()
    return render_template("index.html", files=files)

@bp.route("/upload", methods=["POST"])
def upload():
    uploaded = request.files.get("file")
    
    print("--- INICIANDO DEBUG DO UPLOAD ---")
    print(f"Objeto do arquivo recebido: {uploaded}")
    if uploaded:
        print(f"Nome do arquivo recebido: '{uploaded.filename}'")
    print("---------------------------------")

    if not uploaded or uploaded.filename == '':
        print(">>> PROBLEMA DETECTADO: O nome do arquivo está vazio. Redirecionando para a página inicial.")
        return redirect(url_for("main.index"))
        
    filename = services.save_uploaded_file(uploaded)
    print(f">>> SUCESSO: Arquivo salvo como '{filename}'. Redirecionando para o dashboard.")
    return redirect(url_for("main.dashboard", file=filename))

@bp.route("/dashboard",)
def dashboard():
    file = request.args.get("file")
    if file == 'None': file = None
    data = services.get_structure(file)
    if data is None: data = {}
    categories = list(data.keys())
    return render_template("dashboard.html", data=data, file=file, categories=categories)

@bp.route("/dashboard/new")
def new_dashboard():
    return render_template("dashboard.html", file=None, data={}, categories=[])

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

    if not target_file:
        return jsonify({"ok": False, "msg": "Nome de arquivo não fornecido"}), 400
    
    ok = services.save_structure_to_excel(source_file, target_file)
    return jsonify({"ok": ok})

@bp.route("/api/delete_category", methods=["POST"])
def api_delete_category():
    payload = request.json or {}
    file = payload.get("file")
    category = payload.get("category")
    ok = services.delete_category(file, category)
    return jsonify({"ok": ok})
