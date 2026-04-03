const SHEET_ID = "10lEld6Poa9UO2aJ740r4h2OPHJzlPES_Fb-PYzSEg5w";
const CSV_BASE = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=`;

const SCHEDULE_SHEETS = ["saturday", "sunday", "monday"] as const;
const POOL_SHEETS = [
  "Real Mixed Pools",
  "Loose Mixed Pools",
  "Open Pools",
  "Women Pools",
  "U20 Pools",
  "U15 Pools",
] as const;

const MAX_AGE = 300; // 5 minutes — CDN hard expiry
const STALE_AFTER = 60; // 1 minute — re-fetch from Google Sheets

// --- CSV Parser ---

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  while (i < text.length) {
    const row: string[] = [];
    while (i < text.length) {
      if (text[i] === '"') {
        i++;
        let val = "";
        while (i < text.length) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') {
              val += '"';
              i += 2;
            } else {
              i++;
              break;
            }
          } else {
            val += text[i++];
          }
        }
        row.push(val);
      } else {
        let val = "";
        while (i < text.length && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
          val += text[i++];
        }
        row.push(val);
      }
      if (i < text.length && text[i] === ",") {
        i++;
      } else {
        break;
      }
    }
    if (text[i] === "\r") i++;
    if (text[i] === "\n") i++;
    rows.push(row);
  }
  return rows;
}

// --- Schedule Builder ---

function formatTimeSlot(time: string): string {
  const parts = time.split(":");
  const hour = parts[0];
  const minute = parts[1];
  const endMinute = (parseInt(minute) + 45) % 60;
  const endHour =
    parseInt(minute) + 45 >= 60 ? parseInt(hour) + 1 : hour;
  return `${hour}:${minute}-${endHour}:${endMinute < 10 ? "0" + endMinute : endMinute}`;
}

function buildSchedule(
  sheets: Map<string, string[][]>,
): Record<string, Record<string, object[]>> {
  const result: Record<string, Record<string, object[]>> = {};

  for (const day of SCHEDULE_SHEETS) {
    const data = sheets.get(day);
    if (!data || data.length < 2) {
      result[day] = {};
      continue;
    }

    result[day] = {};

    // Find the header row: contains "TIME" in col 0 or field names in col 1+
    // Also find where match data starts (first row with a time pattern in col 0)
    let headerRow = -1;
    let dataStart = -1;

    for (let r = 0; r < Math.min(data.length, 5); r++) {
      const col0 = (data[r][0] || "").trim();
      const col0Upper = col0.toUpperCase();

      // Check if this row contains a time pattern (HH:MM - HH:MM)
      const hasTime = /\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/.test(col0);

      if (hasTime && (col0Upper.includes("TIME") || col0Upper.includes("SCHEDULE"))) {
        // Merged header + first time slot in one row
        headerRow = r;
        dataStart = r;
        break;
      } else if (col0Upper === "TIME" || col0Upper.includes("TIME")) {
        headerRow = r;
        continue;
      } else if (/^\d{1,2}:\d{2}/.test(col0)) {
        if (dataStart < 0) dataStart = r;
        break;
      }
    }

    if (headerRow < 0) headerRow = 1;
    if (dataStart < 0) dataStart = headerRow + 1;

    // Extract field names from the header/first-data row
    // Field names are at odd columns (1, 3, 5, ...)
    const fieldNames: Map<number, string> = new Map();

    if (headerRow === dataStart) {
      // Merged: field name + match type combined, e.g. "Field 1 RM POOL D (1-48)"
      // Extract just the field name part (before the division code)
      for (let col = 1; col < (data[headerRow]?.length ?? 0); col += 2) {
        const cell = (data[headerRow][col] || "").trim();
        if (!cell) continue;
        // Field name is everything before the match type (e.g. "RM POOL D (1-48)")
        const fieldMatch = cell.match(/^(.+?)\s+(?:RM|LM|O|W|U15|U20)\s+(?:POOL|PQ|Q|S|F|R)/i);
        if (fieldMatch) {
          fieldNames.set(col, fieldMatch[1].trim());
        }
      }
    } else {
      for (let col = 1; col < (data[headerRow]?.length ?? 0); col += 2) {
        const name = (data[headerRow][col] || "").trim();
        if (name && name !== "TIME") fieldNames.set(col, name);
      }
    }

    // Parse match data in groups of 3 rows (time+matchType, team1+score1, team2+score2)
    // But if header is merged with first data row, first group starts at row 0
    let row = dataStart;

    // If merged, the first time slot's matchType is embedded in the header cells
    if (headerRow === dataStart) {
      const col0 = (data[0][0] || "").trim();
      const timeMatch = col0.match(/(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})/);
      if (timeMatch && data.length > 2) {
        const time = timeMatch[1];
        const timeSlot = formatTimeSlot(time);

        for (const [col, fieldName] of fieldNames) {
          const cell = (data[0][col] || "").trim();
          // Extract matchType: first "XX POOL/PQ/Q/S/F/R... (...)" pattern after the field name
          const afterField = cell.replace(fieldName, "").trim();
          const mtMatch = afterField.match(/^((?:RM|LM|O|W|U15|U20)\s+\S+\s+\S+(?:\s+\([^)]+\))?)/i);
          const matchType = mtMatch ? mtMatch[1] : "";
          const team1 = (data[1]?.[col] || "").trim();
          const team2 = (data[2]?.[col] || "").trim();
          const score1 = parseInt(data[1]?.[col + 1]) || 0;
          const score2 = parseInt(data[2]?.[col + 1]) || 0;

          if (team1 && team2 && matchType) {
            if (!result[day][timeSlot]) result[day][timeSlot] = [];
            result[day][timeSlot].push({
              field: fieldName,
              matchType,
              team1,
              team2,
              score1,
              score2,
            });
          }
        }
        row = 3; // Skip to next time slot
      }
    }

    // Parse remaining time slots normally
    for (; row < data.length; row += 3) {
      const time = (data[row]?.[0] || "").trim();
      if (!time || !/^\d{1,2}:\d{2}/.test(time)) continue;

      const timeSlot = formatTimeSlot(time);

      for (const [col, fieldName] of fieldNames) {
        const matchType = (data[row]?.[col] || "").trim();
        const team1 = (data[row + 1]?.[col] || "").trim();
        const team2 = (data[row + 2]?.[col] || "").trim();
        const score1 = parseInt(data[row + 1]?.[col + 1]) || 0;
        const score2 = parseInt(data[row + 2]?.[col + 1]) || 0;

        if (team1 && team2 && matchType) {
          if (!result[day][timeSlot]) result[day][timeSlot] = [];
          result[day][timeSlot].push({
            field: fieldName,
            matchType,
            team1,
            team2,
            score1,
            score2,
          });
        }
      }
    }
  }

  return result;
}

// --- Pools Builder ---

interface PoolTeam {
  TEAM: string;
  PT: number;
  W: number;
  L: number;
  P: number;
  GS: number;
  GA: number;
  GD: number;
}

interface Pool {
  poolName: string;
  teams: PoolTeam[];
  standings: Record<string, string>[];
}

function buildPools(sheets: Map<string, string[][]>): Record<string, Pool[]> {
  const result: Record<string, Pool[]> = {};

  for (const sheetName of POOL_SHEETS) {
    const data = sheets.get(sheetName);
    if (!data) {
      result[sheetName] = [];
      continue;
    }

    const pools: Pool[] = [];
    let r = 0;
    let lastFullHeaders: { colIndex: number; name: string }[] = [];

    while (r < data.length) {
      let poolName = "";

      // Detect pool name: "POOL X" in col 1, or extract from combined header like "REAL MIXED 1-48 POOL A TEAM"
      const col1 = (data[r][1] || "").trim();
      const col1Upper = col1.toUpperCase();

      if (col1Upper.startsWith("POOL ")) {
        poolName = col1;
      } else if (col1Upper === "TEAM") {
        // Bare "TEAM" row without pool name — infer from previous pool's standings
        // e.g. if last pool had standings "1A","2A","3A", this is Pool B
        if (pools.length > 0) {
          const lastPool = pools[pools.length - 1];
          const lastStandings = lastPool.standings[0];
          if (lastStandings) {
            // Get the suffix from the last standing value (e.g. "1A" → "A", "4UC" → "UC")
            const lastVal = Object.values(lastStandings).pop() || "";
            const letterMatch = lastVal.match(/\d+([A-Z]+)$/i);
            if (letterMatch) {
              const suffix = letterMatch[1];
              // Increment the last character
              const lastChar = suffix.charAt(suffix.length - 1);
              const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
              const nextSuffix = suffix.slice(0, -1) + nextChar;
              poolName = `POOL ${nextSuffix}`;
            }
          }
        }
        if (!poolName) poolName = `POOL ?`;
      } else {
        const poolMatch = col1.match(/\b(POOL\s+[A-Z]{1,2})\b/i);
        if (poolMatch) {
          poolName = poolMatch[1].toUpperCase();
        }
      }

      if (!poolName) {
        r++;
        continue;
      }

      // Find TEAM header row (current row or next few rows)
      let teamColIdx = -1;
      let headerCols: { colIndex: number; name: string }[] = [];
      let headerRowIdx = r;

      // Check if current row already contains the TEAM header (combined row)
      const currentRowHasTeam = col1Upper.includes("TEAM");

      if (currentRowHasTeam) {
        // Combined header: pool name + column headers in the same row
        // Find where TEAM label is — it's part of the col1 string, but actual team data starts in col 1
        // Stats columns start from col 3 (PT, W, L, P, GS, GA, GD)
        teamColIdx = 1;
        for (let c = 1; c < data[r].length; c++) {
          const h = (data[r][c] || "").trim();
          if (h && !h.includes("POOL") && h !== "TEAM") {
            headerCols.push({ colIndex: c, name: h });
          }
        }
        // Add TEAM as the first column
        headerCols.unshift({ colIndex: 1, name: "TEAM" });
        headerRowIdx = r;
      } else {
        // Look for separate TEAM header in next rows
        for (let scan = r + 1; scan < data.length && scan <= r + 3; scan++) {
          for (let c = 1; c <= 5 && c < (data[scan]?.length ?? 0); c++) {
            if ((data[scan][c] || "").trim().toUpperCase() === "TEAM") {
              teamColIdx = c;
              headerRowIdx = scan;
              // Scan for all header columns
              for (let hc = c; hc < (data[scan]?.length ?? 0) && hc <= c + 15; hc++) {
                const h = (data[scan][hc] || "").trim();
                if (h) headerCols.push({ colIndex: hc, name: h });
              }
              break;
            }
          }
          if (teamColIdx >= 0) break;
        }
      }

      if (teamColIdx < 0 || headerCols.length === 0) {
        r++;
        continue;
      }

      // If this pool only has a TEAM column, reuse headers from the previous pool
      if (headerCols.length === 1 && headerCols[0].name === "TEAM" && lastFullHeaders.length > 0) {
        headerCols = lastFullHeaders;
      }

      // Remember headers that have stats columns for subsequent pools
      if (headerCols.length > 1) {
        lastFullHeaders = headerCols;
      }

      // Extract team rows
      const teams: PoolTeam[] = [];
      let teamRowIdx = headerRowIdx + 1;

      while (teamRowIdx < data.length) {
        const teamCell = (data[teamRowIdx]?.[teamColIdx] || "").trim();
        const prevCell = teamColIdx > 0 ? (data[teamRowIdx]?.[teamColIdx - 1] || "").trim().toUpperCase() : "";

        if (
          (!teamCell && !prevCell) ||
          teamCell.toUpperCase() === "RANKING" || prevCell === "RANKING" ||
          teamCell.toUpperCase() === "POS" || prevCell === "POS" ||
          teamCell.toUpperCase().startsWith("POOL ") || prevCell.startsWith("POOL ")
        ) break;

        const team: Record<string, string | number> = {};
        let hasData = false;
        for (const h of headerCols) {
          let val: string | number = (data[teamRowIdx]?.[h.colIndex] || "").trim();
          if (h.name === "TEAM") {
            team[h.name] = val;
          } else {
            team[h.name] = parseInt(val as string) || 0;
          }
          if (val !== "") hasData = true;
        }

        if (hasData && team.TEAM) {
          teams.push(team as unknown as PoolTeam);
        }
        teamRowIdx++;
      }

      // Extract standings (POS section)
      const standings: Record<string, string> = {};
      let posRowIdx = teamRowIdx;
      let posColIdx = 1;
      let foundPos = false;

      for (let scan = posRowIdx; scan < data.length && scan <= teamRowIdx + 5; scan++) {
        for (let c = 1; c <= 5 && c < (data[scan]?.length ?? 0); c++) {
          if ((data[scan][c] || "").trim().toUpperCase() === "POS") {
            foundPos = true;
            posColIdx = c;
            posRowIdx = scan + 1;
            break;
          }
        }
        if (foundPos) break;
      }

      if (foundPos) {
        while (posRowIdx < data.length) {
          const posVal = (data[posRowIdx]?.[posColIdx] || "").trim();
          const teamVal = (data[posRowIdx]?.[posColIdx + 1] || "").trim();

          if (
            !posVal ||
            posVal.toUpperCase().startsWith("POOL ") ||
            teamVal.toUpperCase().startsWith("POOL ") ||
            posVal.toUpperCase() === "RANKING" ||
            posVal.toUpperCase() === "TEAM" ||
            !/^\d+$/.test(posVal)
          ) break;

          standings[posVal] = teamVal;
          posRowIdx++;
        }
        r = posRowIdx;
      } else {
        r = teamRowIdx;
      }

      pools.push({
        poolName: poolName.replace(/^POOL\s+/i, "POOL "),
        teams,
        standings: Object.keys(standings).length > 0 ? [standings] : [],
      });
    }

    result[sheetName] = pools;
  }

  return result;
}

// --- Fetch & Cache ---

async function fetchCSV(sheetName: string): Promise<string> {
  const url = CSV_BASE + encodeURIComponent(sheetName);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${sheetName}: ${res.status}`);
  return res.text();
}

function buildResponse(data: string): Response {
  return new Response(data, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, s-maxage=${MAX_AGE}`,
      "CDN-Cache-Control": `max-age=${MAX_AGE}`,
      "X-Cached-At": String(Date.now()),
    },
  });
}

async function fetchScheduleData(): Promise<string> {
  const [scheduleResults, flagsCsv] = await Promise.all([
    Promise.all(
      SCHEDULE_SHEETS.map(async (day) => {
        const csv = await fetchCSV(day);
        return [day, parseCSV(csv)] as const;
      }),
    ),
    fetchCSV("Nationalities"),
  ]);
  const sheets = new Map(scheduleResults);
  const schedule = buildSchedule(sheets);
  const flags = buildFlags(parseCSV(flagsCsv));
  return JSON.stringify({ ...schedule, flags });
}

function buildFlags(data: string[][]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let r = 1; r < data.length; r++) {
    const name = (data[r][0] || "").trim();
    const flag = (data[r][2] || "").trim();
    if (name && flag) flags[name] = flag;
  }
  return flags;
}

async function fetchPoolsData(): Promise<string> {
  const csvResults = await Promise.all(
    POOL_SHEETS.map(async (name) => {
      const csv = await fetchCSV(name);
      return [name, parseCSV(csv)] as const;
    }),
  );
  const sheets = new Map(csvResults);
  return JSON.stringify(buildPools(sheets));
}

const FETCHERS: Record<string, () => Promise<string>> = {
  schedule: fetchScheduleData,
  pools: fetchPoolsData,
};

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const route = url.pathname.replace("/api/", "");
  const fetcher = FETCHERS[route];

  if (!fetcher) {
    return new Response("Not found", { status: 404 });
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString() + "?v=5");
  const cached = await cache.match(cacheKey);

  if (cached) {
    const cachedAt = Number(cached.headers.get("X-Cached-At") || 0);
    if (Date.now() - cachedAt < STALE_AFTER * 1000) {
      return cached;
    }
    // Data is stale — fetch fresh before responding so users never see old data
  }

  try {
    const data = await fetcher();
    const result = buildResponse(data);
    await cache.put(cacheKey, result.clone());
    return result;
  } catch {
    if (cached) return cached; // Google Sheets down — serve stale rather than error
    return new Response("Upstream error", { status: 502 });
  }
};
