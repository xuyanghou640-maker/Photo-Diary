import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_AI_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  try {
    const { prompt, history, mood } = request.body;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Construct the full prompt context
    // We are reconstructing the system prompt here on the server side for security
    // so the client doesn't need to send the full system instruction, just the user query and data context.
    // However, to keep it simple and consistent with previous logic, we'll accept the constructed prompt 
    // or construct it here.
    
    // Let's rely on the prompt passed from client for now, but in a real "hardened" app 
    // you might want to construct the system prompt here to prevent prompt injection.
    // Given the previous architecture, the client constructs the "prompt" string containing context.
    // We will just forward it.
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return response.status(200).json({ content: text });
  } catch (error) {
    console.error('AI Error:', error);
    return response.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
}