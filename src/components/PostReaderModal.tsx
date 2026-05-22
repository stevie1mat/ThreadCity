import { Post } from '../types';

interface PostReaderModalProps {
  post: Post | null;
  onClose: () => void;
}

export default function PostReaderModal({ post, onClose }: PostReaderModalProps) {
  if (!post) return null;

  const handleOpenBluesky = () => {
    const parts = post.uri.match(/at:\/\/([^/]+)\/[^/]+\/([^/]+)/);
    if (parts) {
      window.open(`https://bsky.app/profile/${parts[1]}/post/${parts[2]}`, '_blank');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(3,5,15,0.8)', backdropFilter: 'blur(10px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div style={{
        position: 'relative',
        width: '90%', maxWidth: '560px', maxHeight: '80vh', overflowY: 'auto',
        background: 'rgba(6,10,30,0.95)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)',
            fontSize: '1.2rem', cursor: 'pointer', transition: 'color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
          onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >
          ✕
        </button>

        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--neon-blue)' }}>
              {post.author}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
              @{post.handle}
            </div>
          </div>
        </div>

        <div style={{ 
          fontSize: '1rem', lineHeight: 1.6, color: '#fff', 
          marginBottom: '24px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' 
        }}>
          {post.text}
        </div>

        <div style={{ 
          display: 'flex', gap: '24px', alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px',
          fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)'
        }}>
          <span>💬 <b style={{color: '#fff'}}>{post.replies}</b></span>
          <span>🔁 <b style={{color: '#fff'}}>{post.reposts}</b></span>
          <span>❤️ <b style={{color: '#fff'}}>{post.likes}</b></span>
          
          <button 
            onClick={handleOpenBluesky}
            style={{
              marginLeft: 'auto', background: 'var(--neon-blue)', border: 'none',
              padding: '8px 16px', borderRadius: '4px', color: '#000',
              fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '1px',
              cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#33ddff'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--neon-blue)'}
          >
            VIEW ON BLUESKY
          </button>
        </div>
      </div>
    </div>
  );
}
