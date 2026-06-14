import {
  FunctionCallingMode,
  GoogleGenerativeAI,
  type Content,
  type GenerateContentRequest,
  type GenerativeModel,
} from '@google/generative-ai'
import { AriPredictorUnavailableError, isGeminiQuotaError } from '@/lib/ari/errors'
import { ARI_TOOLS } from '@/lib/ari/tools'

const DEFAULT_MODEL = 'gemini-2.5-flash-lite'
const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash-lite']

export const CHAT_MAX_OUTPUT = 220
export const CHAT_TEMPERATURE = 0.2

export { AriPredictorUnavailableError as AriQuotaError } from '@/lib/ari/errors'

function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY no configurada')
  return key
}

export function getModelCandidates(): string[] {
  const primary = process.env.ARI_MODEL ?? DEFAULT_MODEL
  const extras =
    process.env.ARI_MODEL_FALLBACKS?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? FALLBACK_MODELS
  return [...new Set([primary, ...extras])]
}

export function createGenerativeModel(
  modelName: string,
  systemInstruction: string,
  generationConfig?: GenerativeModel['generationConfig']
) {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey())
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    tools: [{ functionDeclarations: ARI_TOOLS }],
    toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
    generationConfig: generationConfig ?? {
      temperature: CHAT_TEMPERATURE,
      maxOutputTokens: CHAT_MAX_OUTPUT,
    },
  })
}

export async function generateContentWithFallback(input: {
  systemInstruction: string
  request: GenerateContentRequest
  generationConfig?: GenerativeModel['generationConfig']
}) {
  const models = getModelCandidates()
  let lastQuotaError: unknown

  for (const modelName of models) {
    try {
      const model = createGenerativeModel(
        modelName,
        input.systemInstruction,
        input.generationConfig
      )
      const result = await model.generateContent(input.request)
      return { result, modelName }
    } catch (err) {
      if (!isGeminiQuotaError(err)) throw err
      lastQuotaError = err
      console.warn(`[predictor/gemini] ${modelName} sin cuota, probando siguiente…`, err)
    }
  }

  throw new AriPredictorUnavailableError('gemini', lastQuotaError)
}

export type { Content }
