import openai
import pandas as pd
import time
import openpyxl

# Set your OpenAI API key
openai.api_key = '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'  # Replace with your own key hello

# Load input Excel file
input_excel = "Task 1_immediate_anonymized.xlsx"
input_data = pd.read_excel(input_excel, sheet_name=None)

# Conversation prompt
prompt = """
You are a conversational partner for a second-language learner of English. You and the user will collaborate to create an English drama script based on a given scenario. 
You will write lines for the character "Yusuf" (a Turkish college student), while the user will write lines for the character "Omar" (also a Turkish college student).
Yusuf is interested in the ERASMUS program in Spain.  And Yusuf wants to start the program this coming summer. 

### Task 1: Be a College Student, Not a Teacher
- Yusuf and Omar are close friends. The conversation should be natural and authentic, reflecting casual college student interactions.
- The entire script must be in English.                    
- The user's English proficiency ranges from high beginner to intermediate.

#### Rules for Yusuf's Lines:
1. Always begin Yusuf’s lines with “Yusuf: ” followed by your dialogue.
2. Do **not** ask questions or make requests. Instead, continue the conversation with relevant information that moves the story forward.
3. Avoid **stranded prepositions** (e.g., "Where are you going to?").
4. Keep responses **brief**—no more than **two sentences per turn**.

---

### Task 2: Provide Corrective Feedback on Grammatical Errors
As an English language expert, you must provide corrective feedback on **Stranded Preposition Errors** in the user’s sentences.
 However, **do not correct** other grammatical errors especially, errors related to spelling, punctuation, mechanics, or capitalization.

---

### Stranded Preposition Errors
You provide feedback in the following cases:

1. **Missing a necessary stranded preposition in a question**  
   - Example error: *Which country are you planning to study abroad?* (missing *in*)
   - Example feedback: *Try adding a preposition to connect 'study abroad' with the location.*

2. **Incorrectly placing the preposition at the beginning of a question**  
   - Example error: *From whom did you receive the materials?* (too formal in casual conversation)  
   - Example feedback: *This sentence is correct but sounds very formal. Try moving the preposition to the end to make it sound more natural.*

3. **Using an incorrect preposition in a correctly structured sentence**  
   - Example error: *Which country do you want to study abroad to?* (incorrect preposition)  
   - Example feedback: *The preposition is in the right place, but it’s not the correct one. Try using a different preposition.
---

### Instructions for Providing Feedback
- When an error occurs, begin your message with **[Feedback]**.
- List the exact **sentence with the error** before explaining the mistake.
- Use **metalinguistic clues** to describe the issue but **do not provide the correct form directly**.
- After providing feedback, continue the conversation by generating Yusuf’s next line.

---

### Example Interaction

**User:**  
Omar: What program are you planning to apply?  

**Chatbot Response:**  
[Feedback] Error: *What program are you planning to apply?*  
Feedback: *Try adding a preposition to connect 'study abroad' with the location.*  

Yusuf: The ERASMUS program. It's quite exciting to think about studying abroad!

---

Ensure that feedback is **clear, constructive, and encourages self-correction** without overwhelming the learner. Be mindful of learner's English level (high beginner to intermediate) Your primary goal is to maintain an engaging, natural conversation.
"""

# Function to get chatbot response with rate limit handling
def get_chatbot_response(user_input, messages, max_retries=100):
    messages.append({"role": "user", "content": user_input})
    retry_count = 0
    backoff = 10  # Initial wait time in seconds

    while retry_count < max_retries:
        try:
            response = openai.ChatCompletion.create(
                model="gpt-5-2025-08-07",
                messages=messages,
                temperature=1,
            )
            chatbot_reply = response['choices'][0]['message']['content'].strip()
            messages.append({"role": "assistant", "content": chatbot_reply})
            return chatbot_reply

        except openai.error.RateLimitError:
            print(f"Rate limit hit. Retrying in {backoff} seconds...")
            time.sleep(backoff)
            retry_count += 1
            backoff *= 2  # Exponential backoff

        except openai.error.OpenAIError as e:
            print(f"OpenAI API error: {e}")
            return "[Error] API Error"

    print("Max retries reached. Skipping this input.")
    return "[Error] Rate limit exceeded"


num_sheets_to_process = 3  

# Create the output Excel file
with pd.ExcelWriter('chatbot_responses.xlsx', engine='openpyxl') as writer:
    for sheet_name, dialogue_data in list(input_data.items())[:num_sheets_to_process]:
            print(f"Processing sheet: {sheet_name}")
            messages = [{"role": "system", "content": prompt}]
            responses = []

            num_rows = len(dialogue_data)
            current_row = 0

            for _, row in dialogue_data.iterrows():
                user_input = row.iloc[0]
                chatbot_response = get_chatbot_response(user_input, messages)
                responses.append({"input": user_input, "chatbot_response": chatbot_response})
                current_row +=1
                print(f"{current_row} / {num_rows}")


            df_responses = pd.DataFrame(responses)
            df_responses.to_excel(writer, sheet_name=sheet_name, index=False)
            print(f"Responses for sheet '{sheet_name}' saved.")
