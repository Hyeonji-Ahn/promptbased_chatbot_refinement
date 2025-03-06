import pandas as pd
import openpyxl

def merge_excel_files(original_file, produced_file, output_file):
    # Load Excel files
    original_xl = pd.ExcelFile(original_file)
    produced_xl = pd.ExcelFile(produced_file)
    
    # Create a writer to save the merged file
    total_consistency = 0
    sheet_count = 0
    sheet_consistency = {}
    
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        for sheet_name in original_xl.sheet_names:
            if sheet_name in produced_xl.sheet_names:
                # Read the sheets
                original_df = original_xl.parse(sheet_name)
                produced_df = produced_xl.parse(sheet_name)
                
                # Ensure the required columns exist
                if original_df.shape[1] >= 2 and produced_df.shape[1] >= 2:
                    merged_df = pd.DataFrame({
                        'Original Col 1': original_df.iloc[:, 0],
                        'Original Col 2': original_df.iloc[:, 1],
                        'Produced Col 2': produced_df.iloc[:, 1],
                        'Original Feedback Flag': original_df.iloc[:, 1].astype(str).str.contains('Feedback', na=False).astype(int),
                        'Produced Feedback Flag': produced_df.iloc[:, 1].astype(str).str.contains('Feedback', na=False).astype(int)
                    })
                    
                    # Compute consistency flag
                    merged_df['Consistency Flag'] = (merged_df['Original Feedback Flag'] == merged_df['Produced Feedback Flag']).astype(int)
                    
                    # Calculate percentage of consistency flags
                    consistency_percentage = (merged_df['Consistency Flag'].sum() / len(merged_df)) * 100 if len(merged_df) > 0 else 0
                    total_consistency += consistency_percentage
                    sheet_count += 1
                    sheet_consistency[sheet_name] = consistency_percentage
                    
                    # Append percentage row
                    summary_row = pd.DataFrame({
                        'Original Col 1': [''],
                        'Original Col 2': [''],
                        'Produced Col 2': [''],
                        'Original Feedback Flag': [''],
                        'Produced Feedback Flag': [''],
                        'Consistency Flag': [f'{consistency_percentage:.2f}%']
                    })
                    
                    merged_df = pd.concat([merged_df, summary_row], ignore_index=True)
                    
                    # Write to the new sheet
                    merged_df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        # Calculate overall average consistency percentage
        overall_consistency = (total_consistency / sheet_count) if sheet_count > 0 else 0
        
        # Find two sheets with the lowest consistency percentage
        worst_sheets = sorted(sheet_consistency.items(), key=lambda x: x[1])[:2]
        worst_sheets_df = pd.DataFrame(worst_sheets, columns=['Sheet Name', 'Consistency Percentage'])
        worst_sheets_df['Consistency Percentage'] = worst_sheets_df['Consistency Percentage'].map(lambda x: f'{x:.2f}%')
        
        # Save summary
        summary_df = pd.DataFrame({'Overall Consistency Percentage': [f'{overall_consistency:.2f}%']})
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        worst_sheets_df.to_excel(writer, sheet_name='Summary', startrow=2, index=False)

# Example usage
merge_excel_files('Task 1_immediate_anonymized.xlsx', 'chatbot_responses.xlsx', 'ImmResult.xlsx')
