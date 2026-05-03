import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Sparkles, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Message } from '../types';
import { useVoice } from '../hooks/useVoice';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onClearMessages: () => void;
  isLoading: boolean;
  isVoiceOutputEnabled: boolean;
  setIsVoiceOutputEnabled: (enabled: boolean) => void;
  isHandsFree: boolean;
  setIsHandsFree: (enabled: boolean) => void;
  isListening: boolean;
  isSupported: boolean;
  startListening: (onResult: (text: string) => void, onInterim?: (text: string) => void) => void;
  stopListening: () => void;
}

export default function ChatInterface({ 
  messages, 
  onSendMessage, 
  onClearMessages,
  isLoading,
  isVoiceOutputEnabled,
  setIsVoiceOutputEnabled,
  isHandsFree,
  setIsHandsFree,
  isListening,
  isSupported,
  startListening,
  stopListening
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [interimText, setInterimText] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, interimText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      return;
    }
    setInterimText('');
    startListening(
      (transcript) => {
        if (transcript.trim()) {
          onSendMessage(transcript);
        }
        setInterimText('');
      },
      (interim) => {
        setInterimText(interim);
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 relative overflow-hidden">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth pt-16"
      >
        {messages.length > 0 && (
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={onClearMessages}
              className="px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-xs font-bold text-rose-500 shadow-sm hover:bg-rose-50 hover:border-rose-100 transition-all"
            >
              Clear Chat
            </button>
          </div>
        )}

        {messages.length === 0 && !interimText && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center text-2xl">
              👋
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-slate-900">Namaste! Main hoon Dost AI.</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                Main aapki help kar sakta hoon reminders lagane mein, tasks manage karne mein, ya bas gappe marne mein.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.timestamp + idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-brand-primary text-white' : 'bg-white text-slate-600'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                ? 'bg-brand-primary text-white rounded-tr-none' 
                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <span className={`text-[10px] mt-2 block opacity-50 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {interimText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 flex-row-reverse"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-primary text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Mic size={16} />
            </div>
            <div className="max-w-[80%] p-4 rounded-2xl rounded-tr-none bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-sm">
              <p className="text-sm italic">{interimText}...</p>
            </div>
          </motion.div>
        )}

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400">
              <Bot size={16} />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-brand-primary" />
              <span className="text-xs text-slate-400 font-medium italic">Dost is thinking...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-8 bg-gradient-to-t from-slate-50 to-transparent">
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto relative group"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || isListening}
            placeholder={isListening ? "Listening... Bolo bhai!" : "Type something in Hinglish..."}
            className="w-full bg-white border border-slate-200 rounded-2xl p-4 pr-32 shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-slate-700"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setIsVoiceOutputEnabled(!isVoiceOutputEnabled)}
              className={`p-2 transition-colors ${isVoiceOutputEnabled ? 'text-brand-primary' : 'text-slate-300'}`}
              title={isVoiceOutputEnabled ? "Mute responses" : "Unmute responses"}
            >
              {isVoiceOutputEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button 
              type="button"
              onClick={() => setIsHandsFree(!isHandsFree)}
              className={`p-2 transition-colors ${isHandsFree ? 'text-rose-500' : 'text-slate-300'}`}
              title={isHandsFree ? "Turn off Hands-free" : "Turn on Hands-free"}
            >
              <Sparkles size={20} className={isHandsFree ? 'animate-pulse' : ''} />
            </button>
            {isSupported && (
              <motion.button 
                id="mic-button"
                type="button"
                onClick={handleMicClick}
                animate={isListening ? { scale: [1, 1.2, 1], backgroundColor: ['#3b82f6', '#f43f5e', '#3b82f6'] } : {}}
                transition={isListening ? { repeat: Infinity, duration: 2 } : {}}
                className={`p-2 rounded-lg transition-colors ${isListening ? 'text-white' : 'text-slate-400 hover:text-brand-primary'}`}
              >
                {isListening ? <Mic size={20} /> : <Mic size={20} />}
              </motion.button>
            )}
            <button 
              type="submit"
              disabled={isLoading || !input.trim() || isListening}
              className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                input.trim() && !isLoading 
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-100' 
                : 'bg-slate-100 text-slate-400 scale-95 opacity-50 cursor-not-allowed'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-3 font-medium uppercase tracking-widest">
          Personal AI Companion • Version 1.0
        </p>
      </div>
    </div>
  );
}
