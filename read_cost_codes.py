import sys
import json
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("openpyxl not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl"])
    import openpyxl

def read_excel_cost_codes(file_path):
    """Read cost codes from an Excel file"""
    cost_codes = []
    try:
        wb = openpyxl.load_workbook(file_path)
        # Try to read from the first sheet
        ws = wb.active
        
        # Look for cost codes - they might be in different columns
        # Common patterns: first column, or a column labeled "Cost Code", "Code", etc.
        for row in ws.iter_rows(values_only=True):
            if not row:
                continue
            # Check each cell in the row
            for cell_value in row:
                if cell_value and isinstance(cell_value, (str, int, float)):
                    code = str(cell_value).strip()
                    if code and code not in cost_codes:
                        # Filter out header-like text
                        if code.lower() not in ['cost code', 'code', 'cost codes', 'description', '']:
                            cost_codes.append(code)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    
    return cost_codes

def main():
    downloads = Path.home() / "Downloads"
    files = {
        "JLC": downloads / "JLC Cost Codes.xlsx",
        "SHOA": downloads / "SHOACostCodes.xlsx",
        "CDC": downloads / "CDCcostcodes.xlsx"
    }
    
    all_cost_codes = {}
    
    for company, file_path in files.items():
        if file_path.exists():
            print(f"Reading {company} from {file_path.name}...")
            codes = read_excel_cost_codes(file_path)
            all_cost_codes[company] = codes
            print(f"  Found {len(codes)} cost codes")
        else:
            print(f"File not found: {file_path}")
    
    # Output as JSON
    print("\n" + json.dumps(all_cost_codes, indent=2))

if __name__ == "__main__":
    main()
