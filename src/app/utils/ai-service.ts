import OpenAI from 'openai';
import type { DiaryEntry } from '../components/diary-entry-form';

export class AIService {
  private openai: OpenAI | null = null;
  private apiKey: string = '';

  constructor(apiKey?: string) {
    // Qwen API (Aliyun Bailian) Endpoint
    // Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
    const key = apiKey || import.meta.env.VITE_QWEN_API_KEY;
    if (key) {
      this.init(key);
    }
  }

  init(apiKey: string) {
    this.apiKey = apiKey;
    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        dangerouslyAllowBrowser: true // Allowed for this client-side demo, ideally use backend proxy
      });
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
      this.openai = null;
    }
  }

  isConfigured(): boolean {
    return !!this.openai;
  }
  
  hasGlobalKey(): boolean {
    return !!import.meta.env.VITE_QWEN_API_KEY;
  }

  async generateResponse(query: string, entries: DiaryEntry[], mood?: string): Promise<string> {
    if (!this.openai) {
      return "Please configure your Qwen API Key first.";
    }

    // Prepare context
    const recentEntries = entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15) // Qwen handles long context well, but let's keep it focused
      .map(e => ({
        date: new Date(e.date).toLocaleDateString(),
        mood: e.mood,
        content: e.caption,
        tags: e.tags?.join(', ')
      }));

    // System Prompt - Identity & Style
    const systemPrompt = `
      You are "Photo Diary AI", a warm, empathetic, and insightful personal memory assistant.
      Your goal is to help the user reflect on their life, find patterns in their moods, and cherish their memories.
      
      CORE PERSONALITY:
      - Warm & Supportive: Like a close friend who knows you well.
      - Insightful: Connect dots between past and present events.
      - Gentle: If the user is sad, be comforting. If happy, celebrate with them.
      - Concise: Keep answers under 150 words unless asked for a detailed story.

      CONTEXT AWARENESS:
      - You have access to the user's recent diary entries (provided in the prompt).
      - Use specific dates and details from their diary to make your answers personal.
      - If the user asks about something NOT in the diary, politely say you don't recall that memory but ask them to tell you about it.

      LANGUAGE:
      - Detect the language of the user's query (Chinese/English/Japanese/Korean).
      - Reply in the SAME language as the user.
      - If replying in Chinese, use a natural, modern, and warm tone (e.g. "记得那天...", "真为你开心...").
    `;

    // User Context Construction
    const userContext = `
      [User's Recent Memories]
      ${JSON.stringify(recentEntries, null, 2)}

      [Current Context]
      User's Current Mood: ${mood || 'Unknown'}
      User's Query: "${query}"
    `;

    try {
      console.log('Calling Qwen API...');
      const completion = await this.openai.chat.completions.create({
        model: "qwen-turbo", // Cost-effective and fast model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContext }
        ],
      });

      return completion.choices[0].message.content || "I'm thinking...";

    } catch (error) {
      console.error('AI Service Error:', error);
      return "I'm having trouble connecting to Qwen right now. Please check your API Key or network.";
    }
  }
}

export const aiService = new AIService();
