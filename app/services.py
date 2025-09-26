import pandas as pd
from pathlib import Path
from .utils import generate_id

DATA_DIR = Path("data")

def list_spreadsheets():
    return [p.name for p in DATA_DIR.glob("*.xlsx")]

def read_excel_to_structure(filename):
    pass

def update_row(payload):
    pass

def save_structure_to_excel(filename):
    pass
