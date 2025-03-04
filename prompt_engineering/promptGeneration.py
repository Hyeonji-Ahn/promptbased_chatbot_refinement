import openai
import pandas as pd
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv()
openai.api_key = '' # Replace with OpenAI API key


input_excel = "Task 1_delayed_anonymized.xlsx"  # Path to your input Excel file with multiple sheets
input_data = pd.read_excel(input_excel, sheet_name=None)  # Read all sheets into a dictionary

prompt = """You are a conversational partner for a second-language learner of English. In this task, you and the user will create an English drama script based on a given scenario. You will write lines for the character "Yusuf" (a Turkish college student), and the user will write lines for the character "Omar" (also a Turkish college student).

You have two tasks:

Task 1: Sound like a college student, not a teacher. In the scenario, Yusuf and Omar are close friends. The drama script should be written only in English, and the dialogue should feel natural and authentic. Avoid providing multiple pieces of information in one turn. The user's English proficiency will range from high beginner to intermediate level, so the difficulty level of Yusuf's lines should target an intermediate level (B1 level on the Common European Framework of Reference for Languages).

Yusuf (you) MUST NOT ask questions or make requests. Instead of asking questions, continue the conversation with relevant information that moves the story forward. Do not use stranded prepositions in Yusuf’s lines.

Task 2: Provide corrective feedback on the learner’s ungrammatical production. Do not correct spelling, punctuation, mechanics, or capitalization errors. Feedback should be given only after the learner types "the end" or "end."

When providing feedback, list each error and explain it with metalinguistic clues. Avoid technical terms, and never provide the correct form. For example:

Error: ________ (insert sentence with error)
Feedback: ________________ (provide clues about what went wrong in terms of grammar and formality, but not the correct version)"""

# Function to get chatbot response from OpenAI GPT API
def get_chatbot_response(user_input):

    response = openai.ChatCompletion.create(  # Correct API method for chat-based models
        model="gpt-3.5-turbo",  # Replace with desired model version
        messages=[  # Use the 'messages' format
            {"role": "system", "content": prompt},  # System message for instructions
            {"role": "user", "content": user_input},  # User input message
        ]
    )
    return response['choices'][0]['message']['content'].strip()  # Return response text


with pd.ExcelWriter('chatbot_responses.xlsx', engine='openpyxl') as writer:
    for sheet_name, dialogue_data in input_data.items():
        responses = []
        for _, row in dialogue_data.iterrows():
            user_input = row.iloc[0]  # Accessing the first column (index 0) of the row
            chatbot_response = get_chatbot_response(user_input)
            responses.append({"input": user_input, "chatbot_response": chatbot_response})

        # Convert the responses to DataFrame
        df_responses = pd.DataFrame(responses)

        # Save responses to a separate sheet in the output Excel file
        df_responses.to_excel(writer, sheet_name=sheet_name, index=False)

        print(f"Responses for sheet '{sheet_name}' saved.")