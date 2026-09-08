import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Bună! Sunt CivicBot, asistentul tău virtual. Te pot ajuta cu informații despre taxe, autorizații sau asistență socială. Cu ce te pot ajuta?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      // Chemăm direct backend-ul Python pe portul 8001
      const response = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      
      if (!response.ok) throw new Error("Eroare de rețea");
      
      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Ne pare rău, a apărut o eroare de conexiune cu asistentul virtual.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition hover:-translate-y-1 z-50"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-fadeIn" style={{ height: '500px', maxHeight: '80vh' }}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">CivicBot (RAG)</h3>
            <p className="text-xs text-blue-100">Asistent Virtual Primărie</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition">
          <X size={20} />
        </button>
      </div>

      {/* Mesaje */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 text-sm">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
              msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
            }`}>
              <div className="flex items-center gap-1.5 mb-1 opacity-70 text-[10px] uppercase font-bold">
                {msg.sender === 'user' ? <><User size={10}/> Tu</> : <><Bot size={10}/> CivicBot</>}
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2 text-gray-500">
              <Loader2 size={16} className="animate-spin text-blue-500" />
              <span className="text-xs font-medium">Caută în legislație...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-1.5 border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition"
        >
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Întreabă ceva..."
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-2 py-1.5 text-sm text-gray-800"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
