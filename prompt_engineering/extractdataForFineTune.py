import pandas as pd
import json

# Load the Excel file
excel_path = "Task 1_immediate_anonymized_corrected.xlsx"
all_sheets = pd.read_excel(excel_path, sheet_name=None)

with open("fine_tune_data.jsonl", "w", encoding="utf-8") as outfile:
    for sheet_name, df in all_sheets.items():
        df = df.dropna(how='all')
        for _, row in df.iterrows():
            if pd.notna(row.iloc[0]) and pd.notna(row.iloc[1]):
                entry = {
                    "messages": [
                        {"role": "user", "content": str(row.iloc[0]).strip()},
                        {"role": "assistant", "content": str(row.iloc[1]).strip()}
                    ]
                }
                json.dump(entry, outfile)
                outfile.write("\n")
