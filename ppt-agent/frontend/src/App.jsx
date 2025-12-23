import { useState } from 'react'
import axios from 'axios'
import html2canvas from 'html2canvas'
import { Plus, Download, RefreshCw, Layout, Edit, Image as ImageIcon, ArrowLeft } from 'lucide-react'
import Dashboard from './Dashboard'
import OutlineEditor from './OutlineEditor'
import SlideRenderer from './SlideRenderer'
import './App.css'

function App() {
  const [step, setStep] = useState('dashboard') // dashboard, input, outline, slides
  const [prompt, setPrompt] = useState('')
  const [templateId, setTemplateId] = useState(null)
  const [outline, setOutline] = useState([])
  const [slides, setSlides] = useState([])
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleTemplateUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    // Optimistic UI update or simple alert
    console.log("Uploading template...")

    try {
        const response = await axios.post(`${API_URL}/upload-template`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        setTemplateId(response.data.template_id);
        alert("Template uploaded successfully! Now write a prompt.");
        setStep('input');
    } catch (err) {
        console.error("Upload failed", err);
        setError("Failed to upload template");
    }
  }

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
      setActiveSlideIndex(0)
      setStep('slides')
    } catch (err) {
      console.error(err)
      setError("Failed to generate slide content.")
    } finally {
      setLoading(false)
    }
  }

  // Generate Image for current slide
  const handleDownloadImage = async () => {
    const element = document.getElementById(`main-slide-render`)
    if (element) {
      try {
        const canvas = await html2canvas(element)
        const link = document.createElement('a')
        link.download = `slide-${activeSlideIndex + 1}.png`
        link.href = canvas.toDataURL()
        link.click()
      } catch (err) {
        console.error("Image generation failed", err)
      }
    }
  }

  // --- Render Logic ---

  if (step === 'dashboard') {
    return (
        <Dashboard
            onGenerateClick={() => setStep('input')}
            onTemplateUpload={handleTemplateUpload}
        />
    )
  }

  if (step === 'slides') {
    return (
      <div className="app-container">
        {/* Left Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header" onClick={() => setStep('dashboard')} style={{cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
            <ArrowLeft size={16} style={{marginRight: '10px'}}/> PPT Agent
          </div>
          <div className="slide-list">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`thumbnail-wrapper ${index === activeSlideIndex ? 'active' : ''}`}
                onClick={() => setActiveSlideIndex(index)}
              >
                <div className="slide-number">{index + 1}</div>
                <div className="thumbnail-scale">
                  <div className="thumbnail-content" style={{ transform: 'scale(0.25)', width: '800px', height: '450px' }}>
                     <SlideRenderer slide={slide} id={`thumb-${index}`} />
                  </div>
                </div>
              </div>
            ))}

            <div style={{ padding: '10px', textAlign: 'center', color: '#888', border: '1px dashed #ccc', borderRadius: '4px' }}>
              <Plus size={20} style={{ display: 'block', margin: '0 auto' }} />
              Add Slide
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="workspace">
          <div className="workspace-header">
             <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <button className="icon-btn" onClick={() => setStep('outline')}><ArrowLeft size={16} /></button>
                <h3>{prompt || "Untitled Presentation"}</h3>
             </div>
             <div style={{ display: 'flex', gap: '10px' }}>
                <button className="action-btn primary-btn" onClick={handleDownloadImage}>
                  <Download size={16} /> Export
                </button>
             </div>
          </div>

          <div className="canvas-area">
            {slides[activeSlideIndex] && (
              <div className="main-slide-wrapper">
                 <SlideRenderer slide={slides[activeSlideIndex]} id="main-slide-render" />
              </div>
            )}
          </div>

          {/* Bottom Toolbar */}
          <div className="toolbar">
            <button className="action-btn">
              <Layout size={16} /> Layouts
            </button>
             <button className="action-btn">
              <RefreshCw size={16} /> Rewrite
            </button>
            <button className="action-btn">
              <ImageIcon size={16} /> Change Image
            </button>
            <button className="action-btn">
              <Edit size={16} /> Edit Text
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Input & Outline (Modal-like or dedicated pages)
  return (
    <div className="container">
       <button className="back-home-btn" onClick={() => setStep('dashboard')} style={{position: 'absolute', top: '20px', left: '20px', border: 'none', background: 'transparent', cursor: 'pointer'}}>
          <ArrowLeft size={24} color="#333" />
       </button>

      <header className="app-header">
        <h1>PPT Agent</h1>
        <p>AI-Powered Presentation Generator</p>
      </header>

      <main>
        {step === 'input' && (
          <div className="input-section">

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
            {templateId && <p style={{color: '#646cff', marginTop: '10px', fontSize: '0.9rem'}}>Using uploaded template.</p>}
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
      </main>
    </div>
  )
}

export default App
