/**
 * Vertex AI Service
 * Wrapper for Google Cloud Vertex AI for Imagen-4 image generation
 * NOTE: This must only be called from server-side API routes
 */

import { VertexAI } from '@google-cloud/vertexai'

// Server-side only - Initialize Vertex AI
function getVertexAI(): VertexAI {
  if (typeof window !== 'undefined') {
    throw new Error('Vertex AI SDK can only be used server-side')
  }

  const project = process.env.GOOGLE_CLOUD_PROJECT_ID
  const location = process.env.GOOGLE_CLOUD_REGION || 'us-central1'

  if (!project) {
    throw new Error(
      'GOOGLE_CLOUD_PROJECT_ID environment variable is required. ' +
      'Set it in your .env.local file'
    )
  }

  console.log(`🔐 Initializing Vertex AI with project: ${project}, location: ${location}`)

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
    console.log('📸 Starting image generation...')
    console.log('📝 Prompt:', options.prompt.substring(0, 100) + '...')

    const vertexAI = getVertexAI()
    console.log('✅ Vertex AI initialized')

    const generativeModel = vertexAI.getGenerativeModel({
      model: 'imagegeneration@006',
    })
    console.log('✅ Generative model loaded')

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

    console.log('🚀 Calling Imagen-4 API...')
    const response = await generativeModel.generateContent(request)
    console.log('📦 Response received:', response ? 'success' : 'no response')

    // Extract images from response
    const images: string[] = []

    console.log('🔍 Parsing response...')
    console.log('Response structure:', {
      hasResponse: !!response.response,
      hasCandidates: !!response.response?.candidates,
      candidatesCount: response.response?.candidates?.length || 0,
    })

    if (response.response && response.response.candidates) {
      for (let i = 0; i < response.response.candidates.length; i++) {
        const candidate = response.response.candidates[i]
        console.log(`Candidate ${i}:`, {
          hasContent: !!candidate.content,
          partsCount: candidate.content?.parts?.length || 0,
        })

        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            // Handle image response (check for inline_data with image)
            if ('inline_data' in part && part.inline_data) {
              const data = part.inline_data as any
              console.log('Found inline_data:', { mimeType: data.mime_type })
              if (data.mime_type && data.mime_type.startsWith('image/')) {
                console.log('✅ Found base64 image data')
                images.push(data.data) // base64 string
              }
            }
            // Handle text response that might contain base64
            if ('text' in part) {
              const text = part.text as string
              // Imagen returns base64 in text format
              if (text && text.length > 100 && !text.includes(' ')) {
                console.log('✅ Found base64 in text response')
                images.push(text)
              }
            }
          }
        }
      }
    }

    // If we didn't get images from standard response, try alternative formats
    if (images.length === 0) {
      console.log('⚠️ No images found in standard format, trying alternatives...')
      // Imagen-4 fast generate might return images in a different format
      const candidates = (response as any).candidates || (response as any).imageResponses
      console.log('Looking for alternative formats:', { hasCandidates: !!candidates })
      if (Array.isArray(candidates)) {
        for (const item of candidates) {
          if (item.images) {
            console.log('Found images array:', { count: item.images.length })
            for (const img of item.images) {
              if (img.bytesBase64Encoded) {
                console.log('✅ Found bytesBase64Encoded')
                images.push(img.bytesBase64Encoded)
              }
            }
          }
        }
      }
    }

    console.log(`🎉 Extracted ${images.length} images from response`)

    if (images.length === 0) {
      console.warn('⚠️ No images extracted. Full response:', JSON.stringify(response, null, 2))
      throw new Error(
        'Imagen-4 did not return any images. This may be due to content filtering or API limits.'
      )
    }

    return images.slice(0, 4)
  } catch (error: any) {
    console.error('❌ Error in generateImages:', error)
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      status: error?.status,
    })
    throw new Error(`Image generation failed: ${error?.message || 'Unknown error'}`)
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
