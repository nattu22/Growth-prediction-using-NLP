import { useState } from 'react'
import axios from 'axios'
import html2canvas from 'html2canvas'
import TemplateUpload from './TemplateUpload'
import OutlineEditor from './OutlineEditor'
import SlideRenderer from './SlideRenderer'
import './App.css'

function App() {
  const [step, setStep] = useState('input') // input, outline, slides
  const [prompt, setPrompt] = useState('')
  const [templateId, setTemplateId] = useState(null)
  const [outline, setOutline] = useState([])
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [images, setImages] = useState({}) // Store generated images keyed by slide index

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Step 1: Generate Outline
  const handleGenerateOutline = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(`${API_URL}/generate-outline`, { prompt })
      setOutline(response.data.slides)
      setStep('outline')
    } catch (err) {
      console.error(err)
      setError("Failed to generate outline.")
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Generate Slides content
  const handleGenerateSlides = async (finalOutline) => {
    setLoading(true)
    setError(null)
    setSlides([]) // Reset

    try {
      // Fetch all slides in parallel (or sequential if rate limited)
      // For simplicity/safety, let's do Promise.all
      const promises = finalOutline.map(item =>
        axios.post(`${API_URL}/generate-slide-content`, {
          title: item.title,
          layout: item.suggested_layout,
          context: `${prompt}. Intent: ${item.intent}`,
          template_id: templateId
        })
      )

      const responses = await Promise.all(promises)
      setSlides(responses.map(r => r.data))
      setStep('slides')
    } catch (err) {
      console.error(err)
      setError("Failed to generate slide content.")
    } finally {
      setLoading(false)
    }
  }

  // Generate Image for a slide
  const generateImage = async (index) => {
    const element = document.getElementById(`slide-${index}`)
    if (element) {
      try {
        const canvas = await html2canvas(element)
        const imgData = canvas.toDataURL("image/png")
        setImages(prev => ({ ...prev, [index]: imgData }))
      } catch (err) {
        console.error("Image generation failed", err)
      }
    }
  }

  return (
    <div className="container">
      <header className="app-header">
        <h1>PPT Agent</h1>
        <p>AI-Powered Presentation Generator</p>
      </header>

      <main>
        {step === 'input' && (
          <div className="input-section">
            <TemplateUpload onUpload={setTemplateId} />
            {templateId && <p style={{color: 'green'}}>Template loaded!</p>}

            <form onSubmit={handleGenerateOutline} style={{ marginTop: '20px' }}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a topic (e.g., 'Q3 Financial Results')"
                required
                className="prompt-input"
              />
              <button type="submit" disabled={loading} className="generate-btn">
                {loading ? 'Analyzing...' : 'Create Outline'}
              </button>
            </form>
          </div>
        )}

        {step === 'outline' && (
          <OutlineEditor
            outline={outline}
            onUpdate={setOutline}
            onGenerate={handleGenerateSlides}
          />
        )}

        {loading && <div className="loading">Working...</div>}
        {error && <div className="error-message">{error}</div>}

        {step === 'slides' && (
          <div className="slides-view">
             <h2>Your Presentation</h2>
             <button onClick={() => setStep('input')}>Start Over</button>

             <div className="slides-grid">
               {slides.map((slide, index) => (
                 <div key={index} className="slide-wrapper" style={{ margin: '40px 0' }}>
                   {/* The actual HTML Slide */}
                   <SlideRenderer slide={slide} id={`slide-${index}`} />

                   {/* Controls */}
                   <div style={{ marginTop: '10px' }}>
                     <button onClick={() => generateImage(index)}>Capture as Image</button>
                   </div>

                   {/* Display Captured Image */}
                   {images[index] && (
                     <div style={{ marginTop: '10px' }}>
                       <strong>Captured Image:</strong>
                       <br/>
                       <img src={images[index]} alt="Slide Capture" style={{ width: '400px', border: '1px solid #333' }} />
                     </div>
                   )}

                   {slide.notes && (
                     <div className="speaker-notes">
                       <strong>Notes:</strong> {slide.notes}
                     </div>
                   )}
                 </div>
               ))}
             </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
