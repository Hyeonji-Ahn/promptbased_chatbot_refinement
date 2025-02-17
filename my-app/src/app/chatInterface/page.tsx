"use client";

import Chat from "../components/openAI";
import React, { useState } from 'react';

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };
  return (
    <div className="relative min-h-screen flex flex-col">
      <nav className="flex items-center p-4 shadow-md">
        <button 
          onClick={toggleDrawer} 
          className="md:hidden p-2 bg-blue-500 text-white rounded">
          Task Description
        </button>
        <h1 className="justify-end text-xl ml-auto font-semibold">Talk to Chat GPT API</h1>
      </nav>

      <div className="flex flex-1">
        {/* Persistent side panel for medium and larger screens */}
        <div className="hidden md:block md:fixed md:inset-y-0 md:left-0 md:w-[15%] md:bg-gray-100 md:text-black md:p-4">
          <p>Here is some long text content inside the side panel. This content is always visible on larger screens.</p>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 md:w-5 p-4">
          <Chat />
        </div>
      </div>

      {/* Drawer component for small screens */}
      <div className={`fixed inset-y-0 left-0 bg-slate-50 text-black w-64 p-4 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden z-50`}> 
        <button onClick={toggleDrawer} className="absolute top-2 right-2 text-xl">&times;</button>
        <p>potentially some long explanation</p>
      </div>
    </div>
  );
}

