"use client";

import Chat from "../components/openAI";

export default function Home() {
  return (
    <main className="flex flex-col h-screen">
      <nav className="flex justify-between items-center p-4">
        <h1 className="text-xl font-semibold">
          Talk to Chat GPT API
        </h1>
      </nav>
      <div className="flex-grow overflow-hidden">
        <Chat />
      </div>
    </main>
  );
}