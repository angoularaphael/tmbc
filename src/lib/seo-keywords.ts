import data from '../data/seo-keywords.json';

type ClusterMap = Record<string, string[]>;

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value.trim());
  }
  return out;
}

export function allKeywords(): string[] {
  const clusters = data.clusters as ClusterMap;
  const fromClusters = Object.values(clusters).flat();
  return unique([
    ...fromClusters,
    ...(data.principaux || []),
    ...(data.longue_traine || []),
  ]);
}

export function keywordsMeta(maxLength = 1800): string {
  return allKeywords().join(', ').slice(0, maxLength);
}

export function knowsAbout(): string[] {
  return allKeywords();
}
