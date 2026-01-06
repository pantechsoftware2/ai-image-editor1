'use client'

import { useState } from 'react'
import { Canvas } from '@/components/canvas'
import { BrandConfirmationModal } from '@/components/brand-confirmation-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Header } from '@/components/header'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface BrandData {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logo: string | null
  fonts: string[]
  palette: {
    hex: string[]
    name: string
  }
}

export default function EditorPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brandData, setBrandData] = useState<BrandData | null>(null)
  const [showModal, setShowModal] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const extractBrand = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanUrl = url.trim()
    if (!cleanUrl) {
      setError('❌ Please enter a website URL (e.g., apple.com or https://apple.com)')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Extracting brand from:', url)

      const response = await fetch('/api/extract-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to extract brand data')
      }

      const data: BrandData = await response.json()
      console.log('Brand data extracted:', data)

      setBrandData(data)
      setShowModal(true)
    } catch (err: any) {
      console.error('Extraction error:', err)
      setError(err.message || 'Failed to extract brand data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmBrand = (data: BrandData) => {
    setBrandData(data)
    setShowModal(false)
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-black">
        <Header />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </main>
    )
  }

  // Show canvas if brand data is confirmed
  if (brandData && !showModal) {
    return (
      <>
        <Header />
        <Canvas brandData={brandData} />
      </>
    )
  }

  // Show extraction form
  return (
    <>
      <Header />
      <div className="min-h-screen bg-black flex items-center justify-center p-4 pt-20">
        <Card className="w-full max-w-md bg-white border-0 shadow-lg">
          <div className="p-8">
            <div className="mb-2">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-4">
                STEP 1: EXTRACT BRAND
              </span>
            </div>

            <h1 className="text-3xl font-bold text-black mb-2">Brand DNA</h1>
            <p className="text-gray-600 mb-6">
              Enter a website URL to automatically extract brand colors, fonts, and logo
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={extractBrand} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <Input
                  type="url"
                  placeholder="apple.com or https://apple.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-gray-50 border-gray-300 text-black placeholder-gray-400"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Try: apple.com, google.com, microsoft.com
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⌛</span>
                    Extracting...
                  </>
                ) : (
                  '✨ Extract Brand DNA'
                )}
              </Button>
            </form>

            <div className="space-y-3 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 rounded-lg p-4 text-sm">
                <p className="font-semibold text-blue-900 mb-2">How it works:</p>
                <ol className="space-y-1 text-blue-800 text-xs">
                  <li>• Scrapes website HTML and CSS</li>
                  <li>• Extracts primary colors & fonts</li>
                  <li>• Downloads brand logo</li>
                  <li>• Creates color palette</li>
                </ol>
              </div>
            </div>

            {/* Quick examples */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-3 uppercase">
                Quick Examples
              </p>
              <div className="grid grid-cols-3 gap-2">
                {['apple.com', 'google.com', 'microsoft.com'].map((domain) => (
                  <button
                    key={domain}
                    onClick={() => setUrl(domain)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded transition"
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Brand Confirmation Modal */}
        {showModal && brandData && (
          <BrandConfirmationModal
            brandData={brandData}
            onConfirm={handleConfirmBrand}
            onCancel={() => {
              setShowModal(false)
              setBrandData(null)
              setUrl('')
            }}
            isLoading={loading}
          />
        )}
      </div>
    </>
  )
}
