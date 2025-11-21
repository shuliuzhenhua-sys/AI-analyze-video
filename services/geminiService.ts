import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisData } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    visualDescription: {
      type: Type.STRING,
      description: "场景的详细视觉描述，包括主体、动作和环境 (Simplified Chinese).",
    },
    aiPrompt: {
      type: Type.STRING,
      description: "A high-quality text-to-image prompt (English) for Midjourney/Stable Diffusion.",
    },
    technicalBreakdown: {
      type: Type.STRING,
      description: "从专业电影制作角度解释这个镜头是如何拍摄的，包括灯光、镜头选择、CGI或实拍特效等 (Simplified Chinese).",
    },
    colorPalette: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3-5 hex color codes.",
    }
  },
  required: ["visualDescription", "aiPrompt", "technicalBreakdown", "colorPalette"],
};

export const analyzeFrame = async (base64Image: string): Promise<AnalysisData> => {
  try {
    // Strip the data URL prefix if present to get raw base64
    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          },
          {
            text: "分析这个视频帧。扮演一位专业的电影制作人和 AI 提示词工程师。解构这个场景。\n请注意：\n1. 'visualDescription' 和 'technicalBreakdown' 必须使用简体中文回复。\n2. 'aiPrompt' 请保持使用英文，因为这是针对 Midjourney/Stable Diffusion 优化的提示词。"
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4, // Lower temperature for more analytical/consistent results
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as AnalysisData;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};