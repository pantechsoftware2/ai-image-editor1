/**
 * Vertex AI Service
 * Wrapper for Google Cloud Vertex AI for Imagen-4 image generation
 */

import { VertexAI } from '@google-cloud/vertexai'

// Initialize Vertex AI
const project = process.env.GOOGLE_CLOUD_PROJECT_ID || ''
const location = process.env.GOOGLE_CLOUD_REGION || 'us-central1'

// Create Vertex AI client (server-side only)
function getVertexAI(): VertexAI {
  if (!project) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is required')
  }

  return new VertexAI({
    project,
    location,
  })
}

export interface ImageGenerationOptions {
  prompt: string
  numberOfImages?: number
  sampleCount?: number
  outputFormat?: string
}

/**
 * Generate images using Imagen-4
 * Returns array of base64-encoded images
 */
export async function generateImages(options: ImageGenerationOptions): Promise<string[]> {
  try {
    const vertexAI = getVertexAI()

    const generativeModel = vertexAI.getGenerativeModel({
      model: 'imagen-4.0-fast-generate',
    })

    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: options.prompt,
            },
          ],
        },
      ],
      generation_config: {
        max_output_tokens: 1024,
        temperature: 1,
        top_p: 0.95,
      },
      safety_settings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUAL_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    }

    console.log('Generating images with prompt:', options.prompt)

    const response = await generativeModel.generateContent(request)

    // Extract images from response
    const images: string[] = []

    if (response.response && response.response.candidates) {
      for (const candidate of response.response.candidates) {
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            // Handle image response (check for inline_data with image)
            if ('inline_data' in part && part.inline_data) {
              const data = part.inline_data as any
              if (data.mime_type && data.mime_type.startsWith('image/')) {
                images.push(data.data) // base64 string
              }
            }
            // Handle image response from Imagen specifically
            if ('text' in part) {
              const text = part.text as string
              // Imagen returns base64 in text format
              if (text && text.length > 100 && !text.includes(' ')) {
                images.push(text)
              }
            }
          }
        }
      }
    }

    // If we didn't get images from Imagen, try the image response format
    if (images.length === 0) {
      // Imagen-4 fast generate returns images in a specific format
      const candidates = (response as any).candidates || (response as any).imageResponses
      if (Array.isArray(candidates)) {
        for (const item of candidates) {
          if (item.images) {
            for (const img of item.images) {
              if (img.bytesBase64Encoded) {
                images.push(img.bytesBase64Encoded)
              }
            }
          }
        }
      }
    }

    console.log(`Generated ${images.length} images`)

    // Return 4 variants (or however many we got)
    return images.slice(0, 4)
  } catch (error) {
    console.error('Error generating images:', error)
    throw error
  }
}

/**
 * Generate images using Imagen-4 (deprecated endpoint - for fallback)
 * This uses the older REST API approach
 */
export async function generateImagesREST(prompt: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://${process.env.GOOGLE_CLOUD_REGION || 'us-central1'}-aiplatform.googleapis.com/v1/projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/${process.env.GOOGLE_CLOUD_REGION || 'us-central1'}/publishers/google/models/imagen-3.0-generate:predict`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        body: JSON.stringify({
          instances: [
            {
              prompt,
            },
          ],
          parameters: {
            sampleCount: 4,
            outputFormat: 'PNG',
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Imagen API error: ${response.statusText}`)
    }

    const data = await response.json()

    // Extract base64 images from response
    const images: string[] = []
    if (data.predictions && Array.isArray(data.predictions)) {
      for (const prediction of data.predictions) {
        if (prediction.bytesBase64Encoded) {
          images.push(prediction.bytesBase64Encoded)
        }
      }
    }

    return images.slice(0, 4)
  } catch (error) {
    console.error('Error generating images via REST:', error)
    throw error
  }
}

/**
 * Get access token for REST API (if needed)
 * Note: SDK handles auth automatically, but REST API might need explicit token
 */
async function getAccessToken(): Promise<string> {
  // This would use Google auth library to get token
  // For now, the SDK handles this automatically
  return ''
}
