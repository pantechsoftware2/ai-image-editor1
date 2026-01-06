'use client'

import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function Header() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      await signOut()
      // Always redirect to home after sign out, even if it fails
      router.push('/')
    } catch (error) {
      console.error('Sign out error caught:', error)
      // Still redirect even if there's an error
      router.push('/')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="fixed w-full top-0 z-50 border-b border-white/10 bg-[#0d1224] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <span className="text-white font-bold text-xl">Vizly</span>
        </Link>

        <div className="flex items-center gap-3">
          {!loading && user ? (
            <>
              <Link href="/dashboard">
                <Button size="sm" className="bg-white hover:bg-white/90 text-black font-semibold">
                  Dashboard
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
                className="bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </Button>

            </>
          ) : (
            <>
              <Link href="/login">
               <Button
  size="sm"
  className="bg-blue-600 text-white hover:bg-blue-700 transition-colors"
>
  Sign In
</Button>

              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-white hover:bg-white text-black font-semibold">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
