import { Ollama } from "ollama";

export function getOllamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(
    /\/+$/,
    "",
  );
}

export function getDefaultModel() {
  return process.env.DEFAULT_OLLAMA_MODEL ?? "qwen3:8b";
}

export function createOllamaClient() {
  return new Ollama({ host: getOllamaBaseUrl() });
}

export function messageFromError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}
