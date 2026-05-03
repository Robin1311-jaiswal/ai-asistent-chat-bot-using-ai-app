export interface Task {
  id: string;
  content: string;
  completed: boolean;
  createdAt: number;
}

export interface Reminder {
  id: string;
  text: string;
  time: string;
  completed: boolean;
  createdAt: number;
}

export interface Note {
  id: string;
  content: string;
  createdAt: number;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}
