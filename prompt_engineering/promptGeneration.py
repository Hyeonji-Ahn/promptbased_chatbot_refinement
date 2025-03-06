import openai
import pandas as pd
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv()
openai.api_key = '' # Replace with OpenAI API key


input_excel = "Task 1_immediate_anonymized.xlsx"  # Path to your input Excel file of the desired output
input_data = pd.read_excel(input_excel, sheet_name=None)  # Read all sheets from the Excel file

prompt = """
You are a conversational partner for a second-language learner of English. You and the user will create an English drama script based on a given scenario. You will write lines for the character "Yusuf" (a Turkish college student), and the user will write lines for the character "Omar" (also a Turkish college student).

Your two tasks are:

Task 1: Be a College Student, Not a Teacher
The scenario involves close friends, Yusuf and Omar. Keep the dialogue natural, authentic, and in English.
The learner’s proficiency will range from high beginner to intermediate, so Yusuf’s lines should target B1 level (intermediate) English—simple but natural.
Rules:

1. Always begin Yusuf’s lines with “Yusuf: ” followed by your dialogue.
2. Do not ask questions or make requests. Instead, keep the conversation flowing with relevant information that moves the story forward.
3. Avoid stranded prepositions (e.g., "Where are you going to?").
4. Keep sentences short and clear. Do not exceed two sentences per turn.

Task 2: Provide Corrective Feedback
When the learner makes grammatical errors, provide feedback in the form of metalinguistic clues. Do not directly correct the error; instead, guide the learner toward the correct structure.

Feedback Rules:

Focus on grammatical errors like stranded prepositions and article usage (definite and indefinite articles).
Do not correct spelling, punctuation, mechanics, or capitalization.
Provide feedback gently and explain the issue without using technical terms.

Example:

Error: Which country are you planning to study abroad?
Feedback: Try adding a preposition to connect 'study abroad' with the location.

"""

# Function to get chatbot response while maintaining conversation history
def get_chatbot_response(user_input, messages):
    messages.append({"role": "user", "content": user_input})  # Add user input
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages  # Maintain full conversation history
    )
    chatbot_reply = response['choices'][0]['message']['content'].strip()
    messages.append({"role": "assistant", "content": chatbot_reply})  # Add bot response
    return chatbot_reply

# Define the range of sheets to process
sheets_to_process = ['31','32','33','34','35','36','37','38','39','42','43']  # Update with the desired sheet names

# Create an output Excel file
with pd.ExcelWriter('chatbot_responses.xlsx', engine='openpyxl') as writer:
    for sheet_name, dialogue_data in input_data.items():
        if sheet_name in sheets_to_process:
            messages = [{"role": "system", "content": prompt}]  # Reset conversation for a new sheet
            responses = []
            
            for _, row in dialogue_data.iterrows():
                user_input = row.iloc[0]  # Accessing the first column of the row
                chatbot_response = get_chatbot_response(user_input, messages)
                responses.append({"input": user_input, "chatbot_response": chatbot_response})

            # Convert responses to DataFrame
            df_responses = pd.DataFrame(responses)

            # Save responses to a separate sheet in the output Excel file
            df_responses.to_excel(writer, sheet_name=sheet_name, index=False)

            print(f"Responses for sheet '{sheet_name}' saved.")
