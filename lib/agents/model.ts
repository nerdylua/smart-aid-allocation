import { type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

const DEFAULT_PROVIDER = "openai";
const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

type AgentProvider = "openai" | "gemini";

function resolveAgentProvider(value = process.env.MODEL): AgentProvider {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return DEFAULT_PROVIDER;
  }

  if (normalized === "openai" || normalized === "gemini") {
    return normalized;
  }

  throw new Error(
    `Unsupported MODEL value "${value}". Expected "openai" or "gemini".`
  );
}

function getOpenAIModel() {
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })(process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL);
}

function getGeminiModel() {
  return createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  })(process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL);
}

export function getAgentModel(): LanguageModel {
  return resolveAgentProvider() === "gemini"
    ? getGeminiModel()
    : getOpenAIModel();
}