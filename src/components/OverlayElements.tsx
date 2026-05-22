import { useState } from 'react';
import { EcoSystem } from '../types';

interface OverlayProps {
  hasEco: boolean;
  isLoading: boolean;
  errorMsg: string | null;
  onExampleClick?: (url: string) => void;
  ecoSystem?: EcoSystem | null;
}

export default function OverlayElements({ hasEco, isLoading, errorMsg, onExampleClick, ecoSystem }: OverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <div id="splash" className={hasEco ? 'hidden' : ''}>
        <div id="splash-title">ECOREPO</div>
        <div id="splash-sub">A Living Geological Map</div>
        <div id="splash-hint" style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px', color: '#CCC' }}>
           Volcanoes = Fresh Code<br/>
           Deep Rock = Old Code<br/>
           Droughts = Stale Dependencies<br/>
           Storms = Security Vulnerabilities
        </div>
        <div id="splash-hint" style={{ color: 'var(--neon-blue)' }}>↑ ENTER A GITHUB REPO TO BEGIN</div>
        {onExampleClick && (
          <div style={{ marginTop: '30px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', pointerEvents: 'auto' }}>
            <div style={{ marginBottom: '12px', textAlign: 'center', letterSpacing: '1px' }}>OR TRY THESE EXAMPLES:</div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => onExampleClick('facebook/react')}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--neon-blue)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}
              >
                facebook/react
              </button>
              <button 
                onClick={() => onExampleClick('vitejs/vite')}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--neon-pink)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}
              >
                vitejs/vite
              </button>
            </div>
          </div>
        )}
      </div>

      <div id="loading" className={isLoading ? 'active' : ''}>
        <div className="loader-ring"></div>
        <div id="loading-text">SIMULATING CLIMATE & GEOLOGY…</div>
      </div>

      <div id="error-msg" className={errorMsg ? 'show' : ''}>
        {errorMsg}
      </div>

      {hasEco && ecoSystem && (
          <>
          <div id="climate-dash" style={{
              position: 'absolute', top: 80, left: 20, width: '300px',
              background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '16px', color: '#FFF',
              fontFamily: 'Syne, sans-serif'
          }}>
              <h3 style={{ margin: '0 0 12px 0', color: 'var(--neon-gold)', letterSpacing: '1px' }}>GLOBAL CLIMATE</h3>
              {ecoSystem.cities.filter(c => c.dependency.vulnerabilityCount > 0).length > 0 ? (
                  <div style={{ color: 'var(--neon-pink)', marginBottom: '8px' }}>
                      ⚠️ {ecoSystem.cities.filter(c => c.dependency.vulnerabilityCount > 0).length} cities experiencing Storms
                  </div>
              ) : (
                  <div style={{ color: '#4ECDC4', marginBottom: '8px' }}>
                      ☀️ No active Storms detected
                  </div>
              )}
              {ecoSystem.cities.filter(c => c.dependency.stalenessDays > 180).length > 0 ? (
                  <div style={{ color: '#FFD700', marginBottom: '8px' }}>
                      🏜️ {ecoSystem.cities.filter(c => c.dependency.stalenessDays > 180).length} cities in Severe Drought
                  </div>
              ) : (
                  <div style={{ color: '#4ECDC4', marginBottom: '8px' }}>
                      💧 Ecosystem is well-hydrated
                  </div>
              )}
          </div>
          
          <div id="legend-dash" style={{
              position: 'absolute', bottom: 20, left: 20, width: '300px',
              background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '16px', color: '#FFF',
              fontFamily: 'Syne, sans-serif'
          }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#4ECDC4', letterSpacing: '1px' }}>TERRAIN LEGEND</h3>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ width: 12, height: 12, background: '#FF4500', marginRight: 10, borderRadius: 2 }}></div>
                  <span style={{ fontSize: '0.9rem' }}>Volcanic (Fresh Code &lt; 30d)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ width: 12, height: 12, background: '#8B4513', marginRight: 10, borderRadius: 2 }}></div>
                  <span style={{ fontSize: '0.9rem' }}>Sedimentary (Older Code)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ width: 12, height: 12, background: '#A9A9A9', marginRight: 10, borderRadius: 2 }}></div>
                  <span style={{ fontSize: '0.9rem' }}>Fossil (Dead/Ancient Code)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px', marginBottom: '8px' }}>
                  <div style={{ width: 12, height: 12, background: '#2E8B57', marginRight: 10, borderRadius: 10 }}></div>
                  <span style={{ fontSize: '0.9rem' }}>Dependency City (NPM)</span>
              </div>
          </div>
          </>
      )}

      <div id="search-bar" style={{ display: hasEco ? 'block' : 'none', position: 'absolute', top: 80, right: 20, zIndex: 10, pointerEvents: 'auto', width: '250px' }}>
        <input 
          type="text" 
          placeholder="Search files to teleport..." 
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          style={{
            background: 'rgba(0,0,0,0.5)', border: '1px solid var(--neon-blue)', color: '#FFF', 
            padding: '8px 16px', borderRadius: '4px', width: '100%', outline: 'none',
            fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box'
          }}
        />
        {/* Teleport functionality is removed here since we don't track canvas coords easily, but could be restored later */}
      </div>
    </>
  );
}
