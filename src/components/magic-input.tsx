'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'

export function MagicInput() {
  const [input, setInput] = useState('')

  return (
    <div className="space-y-12">
      {/* Main Input */}
      <div className="relative w-full">
        <div className="flex gap-2 bg-white rounded-xl p-2 focus-within:ring-2 focus-within:ring-white/30 transition-all">
          <Input
            type="text"
            placeholder="Describe what you want to create..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-0 text-black placeholder-black/40 focus:outline-none text-base font-medium"
          />
          <Link href={input ? '/editor' : '#'}>
            <Button
              className="rounded-lg bg-black hover:bg-black/90 text-white px-6 py-2 font-semibold flex items-center gap-2"
              disabled={!input}
            >
              <Zap className="w-4 h-4" />
              Create
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Examples */}
      <div className="text-center">
        <p className="text-white/50 text-sm mb-6">Or try these examples:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            'Minimalist logo design',
            'Professional presentation slide',
            'Social media thumbnail',
          ].map((example) => (
            <button
              key={example}
              onClick={() => setInput(example)}
              className="px-4 py-3 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all text-sm"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
