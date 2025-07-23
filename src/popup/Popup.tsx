import React, { useEffect, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chrome = (window as any).chrome;

interface HistoryItem {
  style: string;
  date: string;
  cost: number;
}

const Popup: React.FC = () => {
  const [style, setStyle] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [cost, setCost] = useState(0);
  const [hasKey, setHasKey] = useState(true);

  useEffect(() => {
    // Проверяем наличие ключа
    chrome.storage?.local.get(['openaiKey'], (result: { openaiKey?: string }) => {
      setHasKey(!!result.openaiKey);
    });
    // Загружаем историю
    const h = localStorage.getItem('gpt-styler-history');
    if (h) setHistory(JSON.parse(h));
  }, []);

  const saveHistory = (item: HistoryItem) => {
    const newHistory = [item, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('gpt-styler-history', JSON.stringify(newHistory));
  };

  const handleApply = async () => {
    setStatus('analyzing');
    setError(null);
    // Запрашиваем HTML у content-script
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs: any[]) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return setError('No active tab');
      chrome.tabs.sendMessage(tabId, { type: 'requestHtml' }, (resp: any) => {
        if (!resp?.html) return setError('Не удалось получить HTML');
        setStatus('applying');
        // Отправляем в background
        chrome.runtime.sendMessage({ type: 'style', html: resp.html, styleName: style }, (progress: any) => {
          if (progress?.error) {
            setError(progress.error);
            setStatus('idle');
          } else if (progress?.message === 'done') {
            setStatus('done');
            // Примерная стоимость (заглушка)
            const tokens = Math.round((resp.html.length + 2000) / 4);
            const price = tokens * 0.00001; // примерная формула
            setCost(price);
            saveHistory({ style, date: new Date().toISOString(), cost: price });
            setTimeout(() => setStatus('idle'), 3000);
          }
        });
      });
    });
  };

  const handleUndo = () => {
    chrome.tabs?.query({ active: true, currentWindow: true }, (tabs: any[]) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;
      chrome.tabs.sendMessage(tabId, { type: 'undo' });
    });
  };

  return (
    <div className="w-80 p-4 font-sans">
      {!hasKey && (
        <div className="bg-yellow-200 text-yellow-900 p-2 mb-2 rounded text-sm">
          Добавьте OpenAI API-ключ в настройках!
        </div>
      )}
      <input
        className="border rounded px-2 py-1 w-full mb-2"
        placeholder="Опиши стиль (например, Material You)"
        value={style}
        onChange={e => setStyle(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded w-full mb-2 disabled:bg-blue-300"
        onClick={handleApply}
        disabled={!style || !hasKey || status === 'analyzing' || status === 'applying'}
      >
        Apply
      </button>
      <button
        className="bg-gray-200 text-gray-800 px-4 py-2 rounded w-full mb-2"
        onClick={handleUndo}
      >
        Undo (Reload)
      </button>
      <div className="mb-2">
        {status === 'analyzing' && <span>Analyzing…</span>}
        {status === 'applying' && <span>Applying patch…</span>}
        {status === 'done' && <span className="text-green-600">Done ✓</span>}
        {error && <span className="text-red-600">Error: {error}</span>}
      </div>
      <div className="mb-2 text-xs text-gray-500">
        $-Cost: <span className="font-mono">{cost.toFixed(5)}</span>
      </div>
      <div className="border-t pt-2 mt-2">
        <div className="font-bold text-xs mb-1">History</div>
        <ul className="text-xs max-h-32 overflow-y-auto">
          {history.map((h, i) => (
            <li key={i} className="mb-1 flex justify-between">
              <span>{h.style}</span>
              <span>{new Date(h.date).toLocaleTimeString()} | ${h.cost.toFixed(5)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Popup; 