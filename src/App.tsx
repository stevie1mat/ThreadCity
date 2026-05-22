import { useState } from 'react';
import BackgroundStars from './components/BackgroundStars';
import Header from './components/Header';
import EcoCanvas from './components/EcoCanvas';
import OverlayElements from './components/OverlayElements';
import FileReaderModal from './components/FileReaderModal';
import { fetchEcoData } from './services/github';
import { buildEcoSystem } from './utils/ecoBuilder';
import { EcoSystem, FossilNode } from './types';

export default function App() {
  const [ecoSystem, setEcoSystem] = useState<EcoSystem | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<{ files: number; deps: number; vulns: number } | null>(null);
  const [readingNode, setReadingNode] = useState<FossilNode | null>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const handleBuildEco = async (url: string) => {
    setIsBuilding(true);
    setEcoSystem(null);
    setErrorMsg(null);

    try {
      const data = await fetchEcoData(url);
      if (!data || !data.rootNode) throw new Error('Could not parse repository structure.');

      const builtSystem = buildEcoSystem(data.rootNode, data.cities);
      setEcoSystem(builtSystem);

      let files = 0;
      const countNodes = (node: FossilNode) => {
        if (node.type !== 'tree') files++;
        (node.children || []).forEach(countNodes);
      };
      countNodes(data.rootNode);

      const deps = data.cities.length;
      const vulns = data.cities.reduce((sum, c) => sum + c.vulnerabilityCount, 0);

      setStats({ files, deps, vulns });

    } catch (err: any) {
      showError(err.message || 'An error occurred.');
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <>
      <BackgroundStars />
      <Header onBuild={handleBuildEco} isBuilding={isBuilding} stats={stats} />
      <EcoCanvas ecoSystem={ecoSystem} onReadNode={setReadingNode} isReading={!!readingNode} />
      <OverlayElements 
        hasEco={!!ecoSystem} 
        isLoading={isBuilding} 
        errorMsg={errorMsg} 
        onExampleClick={handleBuildEco}
        ecoSystem={ecoSystem}
      />
      <FileReaderModal node={readingNode as any} onClose={() => setReadingNode(null)} />
    </>
  );
}
