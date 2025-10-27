'use client';

import React, { useState } from 'react';
import Chat, { Message } from '../components/openAI';
import ExportButton from '../components/ExportButton';

export default function ChatPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  return (
    <div className="relative h-screen flex flex-col">
      <nav className="flex items-center gap-3 p-4 shadow-md">
        <button onClick={() => setIsOpen((v) => !v)} className="p-2 bg-blue-500 text-white rounded">
          Task Description
        </button>
        <h1 className="text-xl font-semibold ml-auto">Chat (Immediate Feedback)</h1>
        <ExportButton messages={messages} />
      </nav>

      <div className="flex flex-1">
        <div className="flex-1 p-4">
          <Chat onMessagesChange={setMessages} />
        </div>
      </div>

      {/* Optional drawer area */}
      <div
        className={`overflow-y-scroll fixed inset-y-0 left-0 bg-slate-50 text-black w-[75%] p-4 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-50`}
      >
        <button onClick={() => setIsOpen(false)} className="absolute top-2 right-2 text-xl">
          &times;
        </button>
        <div className="max-w-2xl mx-auto p-4">
          <h2 className="text-xl font-semibold mb-2">Task Instructions</h2>
          <p>Put your prompt/instructions here.</p>
        </div>
      </div>
    </div>
  );
}
