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
    """Read cost codes with descriptions from an Excel file"""
    cost_codes = []
    try:
        wb = openpyxl.load_workbook(file_path)
        ws = wb.active
        
        # Try different patterns to find code and description columns
        # Pattern 1: First row is header, code in first column, description in second
        # Pattern 2: Code and description alternate in same column
        # Pattern 3: Code in one column, description in another
        
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            return cost_codes
        
        # Check if first row looks like headers
        first_row = rows[0]
        has_headers = any(str(cell or '').lower() in ['code', 'cost code', 'account', 'item', 'description', 'type'] for cell in first_row)
        
        start_row = 1 if has_headers else 0
        
        # Try to find code and description columns
        code_col = None
        desc_col = None
        
        if has_headers:
            for idx, header in enumerate(first_row):
                header_str = str(header or '').lower()
                if 'code' in header_str or 'account' in header_str or 'item' in header_str:
                    code_col = idx
                if 'description' in header_str or 'type' in header_str:
                    desc_col = idx
        
        # If we found columns, use them
        if code_col is not None:
            for row in rows[start_row:]:
                if not row:
                    continue
                code = str(row[code_col] or '').strip()
                description = str(row[desc_col] if desc_col is not None and desc_col < len(row) else '').strip() if desc_col is not None else ''
                
                if code and code.lower() not in ['code', 'cost code', 'account', 'item', '']:
                    cost_codes.append({
                        'code': code,
                        'description': description if description else code
                    })
        else:
            # Try alternating pattern or single column
            for row in rows[start_row:]:
                if not row:
                    continue
                # Check each cell
                for idx, cell_value in enumerate(row):
                    if cell_value:
                        cell_str = str(cell_value).strip()
                        if cell_str and cell_str.lower() not in ['code', 'cost code', 'account', 'item', 'description', 'type', '']:
                            # Check if it looks like a code (starts with number or is short)
                            if cell_str[0].isdigit() or len(cell_str) <= 10:
                                # This might be a code, next cell might be description
                                description = ''
                                if idx + 1 < len(row) and row[idx + 1]:
                                    description = str(row[idx + 1]).strip()
                                
                                # Check if we already have this code
                                if not any(cc['code'] == cell_str for cc in cost_codes):
                                    cost_codes.append({
                                        'code': cell_str,
                                        'description': description if description else cell_str
                                    })
                            elif not any(cc['code'] == cell_str for cc in cost_codes) and not any(cc['description'] == cell_str for cc in cost_codes):
                                # Might be a standalone description or code
                                cost_codes.append({
                                    'code': cell_str,
                                    'description': cell_str
                                })
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        import traceback
        traceback.print_exc()
    
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
