import React from "react";

interface MessageBubbleProps {
  text: string;
  sender: "user" | "assistant";
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, sender }) => {
  const isUser = sender === "user";
  
  const feedbackMatch = text.match(/\[Feedback\] ([\s\S]*?)\n?(Yusuf:|$)/);
  const feedbackText = feedbackMatch ? feedbackMatch[1].trim().replace(/\[Feedback\]\s*/gi, '') : "";
  const chatText = feedbackMatch ? text.replace(feedbackMatch[0], "").trim() : text;


  return (
    <div className={`py-2 flex flex-col gap-2 w-full max-w-md ${isUser ? "items-end" : "items-start"}`}>
      {feedbackText && (
        <div className="bg-pink-100 text-pink-900 p-4 rounded-2xl shadow-md border border-pink-300 max-w-xs md:max-w-sm lg:max-w-md">
          <strong>Error:</strong>
          <p className="mt-1">{feedbackText.split("Feedback:")[0]}</p>
          <p className="mt-1">{feedbackText.split("Feedback:")[1]}</p>
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