import { Send, Bot, Paperclip, User as UserIcon, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { useState, useRef, useEffect } from 'react';
import { authFetch } from '../../utils/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  "Analyze sales trend",
  "Write product description",
  "Predict next month's demand",
  "How to reduce expenses?",
  "Inventory status",
  "Business summary",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your AI Business Assistant. How can I help you grow your clothing business today? I can analyze your sales, write product descriptions, predict demand, or give inventory and expense insights.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for multi-turn context (exclude initial welcome message)
      const history = messages
        .filter((_, i) => i > 0) // skip welcome message
        .slice(-6) // only last 6 for token efficiency
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await authFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        const errorData = await response.json().catch(() => null);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: errorData?.reply || "Sorry, I couldn't process your request. Please try again." },
        ]);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please make sure the server is running.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Clean markdown-like rendering for headings, bold (**text**), bullet points, and numbered lists
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Strip leading bullet or number prefix for bold parsing if present
      const cleanLine = line.replace(/^(?:###\s+|##\s+|[•\-\*]\s+|\d+\.\s+)/, '');
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const rendered = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
        }
        return <span key={j}>{part}</span>;
      });

      if (line.startsWith('### ')) {
        return (
          <h4 key={i} className="font-semibold text-gray-900 mt-2 mb-1 text-sm">
            {rendered}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={i} className="font-bold text-gray-900 mt-3 mb-1 text-base">
            {rendered}
          </h3>
        );
      }
      if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={i} className="flex gap-2 ml-2 my-0.5">
            <span className="text-brand-600 shrink-0 font-bold">•</span>
            <span>{rendered}</span>
          </div>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        const num = line.match(/^\d+\./)?.[0];
        return (
          <div key={i} className="flex gap-2 ml-2 my-0.5">
            <span className="font-semibold text-brand-700 shrink-0">{num}</span>
            <span>{rendered}</span>
          </div>
        );
      }
      if (line.trim() === '---') {
        return <hr key={i} className="my-2 border-gray-200" />;
      }
      if (line.trim() === '') {
        return <div key={i} className="h-1.5" />;
      }

      return <div key={i} className="my-0.5">{rendered}</div>;
    });
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Business Assistant</h1>
        <p className="text-gray-500 text-sm mt-1">Get insights, write product descriptions, and analyze your business data.</p>
      </div>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden border border-gray-200 shadow-sm rounded-2xl">
        <CardContent className="flex-1 p-0 flex flex-col h-full bg-gray-50/30">

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, index) =>
              msg.role === 'assistant' ? (
                <div key={index} className="flex gap-4 max-w-[85%]">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 shrink-0">
                    <Bot size={20} />
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-sm text-gray-700 leading-relaxed rounded-tl-sm">
                    {renderContent(msg.content)}
                  </div>
                </div>
              ) : (
                <div key={index} className="flex gap-4 max-w-[85%] ml-auto justify-end">
                  <div className="bg-brand-800 p-4 rounded-2xl shadow-sm text-sm text-white leading-relaxed rounded-tr-sm">
                    {msg.content}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                    <UserIcon size={20} />
                  </div>
                </div>
              )
            )}

            {isLoading && (
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 shrink-0">
                  <Bot size={20} />
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-sm text-gray-500 leading-relaxed rounded-tl-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing your business data...
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(suggestion)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <button type="button" className="absolute left-4 text-gray-400 hover:text-gray-600 transition-colors">
                <Paperclip size={20} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="w-full pl-12 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-inner placeholder-gray-400 disabled:opacity-50"
                placeholder="Ask me anything about your business..."
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-3 w-10 h-10 bg-brand-800 rounded-xl flex items-center justify-center text-white hover:bg-brand-900 transition-colors disabled:opacity-50"
              >
                <Send size={18} className="ml-1" />
              </button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
