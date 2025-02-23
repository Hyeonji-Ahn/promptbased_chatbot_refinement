import { useState, useRef, useEffect } from "react";
import MessageBubble from "./messageBubble";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatComponent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [chatHeight, setChatHeight] = useState("100vh"); 
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Keep track if user is already at the bottom
  const isUserAtBottom = useRef(true);

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

      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key to send message
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevents adding a new line
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

        // Only scroll when keyboard opens, not when it closes
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

  return (
    <div 
      className="w-[95%] max-w-lg mx-auto border rounded-lg shadow-lg flex flex-col transition-all duration-300" 
      style={{ height: chatHeight }}
    >
      <h2 className="text-xl font-bold p-4 border-b">Chat with AI</h2>

      {/* Chat Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4"
        onScroll={handleScroll} // Detect user scroll
      >
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <MessageBubble key={index} text={msg.content} sender={msg.role} />
          ))
        ) : (
          <p className="text-gray-500">When you are ready, type "ready" to start the conversation.</p>
        )}
        {/* Invisible div for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div 
        className={`p-4 border-t flex gap-2 bg-white transition-all duration-300 ${
          isKeyboardOpen ? "pb-10" : ""
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown} // Handles Enter key
          onFocus={() => {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
          }}
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
    </div>
  );
}
