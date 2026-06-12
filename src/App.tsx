import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { Loader2, Settings, X, Trash2, LogIn, LogOut } from "lucide-react";
import { Content, ChatMessage, ModelConfig } from "./types";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

const DEFAULT_MODEL: ModelConfig = {
  id: 'default',
  name: 'Gemini (По умолчанию)',
  apiUrl: '',
  modelId: 'gemini-3.5-flash',
  apiKey: ''
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [models, setModels] = useState<ModelConfig[]>([DEFAULT_MODEL]);
  const [activeModelId, setActiveModelId] = useState<string>(() => {
    return localStorage.getItem('active_model_id') || 'default';
  });
  
  const [newModel, setNewModel] = useState<Partial<ModelConfig>>({
    name: '', apiUrl: 'https://routerai.ru/api/v1/chat/completions', modelId: '', apiKey: ''
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setModels([DEFAULT_MODEL]);
      return;
    }
    const modelsRef = collection(db, `users/${user.uid}/models`);
    const unsub = onSnapshot(modelsRef, (snapshot) => {
      const loadedModels: ModelConfig[] = [DEFAULT_MODEL];
      snapshot.forEach(doc => {
        const data = doc.data();
        loadedModels.push({
          id: doc.id,
          name: data.name,
          apiUrl: data.apiUrl,
          modelId: data.modelId,
          apiKey: data.apiKey || ''
        });
      });
      setModels(loadedModels);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/models`);
    });
    return () => unsub();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddModel = async () => {
    if (!newModel.name || !newModel.apiUrl || !newModel.modelId) return;
    if (!user) {
      alert("Сначала войдите в систему");
      return;
    }
    const modelId = "model_" + Date.now();
    try {
      await setDoc(doc(db, `users/${user.uid}/models`, modelId), {
        name: newModel.name,
        apiUrl: newModel.apiUrl,
        modelId: newModel.modelId,
        apiKey: newModel.apiKey || '',
        updatedAt: serverTimestamp()
      });
      setNewModel({ name: '', apiUrl: 'https://routerai.ru/api/v1/chat/completions', modelId: '', apiKey: '' });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/models/${modelId}`);
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/models`, id));
      if (activeModelId === id) {
         setActiveModelId('default');
         localStorage.setItem('active_model_id', 'default');
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/models/${id}`);
    }
  };

  const activeModel = models.find(m => m.id === activeModelId) || DEFAULT_MODEL;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const newContents = [...contents, { role: "user", parts: [{ text: userMessage.text }] }];

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: newContents, modelConfig: activeModel }),
      });

      if (!response.ok) {
        throw new Error("Ошибка сервера: " + (await response.text()));
      }

      const data = await response.json();
      
      setContents(data.contents);
      
      const modelMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: data.text || "Я выполнил вызовы инструментов.",
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: `**Ошибка**: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-row bg-[#0B0E14] font-sans text-slate-300 overflow-hidden">
      {/* Navigation Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-slate-800 flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-500 rounded-sm flex items-center justify-center text-black font-bold">MCP</div>
          <span className="text-white font-semibold tracking-tight uppercase text-sm">SEO Контроллер</span>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-6 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Контекст проекта</div>
          <div className="px-4 mb-6">
            <div className="bg-slate-900 rounded border border-slate-700 p-3 flex items-center justify-between">
              <span className="text-xs text-white truncate">e-commerce-portal.com</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>
          </div>
          <div className="px-6 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Функции модели</div>
          <ul className="space-y-1">
            <li className="px-6 py-2 flex items-center gap-3 text-sky-400 bg-sky-400/10 border-r-2 border-sky-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              <span className="text-sm">Чат-интерфейс</span>
            </li>
            <li className="px-6 py-2 flex items-center gap-3 hover:bg-slate-800 transition-colors cursor-pointer">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/><path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              <span className="text-sm">Менеджер статей</span>
            </li>
            <li className="px-6 py-2 flex items-center gap-3 hover:bg-slate-800 transition-colors cursor-pointer">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              <span className="text-sm">Аналитика Метрики</span>
            </li>
            <li className="px-6 py-2 flex items-center gap-3 hover:bg-slate-800 transition-colors cursor-pointer">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              <span className="text-sm">Выдача и ключи</span>
            </li>
          </ul>
        </nav>
        <div className="p-6 border-t border-slate-800 mt-auto">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-2">
            <span>ЛИМИТЫ API</span>
            <span>78%</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 w-[78%]"></div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 sm:px-8 bg-[#0B0E14] shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 truncate">
            <span className="text-sm font-medium text-white truncate">{activeModel.name} + MCP Инструменты</span>
            <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/30 shrink-0">
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest hidden sm:inline">Подключено</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 sm:hidden"></div>
            </div>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-slate-500 uppercase">Search Console</p>
              <p className="text-xs text-white">12.4k Кликов (7 дн)</p>
            </div>
            {isAuthReady && (
               user ? (
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden text-xs text-white" title={user.email || 'User'}>
                     {user.photoURL ? <img src={user.photoURL} alt="avatar" /> : user.email?.charAt(0).toUpperCase()}
                   </div>
                   <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Выйти">
                     <LogOut className="w-4 h-4" />
                   </button>
                 </div>
               ) : (
                 <button onClick={handleLogin} className="flex items-center gap-2 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold rounded transition-colors">
                   <LogIn className="w-4 h-4" />
                   <span className="hidden sm:inline">Войти (Sync)</span>
                 </button>
               )
            )}
          </div>
        </header>

        {/* Chat History */}
        <section className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
              <div className="w-16 h-16 bg-sky-500/10 rounded text-sky-500 flex items-center justify-center mb-4 border border-sky-500/20">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/><path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              </div>
              <h2 className="text-xl font-medium text-white tracking-tight">Начать обсуждение</h2>
              <p className="text-sm text-slate-500 max-w-md">
                Я ИИ-ассистент, оснащенный сервером MCP, включающим более 40 инструментов для управления статьями, анализа позиций SEO, получения аналитики Яндекс.Метрики и многого другого.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              msg.role === "user" ? (
                <div key={msg.id} className="flex gap-4 justify-end">
                  <div className="max-w-xl space-y-2 flex flex-col items-end">
                    <div className="bg-sky-500/10 p-4 rounded-tl-xl rounded-tr-xl rounded-bl-xl border border-sky-500/20">
                      <div className="text-sm text-sky-100 leading-relaxed prose prose-sm prose-invert p-0 m-0 [&>p]:m-0">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                  </div>
                  <div className="w-8 h-8 flex-shrink-0 bg-slate-800 border border-slate-700 rounded grid place-items-center text-xs font-bold text-white">US</div>
                </div>
              ) : (
                <div key={msg.id} className="flex gap-4">
                  <div className="w-8 h-8 flex-shrink-0 bg-sky-500 text-black rounded grid place-items-center text-[10px] font-bold">ИИ</div>
                  <div className="flex-1 space-y-4">
                    <div className="bg-slate-800/30 p-4 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-slate-800">
                      <div className="prose prose-sm prose-invert max-w-none text-slate-200 leading-relaxed break-words">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))
          )}

          {isLoading && (
            <div className="flex w-full justify-start gap-4">
              <div className="w-8 h-8 flex-shrink-0 bg-sky-500 text-black rounded grid place-items-center text-[10px] font-bold">ИИ</div>
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 border border-slate-800 rounded w-fit">
                  <Loader2 className="w-3 h-3 animate-spin text-sky-500" />
                  <span className="text-[10px] font-mono text-slate-400">Обработка инструментов...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </section>

        {/* Input Area */}
        <footer className="p-4 sm:p-6 border-t border-slate-800 bg-[#0F1218] shrink-0">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSend} className="relative">
              <textarea 
                rows={2} 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 pl-4 pr-32 text-sm text-slate-200 focus:outline-none focus:border-sky-500 resize-none" 
                placeholder="Спросите о статьях или метрике, проверьте поисковые позиции..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
              ></textarea>
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button type="button" className="p-2 text-slate-500 hover:text-white" disabled={isLoading}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ОТПРАВИТЬ
                </button>
              </div>
            </form>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Рекомендорованные действия:</span>
              <button type="button" onClick={() => setInput("Покажи сводку визитов из Метрики")} className="text-[10px] text-slate-400 hover:text-white transition-colors">Сводка визитов Метрики</button>
              <button type="button" onClick={() => setInput("Запусти проверку позиций")} className="text-[10px] text-slate-400 hover:text-white transition-colors">Проверить позиции</button>
              <button type="button" onClick={() => setInput("Покажи список моих статей")} className="text-[10px] text-slate-400 hover:text-white transition-colors">Список моих статей</button>
              <button type="button" onClick={() => setInput("Найди в SERP информацию о 'SEO workflow'")} className="text-[10px] text-slate-400 hover:text-white transition-colors">Поиск (SERP)</button>
            </div>
          </div>
        </footer>
      </main>

      {/* Right Status Sidebar */}
      <aside className="hidden lg:flex w-12 border-l border-slate-800 flex-col items-center py-6 gap-6 bg-slate-900/50">
        <div onClick={() => setShowSettings(true)} className="w-6 h-6 rounded-sm bg-slate-700 flex items-center justify-center opacity-50 cursor-pointer hover:opacity-100 transition-opacity" title="Настройки API ИИ">
          <Settings className="w-4 h-4 text-white" />
        </div>
        <div className="w-6 h-6 rounded-sm bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center cursor-pointer">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
        </div>
        <div className="mt-auto">
          <div className="w-6 h-6 rounded-sm flex items-center justify-center opacity-50 text-slate-500 cursor-pointer hover:opacity-100 transition-opacity">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
          </div>
        </div>
      </aside>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F1218] border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-medium text-white">Настройки моделей ИИ</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              <div className="space-y-3">
                 <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Доступные модели</h4>
                 {models.map(m => (
                    <div key={m.id} className={`p-4 rounded-lg border ${activeModelId === m.id ? 'border-sky-500 bg-sky-500/10' : 'border-slate-800 bg-slate-900'} flex items-center justify-between transition-colors mt-2`}>
                      <div>
                        <div className="text-white font-medium flex items-center gap-2">
                           {m.name}
                           {activeModelId === m.id && <span className="text-[10px] bg-sky-500 text-black px-2 py-0.5 rounded font-bold uppercase">Активная</span>}
                        </div>
                        {m.id !== 'default' && (
                           <div className="text-xs text-slate-500 mt-1">{m.modelId} • {m.apiUrl}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {activeModelId !== m.id && (
                          <button onClick={() => { setActiveModelId(m.id); localStorage.setItem('active_model_id', m.id); }} className="px-3 py-1.5 text-xs border border-sky-500/50 text-sky-400 rounded hover:bg-sky-500 hover:text-black transition-colors font-bold">
                            ВЫБРАТЬ
                          </button>
                        )}
                        {m.id !== 'default' && (
                          <button onClick={() => handleDeleteModel(m.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Удалить">
                             <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                 ))}
              </div>

              <div className="pt-6 border-t border-slate-800">
                 <div className="flex items-center justify-between mb-4">
                   <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Добавить кастомную модель (OpenAI API)</h4>
                   {!user && <span className="text-[10px] text-amber-500 font-bold uppercase">Требуется авторизация для синхронизации</span>}
                 </div>
                 <div className={`space-y-4 bg-slate-900 p-4 border border-slate-800 rounded-lg ${!user ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div>
                       <label className="text-xs text-slate-400 block mb-1">Название (в интерфейсе)</label>
                       <input type="text" value={newModel.name} onChange={e => setNewModel({...newModel, name: e.target.value})} className="w-full bg-[#0B0E14] border border-slate-700 rounded p-2 text-sm text-white focus:border-sky-500 focus:outline-none transition-colors" placeholder="RouterAI Claude" />
                    </div>
                    <div>
                       <label className="text-xs text-slate-400 block mb-1">URL API (например, RouterAI)</label>
                       <input type="text" value={newModel.apiUrl} onChange={e => setNewModel({...newModel, apiUrl: e.target.value})} className="w-full bg-[#0B0E14] border border-slate-700 rounded p-2 text-sm text-white focus:border-sky-500 focus:outline-none transition-colors" placeholder="https://routerai.ru/api/v1/chat/completions" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-xs text-slate-400 block mb-1">ID Модели</label>
                         <input type="text" value={newModel.modelId} onChange={e => setNewModel({...newModel, modelId: e.target.value})} className="w-full bg-[#0B0E14] border border-slate-700 rounded p-2 text-sm text-white focus:border-sky-500 focus:outline-none transition-colors" placeholder="claude-3-5-sonnet" />
                      </div>
                      <div>
                         <label className="text-xs text-slate-400 block mb-1">API Ключ (Bearer Token)</label>
                         <input type="password" value={newModel.apiKey} onChange={e => setNewModel({...newModel, apiKey: e.target.value})} className="w-full bg-[#0B0E14] border border-slate-700 rounded p-2 text-sm text-white focus:border-sky-500 focus:outline-none transition-colors" placeholder="sk-..." />
                      </div>
                    </div>
                    <button onClick={handleAddModel} disabled={!newModel.name || !newModel.apiUrl || !newModel.modelId} className="w-full mt-4 py-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-sky-500 hover:text-black text-slate-300 rounded text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 hover:border-sky-400">
                       ДОБАВИТЬ МОДЕЛЬ
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
