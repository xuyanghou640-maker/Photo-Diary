import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DiaryEntry } from '../components/diary-entry-form';

export class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor(apiKey?: string) {
    // Priority: Constructor argument > Environment Variable
    const key = apiKey || import.meta.env.VITE_GOOGLE_AI_KEY;
    if (key) {
      this.init(key);
    }
  }

  init(apiKey: string) {
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
      this.model = null;
    }
  }

  isConfigured(): boolean {
    // We are configured if we have a local model OR if we are in production (assuming backend is set up)
    // Actually, let's keep it simple: returns true always, and we try backend if local fails?
    // Or better: check for key OR assume backend.
    // For now, let's return true so the UI shows "Powered by Site AI" if no local key but backend might work.
    // But to be safe, let's stick to the previous logic + backend check.
    return !!this.model || true; // Always allow trying the request, as it might go to backend
  }
  
  hasGlobalKey(): boolean {
    // If we have a VITE key, it's global.
    // BUT, if we are using the backend proxy, we effectively have a "global key" from the user's perspective.
    // So let's return true to hide the settings panel if we are in a mode where backend is expected.
    // For this specific user request, they want to hide the settings.
    return !!import.meta.env.VITE_GOOGLE_AI_KEY || true; 
  }

  async generateResponse(query: string, entries: DiaryEntry[], mood?: string): Promise<string> {
    // Prepare context
    const recentEntries = entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)
      .map(e => ({
        date: new Date(e.date).toLocaleDateString(),
        mood: e.mood,
        content: e.caption,
        tags: e.tags?.join(', ')
      }));

    const prompt = `
      You are a warm, empathetic, and insightful diary companion. 
      The user is asking you a question or sharing a thought.
      
      Here is the context of the user's recent diary entries (memories):
      ${JSON.stringify(recentEntries, null, 2)}

      User's Query: "${query}"

      Instructions:
      1. Answer the user's query based *only* on the provided diary entries if asking about the past.
      2. If the user asks about something not in the diary, give a general supportive answer but mention you don't have a record of it.
      3. Be conversational and friendly. Use the user's language (if they ask in Chinese, answer in Chinese).
      4. If the user seems sad, offer comfort. If happy, celebrate with them.
      5. Keep the response concise but meaningful.
      
      ${mood ? `Current Context: The user is currently feeling ${mood}.` : ''}
    `;

    try {
      // 1. Try Local Client-Side Call (if configured)
      if (this.model) {
        console.log('Using local/client-side Gemini key');
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      }
      
      // 2. Fallback to Backend Proxy (Safe Method)
      console.log('Using backend API proxy');
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Backend API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content;

    } catch (error) {
      console.error('AI Service Error:', error);
      return "I'm having trouble connecting to my brain right now. Please try again later.";
    }
  }
}

export const aiService = new AIService();