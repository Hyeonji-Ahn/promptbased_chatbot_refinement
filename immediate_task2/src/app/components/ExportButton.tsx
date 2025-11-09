'use client';

import { useState } from 'react';
import type { Message } from './openAI';

export default function ExportButton({ messages }: { messages: Message[] }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  // A=user, B=all assistant lines (including [Feedback]) until the next user
  function toPairs(all: Message[]) {
    const rows: { user: string; bot: string }[] = [];
    let currentUser: string | null = null;
    let botBucket: string[] = [];

    for (const m of all) {
      if (m.role === 'user') {
        // flush previous row
        if (currentUser !== null || botBucket.length) {
          rows.push({ user: currentUser ?? '', bot: botBucket.join('\n') });
        }
        currentUser = m.content;
        botBucket = [];
      } else {
        botBucket.push(m.content); // includes feedback immediately
      }
    }
    if (currentUser !== null || botBucket.length) {
      rows.push({ user: currentUser ?? '', bot: botBucket.join('\n') });
    }
    return rows;
  }

  const handleExport = async () => {
    if (!name.trim()) return alert('Enter user name first.');
    setBusy(true);
    try {
      const chatPairs = toPairs(messages);
      const resp = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name.trim(), chatPairs }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || 'Export failed');

      alert(`Exported to Google Sheets${data.sheetTitle ? ` (tab: ${data.sheetTitle})` : ''}.`);
      // console.log('Sheet URL:', data.webUrl);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        className="border rounded px-3 py-2 text-slate-900 placeholder:text-slate-400 caret-indigo-600"
        placeholder="User name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button className="border rounded px-4 py-2" disabled={busy} onClick={handleExport}>
        {busy ? 'Exporting…' : 'Export'}
      </button>
    </div>
  );
}
