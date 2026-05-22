import { useState } from 'react';

interface HeaderProps {
  onBuild: (url: string) => void;
  isBuilding: boolean;
  stats: { files: number; deps: number; vulns: number } | null;
}

export default function Header({ onBuild, isBuilding, stats }: HeaderProps) {
  const [url, setUrl] = useState('');

  const handleBuild = () => {
    if (url.trim() && !isBuilding) {
      onBuild(url.trim());
    }
  };

  return (
    <div id="header">
      <div id="logo">Eco<span>Repo</span></div>
      <div id="input-wrap">
        <input 
          id="url-input" 
          type="text" 
          placeholder="Enter a GitHub repo… e.g. facebook/react" 
          autoComplete="off" 
          spellCheck="false" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleBuild()}
        />
        <button id="build-btn" onClick={handleBuild} disabled={isBuilding}>BUILD</button>
      </div>
      {stats && (
        <div id="stats-bar" style={{ display: 'flex' }}>
          <span>📄 <b>{stats.files}</b> files</span>
          <span>🏙️ <b>{stats.deps}</b> deps</span>
          <span>⚡ <b>{stats.vulns}</b> vulns</span>
        </div>
      )}
    </div>
  );
}
