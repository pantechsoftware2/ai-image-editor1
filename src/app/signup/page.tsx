'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { signUpWithEmail, signInWithGoogle } = useAuth()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await signUpWithEmail(email, password)
      // After signup, redirect to login page with success message
      router.push('/login?signup=success')
    } catch (err: any) {
      setError(err?.message ?? 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 pt-20">
      <Card className="w-full max-w-md bg-white border-0 shadow-lg">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-black mb-2">Create Account</h1>
          <p className="text-gray-600 mb-6">Sign up to start designing</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-50 border-gray-300 text-black placeholder-gray-400"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50 border-gray-300 text-black placeholder-gray-400"
                disabled={loading}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-2" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : '✨ Sign Up'}
            </Button>
          </form>

          <div className="space-y-3 mb-6">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-xs">
              <p className="font-semibold mb-1">📧 What happens next:</p>
              <ol className="space-y-1">
                <li>1. Account created</li>
                <li>2. Confirmation email sent</li>
                <li>3. Click link in email to verify</li>
                <li>4. Sign in and start designing!</li>
              </ol>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            onClick={signInWithGoogle}
            variant="outline"
            className="w-full border-gray-300 text-black hover:bg-gray-50 font-semibold py-2"
            disabled={loading}
          >
            🔐 Continue with Google
          </Button>

          <p className="text-center text-gray-600 mt-6 text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-black hover:underline font-semibold">
              Sign In
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}
