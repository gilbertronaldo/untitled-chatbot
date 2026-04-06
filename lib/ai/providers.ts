import { createVertex } from "@ai-sdk/google-vertex/edge";
import { createOpenAI } from "@ai-sdk/openai";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";
import { chatModels, titleModel } from "./models";

// ── Test provider ─────────────────────────────────────────────────────────────

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        chatModel,
        titleModel: titleModelMock,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": titleModelMock,
        },
      });
    })()
  : null;

// ── Provider helpers ──────────────────────────────────────────────────────────

/**
 * Returns an OpenAI (or OpenAI-compatible) provider.
 *
 * Configure via environment variables:
 *   OPENAI_API_KEY   — required for hosted OpenAI
 *   OPENAI_BASE_URL  — optional; set to http://localhost:11434/v1 for Ollama
 */
function openaiProvider() {
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL, // undefined → uses OpenAI default
  });
}

/**
 * Returns a Google Vertex AI provider.
 *
 * Configure via environment variables:
 *   GOOGLE_VERTEX_PROJECT  — GCP project ID
 *   GOOGLE_VERTEX_LOCATION — GCP region (default: us-central1)
 *
 * Authentication uses Application Default Credentials (ADC).
 * Set GOOGLE_APPLICATION_CREDENTIALS to a service-account key file
 * or run `gcloud auth application-default login` locally.
 */
function vertexProvider() {
  return createVertex({
    project: "greatnusa-00", // optional
    location: "us-central1", // optional
    googleCredentials: {
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL || "",
      privateKey: process.env.GOOGLE_PRIVATE_KEY || "",
    },
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the language model for a given model ID.
 *
 * Routing is determined by the AI_PROVIDER environment variable:
 *   openai  (default) — OpenAI API or any OpenAI-compatible endpoint (Ollama)
 *   vertex             — Google Vertex AI
 */
export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("chat-model");
  }

  const provider = process.env.AI_PROVIDER ?? "openai";

  if (provider === "vertex") {
    return vertexProvider()(modelId);
  }

  return openaiProvider()(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }

  const provider = process.env.AI_PROVIDER ?? "openai";

  if (provider === "vertex") {
    return vertexProvider()(titleModel.id);
  }

  return openaiProvider()(titleModel.id);
}

// Keep a typed map of chat-model configurations for providerOptions lookup
export const chatModelConfig = Object.fromEntries(
  chatModels.map((m) => [m.id, m])
);
