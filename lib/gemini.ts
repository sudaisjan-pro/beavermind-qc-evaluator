// ─── Gemini API Wrapper ───
// Direct REST API calls to Gemini — no SDK needed.

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiGenerateOptions {
  model?: string;
  systemInstruction?: string;
  messages: GeminiMessage[];
  jsonMode?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

interface GeminiResponse {
  text: string;
  promptTokens: number;
  completionTokens: number;
  thinkingTokens: number;
}

export async function generateWithGemini(options: GeminiGenerateOptions): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY environment variable');

  const model = options.model || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  const requestBody: Record<string, unknown> = {
    contents: options.messages.map(m => ({
      role: m.role,
      parts: m.parts,
    })),
    generationConfig: {
      temperature: options.temperature ?? 0,
      maxOutputTokens: options.maxOutputTokens ?? 65536,
      ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  // System instruction as a top-level field (Gemini API format)
  if (options.systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    let errMsg = `Gemini API error (${res.status})`;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errMsg;
    } catch { /* use default */ }
    throw new Error(errMsg);
  }

  const data = await res.json();

  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error('Gemini returned no candidates. The response may have been filtered.');
  }

  const text = candidate.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return {
    text,
    promptTokens: data.usageMetadata?.promptTokenCount || 0,
    completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
    thinkingTokens: data.usageMetadata?.thoughtsTokenCount || 0,
  };
}
