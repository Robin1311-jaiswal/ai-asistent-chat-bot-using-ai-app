import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  CheckSquare, 
  Bell, 
  FileText, 
  Menu, 
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { Task, Reminder, Note, Message } from '../types';

interface SidebarProps {
  messages: Message[];
  tasks: Task[];
  reminders: Reminder[];
  notes: Note[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onClearMessages: () => void;
  activeTab: 'chat' | 'tasks' | 'reminders' | 'notes';
  setActiveTab: (tab: 'chat' | 'tasks' | 'reminders' | 'notes') => void;
}

export default function Sidebar({
  messages,
  tasks,
  reminders,
  notes,
  onToggleTask,
  onDeleteTask,
  onDeleteReminder,
  onDeleteNote,
  onClearMessages,
  activeTab,
  setActiveTab
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const tabs: Array<{ id: 'chat' | 'tasks' | 'reminders' | 'notes', label: string, icon: any, count?: number }> = [
    { id: 'chat', label: 'Dost Chat', icon: MessageSquare },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, count: tasks.filter(t => !t.completed).length },
    { id: 'reminders', label: 'Reminders', icon: Bell, count: reminders.length },
    { id: 'notes', label: 'Notes', icon: FileText, count: notes.length },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        id="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-md lg:hidden hover:bg-slate-50 transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 280 : 0, opacity: isOpen ? 1 : 0 }}
        className="h-screen bg-white border-r border-slate-200 overflow-hidden flex flex-col z-40 fixed lg:relative"
      >
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-display font-bold text-brand-primary flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center">
              🤖
            </div>
            Dost AI
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                activeTab === tab.id 
                ? 'bg-brand-primary/10 text-brand-primary' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon size={20} />
                <span className="font-medium">{tab.label}</span>
              </div>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-xs bg-brand-primary text-white px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}

          <div className="pt-8 px-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick View</h2>
              {activeTab === 'chat' && messages.length > 0 && (
                <button 
                  onClick={onClearMessages}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors py-1 px-2 hover:bg-rose-50 rounded"
                >
                  Clear
                </button>
              )}
            </div>
            
            <AnimatePresence mode="popLayout">
              {activeTab === 'chat' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {messages.length === 0 && <p className="text-sm text-slate-400 italic">No chat history yet.</p>}
                  {messages.slice(-5).reverse().map((msg, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-1">
                      <p className={`text-[10px] font-bold uppercase ${msg.role === 'user' ? 'text-brand-primary' : 'text-slate-400'}`}>
                        {msg.role === 'user' ? 'You' : 'Dost'}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2">{msg.content}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'tasks' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {tasks.length === 0 && <p className="text-sm text-slate-400 italic">No tasks yet.</p>}
                  {tasks.map(task => (
                    <motion.div 
                      key={task.id} 
                      layout
                      className="group flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg text-sm"
                    >
                      <button 
                        onClick={() => onToggleTask(task.id)}
                        className={`transition-colors ${task.completed ? 'text-green-500' : 'text-slate-300'}`}
                      >
                        {task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      </button>
                      <span className={`flex-1 truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {task.content}
                      </span>
                      <button onClick={() => onDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'reminders' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {reminders.length === 0 && <p className="text-sm text-slate-400 italic">No reminders.</p>}
                  {reminders.map(reminder => (
                    <div key={reminder.id} className="group p-3 bg-slate-50 rounded-lg space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-slate-700 font-medium">{reminder.text}</p>
                        <button onClick={() => onDeleteReminder(reminder.id)} className="text-slate-400 hover:text-rose-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="text-[10px] text-brand-primary font-medium flex items-center gap-1">
                        <Bell size={10} /> {reminder.time}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {notes.length === 0 && <p className="text-sm text-slate-400 italic">No notes.</p>}
                  {notes.map(note => (
                    <div key={note.id} className="group p-3 bg-slate-50 rounded-lg space-y-2">
                      <p className="text-xs text-slate-600 line-clamp-3">{note.content}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                        <button onClick={() => onDeleteNote(note.id)} className="text-slate-400 hover:text-rose-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="p-4 mt-auto space-y-2">
          <div className="p-3 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-lg shadow-sm">
              🇬🇧
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">English Coach</p>
              <p className="text-xs font-semibold text-slate-700">Active Mode</p>
            </div>
          </div>

          <button 
            onClick={() => {
              if (confirm("History delete karni hai bhai?")) {
                localStorage.removeItem('dost-messages');
                window.location.reload();
              }
            }}
            className="w-full p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl border border-slate-100 transition-all flex items-center justify-center gap-2 text-xs font-medium"
          >
            <Trash2 size={14} /> Clear Chat History
          </button>
          
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight mb-2">Connected as</p>
            <p className="text-xs font-semibold text-slate-700">Dost User</p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
