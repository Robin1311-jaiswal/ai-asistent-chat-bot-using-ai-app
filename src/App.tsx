import React, { useState, useEffect } from 'react';
import { 
  chatWithAI 
} from './lib/gemini';
import { Task, Reminder, Note, Message } from './types';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { CheckCircle2, Circle, Trash2, Bell } from 'lucide-react';
import { useVoice } from './hooks/useVoice';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks' | 'reminders' | 'notes'>('chat');
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('dost-messages');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('dost-tasks');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('dost-reminders');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('dost-notes');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem('dost-voice-output');
      return saved !== null ? JSON.parse(saved) : true;
    } catch { return true; }
  });
  const [isHandsFree, setIsHandsFree] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem('dost-hands-free');
      return saved !== null ? JSON.parse(saved) : false;
    } catch { return false; }
  });

  const { speak, startListening, stopListening, isListening, isSupported } = useVoice();

  // Local storage persistence
  useEffect(() => {
    localStorage.setItem('dost-tasks', JSON.stringify(tasks));
    localStorage.setItem('dost-reminders', JSON.stringify(reminders));
    localStorage.setItem('dost-notes', JSON.stringify(notes));
    localStorage.setItem('dost-messages', JSON.stringify(messages));
    localStorage.setItem('dost-voice-output', JSON.stringify(isVoiceOutputEnabled));
    localStorage.setItem('dost-hands-free', JSON.stringify(isHandsFree));
  }, [tasks, reminders, notes, messages, isVoiceOutputEnabled, isHandsFree]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = { role: 'user', content, timestamp: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await chatWithAI(newMessages);

      const functionCalls = response.functionCalls;
      let textResponse = response.text || "";

      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'add_task') {
            const newTask: Task = {
              id: Math.random().toString(36).substr(2, 9),
              content: call.args.content as string,
              completed: false,
              createdAt: Date.now()
            };
            setTasks(prev => [newTask, ...prev]);
            textResponse += `\n\n[Task Added: ${newTask.content}]`;
          } else if (call.name === 'add_reminder') {
            const newReminder: Reminder = {
              id: Math.random().toString(36).substr(2, 9),
              text: call.args.text as string,
              time: call.args.time as string,
              completed: false,
              createdAt: Date.now()
            };
            setReminders(prev => [newReminder, ...prev]);
            textResponse += `\n\n[Reminder Set: ${newReminder.text} at ${newReminder.time}]`;
          } else if (call.name === 'add_note') {
            const newNote: Note = {
              id: Math.random().toString(36).substr(2, 9),
              content: call.args.content as string,
              createdAt: Date.now()
            };
            setNotes(prev => [newNote, ...prev]);
            textResponse += `\n\n[Note Saved]`;
          } else if (call.name === 'open_whatsapp') {
            let phone = (call.args.phone as string || "").replace(/\D/g, '');
            // Add India country code if it looks like a local number
            if (phone.length === 10) phone = '91' + phone;
            
            const message = encodeURIComponent(call.args.message as string || "");
            const whatsappUrl = phone 
              ? `https://api.whatsapp.com/send?phone=${phone}&text=${message}`
              : `https://api.whatsapp.com/send?text=${message}`;
            window.open(whatsappUrl, '_blank');
            textResponse += `\n\n[Bro, tera WhatsApp khul raha hai...]`;
          }
        }
      }

      const finalResponse = textResponse.trim() || "Haan bhai, bol kya kaam hai? Main sun raha hoon.";

      setMessages(prev => [...prev, { 
        role: 'model', 
        content: finalResponse, 
        timestamp: Date.now() 
      }]);

      if (isVoiceOutputEnabled) {
        // Clean text from bracketed info for better speaking
        const speakableText = finalResponse.replace(/\[.*?\]/g, '').trim();
        if (speakableText) {
          speak(speakableText, () => {
            if (isHandsFree) {
              // Longer delay after speaking to ensure silence timer doesn't trigger immediately
              setTimeout(() => {
                const micBtn = document.getElementById('mic-button');
                if (micBtn && !isListening) micBtn.click();
              }, 800);
            }
          });
        }
      } else if (isHandsFree) {
        setTimeout(() => {
          const micBtn = document.getElementById('mic-button');
          if (micBtn && !isListening) micBtn.click();
        }, 800);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "Sorry yaar, kuch gadbad ho gayi. Please try again.", 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const clearChatHistory = () => {
    setMessages([]);
    localStorage.setItem('dost-messages', JSON.stringify([]));
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar 
        messages={messages}
        tasks={tasks}
        reminders={reminders}
        notes={notes}
        onToggleTask={toggleTask}
        onDeleteTask={deleteTask}
        onDeleteReminder={deleteReminder}
        onDeleteNote={deleteNote}
        onClearMessages={clearChatHistory}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <main className="flex-1 h-full min-w-0">
        {activeTab === 'chat' ? (
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            onClearMessages={clearChatHistory}
            isLoading={isLoading} 
            isVoiceOutputEnabled={isVoiceOutputEnabled}
            setIsVoiceOutputEnabled={setIsVoiceOutputEnabled}
            isHandsFree={isHandsFree}
            setIsHandsFree={setIsHandsFree}
            isListening={isListening}
            isSupported={isSupported}
            startListening={startListening}
            stopListening={stopListening}
          />
        ) : (
          <div className="h-full bg-white p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto py-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-display font-bold text-slate-800 capitalize">
                  {activeTab}
                </h2>
                <button 
                  onClick={() => setActiveTab('chat')}
                  className="text-sm font-medium text-brand-primary bg-brand-primary/10 px-4 py-2 rounded-xl hover:bg-brand-primary/20 transition-all"
                >
                  Back to Chat
                </button>
              </div>
              
              {activeTab === 'tasks' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.map(task => (
                    <div key={task.id} className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4 group">
                      <button onClick={() => toggleTask(task.id)} className={task.completed ? 'text-green-500' : 'text-slate-300'}>
                        {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </button>
                      <span className={`flex-1 ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {task.content}
                      </span>
                      <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                  {tasks.length === 0 && <p className="text-slate-400 col-span-full py-20 text-center border-2 border-dashed rounded-3xl">No tasks yet. Ask me to add one!</p>}
                </div>
              )}

              {activeTab === 'reminders' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reminders.map(reminder => (
                    <div key={reminder.id} className="p-5 bg-white border border-slate-100 shadow-sm rounded-2xl group relative">
                       <p className="text-lg font-medium text-slate-800 mb-2">{reminder.text}</p>
                       <p className="text-sm text-brand-primary flex items-center gap-2">
                         <Bell size={14} /> {reminder.time}
                       </p>
                       <button onClick={() => deleteReminder(reminder.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                         <Trash2 size={18} />
                       </button>
                    </div>
                  ))}
                  {reminders.length === 0 && <p className="text-slate-400 col-span-full py-20 text-center border-2 border-dashed rounded-3xl">No reminders. How about "Remind me to drink water at 4pm"?</p>}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notes.map(note => (
                    <div key={note.id} className="p-6 bg-amber-50/50 border border-amber-100 rounded-2xl relative shadow-sm group min-h-[160px] flex flex-col">
                       <p className="text-slate-700 text-sm leading-relaxed mb-4">{note.content}</p>
                       <span className="text-[10px] text-slate-400 block border-t pt-2 mt-auto">
                        {new Date(note.createdAt).toLocaleString()}
                       </span>
                       <button onClick={() => deleteNote(note.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  ))}
                  {notes.length === 0 && <p className="text-slate-400 col-span-full py-20 text-center border-2 border-dashed rounded-3xl">Empty notes. Say "Note this down: [content]" to save something.</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
