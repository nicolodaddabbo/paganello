import type { RawPoolData, PoolStandings, DivisionKey } from "../types/pool";
import { fetchWithCache } from "../utils/cache";

const API_URL = "/api/pools";
const CACHE_DURATION = 5 * 60 * 1000;

export async function fetchPools(): Promise<PoolStandings[]> {
  const data = await fetchWithCache<RawPoolData>(
    API_URL,
    "paganello-pools",
    CACHE_DURATION,
  );
  return transformPoolsData(data);
}

function transformPoolsData(data: RawPoolData): PoolStandings[] {
  const divisions: Array<{ division: string; divisionKey: DivisionKey }> = [
    { division: "Real Mixed", divisionKey: "Real Mixed Pools" },
    { division: "Loose Mixed", divisionKey: "Loose Mixed Pools" },
    { division: "Open", divisionKey: "Open Pools" },
    { division: "Women", divisionKey: "Women Pools" },
    { division: "U20", divisionKey: "U20 Pools" },
    { division: "U15", divisionKey: "U15 Pools" },
  ];

  return divisions.map(({ division, divisionKey }) => ({
    division,
    divisionKey,
    pools: data[divisionKey] || [],
  }));
}
