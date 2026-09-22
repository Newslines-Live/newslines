/**
 * OpenAI-compatible Chat Completions client (fetch-based).
 * Env: OPENAI_API_KEY, optional OPENAI_BASE_URL, OPENAI_MODEL
 */
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export function getLlmConfig(): LlmConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local or the environment.",
    );
  }
  return {
    apiKey,
    baseUrl: (
      process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1"
    ).replace(/\/$/, ""),
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
  };
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; jsonMode?: boolean },
): Promise<{ content: string; model: string }> {
  const config = getLlmConfig();
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: options?.temperature ?? 0.2,
  };
  if (options?.jsonMode !== false) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `LLM request failed ${res.status}: ${errText.slice(0, 500)}`,
    );
  }

  const data = (await res.json()) as {
    model?: string;
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM returned empty content");
  return { content, model: data.model || config.model };
}

export function parseJsonFromLlm(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Could not parse JSON from LLM response");
  }
}
