'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/lib/toast-context'
import { createClient } from '@/lib/supabase'

interface Project {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  created_at: string
  updated_at: string
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      return
    }
    fetchProjects()
  }, [user])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session. Please sign in again.')
      }

      const token = session.access_token
      
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load projects')
      }

      setProjects(data.projects || [])
      console.log(`📁 Loaded ${data.projects.length} projects`)
    } catch (error: any) {
      console.error('Error loading projects:', error)
      addToast(
        `Failed to load projects: ${error.message}`,
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (projectId: string, projectTitle: string) => {
    if (!confirm(`Delete "${projectTitle}"? This cannot be undone.`)) {
      return
    }

    try {
      setDeleting(projectId)
      
      // Get the session token from Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session. Please sign in again.')
      }

      const token = session.access_token

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete project')
      }

      setProjects((prev) => prev.filter((p) => p.id !== projectId))
      addToast(`Project "${projectTitle}" deleted successfully`, 'success')
    } catch (error: any) {
      console.error('Error deleting project:', error)
      addToast(
        `Failed to delete project: ${error.message}`,
        'error'
      )
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Sign in Required</h1>
          <p className="text-gray-400 mb-6">
            Please sign in to view your projects
          </p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <Link
            href="/editor"
            className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm mb-3 sm:mb-4 block"
          >
            ← Back to Editor
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">My Projects</h1>
          <p className="text-white/60 text-xs sm:text-sm md:text-base">
            Manage and remix your saved designs
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-gray-400 text-sm sm:text-base">Loading projects...</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-gray-400 mb-4 text-sm sm:text-base">No projects yet</div>
            <Link
              href="/editor"
              className="inline-block bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium"
            >
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
              >
                {project.thumbnail_url && (
                  <img
                    src={project.thumbnail_url}
                    alt={project.title}
                    className="w-full h-32 sm:h-40 md:h-48 object-cover"
                  />
                )}
                <div className="p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2 truncate">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 mb-3 sm:mb-4">
                    Updated: {formatDate(project.updated_at)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        localStorage.setItem('remix_project_id', project.id)
                        window.location.href = '/editor'
                      }}
                      className="flex-1 bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-blue-700 transition-colors font-medium"
                    >
                      🎨 Remix
                    </button>
                    <button
                      onClick={() => handleDelete(project.id, project.title)}
                      disabled={deleting === project.id}
                      className="flex-1 bg-red-600/20 text-red-400 px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm hover:bg-red-600/30 transition-colors disabled:opacity-50 font-medium"
                    >
                      {deleting === project.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
