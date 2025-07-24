import React, { useEffect, useState } from 'react';
import { Settings, Key, Sparkles, Shield, ExternalLink } from 'lucide-react';

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
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Sparkles size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold">GPT Styler</h1>
              <p className="text-white/80 text-lg">Настройки расширения</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Key className="text-indigo-600" size={24} />
              <h2 className="text-xl font-bold text-gray-800">OpenAI API Ключ</h2>
            </div>
            <p className="text-gray-600 mt-2">
              Введите ваш OpenAI API ключ для работы с GPT-4
            </p>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                API Ключ
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-xl text-base 
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                           transition-all duration-200 bg-gray-50 focus:bg-white"
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  placeholder="sk-proj-..."
                />
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Shield size={12} />
                Ключ сохраняется локально в браузере и не передается третьим лицам
              </p>
            </div>

            <button
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 
                       rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 
                       font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
              onClick={handleSave}
              disabled={!key}
            >
              <Settings size={18} />
              Сохранить настройки
            </button>
            
            {saved && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-xl border border-green-200">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <span className="font-medium">Настройки успешно сохранены!</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ExternalLink className="text-blue-600" size={18} />
              </div>
              <h3 className="font-semibold text-gray-800">Получить API ключ</h3>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              Зарегистрируйтесь на платформе OpenAI и получите ваш API ключ
            </p>
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              platform.openai.com
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="text-purple-600" size={18} />
              </div>
              <h3 className="font-semibold text-gray-800">Как использовать</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Откройте любую веб-страницу, нажмите на иконку расширения и опишите желаемый стиль
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Options; 