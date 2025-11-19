'use client';

export default function MessageBubble({
  text,
  sender,
  feedback,
}: {
  text: string;
  sender: 'user' | 'assistant';
  feedback?: boolean;
}) {
  const isUser = sender === 'user';
  // Remove [Feedback] tag from the text
  const displayText = feedback ? text.replace(/\[Feedback\]\s*/gi, '').trim() : text;
  return (
    <div
      className={[
        'max-w-[80%] rounded-lg px-3 py-2 whitespace-pre-wrap break-words',
        isUser ? 'self-end bg-blue-600 text-white' : feedback ? 'self-start bg-pink-100 text-pink-900 border border-pink-300' : 'self-start bg-gray-100 text-gray-900',
      ].join(' ')}
    >
      {displayText}
    </div>
  );
}
