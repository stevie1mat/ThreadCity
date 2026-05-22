import { FossilNode, FileAge, DependencyCity } from '../types';
import { fetchDependencyEcosystem } from './npm';

export function extractRepoInfo(urlOrName: string): { owner: string; repo: string } | null {
  let cleanStr = urlOrName.trim();
  if (cleanStr.startsWith('http')) {
    try {
      const url = new URL(cleanStr);
      if (url.hostname === 'github.com') {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          return { owner: parts[0], repo: parts[1].replace('.git', '') };
        }
      }
    } catch {
      return null;
    }
  } else {
    const parts = cleanStr.split('/');
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
  }
  return null;
}

export async function fetchEcoData(urlOrName: string): Promise<{ rootNode: FossilNode, cities: DependencyCity[] }> {
  const info = extractRepoInfo(urlOrName);
  if (!info) {
    throw new Error('Invalid GitHub repository format. Use owner/repo or a full GitHub URL.');
  }

  const { owner, repo } = info;
  
  // Fetch tree
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`);
  if (!treeRes.ok) throw new Error('Could not fetch repository tree.');
  const treeData = await treeRes.json();
  const treeItems = treeData.tree || [];

  // Fetch recent commits to estimate file ages
  const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`);
  const commitMap = new Map<string, Date>(); // path -> latest commit date
  
  if (commitsRes.ok) {
      const commits = await commitsRes.json();
      // To map files to commits exactly without 100 API calls, we rely on the top-level files 
      // or we can fetch the tree of the latest commit. 
      // Since GitHub API doesn't easily return all touched files in a list of commits without fetching each commit,
      // we will use a simpler approximation: If the repo has been updated recently, we assign ages procedurally 
      // or we fetch the single latest commit's tree and mark those as volcanic.
      // Wait, let's fetch the actual commit details for the first 5 commits to get fresh files.
      for (const c of commits.slice(0, 5)) {
          const detailRes = await fetch(c.url);
          if (detailRes.ok) {
              const detail = await detailRes.json();
              if (detail.files) {
                  for (const f of detail.files) {
                      if (!commitMap.has(f.filename)) {
                          commitMap.set(f.filename, new Date(c.commit.author.date));
                      }
                  }
              }
          }
      }
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const determineAge = (path: string): FileAge => {
      const date = commitMap.get(path);
      if (date) {
          if (date > thirtyDaysAgo) return 'volcanic';
          return 'sedimentary';
      }
      return 'fossil';
  };
  
  const MAX_ITEMS = 1500;
  const itemsToProcess = treeItems.slice(0, MAX_ITEMS);

  const root: FossilNode = {
    path: '', name: repo, type: 'tree', depth: 0, age: 'sedimentary', children: []
  };

  const nodeMap = new Map<string, FossilNode>();
  nodeMap.set('', root);

  let packageJsonUrl = '';

  for (const item of itemsToProcess) {
    const parts = item.path.split('/');
    const name = parts[parts.length - 1];
    const depth = parts.length;
    
    let extension = '';
    if (item.type === 'blob' && name.includes('.')) {
      extension = name.split('.').pop() || '';
    }

    if (item.path === 'package.json') {
        packageJsonUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${item.path}`;
    }

    const node: FossilNode = {
      path: item.path,
      name,
      type: item.type === 'tree' ? 'tree' : 'blob',
      size: item.size || 0,
      extension: extension.toLowerCase(),
      url: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${item.path}`,
      depth,
      age: determineAge(item.path),
      children: []
    };
    nodeMap.set(item.path, node);
  }

  for (const item of itemsToProcess) {
    const parts = item.path.split('/');
    parts.pop();
    const parentPath = parts.join('/');
    
    const node = nodeMap.get(item.path);
    const parentNode = nodeMap.get(parentPath);
    
    if (node && parentNode) {
      parentNode.children.push(node);
    } else if (node && !parentNode) {
      root.children.push(node);
    }
  }

  const calculateDirSize = (n: FossilNode): number => {
    if (n.type === 'blob') return n.size || 0;
    let sum = 0;
    for (const child of n.children) {
      sum += calculateDirSize(child);
      if (child.age === 'volcanic') n.age = 'volcanic';
    }
    n.size = sum;
    return sum;
  };
  calculateDirSize(root);

  // Parse package.json
  let cities: DependencyCity[] = [];
  if (packageJsonUrl) {
      try {
          const pkgRes = await fetch(packageJsonUrl);
          if (pkgRes.ok) {
              const pkgData = await pkgRes.json();
              cities = await fetchDependencyEcosystem(pkgData.dependencies || {}, pkgData.devDependencies || {});
          }
      } catch (e) {
          console.error("Failed to parse package.json", e);
      }
  }

  return { rootNode: root, cities };
}
