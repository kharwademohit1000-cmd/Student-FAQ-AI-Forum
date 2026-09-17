import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Compass, Bot, User, Send, ArrowRight, Settings } from 'lucide-react';

const SYSTEM_PROMPT = `You are Student FAQ AI, an expert academic counselor and campus life guide for college students. Answer user's questions regarding college academics, choosing majors, campus life, study techniques, internships, and university resources. Keep your responses practical, structured, and supportive. Use markdown formatting to organize your answers.`;

export default function App() {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [isConfiguring, setIsConfiguring] = useState(!import.meta.env.VITE_GEMINI_API_KEY);
  const [messages, setMessages] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  const model = genAI ? genAI.getGenerativeModel({ 
    model: "gemini-3.5-flash",
    systemInstruction: SYSTEM_PROMPT 
  }) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, presetInput?: string) => {
    e?.preventDefault();
    const textToSend = presetInput || input;
    if (!textToSend.trim() || !model) return;

    // Add user message
    const newMessages = [...messages, { role: 'user' as const, content: textToSend }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      // Prepare history for Gemini
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(textToSend);
      const response = result.response.text();
      
      setMessages([...newMessages, { role: 'model', content: response }]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to get response from Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { title: "How do I choose my major?", icon: "🎯" },
    { title: "Tips for finals week?", icon: "📚" },
    { title: "Best campus clubs to join?", icon: "🤝" },
    { title: "How to apply for internships?", icon: "💼" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* Sidebar Dashboard */}
      <div className="w-80 bg-slate-900 text-white flex flex-col p-6 shrink-0 h-full overflow-y-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl text-white">Student FAQ</span>
        </div>

        {/* API Key Configuration */}
        {isConfiguring ? (
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-8">
            <h3 className="font-bold mb-2 flex items-center gap-2 text-sm"><Settings className="w-4 h-4"/> Setup API Key</h3>
            <p className="text-xs text-slate-400 mb-4">Enter your Google Gemini API key to start using the chatbot.</p>
            <input 
              type="password" 
              value={apiKey} 
              onChange={e => setApiKey(e.target.value)} 
              placeholder="AIzaSy..." 
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm mb-3 focus:outline-none focus:border-indigo-500"
            />
            <button 
              onClick={() => { if(apiKey) setIsConfiguring(false) }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded text-sm font-medium transition-colors"
            >
              Save Key
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsConfiguring(true)}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 mb-8"
          >
            <Settings className="w-3 h-3" /> Change API Key
          </button>
        )}

        <div className="text-xs font-bold text-slate-500 mb-4 tracking-wider uppercase">Quick Prompts</div>
        <div className="flex flex-col gap-3 mb-8">
          {quickPrompts.map((prompt, i) => (
            <button 
              key={i} 
              onClick={() => handleSend(undefined, prompt.title)}
              className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-left text-sm border border-slate-700/50 transition-colors"
            >
              <span>{prompt.icon}</span>
              <span className="text-slate-300">{prompt.title}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto">
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4 rounded-xl border border-indigo-500/30">
             <h3 className="font-bold text-indigo-300 text-sm mb-1">Fast & Simple Mode</h3>
             <p className="text-xs text-slate-400">Powered by Vite and Google Generative AI in the browser.</p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative shadow-xl z-10">
        
        {/* Header */}
        <div className="flex items-center px-8 py-5 border-b border-slate-100 bg-white">
            <div>
              <h2 className="font-bold text-xl text-slate-800">AI Student Guide</h2>
              <p className="text-sm text-slate-500">Ask anything about college life</p>
            </div>
            <button 
              onClick={() => setMessages([])} 
              className="ml-auto text-sm text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 transition-colors"
            >
              Clear Chat
            </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100">
                 <Bot className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">How can I help you today?</h2>
              <p className="text-slate-500">I can help you navigate college academics, prepare for exams, or find the right campus communities.</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-4 max-w-4xl mx-auto ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${m.role === 'user' ? 'bg-indigo-100 border-indigo-200' : 'bg-slate-100 border-slate-200'}`}>
                    {m.role === 'user' ? <User className="w-5 h-5 text-indigo-600" /> : <Bot className="w-5 h-5 text-slate-600" />}
                 </div>
                 <div className={`max-w-[80%] rounded-2xl p-5 ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'}`}>
                    {m.role === 'user' ? (
                       <p className="text-[15px]">{m.content}</p>
                    ) : (
                       <div className="text-[15px] leading-relaxed prose prose-sm max-w-none">
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>
                           {m.content}
                         </ReactMarkdown>
                       </div>
                    )}
                 </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-4 max-w-4xl mx-auto">
               <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                  <Bot className="w-5 h-5 text-slate-600" />
               </div>
               <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-5 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.15s'}}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.3s'}}></div>
               </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200 text-center mx-auto max-w-lg">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-6 bg-white border-t border-slate-100">
           <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={apiKey ? "Ask a question..." : "Please configure your API key first"}
                disabled={!apiKey || isLoading}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-[15px] shadow-sm disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || !apiKey || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 rounded-xl transition-colors flex items-center justify-center shadow-md font-medium"
              >
                Send
              </button>
           </form>
        </div>
      </div>
    </div>
  );
}
