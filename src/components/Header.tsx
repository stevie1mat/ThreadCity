import { useState } from 'react';

interface HeaderProps {
  onBuild: (url: string) => void;
  isBuilding: boolean;
  stats: { posts: number; streets: number; maxDepth: number } | null;
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
      <div id="logo">Thread<span>City</span></div>
      <div id="input-wrap">
        <input 
          id="url-input" 
          type="text" 
          placeholder="Paste a Bluesky post URL… e.g. https://bsky.app/profile/user.bsky.social/post/abc123" 
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
          <span>🏙️ <b>{stats.posts}</b> posts</span>
          <span>🛣️ <b>{stats.streets}</b> streets</span>
          <span>🏢 <b>{stats.maxDepth}</b> floors max</span>
        </div>
      )}
    </div>
  );
}
