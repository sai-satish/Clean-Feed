import csv
from pathlib import Path


def read_existing_csv_data(path) -> list:
    CSV_FILE = Path(path)
    if not CSV_FILE.exists():  
        return []

    with open(CSV_FILE, mode='r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)

    
def read_matching_rows(path: str, attributes: dict):
    CSV_FILE = Path(path)
    matching_rows = []

    if not CSV_FILE.exists():
        print(f"File {path} does not exist.")
        return matching_rows

    with open(CSV_FILE, mode='r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if all(row.get(k) == str(v) for k, v in attributes.items()):
                matching_rows.append(row)

    return matching_rows

def update_or_append_row(path: str, to_change: dict, fixed_cols: dict):
    fieldnames = ["userId", "genres", "tags", "liked", "watch_duration", "video_url"]
    CSV_FILE = Path(path)
    rows = []
    updated = False

    # Read existing data
    if CSV_FILE.exists():
        with open(CSV_FILE, mode='r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Normalize None keys and filter out unknown ones
                row = {k: v for k, v in row.items() if k in fieldnames}
                if all(row.get(k) == str(v) for k, v in fixed_cols.items()):
                    for k, v in to_change.items():
                        if k in fieldnames:
                            row[k] = str(v)
                    updated = True
                rows.append(row)

    # Add new row if no match found
    if not updated:
        new_row = {**fixed_cols, **to_change}
        new_row = {k: str(new_row.get(k, "")) for k in fieldnames}
        rows.append(new_row)

    # Write all rows with proper headers
    with open(CSV_FILE, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            clean_row = {k: row.get(k, "") for k in fieldnames}
            writer.writerow(clean_row)
