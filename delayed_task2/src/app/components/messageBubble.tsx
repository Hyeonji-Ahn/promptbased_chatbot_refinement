import React from "react";

interface MessageBubbleProps {
  text: string;
  sender: "user" | "assistant";
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, sender }) => {
  const isUser = sender === "user";
  
  // Check if text contains both Ecrin: and [Feedback]
  const ecrinMatch = text.match(/(Ecrin:[\s\S]*?)(?=\n\n\[Feedback\]|$)/);
  const feedbackMatch = text.match(/\[Feedback\]([\s\S]*?)$/);
  const chatText = ecrinMatch ? ecrinMatch[1].trim() : (feedbackMatch ? "" : text);
  const feedbackText = feedbackMatch ? feedbackMatch[1].trim().replace(/\[Feedback\]\s*/gi, '') : "";


  return (
    <div className={`py-2 flex flex-col gap-2 w-full max-w-md ${isUser ? "items-end" : "items-start"}`}>
      {feedbackText && (
        <div className="bg-pink-100 text-pink-900 p-4 rounded-2xl shadow-md border border-pink-300 max-w-xs md:max-w-sm lg:max-w-md">
          {feedbackText.includes("Error:") && (
            <>
              <strong className="block mt-2">Error:</strong>
              <p className="mt-1">{feedbackText.split("Feedback:")[0].replace("Error:", "").trim()}</p>
            </>
          )}
          {feedbackText.includes("Feedback:") && (
            <p className="mt-1">{feedbackText.split("Feedback:")[1]?.trim()}</p>
          )}
          {!feedbackText.includes("Error:") && !feedbackText.includes("Feedback:") && (
            <p className="mt-1">{feedbackText}</p>
          )}
        </div>
      )}
      {chatText && (
        <div
          className={`px-3 py-3 rounded-xl max-w-xs md:max-w-sm lg:max-w-md ${
            isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
          }`}
        >
          {chatText}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;