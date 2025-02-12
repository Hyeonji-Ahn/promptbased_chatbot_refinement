import React from "react";

interface MessageBubbleProps {
  text: string;
  sender: "user" | "assistant";
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, sender }) => {
  const isUser = sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-xs md:max-w-sm lg:max-w-md px-4 py-2 rounded-2xl ${
          isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default MessageBubble;
