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
          <h1 className="text-2xl font-bold mb-4">Task A: Talking about the ERASMUS Program</h1>
          <h2 className="text-xl font-semibold">Directions</h2>
          <p>
            You and your conversational partner, ChatGPT, will engage in an activity where you create a drama script based on a given scenario.
            This worksheet has information for your conversation. Each piece of information is numbered. Follow the numbers when you talk with ChatGPT.
            Each piece of information includes English words. You have to include them in your sentences.
            Make sure to carefully read what ChatGPT says during the conversation.
            Organize your drama script coherently and add more information if needed.
          </p>
          <h2 className="text-xl font-semibold mt-4">Scenario</h2>
          <p>
            This scenario features two characters (Yusuf and Omar). ChatGPT will write lines for Yusuf, and you will write lines for Omar.
            Yusuf and Omar are students at the same university and are close friends. They are having a conversation about the exchange program.
            Their university has exchange programs such as ERASMUS, Mevlana, and Free Mover.
          </p>
          <p>
            When you are ready, type "ready" in the chat box to start the conversation.
            Try to create longer sentences than just a phrase or words. (Do not say just “Ok”, “Good”, etc.)
            When you are done, type “the end” to finish the task.
          </p>
          <h2 className="text-xl font-semibold mt-4">Things to ask Yusuf (ChatGPT) about:</h2>
          <ul className="list-decimal ml-5">
            <li><strong>Exchange program</strong>
              <ul className="list-disc ml-5">
                <li>Which program Yusuf is planning to apply to</li>
                <li>Which country Yusuf wants to study abroad in</li>
                <li>When Yusuf plans to start his exchange program</li>
                <li>Which website you (Omar) can download the exchange program guide from</li>
                <li>What type of accommodation Yusuf is considering</li>
                <li>Asking if Yusuf can send you (Omar) the link to the website with housing information</li>
              </ul>
            </li>
            <li><strong>Talking about info sessions</strong>
              <ul className="list-disc ml-5">
                <li>Asking which session Yusuf is going to attend</li>
                <li>Suggesting that Yusuf and Omar fill out the application form now</li>
                <li>Who Yusuf and Omar need to submit the application form to</li>
                <li>How long the info session will be</li>
                <li>Saying you (Omar) has a question and asking who to email</li>
              </ul>
            </li>
            <li><strong>Talking about an English test</strong>
              <ul className="list-disc ml-5">
                <li>Asking if Yusuf has taken the English test recently</li>
                <li>Which website Yusuf is watching video lectures on</li>
                <li>Which area Yusuf wants to improve his scores in</li>
                <li>Who Yusuf is practicing English speaking with</li>
                <li>Who Yusuf received the test prep materials from</li>
                <li>Suggesting they (Yusuf and Omar) meet next week to practice English speaking together</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
