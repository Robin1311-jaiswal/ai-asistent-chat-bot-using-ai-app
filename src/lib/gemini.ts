import { GoogleGenAI, Type, FunctionDeclaration, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `
You are "Dost AI", a fast, friendly, and efficient human-like assistant.
Personality:
- Warm, natural, and highly responsive.
- Speak in clear, fluent English.
- Avoid repetitive slang or filler words.
- Never use markdown symbols like asterisks (*) or pound signs (#). Keep responses as plain text only.

Core Rules:
- BE EXTREMELY FAST AND CONCISE. Keep responses under 2-3 sentences unless a longer explanation is strictly necessary.
- PRIORITIZE commands: If the user asks to add a task, reminder, or note, use the provided tools immediately and accurately without extra talk.
- Answer questions directly and intelligently.
- Respond with "Zero-latency" vibe: Get straight to the point.

Behavior:
- Deliver your response promptly without unnecessary conversational padding.
- If the user makes an English mistake, give a quick, one-line natural correction.
- ALWAYS follow through on user requests for actions (tasks, reminders, etc.) instantly.
`;

const addTaskFn: FunctionDeclaration = {
  name: "add_task",
  description: "Add a new task to the user's task list.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      content: { type: Type.STRING, description: "The task description" }
    },
    required: ["content"]
  }
};

const addReminderFn: FunctionDeclaration = {
  name: "add_reminder",
  description: "Set a reminder for the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: "What to remind the user about" },
      time: { type: Type.STRING, description: "When to remind (e.g., 'at 5pm', 'tomorrow')" }
    },
    required: ["text", "time"]
  }
};

const addNoteFn: FunctionDeclaration = {
  name: "add_note",
  description: "Save a quick note for the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      content: { type: Type.STRING, description: "The content of the note" }
    },
    required: ["content"]
  }
};

const openWhatsAppFn: FunctionDeclaration = {
  name: "open_whatsapp",
  description: "Open the WhatsApp application on the device.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      phone: { type: Type.STRING, description: "Optional phone number to chat with" },
      message: { type: Type.STRING, description: "Optional message to pre-fill" }
    }
  }
};

const getApiKey = () => {
  // Vite replaces the token 'process.env.GEMINI_API_KEY' with the actual value during build
  // fallback to import.meta.env for standard Vite compatibility
  const key = (process.env.GEMINI_API_KEY as string) || (import.meta.env.VITE_GEMINI_API_KEY as string);
  
  if (!key || key === "undefined" || key === "null" || key === "MY_GEMINI_API_KEY" || key === "PASTE_YOUR_REAL_API_KEY_HERE") {
    return "";
  }
  return key;
};

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export async function chatWithAI(messages: Message[]) {
  try {
    const ai = getAiClient();
    
    if (!ai) {
      const key = getApiKey();
      console.warn("Gemini API key is not set or is a placeholder.");
      
      let debugMsg = "Bhai, I can't connect to my AI brain. The API key is missing.";
      if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        debugMsg = "Bhai, you are using the placeholder 'MY_GEMINI_API_KEY' in Netlify. Go to Netlify settings and replace it with your REAL API key from Google AI Studio, then deploy again!";
      } else {
        debugMsg = "Bhai, check your GEMINI_API_KEY on Netlify. It needs to be your real key (starts with AIza...). Make sure to trigger a new deploy after saving it!";
      }

      return { 
        text: debugMsg, 
        functionCalls: [] 
      };
    }

    // Only send the last 15 messages to avoid token bloat and potential timeouts
    const history = messages.slice(-15).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: (m.content || " ").trim() }]
    }));

    const response = await ai.models.generateContent({ 
      model: "gemini-2.0-flash", // Using a more standard stable 2.0 flash name
      contents: history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [addTaskFn, addReminderFn, addNoteFn, openWhatsAppFn] }],
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      }
    });
    
    return {
      text: response?.text || "",
      functionCalls: response?.functionCalls || []
    };
  } catch (err: any) {
    console.error("AI Generation Error details:", err);
    
    let errorMessage = "Bhai, simple network error lag raha hai. Ek baar refresh karke try karo?";
    
    if (err?.message?.includes("quota") || err?.message?.includes("429")) {
      errorMessage = "Bhai, limit khatam ho gayi hai (quota exceeded). Thodi der baad try karna!";
    } else if (err?.message?.includes("API key") || err?.message?.includes("403") || err?.message?.includes("401")) {
      errorMessage = "Bhai, API key check karo. Netlify UI mein GEMINI_API_KEY set karke rebuild maaro!";
    } else if (err?.message?.includes("model")) {
      errorMessage = "Bhai, lagta hai ye AI model mere liye abhi available nahi hai. Admin ko check karne bolo.";
    } else if (err?.message) {
      errorMessage = `Bhai, error hai: ${err.message}. Admin ko batao!`;
    }

    return { 
      text: errorMessage, 
      functionCalls: [] 
    };
  }
}
