/**
 * API Route: /api/projects/save
 * Saves a project with generated images, headlines, and metadata
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface SaveProjectRequest {
  userId: string
  title: string
  description: string
  prompt: string
  tier: number
  images: Array<{
    url: string
    storagePath: string
  }>
  headline?: string
  subtitle?: string
  canvasState?: string
}

interface SaveProjectResponse {
  success: boolean
  projectId?: string
  error?: string
}

// Initialize Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(url, key)
}

export async function POST(request: NextRequest): Promise<NextResponse<SaveProjectResponse>> {
  try {
    const body: SaveProjectRequest = await request.json()

    const {
      userId,
      title,
      description,
      prompt,
      tier,
      images,
      headline,
      subtitle,
      canvasState,
    } = body

    if (!userId || !title || !images.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId, title, or images',
        },
        { status: 400 }
      )
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log('💾 SAVING PROJECT')
    console.log('='.repeat(60))
    console.log(`📊 Title: ${title}`)
    console.log(`👤 User ID: ${userId}`)
    console.log(`🎯 Tier: ${tier}`)
    console.log(`📝 Prompt: ${prompt}`)
    console.log(`🖼️  Images: ${images.length}`)
    console.log('='.repeat(60))

    const supabase = getSupabaseClient()

    // Save to projects table
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        title,
        description,
        prompt,
        tier,
        headline,
        subtitle,
        canvas_state: canvasState,
        image_urls: images.map((img) => img.url),
        storage_paths: images.map((img) => img.storagePath),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')

    if (projectError) {
      console.error('❌ Project save error:', projectError)
      throw projectError
    }

    if (!projectData || projectData.length === 0) {
      throw new Error('Failed to save project - no ID returned')
    }

    const projectId = projectData[0].id
    console.log(`✅ Project saved with ID: ${projectId}`)

    return NextResponse.json({
      success: true,
      projectId,
    })
  } catch (error: any) {
    console.error('❌ Error in /api/projects/save:', error)

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to save project',
      },
      { status: 500 }
    )
  }
}
