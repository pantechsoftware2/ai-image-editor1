'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface GenerationSpinnerProps {
  messages: string[]
  isVisible: boolean
}

/**
 * Displays animated spinner with rotating progress messages
 * Used during image/text generation process
 */
export function GenerationSpinner({ messages, isVisible }: GenerationSpinnerProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    if (!isVisible || messages.length === 0) return

    // Rotate through messages every 1.5 seconds
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
    }, 1500)

    return () => clearInterval(interval)
  }, [isVisible, messages])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-xl max-w-sm">
        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>

        {/* Current Message */}
        <div className="text-center">
          <p className="text-gray-900 font-semibold text-lg mb-2">
            {messages[currentMessageIndex]}
          </p>
          <p className="text-gray-500 text-sm">
            Step {currentMessageIndex + 1} of {messages.length}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentMessageIndex + 1) / messages.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
