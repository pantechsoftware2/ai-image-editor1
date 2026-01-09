'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export function MagicInput() {
  const [input, setInput] = useState('')
  const { user } = useAuth()
  const router = useRouter()

  const handleCreateClick = () => {
    if (!input.trim()) return

    if (!user) {
      // Preserve prompt in URL for signup redirect
      const encodedPrompt = encodeURIComponent(input)
      router.push(`/signup?prompt=${encodedPrompt}`)
    } else {
      // Logged in - go to editor with prompt
      const encodedPrompt = encodeURIComponent(input)
      router.push(`/editor?prompt=${encodedPrompt}`)
    }
  }

  return (
    <div className="space-y-8 sm:space-y-12 w-full">
      {/* Main Input */}
      <div className="relative w-full px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 bg-white rounded-lg sm:rounded-xl p-2 sm:p-2.5 focus-within:ring-2 focus-within:ring-white/30 transition-all shadow-lg">
          <Input
            type="text"
            placeholder="What are you marketing today?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateClick()}
            className="flex-1 bg-transparent border-0 text-black placeholder-black/40 focus:outline-none text-sm sm:text-base font-medium"
          />
          <Button
            onClick={handleCreateClick}
            className="w-full sm:w-auto rounded-lg bg-black hover:bg-black/90 text-white px-4 sm:px-6 py-2.5 sm:py-2 font-semibold flex items-center justify-center sm:justify-start gap-2 whitespace-nowrap text-sm sm:text-base"
            disabled={!input.trim()}
          >
            <Zap className="w-4 h-4 flex-shrink-0" />
            <span>Generate Draft</span>
            <ArrowRight className="w-4 h-4 flex-shrink-0 hidden sm:inline" />
          </Button>
        </div>
      </div>

      {/* Quick Examples */}
      <div className="text-center">
        <p className="text-white/50 text-xs sm:text-sm mb-4 sm:mb-6 px-4 sm:px-0">Or try these examples:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 px-4 sm:px-0">
          {[
            'Minimalist logo design',
            'Professional presentation slide',
            'Social media thumbnail',
          ].map((example) => (
            <button
              key={example}
              onClick={() => setInput(example)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all text-xs sm:text-sm font-medium"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
