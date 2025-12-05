import { GoogleGenAI, Type } from "@google/genai";
import { PosePrompt } from "../types";

// Helper to strip data:image/xyz;base64, prefix
const cleanBase64 = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
};

export const generateStyleAnalysis = async (base64Data: string, mimeType: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key tidak ditemui.");

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `Anda adalah seorang jurugambar perkahwinan profesional bertaraf dunia dan pakar dalam 'prompt engineering' untuk AI generatif (Midjourney v6). Tugas anda adalah menganalisis gambar yang diberikan dan menghasilkan satu perenggan prompt yang sangat terperinci. Prompt tersebut mesti merangkumi:
  1. Estetik (contoh: luxurious, rustic, minimalist)
  2. Mood (contoh: intimate, joyful, serene)
  3. Palet Warna & Pencahayaan (contoh: golden hour, soft diffused, pastel tones)
  4. Komposisi & Butiran Kamera (contoh: Sony A7R V, 85mm f/1.2, bokeh)
  5. Deskripsi Subjek & Pakaian (tekstur fabrik, emosi)
  
  Output mestilah dalam Bahasa Inggeris, satu perenggan padat, sedia untuk digunakan dalam Midjourney.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { mimeType, data: cleanBase64(base64Data) } },
        { text: "Analyze this image and create a high-end generative AI prompt." }
      ]
    },
    config: {
      systemInstruction,
      temperature: 0.7,
    }
  });

  return response.text || "Gagal menganalisis gambar.";
};

export const generateBatchPoses = async (base64Data: string, mimeType: string): Promise<PosePrompt[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key tidak ditemui.");

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `Anda adalah pengarah seni kreatif untuk fotografi perkahwinan. Berdasarkan gaya estetik gambar yang dimuat naik, jana 8 idea pose yang unik.
  Kategori pose wajib:
  1. Candid: Gelak Ketawa Spontan
  2. Intimate: 'The Forehead Touch'
  3. Artistik: 'Under The Veil' (atau yang sesuai)
  4. Wide Shot: Environmental/Grand
  5. Classic Glamour: Elegant
  6. Detail: Cincin/Tangan/Bunga
  7. Candid: Bisikan Rahsia
  8. Mood: Black & White Emotion

  Bagi setiap pose, berikan:
  - 'title': Nama pose (seperti di atas)
  - 'prompt': Prompt AI penuh yang menerangkan pose tersebut NAMUN mengekalkan gaya visual (lighting, tone, camera settings) gambar asal yang dimuat naik. Tambahkan parameter '--ar 3:4 --v 6.0' di hujung prompt.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { mimeType, data: cleanBase64(base64Data) } },
        { text: "Generate 8 wedding pose prompts based on this image's style." }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            prompt: { type: Type.STRING }
          },
          required: ["title", "prompt"]
        }
      }
    }
  });

  if (response.text) {
    try {
      return JSON.parse(response.text) as PosePrompt[];
    } catch (e) {
      console.error("Failed to parse JSON", e);
      throw new Error("Gagal memproses data pose.");
    }
  }
  
  throw new Error("Tiada respons daripada AI.");
};