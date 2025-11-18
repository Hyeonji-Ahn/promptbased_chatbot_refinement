'use client';

import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './messageBubble';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  feedback?: boolean; // true for feedback lines
  fullContent?: string; // Store full content with feedback for delayed display
}

export interface Transcript {
  messages: Message[];
  feedback: Message[];
  finished: boolean;
}

export default function ChatComponent({ onTranscriptChange }: { onTranscriptChange?: (t: Transcript) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedbackMessages, setFeedbackMessages] = useState<Message[]>([]);
  const [isChatFinished, setIsChatFinished] = useState(false);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isUserAtBottom = useRef(true);

  // Notify parent with full transcript (messages, feedback, finished)
  useEffect(() => {
    onTranscriptChange?.({ messages, feedback: feedbackMessages, finished: isChatFinished });
  }, [messages, feedbackMessages, isChatFinished, onTranscriptChange]);

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

    // push user msg
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

      // Parse model output for optional [Feedback] and Ecrin:
      const feedbackStart = data.content.indexOf('[Feedback]');
      const ecrinStart = data.content.indexOf('Ecrin:');

      let feedbackPart = '';
      let mainPart = data.content;

      if (feedbackStart !== -1 && ecrinStart !== -1) {
        feedbackPart = data.content.slice(feedbackStart, ecrinStart).trim();
        mainPart = data.content.slice(ecrinStart).trim();
      } else if (ecrinStart !== -1) {
        mainPart = data.content.slice(ecrinStart).trim();
      } else if (feedbackStart !== -1) {
        feedbackPart = data.content.slice(feedbackStart).trim();
        mainPart = '';
      }

      // Store full content but show only main part until Finish Chat
      if (mainPart || feedbackPart) {
        const fullContent = feedbackPart && mainPart 
          ? `${mainPart}\n\n${feedbackPart}` // Character line first, then feedback
          : mainPart || feedbackPart;
        setMessages((prev) => [...prev, { 
          role: 'assistant', 
          content: mainPart || '', // Show only main part
          fullContent: fullContent // Store full content for later
        }]);
        
        // Also store feedback separately for transcript
        if (feedbackPart) {
          setFeedbackMessages((prev) => [...prev, { role: 'assistant', content: feedbackPart, feedback: true }]);
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry—there was an error contacting the model.' }]);
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

  const handleFinishChat = () => {
    // Update messages to show full content (character line + feedback)
    const updatedMessages = messages.map(msg => {
      if (msg.fullContent) {
        return { ...msg, content: msg.fullContent };
      }
      return msg;
    });
    setMessages(updatedMessages);
    setIsChatFinished(true);
  };

  const handleClearChat = () => {
    setMessages([]);
    setFeedbackMessages([]);
    setIsChatFinished(false);
    setInput('');
    setLoading(false);
  };

  return (
    <div className="w-[95%] h-screen max-w-lg mx-auto border rounded-lg shadow-lg flex flex-col overflow-hidden">
      <h2 className="text-xl font-bold p-4 border-b">Chat with AI</h2>

      {/* Finish Chat button at the top */}
      <div className="p-4 border-b">
        <button onClick={handleFinishChat} className="bg-green-500 text-white px-4 py-2 rounded-lg">
          Finish Chat
        </button>
      </div>

      {/* Messages (feedback hidden until Finish Chat) */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2" onScroll={handleScroll}>
        {messages.length === 0 ? (
          <p className="text-gray-500">When you are ready, type "ready" to start the conversation.</p>
        ) : (
          messages.map((m, i) => <MessageBubble key={i} text={m.content} sender={m.role} />)
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
