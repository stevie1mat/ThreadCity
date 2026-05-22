import { useEffect, useState } from 'react';
import { FossilNode } from '../types';

interface FileReaderModalProps {
  node: FossilNode | null;
  onClose: () => void;
}

export default function FileReaderModal({ node, onClose }: FileReaderModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!node) {
      setContent(null);
      setError(null);
      return;
    }

    if (node.type === 'tree') {
      setContent('Directory view not supported in reading mode.');
      return;
    }

    if (!node.url) {
      setError('No URL available to fetch file content.');
      return;
    }

    setLoading(true);
    setError(null);
    setContent(null);

    fetch(node.url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch file content');
        return res.text();
      })
      .then(text => {
        setContent(text);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [node]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && node) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [node, onClose]);

  if (!node) return null;

  return (
    <div id="reader-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex',
      alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)',
      color: '#FFF', fontFamily: 'Inter, sans-serif'
    }}>
      <div id="reader-modal" onClick={e => e.stopPropagation()} style={{
        background: 'rgba(20,20,30,0.95)', border: '1px solid var(--neon-blue)',
        borderRadius: '8px', width: '80%', maxWidth: '900px', height: '80%',
        display: 'flex', flexDirection: 'column', boxShadow: '0 0 30px rgba(0, 150, 255, 0.2)'
      }}>
        <div id="reader-header" style={{
          padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--neon-blue)', marginBottom: '4px' }}>
              {node.name}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
              {node.path} • {Math.round((node.size || 0) / 1024)} KB
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid var(--neon-pink)', color: 'var(--neon-pink)',
            padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit'
          }}>
            CLOSE (ESC)
          </button>
        </div>
        
        <div id="reader-body" style={{
          padding: '20px', overflowY: 'auto', flex: 1, fontFamily: 'monospace',
          fontSize: '0.9rem', lineHeight: 1.5, background: '#0D0D14'
        }}>
          {loading && <div style={{ color: 'var(--neon-gold)' }}>Loading file content...</div>}
          {error && <div style={{ color: 'var(--neon-pink)' }}>{error}</div>}
          {content && (
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
