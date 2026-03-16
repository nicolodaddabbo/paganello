import type { Match } from '../types/match';

export async function shareMatch(match: Match): Promise<boolean> {
  const text = formatMatchText(match);

  if (navigator.share) {
    try {
      await navigator.share({ text });
      return true;
    } catch {
      // User cancelled or share failed, try clipboard
    }
  }

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

function formatMatchText(match: Match): string {
  if (match.hasScore) {
    return `Paganello 2026: ${match.team1} ${match.score1}-${match.score2} ${match.team2} (${match.matchType})`;
  }
  return `Paganello 2026: ${match.team1} vs ${match.team2} - ${match.day} ${match.time} (${match.matchType})`;
}
