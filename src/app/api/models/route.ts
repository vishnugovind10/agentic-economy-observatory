import { NextResponse } from "next/server";
import { createOllamaClient, getDefaultModel, getOllamaBaseUrl, messageFromError } from "@/lib/ollama";

export const dynamic = "force-dynamic";

export async function GET() {
  const defaultModel = getDefaultModel();

  try {
    const response = await createOllamaClient().list();
    const models = response.models.map((model) => model.name).sort();

    return NextResponse.json({
      baseUrl: getOllamaBaseUrl(),
      defaultModel: models.includes(defaultModel) ? defaultModel : models[0] ?? defaultModel,
      models,
    });
  } catch (error) {
    return NextResponse.json(
      {
        baseUrl: getOllamaBaseUrl(),
        defaultModel,
        error: `Unable to reach Ollama at ${getOllamaBaseUrl()}: ${messageFromError(error)}`,
        models: [],
      },
      { status: 503 },
    );
  }
}
