import React, { useState, useRef, useEffect } from "react";
import MessageBubble from "./messageBubble"; // Correct import path for MessageBubble

interface Message {
  role: "user" | "assistant";
  content: string;
  feedback?: boolean;
}

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [feedbackMessages, setFeedbackMessages] = useState<Message[]>([]);
  const [isChatFinished, setIsChatFinished] = useState<boolean>(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isUserAtBottom = useRef(true);

  // Detect mobile keyboard visibility
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleViewportResize = () => {
      const heightDiff = window.innerHeight - window.visualViewport!.height;
      setIsKeyboardOpen(heightDiff > 150);
    };

    window.visualViewport.addEventListener("resize", handleViewportResize);
    handleViewportResize(); // run once on mount

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportResize);
      }
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error(`API request failed with status ${res.status}`);
      const data = await res.json();
      if (!data || !data.content) throw new Error("Invalid API response");

      const feedbackPartStart = data.content.indexOf("[Feedback]");
      const messagePartStart = data.content.indexOf("Yusuf:");

      if (messagePartStart !== -1) {
        const messagePart = data.content.slice(messagePartStart);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: messagePart },
        ]);

        if (feedbackPartStart !== -1) {
          const feedbackPart = data.content.slice(feedbackPartStart, messagePartStart).trim();
          if (feedbackPart) {
            setFeedbackMessages((prevMessages) => [
              ...prevMessages,
              { role: "assistant", content: feedbackPart, feedback: true },
            ]);
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      isUserAtBottom.current = scrollHeight - scrollTop - clientHeight < 10;
    }
  };

  useEffect(() => {
    if (isUserAtBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleFinishChat = () => {
    feedbackMessages.forEach((feedback) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: feedback.content }
      ]);
    });
    setFeedbackMessages([]);
    setIsChatFinished(true);
  };

  const handleClearChat = () => {
    setMessages([]);
    setInput("");
    setLoading(false);
    setFeedbackMessages([]);
    setIsChatFinished(false);
  };

  return (
    <div className="w-[95%] h-screen max-w-lg mx-auto border rounded-lg shadow-lg flex flex-col overflow-hidden">
      <h2 className="text-xl font-bold p-4 border-b">Chat with AI</h2>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4"
        onScroll={handleScroll}
      >
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <MessageBubble key={index} text={msg.content} sender={msg.role} />
          ))
        ) : (
          <p className="text-gray-500">When you are ready, type "ready" to start the conversation.</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div
        className={`p-4 border-t flex gap-2 bg-white transition-all duration-300
        }`}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-lg text-black"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>

      {/* Chat Finish Button */}
      <button
        onClick={handleFinishChat}
        className="bg-green-500 text-white px-4 py-2 rounded-lg mt-2"
      >
        Finish Chat
      </button>

      {isChatFinished && (
        <div className="flex gap-2 mt-4 p-4">
          <button
            onClick={handleClearChat}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Clear Chat
          </button>
          <button
            onClick={handleClearChat}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Start New Chat
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;
