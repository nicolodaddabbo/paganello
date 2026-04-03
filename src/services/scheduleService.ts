import type { RawScheduleData, Match, FlagMap } from "../types/match";
import { fetchWithCache, onCacheUpdate } from "../utils/cache";
import { DAYS } from "../utils/time";
import { isPlaceholder } from "../utils/match";

const API_URL = "/api/schedule";
const CACHE_DURATION = 60 * 1000; // 1 minute

let cachedFlags: FlagMap = {};

export async function fetchSchedule(): Promise<Match[]> {
  const data = await fetchWithCache<RawScheduleData>(
    API_URL,
    "paganello-schedule",
    CACHE_DURATION,
  );
  if (data.flags) cachedFlags = data.flags;
  return transformScheduleData(data);
}

export function onScheduleUpdate(cb: (matches: Match[]) => void): () => void {
  return onCacheUpdate<RawScheduleData>("paganello-schedule", (data) => {
    if (data.flags) cachedFlags = data.flags;
    cb(transformScheduleData(data));
  });
}

export function getFlags(): FlagMap {
  return cachedFlags;
}

export function getFlag(team: string): string {
  return cachedFlags[team] || "";
}

function transformScheduleData(data: RawScheduleData): Match[] {
  const matches: Match[] = [];
  let id = 0;

  DAYS.forEach((day) => {
    const daySchedule = data[day];
    if (!daySchedule) return;

    Object.entries(daySchedule).forEach(([time, matchList]) => {
      if (!/^\d{1,2}:\d{2}/.test(time)) return;
      matchList.forEach((rawMatch) => {
        if (!rawMatch.team1 || !rawMatch.team2) return;
        matches.push({
          id: `${day}-${id++}`,
          day,
          time,
          field: rawMatch.field,
          division: extractDivision(rawMatch.matchType),
          matchType: rawMatch.matchType,
          team1: rawMatch.team1,
          team2: rawMatch.team2,
          score1: rawMatch.score1,
          score2: rawMatch.score2,
          hasScore: rawMatch.score1 > 0 || rawMatch.score2 > 0,
        });
      });
    });
  });

  return matches;
}

function extractDivision(matchType: string): string {
  const match = matchType.match(/^(RM|LM|O|W|U20|U15)/);
  return match ? match[1] : "Unknown";
}

export function getUniqueFields(matches: Match[]): string[] {
  const fields = new Set<string>();
  matches.forEach((match) => fields.add(match.field));
  return ["all", ...Array.from(fields).sort()];
}

export function getUniqueTimes(matches: Match[]): string[] {
  const times = new Set<string>();
  matches.forEach((match) => times.add(match.time));
  return ["all", ...Array.from(times).sort()];
}

export function getUniqueTeams(matches: Match[]): string[] {
  const teams = new Set<string>();
  matches.forEach((match) => {
    if (match.team1 && !isPlaceholder(match.team1)) teams.add(match.team1);
    if (match.team2 && !isPlaceholder(match.team2)) teams.add(match.team2);
  });
  return Array.from(teams).sort();
}
