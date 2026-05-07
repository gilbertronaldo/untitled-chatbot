// Default model – can be overridden via DEFAULT_CHAT_MODEL env var.
// Set AI_PROVIDER=vertex and configure GOOGLE_VERTEX_PROJECT to use
// Google Vertex AI instead of OpenAI.
export const DEFAULT_CHAT_MODEL =
  process.env.DEFAULT_CHAT_MODEL ?? "gemini-2.5-pro";

export const titleModel = {
  id: process.env.DEFAULT_TITLE_MODEL ?? "gemini-2.5-pro",
  name: "Gemini 2.5 Pro",
  provider: "vertex",
  description: "Model used for generating conversation titles"
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


export const vertexModels: ChatModel[] = [
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "vertex",
    description: "Fast and capable Gemini model with tool use",
    capabilities: { tools: true, vision: true, reasoning: false },
  },
];

function getActiveProvider(): string {
  return process.env.AI_PROVIDER ?? "vertex";
}

export const chatModels: ChatModel[] =
  getActiveProvider() === "vertex" ? vertexModels : [];

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
