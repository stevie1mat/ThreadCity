import { useEffect, useRef } from 'react';
import { Building, City } from '../types';

interface OverlayProps {
  hasCity: boolean;
  isLoading: boolean;
  errorMsg: string | null;
  hoveredBuilding: Building | null;
  onExampleClick?: (url: string) => void;
  city?: City | null;
}

export default function OverlayElements({ hasCity, isLoading, errorMsg, hoveredBuilding, onExampleClick, city }: OverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!city || !hasCity || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 300;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Find bounds
    let maxZ = 100;
    city.buildings.forEach(b => {
       if (b.y > maxZ) maxZ = b.y;
    });

    const padding = 20;
    const scaleZ = (canvas.height - padding * 2) / (maxZ || 1);
    
    // Draw road
    ctx.fillStyle = '#979CAE';
    ctx.fillRect(canvas.width/2 - 10, 0, 20, canvas.height);

    // Draw buildings
    city.buildings.forEach(b => {
      const mapZ = canvas.height - padding - (b.y * scaleZ);
      // Map X proportionally 
      const isLeft = b.x < 0;
      const mapX = isLeft ? canvas.width/2 - 15 - 10 : canvas.width/2 + 15;
      
      // Highlight if hovered
      if (hoveredBuilding && hoveredBuilding.post === b.post) {
         ctx.fillStyle = '#FFF';
         ctx.fillRect(mapX - 2, mapZ - 5 - 2, 14, 14);
      }
      
      ctx.fillStyle = b.color;
      ctx.fillRect(mapX, mapZ - 5, 10, 10);
      
      // Draw OP special marker
      if (b.isOP || b.depth === 0) {
         ctx.strokeStyle = '#FFF';
         ctx.lineWidth = 2;
         ctx.strokeRect(mapX - 1, mapZ - 6, 12, 12);
      }
    });

  }, [city, hasCity, hoveredBuilding]);
  return (
    <>
      <div id="splash" className={hasCity ? 'hidden' : ''}>
        <div id="splash-title">THREADCITY</div>
        <div id="splash-sub">Every Thread is a City</div>
        <div id="splash-hint">↑ PASTE A BLUESKY URL TO BEGIN</div>
        {onExampleClick && (
          <div style={{ marginTop: '30px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', pointerEvents: 'auto' }}>
            <div style={{ marginBottom: '12px', textAlign: 'center', letterSpacing: '1px' }}>OR TRY THESE EXAMPLES:</div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => onExampleClick('https://bsky.app/profile/bsky.app/post/3mlvllqtnmk2g')}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--neon-blue)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                @bsky.app Thread
              </button>
              <button 
                onClick={() => onExampleClick('https://bsky.app/profile/bsky.app/post/3ml7bvrr4yk2l')}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--neon-pink)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                #Breadsky Thread
              </button>
            </div>
          </div>
        )}
      </div>

      <div id="tooltip" className={hoveredBuilding ? 'visible' : ''} style={{
        left: '24px', top: 'auto', bottom: '24px', transform: 'none',
        width: '320px', textAlign: 'center', pointerEvents: 'none'
      }}>
        {hoveredBuilding && hoveredBuilding.post && (
          <>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--neon-blue)', marginBottom: '4px' }}>
              {hoveredBuilding.post.author}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>
              @{hoveredBuilding.post.handle}
            </div>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.4, marginBottom: '12px' }}>
              {hoveredBuilding.post.text.length > 100 
                ? hoveredBuilding.post.text.slice(0, 100) + '...' 
                : hoveredBuilding.post.text}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
              💬 {hoveredBuilding.post.replies} &nbsp; 🔁 {hoveredBuilding.post.reposts} &nbsp; ❤️ {hoveredBuilding.post.likes}
            </div>
            <div style={{ 
              background: 'rgba(255,255,255,0.1)', border: '1px solid var(--neon-gold)', 
              color: 'var(--neon-gold)', padding: '6px 12px', borderRadius: '4px',
              display: 'inline-block', fontSize: '0.8rem', letterSpacing: '1px'
            }}>
              [PRESS SPACE TO READ]
            </div>
          </>
        )}
      </div>



      <div id="loading" className={isLoading ? 'active' : ''}>
        <div className="loader-ring"></div>
        <div id="loading-text">BUILDING YOUR CITY…</div>
      </div>

      <div id="error-msg" className={errorMsg ? 'show' : ''}>
        {errorMsg}
      </div>

      <div id="minimap" style={{ display: hasCity ? 'block' : 'none', position: 'absolute', bottom: 20, right: 20, border: '1px solid var(--glass-border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '0.7rem', padding: '4px 8px', textAlign: 'center', letterSpacing: 1}}>ROAD MAP</div>
        <canvas ref={canvasRef} style={{ display: 'block' }}></canvas>
      </div>
    </>
  );
}
