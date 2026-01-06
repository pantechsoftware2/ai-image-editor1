/**
 * API Route: /api/generateHeadline
 * Generates a short marketing headline using Gemini AI
 * Called when user selects an image to auto-add text to canvas
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

interface GenerateHeadlineRequest {
  subject: string
}

interface GenerateHeadlineResponse {
  success: boolean
  headline?: string
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateHeadlineResponse>> {
  try {
    const body: GenerateHeadlineRequest = await request.json()
    const { subject } = body

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subject is required',
        },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.warn('⚠️ GOOGLE_GENERATIVE_AI_API_KEY not set, skipping headline generation')
      return NextResponse.json(
        {
          success: true,
          headline: subject.charAt(0).toUpperCase() + subject.slice(1), // Fallback: capitalize subject
        }
      )
    }

    console.log('💭 Generating headline for subject:', subject)

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Generate a single, short marketing headline (5 words max) for a design image about "${subject}". 
Be creative, punchy, and compelling. 
The headline will be displayed as an overlay on the generated image.
Return ONLY the headline text, nothing else. No quotation marks, no explanation.`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text().trim()

    // Clean up the response (remove quotes if present)
    const headline = responseText
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .split('\n')[0] // Take first line only
      .trim()

    console.log('✨ Generated headline:', headline)

    return NextResponse.json({
      success: true,
      headline,
    })
  } catch (error: any) {
    console.error('❌ Headline generation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to generate headline',
      },
      { status: 500 }
    )
  }
}
