// src/pages/Builder.jsx
import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import './Builder.css';

const Builder = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState({
    html: '',
    css: '',
    js: ''
  });
  const [previewMode, setPreviewMode] = useState('code'); // 'code' or 'preview'
  const [activeTab, setActiveTab] = useState('html'); // 'html', 'css', 'js'
  const [dividerPosition, setDividerPosition] = useState(40);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [deviceView, setDeviceView] = useState('desktop'); // 'desktop' or 'mobile'
  const [isEnhancing, setIsEnhancing] = useState(false);
  const dividerRef = useRef(null);
  const previewRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // AI Generation function
  const generateWebsite = async () => {
    if (!prompt.trim()) return;
    
    console.log('Generate website called with prompt:', prompt);
    
    setIsGenerating(true);
    setIsGeneratingCode(true);
    
    try {
      // Call the index.js AI generation function with the raw prompt
      const result = await callIndexJS(prompt);
      
      console.log('Result received:', result);
      
      // Animate code generation
      await animateCodeGeneration(result);
      
      setGeneratedFiles(result);
      console.log('Generated files set:', result);
      
      // Save the project to localStorage for History page
      if (result.html || result.css || result.js) {
        const newProject = {
          id: Date.now().toString(),
          prompt: prompt,
          html: result.html,
          css: result.css,
          js: result.js,
          timestamp: Date.now()
        };
        
        // Get existing projects
        const existingProjects = JSON.parse(localStorage.getItem('aiProjects') || '[]');
        existingProjects.unshift(newProject); // Add new project at the beginning
        
        // Save back to localStorage
        localStorage.setItem('aiProjects', JSON.stringify(existingProjects));
        console.log('Project saved to history');
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
      setIsGeneratingCode(false);
    }
  };

  // Call the index.js AI generation
  const callIndexJS = async (userPrompt) => {
    try {
      console.log('Starting AI generation for prompt:', userPrompt);
      
      // Import and call the AI generation function from index.js
      const { runAgent } = await import('../index.js');
      
      // Run the AI agent with the raw prompt and get the generated files
      const generatedFiles = await runAgent(userPrompt);
      
      console.log('AI generation completed:', generatedFiles);
      
      return generatedFiles;
    } catch (error) {
      console.error('Error calling index.js:', error);
      // Fallback to simple response
      return {
        html: `<!DOCTYPE html>
<html>
<head>
    <title>Generated Website</title>
</head>
<body>
    <h1>${userPrompt}</h1>
    <p>Website generated from your prompt: ${userPrompt}</p>
</body>
</html>`,
        css: `body { font-family: Arial, sans-serif; padding: 20px; }`,
        js: `console.log('Website generated for: ${userPrompt}');`
      };
    }
  };

  // Animate code generation
  const animateCodeGeneration = async (files) => {
    const delay = 100; // Delay between each character
    
    // Animate HTML
    for (let i = 0; i < files.html.length; i++) {
      setGeneratedFiles(prev => ({
        ...prev,
        html: files.html.substring(0, i + 1)
      }));
      await new Promise(resolve => setTimeout(resolve, delay / 10));
    }
    
    // Animate CSS
    for (let i = 0; i < files.css.length; i++) {
      setGeneratedFiles(prev => ({
        ...prev,
        css: files.css.substring(0, i + 1)
      }));
      await new Promise(resolve => setTimeout(resolve, delay / 10));
    }
    
    // Animate JS
    for (let i = 0; i < files.js.length; i++) {
      setGeneratedFiles(prev => ({
        ...prev,
        js: files.js.substring(0, i + 1)
      }));
      await new Promise(resolve => setTimeout(resolve, delay / 10));
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const container = dividerRef.current?.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    const clampedPosition = Math.max(20, Math.min(80, newPosition));
    setDividerPosition(clampedPosition);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const togglePreview = () => {
    setPreviewMode(previewMode === 'code' ? 'preview' : 'code');
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const getActiveCode = () => {
    switch (activeTab) {
      case 'html':
        return generatedFiles.html || '// Generated HTML will appear here';
      case 'css':
        return generatedFiles.css || '// Generated CSS will appear here';
      case 'js':
        return generatedFiles.js || '// Generated JavaScript will appear here';
      default:
        return generatedFiles.html || '// Generated HTML will appear here';
    }
  };

  const enhancePrompt = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt first to enhance it.');
      return;
    }
  
    setIsEnhancing(true);
  
    try {
      const { enhancePromptAI } = await import('../index.js');
  
      const enhanced = await enhancePromptAI(prompt);
  
      if (enhanced && typeof enhanced === 'string') {
        setPrompt(enhanced);
        console.log('✅ Prompt enhanced successfully');
      } else {
        alert('AI returned an empty or invalid response.');
      }
    } catch (error) {
      console.error('❌ Error enhancing prompt:', error.message || error);
      alert('Error enhancing prompt. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };
  

  const downloadCode = async () => {
    if (!generatedFiles.html && !generatedFiles.css && !generatedFiles.js) {
      alert('No code generated yet. Please generate a website first.');
      return;
    }

    try {
      // Create a simple ZIP-like structure using JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add files to the ZIP
      if (generatedFiles.html) {
        zip.file('index.html', generatedFiles.html);
      }
      if (generatedFiles.css) {
        zip.file('style.css', generatedFiles.css);
      }
      if (generatedFiles.js) {
        zip.file('script.js', generatedFiles.js);
      }

      // Create a README file
      const readmeContent = `# AI Generated Website

This website was generated using AI Website Builder.

## Files:
- index.html - Main HTML file
- style.css - CSS styles
- script.js - JavaScript functionality

## How to use:
1. Extract all files to a folder
2. Open index.html in your web browser
3. The website should work immediately

Generated on: ${new Date().toLocaleString()}
Original prompt: ${prompt || 'Not specified'}`;

      zip.file('README.md', readmeContent);

      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-website-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('Code downloaded successfully!');
    } catch (error) {
      console.error('Error downloading code:', error);
      alert('Error downloading code. Please try again.');
    }
  };

  // Function to publish the generated website to Vercel
  const publishToVercel = async () => {
    if (!generatedFiles.html && !generatedFiles.css && !generatedFiles.js) {
      alert('No code generated yet. Please generate a website first.');
      return;
    }
  
    // Inject CSS/JS references
    function injectAssets(html) {
      let newHtml = html.replace(
        /<head([^>]*)>/i,
        `<head$1>\n<link rel="stylesheet" href="style.css">`
      );
      newHtml = newHtml.replace(
        /<\/body>/i,
        `<script src="script.js"></script>\n</body>`
      );
      return newHtml;
    }
    const htmlWithAssets = injectAssets(generatedFiles.html);
  
    try {
      const response = await fetch('http://localhost:3001/api/vercel-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: htmlWithAssets,
          css: generatedFiles.css,
          js: generatedFiles.js,
          projectName: prompt.slice(0, 30) || 'ai-website',
        }),
      });
      let data;
      try {
        data = await response.json();
      } catch {
        const text = await response.text();
        alert('❌ Error publishing: ' + text);
        return;
      }
      if (response.ok && data.url) {
        alert(`✅ Published! Your site is live at: ${data.url}`);
        window.open(data.url, '_blank');
      } else {
        alert('❌ Failed to publish: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('❌ Error publishing: ' + error.message);
    }
  };

  // Voice-to-text logic for prompt
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Sorry, your browser does not support Speech Recognition.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
    }
    const recognition = recognitionRef.current;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      insertTextAtCursor(transcript);
    };
    recognition.start();
  };

  // Insert text at cursor in the prompt textarea
  const insertTextAtCursor = (text) => {
    const textarea = document.getElementById('prompt-textarea');
    if (!textarea) {
      setPrompt(prev => (prev ? prev + ' ' + text : text));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const newValue = value.slice(0, start) + text + value.slice(end);
    setPrompt(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 0);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  useEffect(() => {
    if (previewMode === 'preview' && previewRef.current && generatedFiles.html) {
      const htmlContent = generatedFiles.html;
      const cssContent = generatedFiles.css;
      const jsContent = generatedFiles.js;
      
      // Create a complete HTML document with proper structure
      let fullHTML = htmlContent;
      
      // If the HTML doesn't have proper structure, create a complete document
      if (!htmlContent.includes('<!DOCTYPE html>') && !htmlContent.includes('<html>')) {
        fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Generated Website</title>
    <style>
        /* Reset all existing styles to ensure AI CSS takes precedence */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        /* Remove any external CSS references */
        link[rel="stylesheet"] {
            display: none !important;
        }
        
        /* AI Generated CSS with !important to override any existing styles */
        ${cssContent.replace(/;/g, ' !important;')}
    </style>
</head>
<body>
    ${htmlContent}
    <script>
        ${jsContent}
    </script>
</body>
</html>`;
      } else {
        // If HTML has proper structure, inject CSS and JS properly
        // Remove any external CSS links to prevent conflicts
        fullHTML = fullHTML.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
        
        // Add CSS with !important to override existing styles
        const cssWithImportant = cssContent.replace(/;/g, ' !important;');
        
        // Inject CSS into head
        if (fullHTML.includes('</head>')) {
          fullHTML = fullHTML.replace('</head>', 
            `<style>
                /* Reset all existing styles to ensure AI CSS takes precedence */
                * {
                    margin: 0 !important;
                    padding: 0 !important;
                    box-sizing: border-box !important;
                }
                
                /* AI Generated CSS with !important to override any existing styles */
                ${cssWithImportant}
            </style></head>`);
        } else {
          // If no head tag, add one
          fullHTML = fullHTML.replace('<html>', 
            `<html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Generated Website</title>
                <style>
                    /* Reset all existing styles to ensure AI CSS takes precedence */
                    * {
                        margin: 0 !important;
                        padding: 0 !important;
                        box-sizing: border-box !important;
                    }
                    
                    /* AI Generated CSS with !important to override any existing styles */
                    ${cssWithImportant}
                </style>
            </head>`);
        }
        
        // Inject JS into body
        if (fullHTML.includes('</body>')) {
          fullHTML = fullHTML.replace('</body>', `<script>${jsContent}</script></body>`);
        } else {
          fullHTML = fullHTML.replace('</html>', `<script>${jsContent}</script></html>`);
        }
      }
      
      // Create a blob URL for the HTML content
      const blob = new Blob([fullHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      previewRef.current.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.title = 'Website Preview';
      iframe.className = deviceView === 'mobile' ? 'preview-iframe mobile' : 'preview-iframe desktop';
      iframe.style.width = deviceView === 'mobile' ? '375px' : '100%';
      iframe.style.height = deviceView === 'mobile' ? '667px' : '100%';
      iframe.style.border = 'none';
      if (deviceView === 'mobile') {
        iframe.style.borderRadius = '20px';
        iframe.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.2)';
        iframe.style.border = '8px solid #333';
      } else {
        iframe.style.borderRadius = '8px';
        iframe.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        iframe.style.border = 'none';
      }
      previewRef.current.appendChild(iframe);
      // Cleanup blob URL
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [previewMode, generatedFiles, deviceView]);

  return (
    <>
      <Navbar />
      <div className="builder-container">
        {/* Left Side - Prompt Input */}
        <div 
          className="prompt-section"
          style={{ width: `${dividerPosition}%` }}
        >
          <div className="prompt-header">
            <h2>🤖 AI Website Builder</h2>
            <p>Describe your website and watch AI create it!</p>
          </div>
          
          <div className="prompt-input">
            <textarea
              id="prompt-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the website you want to build... (e.g., 'A modern portfolio website for a photographer with image gallery and contact form')"
              disabled={isGenerating}
            />
            <div className="button-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleVoiceInput}
                className={`voice-mic-btn${isListening ? ' listening' : ''}`}
                title="Speak to insert text into the prompt"
              >
                {isListening ? '🎤' : '🎙️'}
              </button>
              <button 
                onClick={enhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
                className="enhance-btn"
              >
                {isEnhancing ? '�� Enhancing...' : '✨ AI Enhance'}
              </button>
              <button 
                onClick={generateWebsite}
                disabled={isGenerating || !prompt.trim()}
                className="generate-btn"
              >
                {isGenerating ? '🔄 Generating...' : '🚀 Generate Website'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div 
          className="divider"
          ref={dividerRef}
          onMouseDown={handleMouseDown}
        />
        
        {/* Right Side - Code/Preview */}
        <div
          className="output-section"
          style={{ width: `${100 - dividerPosition}%` }}
        >
          <div className="output-header">
            <div className="header-left">
              <button 
                onClick={togglePreview}
                className="preview-toggle-btn"
              >
                {previewMode === 'code' ? '👁️ Preview' : '💻 Code'}
              </button>
              {previewMode === 'preview' && (
                <div className="device-toggle">
                  <button 
                    onClick={() => setDeviceView('desktop')}
                    className={`device-btn ${deviceView === 'desktop' ? 'active' : ''}`}
                  >
                    🖥️ Desktop
                  </button>
                  <button 
                    onClick={() => setDeviceView('mobile')}
                    className={`device-btn ${deviceView === 'mobile' ? 'active' : ''}`}
                  >
                    📱 Mobile
                  </button>
                </div>
              )}
            </div>
            <div className="header-right">
              <button 
                onClick={publishToVercel}
                className="publish-btn"
                disabled={!generatedFiles.html && !generatedFiles.css && !generatedFiles.js || isGenerating}
              >
                🚀 {isGenerating ? 'Publishing...' : 'Publish'}
              </button>
              <button 
                onClick={downloadCode}
                className="download-btn"
                disabled={!generatedFiles.html && !generatedFiles.css && !generatedFiles.js}
              >
                📦 Download ZIP
              </button>
            </div>
          </div>
          
          <div className="output-content">
            {/* Loading Overlay */}
            {isGenerating && (
              <div className="builder-loading-overlay">
                <div className="builder-loader">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <div className="loader-text">Generating your website...</div>
              </div>
            )}
            {/* Code View */}
            <div className={`code-tabs ${previewMode === 'code' ? 'active' : 'hidden'}`}>
              <div className="tab-buttons">
                <button 
                  className={`tab-btn ${activeTab === 'html' ? 'active' : ''}`}
                  onClick={() => handleTabClick('html')}
                >
                  HTML
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'css' ? 'active' : ''}`}
                  onClick={() => handleTabClick('css')}
                >
                  CSS
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'js' ? 'active' : ''}`}
                  onClick={() => handleTabClick('js')}
                >
                  JS
                </button>
              </div>
              <div className="code-content">
                {/* Only show editable textareas if code is generated */}
                {generatedFiles.html || generatedFiles.css || generatedFiles.js ? (
                  <>
                    {activeTab === 'html' && (
                      <textarea
                        value={generatedFiles.html}
                        onChange={e => setGeneratedFiles(prev => ({ ...prev, html: e.target.value }))}
                        className="code-editor"
                        rows={20}
                        spellCheck={false}
                      />
                    )}
                    {activeTab === 'css' && (
                      <textarea
                        value={generatedFiles.css}
                        onChange={e => setGeneratedFiles(prev => ({ ...prev, css: e.target.value }))}
                        className="code-editor"
                        rows={20}
                        spellCheck={false}
                      />
                    )}
                    {activeTab === 'js' && (
                      <textarea
                        value={generatedFiles.js}
                        onChange={e => setGeneratedFiles(prev => ({ ...prev, js: e.target.value }))}
                        className="code-editor"
                        rows={20}
                        spellCheck={false}
                      />
                    )}
                  </>
                ) : (
                  <pre><code>{getActiveCode()}</code></pre>
                )}
                {isGeneratingCode && (
                  <div className="code-generating-indicator">
                    <span className="typing-cursor">|</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Preview View */}
            <div className={`preview-container ${previewMode === 'preview' ? 'active' : 'hidden'} ${deviceView === 'mobile' ? 'mobile-view' : 'desktop-view'}`} ref={previewRef}>
              {!generatedFiles.html && (
                <div className="preview-placeholder">
                  <h3>👀 Preview</h3>
                  <p>Generate a website to see the preview here!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Builder;
