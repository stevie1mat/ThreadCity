import { DependencyCity } from '../types';

async function fetchPackageInfo(pkgName: string, currentVersionStr: string, isDev: boolean): Promise<DependencyCity | null> {
  try {
    // Clean version string (remove ^, ~, etc)
    const currentVersion = currentVersionStr.replace(/[^0-9.]/g, '');
    if (!currentVersion) return null;

    // Fetch registry data
    const regRes = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkgName)}`);
    if (!regRes.ok) return null;
    const regData = await regRes.json();
    const latestVersion = regData['dist-tags']?.latest || currentVersion;
    
    // Estimate staleness (a rough metric based on version differences)
    let stalenessDays = 0;
    if (currentVersion !== latestVersion) {
        // If we have publish times, we can calculate real days
        const latestTime = regData.time?.[latestVersion];
        const currentTime = regData.time?.[currentVersion];
        if (latestTime && currentTime) {
            const diffMs = new Date(latestTime).getTime() - new Date(currentTime).getTime();
            stalenessDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        } else {
            // Fallback approximation
            stalenessDays = 90; // Assume 3 months stale if different but no dates
        }
    }

    // Fetch downloads
    let population = 1000; // Default
    try {
        const dlRes = await fetch(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(pkgName)}`);
        if (dlRes.ok) {
            const dlData = await dlRes.json();
            population = dlData.downloads || 1000;
        }
    } catch (e) {
        // ignore
    }

    // Fetch OSV vulnerabilities
    let vulnerabilityCount = 0;
    let vulnerabilities: any[] = [];
    try {
        const osvRes = await fetch('https://api.osv.dev/v1/query', {
            method: 'POST',
            body: JSON.stringify({
                version: currentVersion,
                package: { name: pkgName, ecosystem: 'npm' }
            })
        });
        if (osvRes.ok) {
            const osvData = await osvRes.json();
            if (osvData.vulns) {
                vulnerabilities = osvData.vulns;
                vulnerabilityCount = vulnerabilities.length;
            }
        }
    } catch (e) {
        // ignore
    }

    return {
        name: pkgName,
        currentVersion,
        latestVersion,
        population,
        stalenessDays,
        vulnerabilityCount,
        vulnerabilities,
        isDev
    };
  } catch (err) {
      console.warn('Failed to fetch stats for', pkgName, err);
      return null;
  }
}

export async function fetchDependencyEcosystem(dependencies: Record<string, string>, devDependencies: Record<string, string>): Promise<DependencyCity[]> {
    const promises: Promise<DependencyCity | null>[] = [];
    
    // Limit to top 20 deps to prevent massive slowdowns and rate limits in browser
    const allDeps = [
        ...Object.entries(dependencies || {}).map(([k, v]) => ({ k, v, dev: false })),
        ...Object.entries(devDependencies || {}).map(([k, v]) => ({ k, v, dev: true }))
    ].slice(0, 30);

    for (const { k, v, dev } of allDeps) {
        promises.push(fetchPackageInfo(k, v, dev));
    }

    const results = await Promise.all(promises);
    return results.filter(Boolean) as DependencyCity[];
}
