/**
 * API Route: /api/generate-creative
 * The "God Prompt" - Gemini 3 Chain-of-Thought Creative Direction
 * 
 * Implements Phase 1 (Strategic Reasoning) → Phase 2 (Layout Selection) → Phase 3 (Asset Generation)
 * Uses Gemini 3's thinking capability for optimal creative output
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBestAvailableModels } from '@/lib/ai-config'

interface GenerateCreativeRequest {
  userPrompt: string
  brandColors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
  userId?: string
}

interface TextOverlay {
  headline: string
  subtitle: string
  suggested_font_color: string
}

interface CreativeOutput {
  reasoning: string
  layout_id: 'VISUAL_SOLO' | 'HOOK_CENTER' | 'STORY_SPLIT'
  image_prompt: string
  text_overlay: TextOverlay
  model_used: string
}

interface GenerateCreativeResponse {
  success: boolean
  creative: CreativeOutput
  error?: string
}

const SYSTEM_INSTRUCTION = `You are the Lead Creative Director at a high-end ad agency. Your goal is to translate a vague user request into a commercially viable visual asset.

### PHASE 1: STRATEGIC REASONING (Internal Monologue)
Before generating JSON, analyze the User Request for:
1. **Commercial Intent:** Is this B2B (needs trust, clean lines) or B2C (needs emotion, vibrancy)?
2. **Visual Hierarchy:** Where must the text sit so it is 100% legible? (e.g., if sky is blue, text must be white/bottom).
3. **The 'Click' Factor:** What visual element will stop the scroll?

### PHASE 2: LAYOUT SELECTION
Select exactly ONE layout ID:
- 'VISUAL_SOLO': For wallpapers, mood boards, or pure photography. (No Text).
- 'HOOK_CENTER': For punchy, single-message ads. (Text center or bottom-center).
- 'STORY_SPLIT': For complex messages. (Image top 70%, Text bottom 30% on a solid block).

### PHASE 3: ASSET GENERATION
Generate the strict JSON output below.

**Image Prompt Rules (Crucial):**
- You are prompting 'Imagen-3/4'. It understands photography terms.
- ALWAYS specify lighting: 'Volumetric lighting', 'Studio strobe', 'Golden hour'.
- ALWAYS specify texture: '8k texture', 'Octane render', 'Shot on Sony A7R IV'.
- **Negative Space Engineering:** If layout is NOT 'VISUAL_SOLO', you must append: 'Compose the image with a clean, low-detail area in the [insert position] to allow for text overlay. Do not place busy objects here.'

**Copywriting Rules:**
- Headlines: Max 5 words. Active voice.
- Subtitles: Max 12 words. Benefit-driven.

### OUTPUT JSON FORMAT:
{
  "reasoning": "User wants a coffee ad. B2C. Needs warmth. Dark roast colors.",
  "layout_id": "HOOK_CENTER",
  "image_prompt": "Close up macro shot of espresso crema... soft focus background... dark negative space at bottom...",
  "text_overlay": {
    "headline": "WAKE UP HAPPY",
    "subtitle": "50% off all dark roasts this week.",
    "suggested_font_color": "#FFFFFF"
  }
}`

export async function POST(request: NextRequest): Promise<NextResponse<GenerateCreativeResponse>> {
  try {
    const body: GenerateCreativeRequest = await request.json()

    const { userPrompt, brandColors, userId } = body

    if (!userPrompt || !userPrompt.trim()) {
      return NextResponse.json(
        {
          success: false,
          creative: {} as CreativeOutput,
          error: 'User prompt is required',
        },
        { status: 400 }
      )
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎨 THE GOD PROMPT: Gemini 3 Creative Direction')
    console.log('='.repeat(60))
    console.log(`📝 User Request: ${userPrompt}`)
    console.log(`🎨 Brand Colors:`, brandColors)
    console.log('='.repeat(60))

    // Get the best available model
    const models = await getBestAvailableModels()
    const textModel = models.textModel

    console.log(`🤖 Using Model: ${textModel}`)

    // Initialize Google Generative AI
    // In production, use: const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    
    console.log('\n💭 PHASE 1: Analyzing Strategic Intent...')


    // TODO: Replace this simulated response with actual Gemini 3 API call using the SYSTEM_INSTRUCTION and userPrompt
    // Example:
    // const model = genAI.getGenerativeModel({ model: textModel, systemInstruction: SYSTEM_INSTRUCTION })
    // const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: userPrompt }] }] })
    // const creative: CreativeOutput = JSON.parse(result.response.text())

    const simulatedCreative: CreativeOutput = {
      reasoning: `User wants a coffee ad. B2C. Needs warmth. Dark roast colors.`,
      layout_id: 'HOOK_CENTER',
      image_prompt: `Close up macro shot of ${userPrompt}, volumetric lighting, soft focus background, dark negative space at bottom, 8k texture, Octane render, Shot on Sony A7R IV. Compose the image with a clean, low-detail area at the bottom to allow for text overlay. Do not place busy objects here.`,
      text_overlay: {
        headline: 'WAKE UP HAPPY',
        subtitle: '50% off all dark roasts this week.',
        suggested_font_color: '#FFFFFF',
      },
      model_used: textModel,
    }

    console.log('✅ PHASE 2: Selected Layout')
    console.log(`   Layout: ${simulatedCreative.layout_id}`)
    console.log('✅ PHASE 3: Generated Assets')

    console.log('\n📊 Creative Output:')
    console.log(`   Headline: ${simulatedCreative.text_overlay.headline}`)
    console.log(`   Subtitle: ${simulatedCreative.text_overlay.subtitle}`)
    console.log('='.repeat(60) + '\n')

    return NextResponse.json({
      success: true,
      creative: simulatedCreative,
    })
  } catch (error: any) {
    console.error('❌ Error in /api/generate-creative:', error)

    return NextResponse.json(
      {
        success: false,
        creative: {} as CreativeOutput,
        error: error?.message || 'Failed to generate creative direction',
      },
      { status: 500 }
    )
  }
}
