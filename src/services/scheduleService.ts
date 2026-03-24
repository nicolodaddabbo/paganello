import type { RawScheduleData, Match } from "../types/match";
import { fetchWithCache } from "../utils/cache";
import { DAYS } from "../utils/time";

const API_URL = "/api/schedule";
const FALLBACK_URL =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AY5xjrTW6rX1zzFe4P5-JajuVPCw9Cm_S_aTN53pCY5CDMiIrTvwa5rT4BizToJ2EYfP-Bgdtcd8qU8njoLb09y939BFJurflo5LybTdLHGpXOI_kuM_ZxoNh08eZcRl0iCItcUKuM91-r2ea45NROd4yBYSC-wSnOYQY_IMCQ8zXzYyn3f1LXtYOj_6-UzdzFrWLDgtd5p2BffsVKYcM0WN-b7gwokYJiLdFYV_SPiTmobUvkHSkSOxmR6f9riErWYeJNF7pm8ZEy-_Bn-sICbeJ0NOvuzxFqsKBlxDtwTJ7UY7reKb6Hnwdq7I63nBJA&lib=MEoXfsZS0V3rHY2Z_S8VN8jTDv19RCRyF";
const CACHE_DURATION = 30 * 60 * 1000;

export async function fetchSchedule(): Promise<Match[]> {
  const data = await fetchWithCache<RawScheduleData>(
    API_URL,
    "paganello-schedule",
    CACHE_DURATION,
    FALLBACK_URL,
  );
  return transformScheduleData(data);
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
    if (match.team1) teams.add(match.team1);
    if (match.team2) teams.add(match.team2);
  });
  return Array.from(teams).sort();
}
