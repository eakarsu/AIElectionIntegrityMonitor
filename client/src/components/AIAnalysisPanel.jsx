import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function AIAnalysisPanel({ analysis, loading, onAnalyze }) {
  if (loading) {
    return (
      <div className="ai-analysis-container">
        <div className="ai-analysis-header">
          <span>🤖</span>
          <h3>AI Analysis</h3>
        </div>
        <div className="ai-loading">
          <div className="ai-spinner"></div>
          Generating AI analysis... This may take a moment.
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div style={{ marginTop: 24 }}>
        <button className="btn btn-primary" onClick={onAnalyze}>
          🤖 Run AI Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="ai-analysis-container">
      <div className="ai-analysis-header">
        <span>🤖</span>
        <h3>AI Analysis Report</h3>
      </div>
      <div className="ai-analysis-body">
        <div className="ai-content">
          <ReactMarkdown>{analysis.content}</ReactMarkdown>
        </div>
      </div>
      {analysis.model && (
        <div className="ai-analysis-meta">
          <span>Model: {analysis.model}</span>
          {analysis.usage && (
            <>
              <span>Tokens: {analysis.usage.total_tokens}</span>
              <span>Prompt: {analysis.usage.prompt_tokens} | Completion: {analysis.usage.completion_tokens}</span>
            </>
          )}
        </div>
      )}
      <div style={{ padding: '12px 20px' }}>
        <button className="btn btn-outline btn-sm" onClick={onAnalyze}>
          🔄 Re-analyze
        </button>
      </div>
    </div>
  );
}
