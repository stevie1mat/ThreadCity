import { useState } from 'react';
import BackgroundStars from './components/BackgroundStars';
import Header from './components/Header';
import CityCanvas from './components/CityCanvas';
import OverlayElements from './components/OverlayElements';
import PostReaderModal from './components/PostReaderModal';
import { fetchThread, parseThread } from './services/bluesky';
import { buildCity } from './utils/cityBuilder';
import { City, Building, Post } from './types';

export default function App() {
  const [city, setCity] = useState<City | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<{ posts: number; streets: number; maxDepth: number } | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<Building | null>(null);
  const [readingPost, setReadingPost] = useState<Post | null>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const handleBuildCity = async (url: string) => {
    setIsBuilding(true);
    setCity(null);
    setHoveredBuilding(null);
    setErrorMsg(null);

    try {
      const thread = await fetchThread(url);
      const tree = parseThread(thread);
      if (!tree) throw new Error('Could not parse thread structure.');

      const builtCity = buildCity(tree);
      setCity(builtCity);

      const countPosts = (node: Post): number => 1 + (node.children || []).reduce((s: number, c: Post) => s + countPosts(c), 0);
      const totalPosts = countPosts(tree);
      const maxDepth = builtCity.buildings.reduce((m, b) => Math.max(m, b.floors), 0);

      setStats({
        posts: totalPosts,
        streets: builtCity.streets.length,
        maxDepth
      });

    } catch (err: any) {
      showError(err.message || 'An error occurred.');
    } finally {
      setIsBuilding(false);
    }
  };

  const handleHover = (building: Building | null) => {
    setHoveredBuilding(building);
  };

  return (
    <>
      <BackgroundStars />
      <Header onBuild={handleBuildCity} isBuilding={isBuilding} stats={stats} />
      <CityCanvas city={city} onHover={handleHover} onReadPost={setReadingPost} isReading={!!readingPost} />
      <OverlayElements 
        hasCity={!!city} 
        isLoading={isBuilding} 
        errorMsg={errorMsg} 
        hoveredBuilding={hoveredBuilding} 
        onExampleClick={handleBuildCity}
        city={city}
      />
      <PostReaderModal post={readingPost} onClose={() => setReadingPost(null)} />
    </>
  );
}
