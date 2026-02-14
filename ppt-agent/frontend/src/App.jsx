import { useState } from 'react'
import axios from 'axios'
import html2canvas from 'html2canvas'
import { Plus, Download, RefreshCw, Layout, Edit, Image as ImageIcon, ArrowLeft, Type, Grid, Palette, Settings, X, MoreHorizontal, AlignLeft, Bold, Italic } from 'lucide-react'
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

  if (step === 'input') {
      return (
        <div className="creation-overlay">
            <button className="close-btn" onClick={() => setStep('dashboard')}>
                <X size={32} />
            </button>

            <div className="creation-container">
                <h1 className="creation-header">Create new presentation</h1>

                <form onSubmit={handleGenerateOutline}>
                    <div className="creation-input-group">
                        <label className="creation-label">Make it look like...</label>
                        <div style={{display:'flex', gap:'10px', overflowX:'auto', paddingBottom:'10px'}}>
                             {/* Mock Themes */}
                             {['Modern', 'Classic', 'Dark', 'Vibrant'].map(theme => (
                                 <button type="button" key={theme} style={{
                                     padding:'8px 16px', borderRadius:'20px',
                                     border:'1px solid #444', background: 'transparent', color:'#fff', cursor:'pointer'
                                 }}>{theme}</button>
                             ))}
                        </div>
                    </div>

                    <div className="creation-input-group">
                        <label className="creation-label">About...</label>
                        <input
                            type="text"
                            className="creation-input"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. Q3 Marketing Strategy"
                            autoFocus
                        />
                    </div>

                    {templateId && <p style={{color: '#646cff', fontSize: '0.9rem'}}>Using uploaded template.</p>}

                    <div className="creation-actions">
                        <button type="submit" className="creation-btn primary" disabled={loading || !prompt}>
                            {loading ? 'Analyzing...' : 'Create Presentation'}
                        </button>
                        <button type="button" className="creation-btn" onClick={() => setStep('dashboard')}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
      )
  }

  if (step === 'slides') {
    return (
      <div className="app-container">
        {/* Left Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header" onClick={() => setStep('dashboard')}>
            <ArrowLeft size={16} /> PPT Agent
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

            <div style={{ padding: '15px', textAlign: 'center', color: '#888', border: '1px dashed #ccc', borderRadius: '4px', cursor: 'pointer', fontSize:'0.8rem' }}>
              <Plus size={16} style={{ display: 'block', margin: '0 auto 5px' }} />
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

                 {/* Floating Toolbar Mockup */}
                 <div className="floating-toolbar">
                     <button className="float-btn"><Bold size={16} /></button>
                     <button className="float-btn"><Italic size={16} /></button>
                     <button className="float-btn"><AlignLeft size={16} /></button>
                     <div style={{width:'1px', height:'16px', background:'#ddd', margin:'0 4px'}}></div>
                     <button className="float-btn"><Settings size={16} /></button>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Context Sidebar */}
        <div className="context-sidebar">
            <div className="context-header">Design Tools</div>
            <div className="context-content">
                <div className="tool-section">
                    <h4>Layouts</h4>
                    <div className="tool-grid">
                        <div className="tool-btn"><Layout size={20} /> Smart</div>
                        <div className="tool-btn"><Grid size={20} /> Grid</div>
                    </div>
                </div>

                <div className="tool-section">
                    <h4>Content</h4>
                    <div className="tool-grid">
                        <div className="tool-btn"><Type size={20} /> Text</div>
                        <div className="tool-btn"><ImageIcon size={20} /> Image</div>
                        <div className="tool-btn"><Palette size={20} /> Color</div>
                        <div className="tool-btn"><RefreshCw size={20} /> Rewrite</div>
                    </div>
                </div>

                <div className="tool-section">
                    <h4>Slide Note</h4>
                    <div style={{fontSize:'0.8rem', color:'#666', lineHeight:'1.5'}}>
                        Use this area to add speaker notes or AI instructions for this specific slide.
                    </div>
                </div>
            </div>
        </div>
      </div>
    )
  }

  // Outline Fallback
  if (step === 'outline') {
      return (
        <div className="container">
             <OutlineEditor
                outline={outline}
                onUpdate={setOutline}
                onGenerate={handleGenerateSlides}
             />
        </div>
      )
  }

  return <div>Loading...</div>
}

export default App
