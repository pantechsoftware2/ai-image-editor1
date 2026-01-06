'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas as FabricCanvas, Rect, Textbox } from 'fabric'
import { ImageGrid } from './image-grid'
import { useAuth } from '@/lib/auth-context'

interface CanvasTemplate {
  name: string
  id: string
  description: string
  setup: (canvas: InstanceType<typeof FabricCanvas>) => void
}

// Define templates as JSON coordinates
const TEMPLATES: CanvasTemplate[] = [
  {
    name: 'Full Image',
    id: 'full-image',
    description: 'Image fills entire canvas',
    setup: (canvas) => {
      canvas.clear()
      const rect = new Rect({
        left: 0,
        top: 0,
        width: 1080,
        height: 1350,
        fill: '#F3F4F6',
        selectable: false,
      })
      canvas.add(rect)
    },
  },
  {
    name: 'Image + Text',
    id: 'image-text',
    description: 'Image at 100%, text block at top',
    setup: (canvas) => {
      canvas.clear()

      const rect = new Rect({
        left: 0,
        top: 0,
        width: 1080,
        height: 1350,
        fill: '#FFFFFF',
        selectable: false,
      })
      canvas.add(rect)

      const imageArea = new Rect({
        left: 0,
        top: 100,
        width: 1080,
        height: 900,
        fill: '#E5E7EB',
        stroke: '#D1D5DB',
        strokeWidth: 1,
        selectable: false,
      })
      canvas.add(imageArea)

      const textBlock = new Textbox('Add Your Text Here', {
        left: 50,
        top: 30,
        width: 980,
        fontSize: 48,
        fontWeight: 'bold',
        fill: '#000000',
        editable: true,
        fontFamily: 'Arial',
      })
      canvas.add(textBlock)
    },
  },
  {
    name: 'Two Column',
    id: 'two-column',
    description: 'Left image, right text',
    setup: (canvas) => {
      canvas.clear()

      const bg = new Rect({
        left: 0,
        top: 0,
        width: 1080,
        height: 1350,
        fill: '#FFFFFF',
        selectable: false,
      })
      canvas.add(bg)

      const leftArea = new Rect({
        left: 0,
        top: 0,
        width: 540,
        height: 1350,
        fill: '#E5E7EB',
        stroke: '#D1D5DB',
        strokeWidth: 1,
        selectable: false,
      })
      canvas.add(leftArea)

      const rightText = new Textbox('Your Text Content', {
        left: 600,
        top: 100,
        width: 420,
        fontSize: 36,
        fill: '#000000',
        editable: true,
        fontFamily: 'Arial',
      })
      canvas.add(rightText)
    },
  },
  {
    name: 'Centered',
    id: 'centered',
    description: 'Centered content with margins',
    setup: (canvas) => {
      canvas.clear()

      const bg = new Rect({
        left: 0,
        top: 0,
        width: 1080,
        height: 1350,
        fill: '#FFFFFF',
        selectable: false,
      })
      canvas.add(bg)

      const contentArea = new Rect({
        left: 90,
        top: 200,
        width: 900,
        height: 950,
        fill: '#F9FAFB',
        stroke: '#E5E7EB',
        strokeWidth: 2,
        selectable: false,
      })
      canvas.add(contentArea)

      const centerText = new Textbox('Centered Content', {
        left: 150,
        top: 600,
        width: 780,
        fontSize: 52,
        fontWeight: 'bold',
        textAlign: 'center',
        fill: '#000000',
        editable: true,
        fontFamily: 'Arial',
      })
      canvas.add(centerText)
    },
  },
]

export function Canvas({ brandData }: { brandData?: any }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<InstanceType<typeof FabricCanvas> | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('image-text')
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1350 })
  const [generatingImages, setGeneratingImages] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<any[]>([])
  const [showImageGrid, setShowImageGrid] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [promptInput, setPromptInput] = useState('')
  const [useAIText, setUseAIText] = useState(false)
  const [generatingHeadline, setGeneratingHeadline] = useState(false)
  const { user } = useAuth()

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: 1080,
      height: 1350,
      backgroundColor: '#FFFFFF',
    })

    fabricCanvasRef.current = fabricCanvas

    const initialTemplate = TEMPLATES.find((t) => t.id === selectedTemplate)
    if (initialTemplate) {
      initialTemplate.setup(fabricCanvas)
    }

    const handleResize = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.clientWidth
      const aspectRatio = 1080 / 1350

      let newWidth = containerWidth - 40
      let newHeight = newWidth / aspectRatio

      if (newHeight > window.innerHeight - 200) {
        newHeight = window.innerHeight - 200
        newWidth = newHeight * aspectRatio
      }

      fabricCanvas.setDimensions({
        width: newWidth,
        height: newHeight,
      })

      const scale = newWidth / 1080
      fabricCanvas.setZoom(scale)

      setCanvasSize({ width: newWidth, height: newHeight })
    }

    let resizeTimeout: NodeJS.Timeout
    const resizeListener = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(handleResize, 100)
    }

    window.addEventListener('resize', resizeListener)
    handleResize()

    return () => {
      window.removeEventListener('resize', resizeListener)
      fabricCanvas.dispose()
    }
  }, [])

  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const template = TEMPLATES.find((t) => t.id === selectedTemplate)
    if (template) {
      template.setup(fabricCanvasRef.current)
    }
  }, [selectedTemplate])

  const addText = () => {
    if (!fabricCanvasRef.current) return

    const text = new Textbox('New Text', {
      left: 50,
      top: 50,
      width: 980,
      fontSize: 32,
      fill: brandData?.primaryColor || '#000000',
      editable: true,
      fontFamily: brandData?.fonts?.[0] || 'Arial',
    })

    fabricCanvasRef.current.add(text)
    fabricCanvasRef.current.setActiveObject(text)
    fabricCanvasRef.current.renderAll()
  }

  const downloadCanvas = () => {
    if (!fabricCanvasRef.current) return

    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    })

    const link = document.createElement('a')
    link.href = dataURL
    link.download = `design-${Date.now()}.png`
    link.click()
  }

  const generateImages = async () => {
    const prompt = promptInput.trim()
    if (!prompt) {
      alert('❌ Please enter a description (e.g., "a steaming cup of coffee")')
      return
    }

    setGeneratingImages(true)
    setImagePrompt(prompt)

    try {
      console.log('🚀 Generating images with prompt:', prompt)
      console.log('🎨 Using AI Text Effects:', useAIText)

      const response = await fetch('/api/generateImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          template: selectedTemplate,
          primaryColor: brandData?.primaryColor,
          secondaryColor: brandData?.secondaryColor,
          accentColor: brandData?.accentColor,
          userId: user?.id,
          useAIText,
          aiTextContent: useAIText ? promptInput : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ API Error:', data)
        throw new Error(data.error || `Failed to generate images (${response.status})`)
      }

      if (data.success && data.images && data.images.length > 0) {
        console.log('✨ Generated images:', data.images.length)
        setGeneratedImages(data.images)
        setShowImageGrid(true)
        setPromptInput('')
      } else {
        console.error('❌ No images in response:', data)
        throw new Error(data.error || 'No images were generated. Try a different prompt.')
      }
    } catch (error: any) {
      console.error('🔴 Generation error:', error)
      const errorMessage = error?.message || 'Unknown error'
      alert(
        `❌ Error: ${errorMessage}\n\nMake sure your Google Cloud credentials are configured correctly.`
      )
    } finally {
      setGeneratingImages(false)
    }
  }

  const handleImageSelect = async (image: any) => {
    if (!fabricCanvasRef.current) return

    try {
      console.log('📸 Loading image as background...')
      
      // Add image as background (scale to fit canvas)
      const imgUrl = image.base64 || image.url
      const img = new Image()
      
      img.onload = async () => {
        const fabricImage = new (FabricCanvas as any).Image(img, {
          left: 0,
          top: 0,
          width: 1080,
          height: 1350,
          selectable: false,
          evented: false,
        })
        
        // Add image and set it to be behind text
        fabricImage.zIndex = 0
        fabricCanvasRef.current!.add(fabricImage)
        fabricCanvasRef.current!.renderAll()
        console.log('✅ Image added to canvas as background')
        
        // Auto-generate and add headline text
        await generateAndAddHeadline()
      }

      img.src = imgUrl
    } catch (error) {
      console.error('❌ Error loading image:', error)
      alert('Failed to load image')
    }
  }

  const generateAndAddHeadline = async () => {
    if (!promptInput.trim()) {
      console.log('ℹ️ No prompt, skipping headline generation')
      return
    }

    try {
      setGeneratingHeadline(true)
      console.log('✨ Generating headline with Gemini...')

      // Call Gemini to generate a headline
      const response = await fetch('/api/generateHeadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: promptInput,
        }),
      })

      const data = await response.json()

      if (data.headline && fabricCanvasRef.current) {
        console.log('💭 Generated headline:', data.headline)

        // Add text to canvas
        const textbox = new Textbox(data.headline, {
          left: 50,
          top: 50,
          width: 980,
          fontSize: 48,
          fontWeight: 'bold',
          fill: brandData?.primaryColor || '#FFFFFF',
          editable: true,
          fontFamily: brandData?.fonts?.[0] || 'Arial',
          textAlign: 'center',
          stroke: '#000000',
          strokeWidth: 2,
        })

        fabricCanvasRef.current.add(textbox)
        fabricCanvasRef.current.renderAll()
        console.log('✅ Headline added to canvas')
      }
    } catch (error) {
      console.error('❌ Headline generation error:', error)
      // Don't alert - this is optional
    } finally {
      setGeneratingHeadline(false)
    }
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Canvas Editor</h1>
          <p className="text-gray-400">
            Design with 1080x1350 aspect ratio • Drag to move • Double-click text to edit
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Templates</h2>
                <div className="space-y-2">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        selectedTemplate === template.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs mt-1 opacity-75">
                        {template.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Tools</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">
                      Generate Image
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., steaming coffee cup"
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          generateImages()
                        }
                      }}
                      className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg text-xs mb-2 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                      disabled={generatingImages}
                    />
                    
                    {/* AI Text Effects Toggle */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useAIText}
                          onChange={(e) => setUseAIText(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-300">Use AI Text Effects?</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        ⚠️ Renders text in image (non-editable). Example: "SALE" rendered in smoke effect.
                      </p>
                    </div>

                    <button
                      onClick={generateImages}
                      disabled={generatingImages || !promptInput.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      {generatingImages ? (
                        <>
                          <span className="inline-block animate-spin mr-2">⌛</span>
                          Generating...
                        </>
                      ) : (
                        '🎨 Generate Image'
                      )}
                    </button>
                  </div>

                  <button
                    onClick={addText}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    + Add Text
                  </button>
                  <button
                    onClick={downloadCanvas}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    ⬇️ Download
                  </button>
                </div>
              </div>

              {brandData && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Brand Info
                  </h2>
                  <div className="space-y-3 text-sm">
                    {brandData.logo && (
                      <div>
                        <p className="text-gray-400 mb-2">Logo</p>
                        <img
                          src={brandData.logo}
                          alt="Brand logo"
                          className="w-full h-20 object-contain bg-gray-800 rounded"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-gray-400">Primary</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: brandData.primaryColor }}
                        />
                        <span className="text-gray-300">
                          {brandData.primaryColor}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div
              ref={containerRef}
              className="bg-gray-800 rounded-lg p-5 flex justify-center items-start min-h-[600px]"
            >
              <canvas
                ref={canvasRef}
                className="border-2 border-gray-700 rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {showImageGrid && generatedImages.length > 0 && (
        <ImageGrid
          images={generatedImages}
          prompt={imagePrompt}
          onSelect={handleImageSelect}
          onClose={() => setShowImageGrid(false)}
        />
      )}
    </div>
  )
}
