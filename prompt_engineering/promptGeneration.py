import openai
import pandas as pd
import time
import openai.error

# Set your OpenAI API key
openai.api_key = ''  # Replace with your own key hello

# Load input Excel file
input_excel = "Task 1_immediate_anonymized.xlsx"
input_data = pd.read_excel(input_excel, sheet_name=None)

# Conversation prompt
prompt = """
You are a conversational partner for a second-language learner of English. You and the user will collaborate to create an English drama script based on a given scenario. 
You will write lines for the character "Yusuf" (a Turkish college student), while the user will write lines for the character "Omar" (also a Turkish college student).
Yusuf is interested in the ERASMUS program in Spain.  And Yusuf wants to start the program this coming summer. 

### Task 1: Be a College Student, Not a Teacher
- Yusuf and Omar are close friends. The conversation should be natural and authentic.
- The entire script must be in English.                    
- The user's English proficiency ranges from high beginner to intermediate.

#### Rules for Yusuf's Lines:
1. Always begin Yusuf’s lines with “Yusuf: ” followed by your dialogue.
2. Do **not** ask questions or make requests. Instead, continue the conversation with relevant information that moves the story forward.
3. Avoid **stranded prepositions** (e.g., "Where are you going to?").
4. Keep responses **brief**—no more than **two sentences per turn**.

---

### Task 2: Provide Corrective Feedback on Grammatical Errors
As an English language expert, you must provide corrective feedback on **grammatical errors** in the user’s sentences.
However, **do not correct** errors related to spelling, punctuation, mechanics, or capitalization.

### Instructions for Providing Feedback
- When an error occurs, begin your message with **[Feedback]**
- List the exact **sentence with the error** before explaining the mistake.
- Use **metalinguistic clues** to describe the issue, **do not provide the correct form directly**.
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

Ensure that feedback is **clear, constructive, and encourages self-correction** without overwhelming the learner. Your primary goal is to maintain an engaging, natural conversation.
"""

# Function to get chatbot response with rate limit handling
def get_chatbot_response(user_input, messages, max_retries=100):
    messages.append({"role": "user", "content": user_input})
    retry_count = 0
    backoff = 10  # Initial wait time in seconds

    while retry_count < max_retries:
        try:
            response = openai.ChatCompletion.create(
                model="ft:gpt-4o-2024-08-06:personal::BUmAU3nQ",
                messages=messages,
                temperature=0.3,
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

# Create the output Excel file
with pd.ExcelWriter('chatbot_responses.xlsx', engine='openpyxl') as writer:
    for sheet_name, dialogue_data in input_data.items():
            print(f"Processing sheet: {sheet_name}")
            messages = [{"role": "system", "content": prompt}]
            responses = []

            for _, row in dialogue_data.iterrows():
                user_input = row.iloc[0]
                chatbot_response = get_chatbot_response(user_input, messages)
                responses.append({"input": user_input, "chatbot_response": chatbot_response})

            df_responses = pd.DataFrame(responses)
            df_responses.to_excel(writer, sheet_name=sheet_name, index=False)
            print(f"Responses for sheet '{sheet_name}' saved.")
