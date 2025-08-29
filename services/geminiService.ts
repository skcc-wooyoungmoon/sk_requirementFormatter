import { GoogleGenAI, Type } from "@google/genai";
import type { FormattedResult } from '../types';

export type FilePart = {
  mimeType: string;
  data: string;
};

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY is not defined in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getPrompt = (rawText: string, hasFiles: boolean): string => `
You are an expert project manager and systems analyst.
${hasFiles
  ? "Your task is to analyze the user's input, which includes text and accompanying files (like UI mockups, diagrams, documents, or whiteboards), and reformat it into a clear, professional, and well-organized requirements document in Korean. Extract and synthesize requirements from both the text and the content within the files."
  : "Your task is to reformat the following raw, unstructured user requirements into a clear, professional, and well-organized requirements document in Korean."
}

First, create a comprehensive requirements document in Markdown format. The document should include the following sections if applicable:

1.  **개요 (Overview):** A brief summary of the project's purpose.
2.  **주요 기능 (Key Features):** A bulleted list of the main functionalities.
3.  **사용자 요구사항 (User Requirements):** Detailed functional requirements, possibly numbered. Use clear and concise language.
4.  **비기능적 요구사항 (Non-Functional Requirements):** Address aspects like performance, security, usability, etc., if mentioned or implied.
5.  **제약 조건 (Constraints):** Any technical or business limitations.

Analyze the user's input and intelligently categorize each point into the appropriate section. If a section is not relevant, omit it. Ensure the final output is well-structured and easy to read. Use Markdown headings (##), subheadings (###), bold text (**), and lists (- or 1.) appropriately.

Second, after generating the markdown, analyze it and extract every individual, detailed requirement into a structured list. Each item in the list must have:
- A 'group' (e.g., '주요 기능', '사용자 요구사항').
- A unique 'id' (e.g., 'FE-001', 'BE-001').
- A 'sequence' number within its group.
- A detailed 'description' of the requirement.

The final output must be a JSON object that strictly follows the provided schema.

---

**Raw User Input (Text):**
\`\`\`
${rawText || "(제공된 텍스트 없음)"}
\`\`\`
${hasFiles ? "\n**Raw User Input (Files):**\n(파일이 컨텍스트로 별도 제공됩니다.)" : ""}

---

**Formatted Output (JSON Object):**
`;

const schema = {
    type: Type.OBJECT,
    properties: {
        markdownOutput: {
            type: Type.STRING,
            description: "The full, well-structured requirements document in Korean Markdown format.",
        },
        requirementsList: {
            type: Type.ARRAY,
            description: "A structured list of individual requirements for CSV export.",
            items: {
                type: Type.OBJECT,
                properties: {
                    group: {
                        type: Type.STRING,
                        description: "The requirement category, e.g., '주요 기능' or '사용자 요구사항'."
                    },
                    id: {
                        type: Type.STRING,
                        description: "A unique identifier for the requirement, e.g., 'FE-001'."
                    },
                    sequence: {
                        type: Type.INTEGER,
                        description: "The sequence number of the requirement within its group."
                    },
                    description: {
                        type: Type.STRING,
                        description: "The detailed description of the single requirement."
                    }
                },
                required: ["group", "id", "sequence", "description"]
            }
        }
    },
    required: ["markdownOutput", "requirementsList"]
};


export const formatRequirements = async (rawText: string, files: FilePart[]): Promise<FormattedResult> => {
  if (!rawText.trim() && files.length === 0) {
    throw new Error("Input text or files cannot be empty.");
  }
  
  try {
    const promptText = getPrompt(rawText, files.length > 0);
    const textPart = { text: promptText };
    const fileParts = files.map(file => ({
        inlineData: {
            mimeType: file.mimeType,
            data: file.data
        }
    }));

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, ...fileParts] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });
    
    const jsonResult = JSON.parse(response.text);
    return jsonResult as FormattedResult;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Failed to parse the AI's response. The model may have returned invalid JSON.");
    }
    throw new Error("Failed to communicate with the AI model.");
  }
};