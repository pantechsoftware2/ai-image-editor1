/**
 * AI Configuration: Dynamic Model Selection
 * 
 * This module implements the "Model Hunter" - a dynamic configuration singleton that:
 * 1. Queries Google's Vertex AI Model Garden API
 * 2. Sorts available models by generation/version (priority hierarchy)
 * 3. Selects the best available model for both text and image generation
 * 
 * Model Priority (Higher index = Better):
 * TEXT: gemini-3.0-pro > gemini-2.0-flash > gemini-1.5-pro > gemini-1.5-flash
 * IMAGE: imagen-4 > gemini-3-pro-image > imagen-3.0-generate-001 > imagen-3.0-fast
 */

import { ModelServiceClient } from '@google-cloud/aiplatform'

// ============================================================
// 1. DEFINE THE HIERARCHY OF "BEST" (Regex Patterns)
// Higher index = Better model. We prefer Pro over Flash, and newer versions over older.
// ============================================================

const TEXT_MODEL_PRIORITY = [
  /gemini-1\.5-flash/i,
  /gemini-1\.5-pro/i,
  /gemini-2\.0-flash/i,
  /gemini-2\.0-pro/i,
  /gemini-3\.0-flash/i,
  /gemini-3\.0-pro/i, // The Heavyweight
]

const IMAGE_MODEL_PRIORITY = [
  /imagen-3\.0-fast/i,
  /imagen-3\.0-generate-001/i,
  /gemini-3-pro-image/i,
  /imagen-4\.0-generate-001/i,
  /imagen-4/i, // The Holy Grail
]

// ============================================================
// 2. SINGLETON CACHE - Stores the best models once selected
// ============================================================

interface ModelConfig {
  textModel: string
  imageModel: string
  selectedAt: number
}

let cachedConfig: ModelConfig | null = null

// ============================================================
// 3. HELPER FUNCTION - Find the best match from available models
// ============================================================

function findBestModel(patterns: RegExp[], availableModels: string[]): string | null {
  let bestModel: string | null = null
  let bestRank = -1

  for (const model of availableModels) {
    for (let rank = 0; rank < patterns.length; rank++) {
      if (patterns[rank].test(model) && rank > bestRank) {
        bestRank = rank
        bestModel = model
      }
    }
  }

  return bestModel
}

// ============================================================
// 4. MAIN EXPORT - Get best available models
// Returns cached result if fresh, or queries API if needed
// ============================================================

export async function getBestAvailableModels(forceRefresh = false) {
  // Return cached result if available and fresh (< 1 hour old)
  if (cachedConfig && !forceRefresh && Date.now() - cachedConfig.selectedAt < 3600000) {
    console.log('📦 Using cached model config:', {
      textModel: cachedConfig.textModel,
      imageModel: cachedConfig.imageModel,
    })
    return {
      textModel: cachedConfig.textModel,
      imageModel: cachedConfig.imageModel,
    }
  }

  try {
    console.log('🔍 Probing for best available models...')

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
    const region = process.env.GOOGLE_CLOUD_REGION || 'us-central1'

    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID not set')
    }

    // Query Vertex AI Model Garden API
    const client = new ModelServiceClient()
    const parent = `projects/${projectId}/locations/${region}`

    const [models] = await client.listModels({ parent })

    if (!models || models.length === 0) {
      console.warn('⚠️  No models found in Model Garden, using fallbacks')
      throw new Error('No models available')
    }

    // Extract model IDs
    const availableModels = models
      .map((m) => m.name?.split('/').pop() || '')
      .filter((id) => id.length > 0)

    console.log(`📊 Found ${availableModels.length} available models`)

    // Find best matches using priority patterns
    const textModel = findBestModel(TEXT_MODEL_PRIORITY, availableModels)
    const imageModel = findBestModel(IMAGE_MODEL_PRIORITY, availableModels)

    if (!textModel || !imageModel) {
      console.warn('⚠️  Some models not found in priority list, using fallbacks')
    }

    const config: ModelConfig = {
      textModel: textModel || 'gemini-2.0-flash-001',
      imageModel: imageModel || 'imagen-4.0-generate-001',
      selectedAt: Date.now(),
    }

    // Cache the result
    cachedConfig = config

    console.log('✅ Selected models:', {
      textModel: config.textModel,
      imageModel: config.imageModel,
      region,
    })

    return {
      textModel: config.textModel,
      imageModel: config.imageModel,
    }
  } catch (error: any) {
    console.error('❌ Failed to query Model Garden API, using fallbacks:', error?.message)

    // Fallback to known-good models
    const config: ModelConfig = {
      textModel: 'gemini-2.0-flash-001',
      imageModel: 'imagen-4.0-generate-001',
      selectedAt: Date.now(),
    }

    cachedConfig = config

    return {
      textModel: config.textModel,
      imageModel: config.imageModel,
    }
  }
}

// ============================================================
// 5. UTILITY FUNCTIONS
// ============================================================

/**
 * Check if a specific model is available
 */
export async function isModelAvailable(modelName: string): Promise<boolean> {
  try {
    const config = await getBestAvailableModels()
    return modelName === config.textModel || modelName === config.imageModel
  } catch {
    return false
  }
}

/**
 * Get model generation info for UI display
 */
export function getModelInfo(modelName: string) {
  const generation = modelName.includes('3.0') ? '3.0' : modelName.includes('2.0') ? '2.0' : '1.5'
  const isText = !modelName.includes('imagen')
  const type = isText ? 'Text' : 'Image'

  return {
    name: modelName,
    generation,
    type,
    icon: isText ? '📝' : '🎨',
  }
}

/**
 * Clear cache to force refresh on next call
 */
export function clearModelCache() {
  cachedConfig = null
  console.log('🧹 Model cache cleared')
}
