import pandas as pd
from pathlib import Path
from .utils import generate_id
import os
from werkzeug.utils import secure_filename

DATA_DIR = Path("data")

def list_spreadsheets():
    return [p.name for p in DATA_DIR.glob("*.xlsx")]

def read_excel_to_structure(filename):
    pass

def update_row(payload):
    pass

def save_structure_to_excel(filename):
    pass

def save_uploaded_file(file_storage):
    filename = secure_filename(file_storage.filename)
    filepath = os.path.join("data", filename)
    file_storage.save(filepath)
    return filepath