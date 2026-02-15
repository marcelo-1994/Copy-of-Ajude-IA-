import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] || '' });
  }

  // Used by the Urgent Modal
  async getHealthAdvice(symptoms: string): Promise<string> {
    try {
      const model = 'gemini-2.5-flash';
      const prompt = `
        You are a compassionate medical assistant. A user is reporting these symptoms/situation: "${symptoms}".
        Provide a very short, calming, and clear piece of advice (max 2 sentences) in Portuguese.
        If it sounds like an emergency, emphasize calling 192 (Ambulance) immediately.
      `;
      
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
      });

      return response.text || 'Mantenha a calma e procure ajuda médica se necessário.';
    } catch (error) {
      console.error('Gemini API Error:', error);
      return 'Não foi possível conectar ao assistente inteligente. Por favor, dirija-se a um hospital imediatamente se for urgente.';
    }
  }

  // New method for the main Dashboard Triage
  async analyzeRequest(userQuery: string): Promise<{
    advice: string;
    suggestedProfession: string;
    urgency: string;
    keywords: string[];
  }> {
    try {
      const model = 'gemini-2.5-flash';
      
      const response = await this.ai.models.generateContent({
        model,
        contents: `Analise o seguinte pedido de ajuda de um usuário no app 'AJUDE-IA'.
        Pedido: "${userQuery}"
        
        Responda em PORTUGUÊS DO BRASIL.
        
        Tarefas:
        1. 'advice': Dê conselhos práticos de 'primeiros socorros' ou passos iniciais para o problema (ex: fechar o registro se for vazamento, respirar fundo se for ansiedade).
        2. 'suggestedProfession': Identifique UMA profissão chave para resolver isso (ex: 'Encanador', 'Psicólogo', 'Médico', 'Advogado').
        3. 'urgency': Classifique como 'Baixa', 'Média' ou 'Alta'.
        4. 'keywords': Liste 3 palavras-chave.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              advice: { type: Type.STRING, description: "Conselhos imediatos e práticos (max 2 frases)." },
              suggestedProfession: { type: Type.STRING, description: "A profissão ideal para o caso." },
              urgency: { type: Type.STRING, description: "Nível de urgência." },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tags relacionadas." }
            },
            required: ["advice", "suggestedProfession", "urgency", "keywords"]
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error('Gemini Analysis Error:', error);
      // Fallback in case of error
      return {
        advice: "Não conseguimos analisar automaticamente. Veja os profissionais abaixo.",
        suggestedProfession: "",
        urgency: "Baixa",
        keywords: []
      };
    }
  }
}