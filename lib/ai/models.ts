// Default model – can be overridden via DEFAULT_CHAT_MODEL env var.
// Set AI_PROVIDER=vertex and configure GOOGLE_VERTEX_PROJECT to use
// Google Vertex AI instead of OpenAI.
export const DEFAULT_CHAT_MODEL =
  process.env.DEFAULT_CHAT_MODEL ?? "gpt-4o-mini";

export const titleModel = {
  id: process.env.DEFAULT_TITLE_MODEL ?? "gpt-4o-mini",
  name: "GPT-4o Mini",
  provider: "openai",
  description: "Fast model for title generation",
};

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: ModelCapabilities;
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
};

// Models are resolved from the AI_PROVIDER env var at runtime.
// For OpenAI / OpenAI-compatible (e.g. Ollama): set AI_PROVIDER=openai and
//   OPENAI_API_KEY / OPENAI_BASE_URL (leave OPENAI_BASE_URL unset for OpenAI).
// For Google Vertex AI: set AI_PROVIDER=vertex and GOOGLE_VERTEX_PROJECT.
export const openaiModels: ChatModel[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Fast and affordable model with vision and tool use",
    capabilities: { tools: true, vision: true, reasoning: false },
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Highly capable model with vision and tool use",
    capabilities: { tools: true, vision: true, reasoning: false },
  },
  {
    id: "o4-mini",
    name: "o4 Mini",
    provider: "openai",
    description: "Efficient reasoning model",
    capabilities: { tools: true, vision: false, reasoning: true },
    reasoningEffort: "medium",
  },
];

export const vertexModels: ChatModel[] = [
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "vertex",
    description: "Fast and capable Gemini model with tool use",
    capabilities: { tools: true, vision: true, reasoning: false },
  },
  {
    id: "gemini-2.0-flash-thinking-exp-1219",
    name: "Gemini 2.0 Flash Thinking",
    provider: "vertex",
    description: "Gemini model with reasoning capabilities",
    capabilities: { tools: false, vision: true, reasoning: true },
  },
];

function getActiveProvider(): string {
  return process.env.AI_PROVIDER ?? "openai";
}

export const chatModels: ChatModel[] =
  getActiveProvider() === "vertex" ? vertexModels : openaiModels;

export function getCapabilities(): Record<string, ModelCapabilities> {
  return Object.fromEntries(chatModels.map((m) => [m.id, m.capabilities]));
}

export const isDemo = process.env.IS_DEMO === "1";

export function getActiveModels(): ChatModel[] {
  return chatModels;
}

export const allowedModelIds = new Set(chatModels.map((m) => m.id));

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
