'use client';

import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './messageBubble';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  feedback?: boolean; // true for feedback lines
}

export default function ChatComponent({
  onMessagesChange,
}: {
  onMessagesChange?: (msgs: Message[]) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isUserAtBottom = useRef(true);

  // bubble messages up
  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    isUserAtBottom.current = scrollHeight - scrollTop - clientHeight < 10;
  };

  useEffect(() => {
    if (isUserAtBottom.current) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // push user message
    const newMessages: Message[] = [...messages, { role: 'user', content: input.trim() }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!res.ok) throw new Error(`API request failed: ${res.status}`);
      const data = await res.json();
      if (!data || typeof data.content !== 'string') throw new Error('Invalid API response');

      // Parse for [Feedback] and "Ecrin:"
      const feedbackStart = data.content.indexOf('[Feedback]');
      const ecrinStart = data.content.indexOf('Ecrin:');

      let feedbackPart = '';
      let mainPart = data.content;

      if (feedbackStart !== -1 && ecrinStart !== -1) {
        // feedback then Ecrin
        feedbackPart = data.content.slice(feedbackStart, ecrinStart).trim();
        mainPart = data.content.slice(ecrinStart).trim();
      } else if (ecrinStart !== -1) {
        mainPart = data.content.slice(ecrinStart).trim();
      } else if (feedbackStart !== -1) {
        feedbackPart = data.content.slice(feedbackStart).trim();
        mainPart = '';
      }

      const additions: Message[] = [];
      // Feedback first, then character line
      if (feedbackPart) additions.push({ role: 'assistant', content: feedbackPart, feedback: true });
      if (mainPart) additions.push({ role: 'assistant', content: mainPart });

      if (additions.length) setMessages((prev) => [...prev, ...additions]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry—there was an error contacting the model.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-[95%] h-screen max-w-lg mx-auto border rounded-lg shadow-lg flex flex-col overflow-hidden">
      <h2 className="text-xl font-bold p-4 border-b">Chat with AI</h2>

      {/* Messages (feedback shows immediately) */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col" onScroll={handleScroll}>
        {messages.length === 0 ? (
          <p className="text-gray-500">When you are ready, type "ready" to start the conversation.</p>
        ) : (
          messages.map((m, i) => (
            <MessageBubble key={i} text={m.content} sender={m.role} feedback={m.feedback} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="flex-1 p-2 border rounded-lg text-black"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
