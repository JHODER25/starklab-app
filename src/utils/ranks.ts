export interface RankInfo {
  name: string;
  color: string;
  minXp: number;
}

export const RANKS: RankInfo[] = [
  { name: 'Principiante', color: '#ffffff', minXp: 0 },
  { name: 'Intermedio', color: '#10B981', minXp: 5000 },
  { name: 'Avanzado', color: '#3B82F6', minXp: 25000 },
  { name: 'Santo', color: '#8B5CF6', minXp: 75000 },
  { name: 'Rey', color: '#F59E0B', minXp: 150000 },
  { name: 'Emperador', color: '#EF4444', minXp: 300000 },
  { name: 'Dios', color: '#FBBF24', minXp: 600000 }
];

export function getRankInfo(totalXp: number) {
  // Find the highest rank the user has achieved
  let currentRankIndex = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (totalXp >= RANKS[i].minXp) {
      currentRankIndex = i;
    } else {
      break;
    }
  }

  const currentRank = RANKS[currentRankIndex];
  const nextRank = currentRankIndex < RANKS.length - 1 ? RANKS[currentRankIndex + 1] : null;

  let progressPercent = 100;
  let xpInCurrentLevel = totalXp;
  let xpNeeded = 0;

  if (nextRank) {
    const xpRange = nextRank.minXp - currentRank.minXp;
    xpInCurrentLevel = totalXp - currentRank.minXp;
    xpNeeded = nextRank.minXp - currentRank.minXp;
    progressPercent = Math.min((xpInCurrentLevel / xpRange) * 100, 100);
  }

  return {
    currentRank,
    nextRank,
    progressPercent,
    xpInCurrentLevel,
    xpNeeded
  };
}
