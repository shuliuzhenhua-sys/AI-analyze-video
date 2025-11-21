import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisData, AnalysisResult } from "../types";
import { formatTime } from "../utils/videoUtils";

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
      description: "A high-quality text-to-image prompt (English) for Midjourney/Stable Diffusion describing the whole scene.",
    },
    characterPrompt: {
      type: Type.STRING,
      description: "如果画面中明显有人物角色，请提供针对该人物的详细外貌、服装、姿态的英文提示词 (English)。确保描述精确。如果画面中没有主要人物，请返回空字符串。",
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
            text: "分析这个视频帧。扮演一位专业的电影制作人和 AI 提示词工程师。解构这个场景。\n请注意：\n1. 'visualDescription' 和 'technicalBreakdown' 必须使用简体中文回复。\n2. 'aiPrompt' 和 'characterPrompt' 必须使用英文。\n3. 如果有人物，务必在 characterPrompt 中单独描述。"
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4,
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

export const generateStoryboard = async (frames: AnalysisResult[]): Promise<string> => {
  try {
    // Filter only successful frames
    const validFrames = frames.filter(f => f.data && !f.isLoading && !f.error);
    
    if (validFrames.length === 0) return "无法生成分镜脚本：没有有效的分析数据。";

    const context = validFrames.map(f => {
      return `Timecode: ${formatTime(f.timestamp)}\nVisual: ${f.data?.visualDescription}\nTechnical: ${f.data?.technicalBreakdown}`;
    }).join('\n\n---\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `你是一位专业的电影导演和分镜师。根据以下视频关键帧的分析数据，生成一份完整的【视频分镜脚本】(Storyboard Script)。

输入数据：
${context}

要求：
1. 使用 Markdown 格式。
2. 语言：简体中文。
3. 结构清晰，包含：
   - **剧情梗概**：基于画面总结这段视频讲述了什么。
   - **分镜列表**：按时间顺序排列，包含时间、画面描述、运镜/技术细节、推测音效/配乐。
4. 请发挥想象力，填补关键帧之间的叙事空白，使其成为一个连贯的故事脚本。
`
          }
        ]
      }
    });

    return response.text || "生成分镜脚本失败。";

  } catch (error) {
    console.error("Storyboard Generation Error:", error);
    return "生成分镜脚本时发生错误。";
  }
};