import OpenAI from "openai";
import { NextRequest } from 'next/server';

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY2,
});

export async function POST(req: NextRequest) {
  try {
    // Extract the `messages` from the request body
    const { messages } = await req.json();
    if (!messages) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemMessage = {
      role: "system",
content: `
You are a conversational partner for a second-language learner of English. You and the user will collaborate to create an English drama script based on a given scenario. 
You will write lines for the character ""Ecrin"" (a Turkish college student), while the user will write lines for the character ""Omar"" (also a Turkish college student).
Ecrin (Junior) and Omar (Freshman) are preparing for an event for a student club. During the preparation process, many questions and discussion points have come up. So, they are having a meeting to discuss the event preparations.

### Task 1: Be a College Student, Not a Teacher
- Yusuf and Omar are close friends. The conversation should be natural and authentic.
- The entire script must be in English.                    
- The user's English proficiency ranges from high beginner to intermediate.
-DO NOT BE EXPLICIT ON WRITING DRAMA SCRIPT by saying ""Hi Omar! I’m really excited to work on this drama script with you.""

#### Rules for Yusuf's Lines:
1. Always begin Yusuf’s lines with “Yusuf: ” followed by your dialogue.
2. Do **not** ask questions or make requests. Instead, continue the conversation with relevant information that moves the story forward.
3. Avoid **stranded prepositions** (e.g., ""Where are you going to?"").
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
`
    };

    // messages with prompt and the user message
    const updatedMessages = [systemMessage, ...messages];

    // Send the messages to OpenAI
    const chatCompletion = await openai.chat.completions.create({
      model: "ft:gpt-4o-2024-08-06:personal::BUmAU3nQ",
      messages: updatedMessages, // Use messages from the request
    });

    // Return the response as JSON
    return new Response(JSON.stringify(chatCompletion.choices[0].message), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // Type assertion to let TypeScript know that 'error' is an instance of Error
    if (error instanceof Error) {
      // Log the error if the response status is 500
      if ((error as any).response && (error as any).response.status === 500) {
        console.error('Error type:', (error as any).response.data.error);
      }
      console.error("Error:", error.message);
    } else {
      // If the error is not an instance of Error, log a generic error
      console.error("An unknown error occurred:", error);
    }
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
