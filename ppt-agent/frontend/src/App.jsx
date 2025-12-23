import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [prompt, setPrompt] = useState('')
  const [slide, setSlide] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSlide(null)

    try {
      // In production, this URL should be configurable
      const response = await axios.post('http://localhost:8000/generate-slide', {
        prompt: prompt
      })
      setSlide(response.data)
    } catch (err) {
      console.error(err)
      setError("Failed to generate slide. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header className="app-header">
        <h1>PPT Agent</h1>
        <p>AI-Powered Presentation Generator</p>
      </header>

      <main>
        <div className="input-section">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a topic (e.g., 'Q3 Financial Results')"
              required
              className="prompt-input"
            />
            <button type="submit" disabled={loading} className="generate-btn">
              {loading ? 'Generating...' : 'Generate Slide'}
            </button>
          </form>
        </div>

        {error && <div className="error-message">{error}</div>}

        {slide && (
          <div className="slide-preview">
             <div className="slide-content">
               <h2>{slide.title}</h2>
               <ul>
                 {slide.bullet_points.map((point, index) => (
                   <li key={index}>{point}</li>
                 ))}
               </ul>
             </div>
             {slide.notes && (
               <div className="speaker-notes">
                 <strong>Speaker Notes:</strong>
                 <p>{slide.notes}</p>
               </div>
             )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
