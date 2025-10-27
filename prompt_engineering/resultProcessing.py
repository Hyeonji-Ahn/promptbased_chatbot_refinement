import pandas as pd
import re
from sentence_transformers import SentenceTransformer, util

# Load the SBERT model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Check if feedback exists
def has_feedback(text):
    return '[feedback]' in text.lower()

# Calculate SBERT similarity
def calculate_similarity(text1, text2):
    emb1 = model.encode(text1, convert_to_tensor=True)
    emb2 = model.encode(text2, convert_to_tensor=True)
    return util.pytorch_cos_sim(emb1, emb2).item()

# Main function
def merge_excel_files_preposition(original_file, produced_file, output_file):
    original_xl = pd.ExcelFile(original_file)
    produced_xl = pd.ExcelFile(produced_file)

    total_feedback_match_percentage = 0
    total_sheets = 0
    sheet_feedback_match_percentage = {}
    total_semantic_similarity = 0
    similarity_count = 0

    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        for sheet_name in original_xl.sheet_names:
            if sheet_name in produced_xl.sheet_names:
                original_df = original_xl.parse(sheet_name)
                produced_df = produced_xl.parse(sheet_name)

                if original_df.shape[1] >= 2 and produced_df.shape[1] >= 2:
                    original_col2 = original_df.iloc[:, 1].astype(str)
                    produced_col2 = produced_df.iloc[:, 1].astype(str)

                    original_feedback_flags = []
                    produced_feedback_flags = []
                    feedback_matches = []
                    feedback_similarities = []

                    for o_text, p_text in zip(original_col2, produced_col2):
                        original_has_feedback = has_feedback(o_text)
                        produced_has_feedback = has_feedback(p_text)

                        original_feedback_flags.append(original_has_feedback)
                        produced_feedback_flags.append(produced_has_feedback)

                        feedback_matches.append(int(original_has_feedback == produced_has_feedback))

                        # Only calculate similarity if both texts have feedback
                        if original_has_feedback and produced_has_feedback:
                            similarity_score = calculate_similarity(o_text, p_text)
                            feedback_similarities.append(similarity_score)
                            similarity_count += 1
                        else:
                            feedback_similarities.append('N/A')

                    merged_df = pd.DataFrame({
                        'Original Col 1': original_df.iloc[:, 0],
                        'Original Col 2': original_col2,
                        'Produced Col 2': produced_col2,
                        'Original Feedback Flag': original_feedback_flags,
                        'Produced Feedback Flag': produced_feedback_flags,
                        'Feedback Match': feedback_matches,
                        'Semantic Similarity': feedback_similarities
                    })

                    feedback_match_percentage = (sum(feedback_matches) / len(feedback_matches)) * 100 if len(feedback_matches) > 0 else 0
                    total_feedback_match_percentage += feedback_match_percentage
                    total_sheets += 1
                    sheet_feedback_match_percentage[sheet_name] = feedback_match_percentage

                    sheet_similarity_values = [s for s in feedback_similarities if isinstance(s, float)]
                    average_semantic_similarity = (sum(sheet_similarity_values) / len(sheet_similarity_values)) if sheet_similarity_values else 0
                    total_semantic_similarity += sum(sheet_similarity_values)

                    summary_row = pd.DataFrame({
                        'Original Col 1': [''],
                        'Original Col 2': [''],
                        'Produced Col 2': [''],
                        'Original Feedback Flag': [''],
                        'Produced Feedback Flag': [''],
                        'Feedback Match': [f'{feedback_match_percentage:.2f}%'],
                        'Semantic Similarity': [f'{average_semantic_similarity:.2f}' if sheet_similarity_values else 'N/A']
                    })

                    merged_df = pd.concat([merged_df, summary_row], ignore_index=True)
                    merged_df.to_excel(writer, sheet_name=sheet_name, index=False)

        overall_feedback_match_percentage = (total_feedback_match_percentage / total_sheets) if total_sheets > 0 else 0
        overall_semantic_similarity = (total_semantic_similarity / similarity_count) if similarity_count > 0 else 0

        summary_df = pd.DataFrame({
            'Overall Feedback Match Percentage': [f'{overall_feedback_match_percentage:.2f}%'],
            'Overall Average Semantic Similarity': [f'{overall_semantic_similarity:.2f}' if similarity_count > 0 else 'N/A']
        })

        worst_sheets = sorted(sheet_feedback_match_percentage.items(), key=lambda x: x[1])[:2]
        worst_df = pd.DataFrame(worst_sheets, columns=['Sheet Name', 'Feedback Match %'])
        worst_df['Feedback Match %'] = worst_df['Feedback Match %'].map(lambda x: f'{x:.2f}%')

        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        worst_df.to_excel(writer, sheet_name='Summary', startrow=3, index=False)

# Run the function
merge_excel_files_preposition(
    'Task 1_immediate_anonymized.xlsx',
    'chatbot_responses.xlsx',
    'ImmResult_Semantic.xlsx'
)
