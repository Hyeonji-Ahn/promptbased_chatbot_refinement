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
        <h1 className="text-xl font-semibold ml-auto">Chat (Immediate Feedback) Task 2</h1>
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
        <div className="text-black max-w-2xl mx-auto p-4">
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
           This scenario features two characters (Ecrin and Omar). ChatGPT will write lines for    
      👱🏻‍♀️Ecrin, and you will write lines for 👨🏻Omar.
Ecrin (Junior) and Omar (Freshman) are preparing for an event for a student club. During the preparation process, many questions and discussion points have come up. So, they are having a meeting to discuss the event preparations.

          </p>
          <p>
            When you are ready, type "ready" in the chat box to start the conversation.
            Try to create longer sentences than just a phrase or words. (Do not say just “Ok”, “Good”, etc.)
            When you are done, type “the end” to finish the task. 
          </p>
          <h2 className="text-xl font-semibold mt-4">Things to ask Ecrin (ChatGPT) about: 
</h2>
          <ul className="list-decimal ml-5">
  <li><strong>Topic 1: Reserving and setting up the venue</strong>
    <ul className="list-disc ml-5">
      <li>Who will reserve the conference room</li>
      <li>Which entrance you (Omar) need to set up the sign-up table at</li>
      <li>Which storage room you (Omar) can bring the chairs from</li>
      <li>There are two cameras; which one you (Omar) can use to record the event</li>
      <li>Who you (Omar) need to return the camera to after the event</li>
    </ul>
  </li>
  <li><strong>Topic 2: Budget and things to purchase and order</strong>
    <ul className="list-disc ml-5">
      <li>Who you (Omar) can work with to complete the budget form</li>
      <li>When the budget plan is due</li>
      <li>Who you (Omar) can communicate with if there are additional questions about the budget</li>
      <li>How many event staff members will participate</li>
      <li>Which café you (Omar) can order lunch from</li>
      <li>Asking what can be offered as a giveaway item</li>
      <li>Asking which online store Yusuf bought souvenirs from last year</li>
    </ul>
  </li>
  <li><strong>Topic 3: Preparing the event survey</strong>
    <ul className="list-disc ml-5">
      <li>Saying that a participant survey needs to be prepared</li>
      <li>How many participants they (Yusuf & Omar) collect the survey from</li>
      <li>Which website you (Omar) upload the survey results to</li>
    </ul>
  </li>
</ul>

        </div>
      </div>
    </div>
  );
}
