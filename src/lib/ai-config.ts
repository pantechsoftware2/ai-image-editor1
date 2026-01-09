import { ModelServiceClient } from '@google-cloud/aiplatform'

const TEXT_MODEL_PRIORITY = [
  /gemini-1\.5-flash/,
  /gemini-1\.5-pro/,
  /gemini-2\.0-flash/,
  /gemini-3\.0-flash/,
  /gemini-3\.0-pro/
]

const IMAGE_MODEL_PRIORITY = [
  /imagen-3\.0-fast/,
  /imagen-3\.0-generate-001/,
  /gemini-3-pro-image/,
  /imagen-4/
]

export async function getBestAvailableModels() {
  const client = new ModelServiceClient()
  const parent = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/us-central1`

  const [models] = await client.listModels({ parent })

  const findBest = (patterns: RegExp[]) => {
    let best: string | null = null
    let rank = -1

    for (const model of models) {
      const id = model.name?.split('/').pop() || ''
      patterns.forEach((regex, i) => {
        if (regex.test(id) && i > rank) {
          rank = i
          best = id
        }
      })
    }

    return best
  }

  return {
    textModel: findBest(TEXT_MODEL_PRIORITY) || 'gemini-2.0-flash-001',
    imageModel: findBest(IMAGE_MODEL_PRIORITY) || 'imagen-3.0-generate-001'
  }
}
