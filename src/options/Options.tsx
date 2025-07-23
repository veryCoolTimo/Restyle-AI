import React, { useEffect, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chrome = (window as any).chrome;

const Options: React.FC = () => {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome?.storage?.local.get(['openaiKey'], (result: { openaiKey?: string }) => {
      if (result.openaiKey) setKey(result.openaiKey);
    });
  }, []);

  const handleSave = () => {
    chrome?.storage?.local.set({ openaiKey: key }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">OpenAI API Key</h1>
      <input
        type="password"
        className="border rounded px-3 py-2 w-80 mb-2"
        value={key}
        onChange={e => setKey(e.target.value)}
        placeholder="sk-..."
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleSave}
        disabled={!key}
      >
        Сохранить
      </button>
      {saved && <div className="text-green-600 mt-2">Сохранено!</div>}
    </div>
  );
};

export default Options; 