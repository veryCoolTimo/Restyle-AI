import React, { useEffect, useState } from 'react';
import { Settings, Wand2, Undo2, History, Zap, Sparkles, AlertCircle } from 'lucide-react';

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
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Получаем ключ
    chrome.storage?.local.get(['openaiKey'], (result: { openaiKey?: string }) => {
      setApiKey(result.openaiKey || '');
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
    
    try {
      const tabs = await new Promise<any[]>((resolve) => {
        chrome.tabs?.query({ active: true, currentWindow: true }, resolve);
      });
      
      const tabId = tabs[0]?.id;
      if (!tabId) {
        setError('Активная вкладка не найдена');
        setStatus('idle');
        return;
      }

      // Проверяем готовность content script с timeout
      const resp = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Content script не отвечает. Попробуйте перезагрузить страницу.'));
        }, 5000);

        chrome.tabs.sendMessage(tabId, { type: 'requestHtml' }, (response: any) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(new Error('Content script не загружен. Перезагрузите страницу.'));
          } else {
            resolve(response);
          }
        });
      });

      if (!resp?.html) {
        setError('Не удалось получить HTML со страницы');
        setStatus('idle');
        return;
      }

      setStatus('applying');
      
      const progress = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Таймаут запроса к OpenAI'));
        }, 30000);

        chrome.runtime.sendMessage({ type: 'style', html: resp.html, styleName: style }, (response: any) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if (progress?.error) {
        setError(progress.error);
        setStatus('idle');
      } else if (progress?.message === 'done') {
        setStatus('done');
        const tokens = Math.round((resp.html.length + 2000) / 4);
        const price = tokens * 0.00001;
        setCost(price);
        saveHistory({ style, date: new Date().toISOString(), cost: price });
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (error: any) {
      setError(error.message || 'Неизвестная ошибка');
      setStatus('idle');
    }
  };

  const handleUndo = async () => {
    try {
      const tabs = await new Promise<any[]>((resolve) => {
        chrome.tabs?.query({ active: true, currentWindow: true }, resolve);
      });
      
      const tabId = tabs[0]?.id;
      if (!tabId) return;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Content script не отвечает'));
        }, 3000);

        chrome.tabs.sendMessage(tabId, { type: 'undo' }, (response: any) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(new Error('Content script не загружен'));
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Undo failed:', error);
    }
  };

  const handleSaveKey = () => {
    chrome.storage?.local.set({ openaiKey: apiKey }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      setShowSettings(false);
    });
  };

  return (
    <div className="w-[480px] min-h-[580px] bg-gradient-to-br from-slate-50 to-slate-100 font-sans relative flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">GPT Styler</h1>
              <p className="text-white/80 text-sm">AI Website Transformation</p>
            </div>
          </div>
          <button
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
            onClick={() => setShowSettings(true)}
            title="Настройки"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* API Key Warning */}
        {!apiKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-amber-600" size={20} />
            <div className="flex-1">
              <p className="text-amber-800 font-medium">API ключ не найден</p>
              <p className="text-amber-600 text-sm">Добавьте OpenAI API ключ в настройках</p>
            </div>
          </div>
        )}

        {/* Style Input */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Описание стиля
          </label>
          <div className="relative">
            <Wand2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-base 
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                         transition-all duration-200 bg-white shadow-sm"
              placeholder="Material Design темная тема..."
              value={style}
              onChange={e => setStyle(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 
                       text-white px-4 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 
                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
            onClick={handleApply}
            disabled={!style || !apiKey || status === 'analyzing' || status === 'applying'}
          >
            <Zap size={18} />
            Применить
          </button>
          <button
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 
                       text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300
                       transition-all duration-200 font-medium shadow-sm"
            onClick={handleUndo}
          >
            <Undo2 size={18} />
            Отменить
          </button>
        </div>
      </div>

      {/* Status & Cost */}
      <div className="px-6 pb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          {/* Status */}
          <div className="flex items-center gap-2 mb-3">
            {status === 'analyzing' && (
              <>
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-indigo-600 font-medium">Анализирую страницу...</span>
              </>
            )}
            {status === 'applying' && (
              <>
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-purple-600 font-medium">Применяю стиль...</span>
              </>
            )}
            {status === 'done' && (
              <>
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <span className="text-green-600 font-medium">Готово! ✨</span>
              </>
            )}
            {error && (
              <>
                <AlertCircle className="text-red-500" size={16} />
                <span className="text-red-600 font-medium">Ошибка: {error}</span>
              </>
            )}
            {status === 'idle' && !error && (
              <span className="text-gray-500">Готов к работе</span>
            )}
          </div>
          
          {/* Cost */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Стоимость запроса:</span>
            <span className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded-lg">
              ${cost.toFixed(5)}
            </span>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 p-4 bg-gray-50 border-b border-gray-100">
            <History size={18} className="text-gray-600" />
            <h3 className="font-semibold text-gray-800">История стилизации</h3>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <History size={20} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">История пуста</p>
                <p className="text-gray-400 text-xs mt-1">Примененные стили появятся здесь</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {history.map((h, i) => (
                  <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{h.style}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(h.date).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-mono">
                          ${h.cost.toFixed(5)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-t-2xl text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Settings size={20} />
                  </div>
                  <h2 className="text-xl font-bold">Настройки</h2>
                </div>
                <button
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                  onClick={() => setShowSettings(false)}
                  title="Закрыть"
                >
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  OpenAI API ключ
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base 
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                           transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-proj-..."
                />
                <p className="text-xs text-gray-500">
                  Ключ сохраняется локально и не передается третьим лицам
                </p>
              </div>

              <button
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 
                         rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 
                         font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSaveKey}
                disabled={!apiKey}
              >
                Сохранить ключ
              </button>
              
              {saved && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl">
                  <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-sm font-medium">Ключ успешно сохранен!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Popup; 