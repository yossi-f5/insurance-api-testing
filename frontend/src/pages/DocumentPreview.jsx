import { useState } from 'react';
import { getApiUrl } from '../utils/api.js';
import './DocumentPreview.css';

const DocumentPreview = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePreview = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log('🔍 Previewing document...');
      
      // 🚨 VULNERABLE: This endpoint is vulnerable to SSRF
      // The backend makes requests to a hardcoded URL without validation
      const response = await fetch(getApiUrl('api/documents/preview'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // No parameters needed - backend uses hardcoded URL
      });

      console.log('🔍 Response status:', response.status);
      
      const data = await response.json();
      console.log('🔍 Response data:', data);

      if (response.ok) {
        setResult(data);
      } else {
        setError(data);
      }
    } catch (err) {
      console.error('🔍 Error previewing document:', err);
      setError({
        error: 'Network error',
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="document-preview-container">
      <div className="document-preview-header">
        <h1>Document Preview</h1>
        <p>Preview your insurance documents and policy information</p>
      </div>

      <div className="document-preview-content">
        <div className="preview-section">
          <h2>Preview Document</h2>
          <p>Click the button below to preview your latest insurance document.</p>
          
          <button 
            onClick={handlePreview} 
            className="preview-btn" 
            disabled={loading}
          >
            {loading ? 'Loading Preview...' : '🔍 Preview Document'}
          </button>
        </div>

        {result && (
          <div className="result-section">
            <h3>📄 Document Preview</h3>
            <div className="result-content">
              <div className="preview-meta">
                <p><strong>Fetched At:</strong> {new Date(result.fetchedAt).toLocaleString()}</p>
                <p><strong>URL:</strong> {result.url}</p>
              </div>
              
              <div className="document-content">
                <h4>Document Content</h4>
                <div className="content-preview">
                  <pre>{result.content}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="result-section error">
            <h3>❌ Preview Error</h3>
            <div className="result-content">
              <div className="result-details">
                <p><strong>Error:</strong> {error.error}</p>
                {error.message && <p><strong>Message:</strong> {error.message}</p>}
                {error.code && <p><strong>Code:</strong> {error.code}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="help-section">
          <h3>About Document Preview</h3>
          <p>This feature allows you to preview your insurance documents and policy information. The preview is generated from our document management system and provides you with the latest version of your policy documents.</p>
          
          <div className="features-list">
            <div className="feature-item">
              <strong>📋 Policy Information</strong> - View your current policy details
            </div>
            <div className="feature-item">
              <strong>📅 Recent Updates</strong> - See the latest changes to your policy
            </div>
            <div className="feature-item">
              <strong>📊 Coverage Summary</strong> - Review your coverage limits and deductibles
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview; 