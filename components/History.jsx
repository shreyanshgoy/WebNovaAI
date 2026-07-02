import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import './History.css';

const History = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [previewMode, setPreviewMode] = useState('code'); // 'code' or 'preview'
  const [activeTab, setActiveTab] = useState('html'); // 'html', 'css', 'js'
  const [deviceView, setDeviceView] = useState('desktop'); // 'desktop' or 'mobile'
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);
  const previewRef = useRef(null); // Add ref for preview iframe container

  useEffect(() => {
    // Load projects from localStorage
    const savedProjects = localStorage.getItem('aiProjects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  useEffect(() => {
    if (showModal && previewMode === 'preview' && previewRef.current && selectedProject && (selectedProject.html || selectedProject.css || selectedProject.js)) {
      const htmlContent = selectedProject.html || '';
      const cssContent = selectedProject.css || '';
      const jsContent = selectedProject.js || '';
      const fullHTML = htmlContent.replace('</head>', 
        `<style>${cssContent}</style></head>`) // inject CSS
        .replace('</body>', `<script>${jsContent}</script></body>`); // inject JS
      // Create a blob URL for the HTML content
      const blob = new Blob([fullHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      previewRef.current.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.title = 'Project Preview';
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
  }, [showModal, previewMode, selectedProject, deviceView]);

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const getActiveCode = () => {
    if (!selectedProject) return '';
    
    switch (activeTab) {
      case 'html':
        return selectedProject.html || '// No HTML code available';
      case 'css':
        return selectedProject.css || '// No CSS code available';
      case 'js':
        return selectedProject.js || '// No JavaScript code available';
      default:
        return selectedProject.html || '// No HTML code available';
    }
  };

  const deleteProject = (projectId) => {
    const updatedProjects = projects.filter(project => project.id !== projectId);
    setProjects(updatedProjects);
    localStorage.setItem('aiProjects', JSON.stringify(updatedProjects));
    
    if (selectedProject && selectedProject.id === projectId) {
      setSelectedProject(null);
      setShowModal(false); // Close modal if the deleted project was selected
    }
  };

  const clearAllProjects = () => {
    if (window.confirm('Are you sure you want to delete all projects? This action cannot be undone.')) {
      setProjects([]);
      setSelectedProject(null);
      localStorage.removeItem('aiProjects');
    }
  };

  // Function to publish a project to Vercel (uses the edited code)
  const publishProjectToVercel = async (project) => {
    if (!project.html && !project.css && !project.js) {
      alert('No code to publish for this project.');
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
    const htmlWithAssets = injectAssets(project.html);

    try {
      const response = await fetch('http://localhost:3001/api/vercel-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: htmlWithAssets,
          css: project.css,
          js: project.js,
          projectName: project.prompt.slice(0, 30) || 'ai-website',
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

  const closeModal = () => {
    setShowModal(false);
    setSelectedProject(null);
  };

  // Secure HTML for full screen preview to prevent navigation out of iframe
  function secureGeneratedHtml(html) {
    // Remove target="_top" and target="_parent" from <a> and <form> tags
    let safeHtml = html.replace(/target=(["'])_top\1/gi, 'target="_self"');
    safeHtml = safeHtml.replace(/target=(["'])_parent\1/gi, 'target="_self"');
    // Add target="_blank" and rel if missing for <a> tags (external links)
    safeHtml = safeHtml.replace(/<a (?![^>]*target=)/g, '<a target="_blank" rel="noopener noreferrer" ');
    // Optionally, add target="_self" to <form> tags if not present
    safeHtml = safeHtml.replace(/<form(?![^>]*target=)/g, '<form target="_self"');
    return safeHtml;
  }

  return (
    <>
      <Navbar />
      <div className="history-container">
        <div className="history-header">
          <h1>📚 Project History</h1>
          <p>View and manage all your AI-generated websites</p>
          {projects.length > 0 && (
            <button onClick={clearAllProjects} className="clear-all-btn">
              🗑️ Clear All Projects
            </button>
          )}
        </div>

        <div className="history-content">
          {/* Projects Grid - now full width */}
          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No projects yet</h3>
              <p>Generate your first website using the Builder to see it here!</p>
              <a href="/builder" className="go-to-builder-btn">
                🛠️ Go to Builder
              </a>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className="project-card"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="project-header">
                    <h3>{project.prompt.substring(0, 30)}...</h3>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="delete-project-btn"
                    >
                      🗑️
                    </button>
                  </div>
                  <p className="project-prompt">{project.prompt}</p>
                  <div className="project-meta">
                    <span className="project-date">
                      {new Date(project.timestamp).toLocaleDateString()}
                    </span>
                    <span className="project-time">
                      {new Date(project.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Modal for Project Details - now full page */}
        {showModal && selectedProject && (
          <div className="pricing-overlay" onClick={closeModal}>
            <div className="fullpage-modal" onClick={e => e.stopPropagation()}>
              <button className="close-btn" onClick={closeModal}>×</button>
              <div className="project-details">
                <div className="project-details-header">
                  <h2>Project Details</h2>
                  <div className="header-buttons">
                    <button 
                      onClick={() => setPreviewMode(previewMode === 'code' ? 'preview' : 'code')}
                      className="preview-toggle-btn"
                    >
                      {previewMode === 'code' ? '👁️ Preview' : '💻 Code'}
                    </button>
                    <button
                      onClick={() => publishProjectToVercel(selectedProject)}
                      className="publish-btn"
                    >
                      🚀 Publish
                    </button>
                    {previewMode === 'preview' && (
                      <>
                        <button
                          onClick={() => setIsFullScreenPreview(!isFullScreenPreview)}
                          className="fullscreen-toggle-btn"
                        >
                          {isFullScreenPreview ? '🗗 Exit Full Screen' : '🗖 Full Screen'}
                        </button>
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
                      </>
                    )}
                  </div>
                </div>
                <div className="project-info">
                  <h3>Prompt:</h3>
                  <p className="project-prompt-text">{selectedProject.prompt}</p>
                  <div className="project-timestamp">
                    Generated on: {new Date(selectedProject.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="project-content">
                  {previewMode === 'code' && (
                    <div className="code-view">
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
                        {selectedProject.html || selectedProject.css || selectedProject.js ? (
                          <>
                            {activeTab === 'html' && (
                              <textarea
                                value={selectedProject.html}
                                onChange={e => {
                                  setSelectedProject(prev => ({ ...prev, html: e.target.value }));
                                  setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, html: e.target.value } : p));
                                }}
                                className="code-editor"
                                rows={20}
                                spellCheck={false}
                              />
                            )}
                            {activeTab === 'css' && (
                              <textarea
                                value={selectedProject.css}
                                onChange={e => {
                                  setSelectedProject(prev => ({ ...prev, css: e.target.value }));
                                  setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, css: e.target.value } : p));
                                }}
                                className="code-editor"
                                rows={20}
                                spellCheck={false}
                              />
                            )}
                            {activeTab === 'js' && (
                              <textarea
                                value={selectedProject.js}
                                onChange={e => {
                                  setSelectedProject(prev => ({ ...prev, js: e.target.value }));
                                  setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, js: e.target.value } : p));
                                }}
                                className="code-editor"
                                rows={20}
                                spellCheck={false}
                              />
                            )}
                          </>
                        ) : (
                          <pre><code>{getActiveCode()}</code></pre>
                        )}
                      </div>
                    </div>
                  )}
                  {previewMode === 'preview' && (
                    <div className={`preview-view ${deviceView === 'mobile' ? 'mobile-view' : 'desktop-view'}`} ref={previewRef}>
                      {!(selectedProject.html || selectedProject.css || selectedProject.js) && (
                        <div className="preview-placeholder">
                          <h3>👀 Preview</h3>
                          <p>No code to preview for this project!</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Full Screen Preview Overlay */}
        {isFullScreenPreview && selectedProject && (
          <div className="fullscreen-preview-overlay">
            <button className="fullscreen-exit-btn" onClick={() => setIsFullScreenPreview(false)}>×</button>
            {/* Blob URL approach for full screen preview */}
            <FullScreenBlobPreview selectedProject={selectedProject} secureGeneratedHtml={secureGeneratedHtml} />
          </div>
        )}
      </div>
    </>
  );
};

// Component for full screen blob preview
function FullScreenBlobPreview({ selectedProject, secureGeneratedHtml }) {
  const iframeRef = React.useRef(null);
  useEffect(() => {
    if (!selectedProject) return;
    const htmlContent = selectedProject.html || '';
    const cssContent = selectedProject.css || '';
    const jsContent = selectedProject.js || '';
    const fullHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${cssContent}</style>
</head>
<body>
${secureGeneratedHtml(htmlContent)}
<script>${jsContent}</script>
</body>
</html>`;
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.src = url;
    }
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedProject, secureGeneratedHtml]);
  return (
    <iframe
      ref={iframeRef}
      title="Full Screen Project Preview"
      className="fullscreen-preview-iframe"
      sandbox="allow-scripts allow-same-origin"
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  );
}

export default History; 