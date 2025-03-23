import React, { useState, useRef, useEffect } from "react";
import MessageBubble from "./messageBubble"; // Correct import path for MessageBubble

interface Message {
  role: "user" | "assistant";
  content: string;
  feedback?: boolean; // Feedback flag to mark whether it's feedback or a regular response
}

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isFeedbackDelayed, setIsFeedbackDelayed] = useState<boolean>(false);
  const [feedbackMessages, setFeedbackMessages] = useState<Message[]>([]); // Store feedback messages separately
  const [chatHeight, setChatHeight] = useState("100vh");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [canToggleFeedback, setCanToggleFeedback] = useState<boolean>(true); // Flag to allow toggling feedback before first message
  const [isChatFinished, setIsChatFinished] = useState<boolean>(false); // Track if the chat is finished

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isUserAtBottom = useRef(true); // Track if user is at the bottom of the chat.

  const handleToggleChange = () => {
    if (canToggleFeedback) {
      setIsFeedbackDelayed(!isFeedbackDelayed);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setCanToggleFeedback(false); // Disable the feedback toggle after the first message is sent

    try {
      // Send chat request to the server
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error(`API request failed with status ${res.status}`);

      const data = await res.json();
      if (!data || !data.content) throw new Error("Invalid API response");

      // Split the assistant's message into feedback and message parts manually
      const feedbackPartStart = data.content.indexOf("[Feedback]");
      const messagePartStart = data.content.indexOf("Yusuf:");

      if (isFeedbackDelayed && messagePartStart !== -1) {
        // Show message part immediately
        const messagePart = data.content.slice(messagePartStart);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: messagePart },
        ]);

        // Store feedback part for later
        if (feedbackPartStart !== -1) {
          const feedbackPart = data.content.slice(feedbackPartStart, messagePartStart).trim();
          if (feedbackPart) {
            setFeedbackMessages((prevMessages) => [
              ...prevMessages,
              { role: "assistant", content: feedbackPart, feedback: true },
            ]);
          }
        }
      } else if (messagePartStart !== -1) {
        // Show the full message immediately if feedback is not delayed
        const messagePart = data.content.slice(messagePartStart);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: messagePart },
        ]);

        // Immediately show feedback if not delayed
        if (feedbackPartStart !== -1) {
          const feedbackPart = data.content.slice(feedbackPartStart, messagePartStart).trim();
          if (feedbackPart) {
            setMessages((prevMessages) => [
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

  // Handle Enter key to send message
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // Detect if user manually scrolled away from bottom
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      isUserAtBottom.current = scrollHeight - scrollTop - clientHeight < 10;
    }
  };

  // Auto-scroll to latest message when messages update
  useEffect(() => {
    if (isUserAtBottom.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle keyboard pop-up and prevent overshoot
  useEffect(() => {
    const updateChatHeight = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        setChatHeight(`${viewportHeight}px`);
        setIsKeyboardOpen(viewportHeight < window.innerHeight);

        if (viewportHeight < window.innerHeight) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 50);
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateChatHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateChatHeight);
      }
    };
  }, []);

  const handleFinishChat = () => {
    // Show feedback messages only when the user presses Finish Chat
    feedbackMessages.forEach((feedback) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: feedback.content }
      ]);
    });
    setFeedbackMessages([]); // Clear feedback after displaying
    setIsChatFinished(true); // Mark the chat as finished
  };

  const handleClearChat = () => {
    // Reset the chat state to start fresh
    setMessages([]);
    setInput("");
    setLoading(false);
    setIsFeedbackDelayed(false);
    setFeedbackMessages([]);
    setCanToggleFeedback(true); // Re-enable feedback toggle for the next session
    setIsChatFinished(false); // Reset chat finished state
  };

  return (
    <div className="w-[95%] max-w-lg mx-auto border rounded-lg shadow-lg flex flex-col transition-all duration-300" style={{ height: chatHeight }}>
      <h2 className="text-xl font-bold p-4 border-b">Chat with AI</h2>

      {/* Feedback Toggle */}
      <div className="p-4 border-b">
        <label>
          <input 
            type="checkbox" 
            checked={isFeedbackDelayed} 
            onChange={handleToggleChange} 
            disabled={!canToggleFeedback} // Disable toggle after the first message
          />
          Delay Feedback
        </label>
      </div>

      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4" onScroll={handleScroll}>
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
      <div className={`p-4 border-t flex gap-2 bg-white transition-all duration-300 ${isKeyboardOpen ? "pb-10" : ""}`}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)}
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
          <button onClick={handleClearChat} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
            Clear Chat
          </button>
          <button onClick={handleClearChat} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            Start New Chat
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;
