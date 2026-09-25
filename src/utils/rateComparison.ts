import AsyncStorage from "@react-native-async-storage/async-storage";

export interface RateChangeInfo {
  difference: number;
  formattedChange: string;
  direction: "up" | "down" | "neutral";
  color: string;
  bgColor: string;
  iconName: "caret-up" | "caret-down" | "remove-outline";
}

export const RATE_HISTORY_STORAGE_KEY = "@kanisaa_daily_rate_snapshot";

export interface StoredRateSnapshot {
  date: string; // YYYY-MM-DD
  goldRate: number;
  silverRate: number;
  previousGoldRate?: number | null;
  previousSilverRate?: number | null;
}

/**
 * Parses any rate number/string into a clean float.
 */
export function parseRateNumber(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, "").trim());
  return isNaN(num) ? null : num;
}

/**
 * Formats a difference score into display metadata (color, icon, direction, formatted text).
 * Returns null if diff is null/undefined/empty.
 */
export function formatChangeValue(diff: number | string | null | undefined): RateChangeInfo | null {
  if (diff === null || diff === undefined || diff === "") {
    return null;
  }

  const rawStr = String(diff).replace(/,/g, "").replace(/^\+/, "").trim();
  const num = typeof diff === "number" ? diff : parseFloat(rawStr);
  if (isNaN(num)) {
    return null;
  }

  const cleanNum = Number(num.toFixed(2));
  if (cleanNum > 0) {
    const formatted = `+${cleanNum % 1 === 0 ? cleanNum : cleanNum.toFixed(2)}`;
    return {
      difference: cleanNum,
      formattedChange: formatted,
      direction: "up",
      color: "#16A34A",
      bgColor: "rgba(22, 163, 74, 0.12)",
      iconName: "caret-up",
    };
  } else if (cleanNum < 0) {
    const formatted = `${cleanNum % 1 === 0 ? cleanNum : cleanNum.toFixed(2)}`;
    return {
      difference: cleanNum,
      formattedChange: formatted,
      direction: "down",
      color: "#DC2626",
      bgColor: "rgba(220, 38, 38, 0.12)",
      iconName: "caret-down",
    };
  } else {
    return {
      difference: 0,
      formattedChange: "0",
      direction: "neutral",
      color: "#64748B",
      bgColor: "rgba(100, 116, 139, 0.10)",
      iconName: "remove-outline",
    };
  }
}

/**
 * Calculates rate change by subtracting previousRate from currentRate.
 * Returns null if either rate is missing or invalid.
 */
export function calculateRateChange(
  currentRate: string | number | null | undefined,
  previousRate: string | number | null | undefined
): RateChangeInfo | null {
  const curr = parseRateNumber(currentRate);
  const prev = parseRateNumber(previousRate);

  if (curr === null || prev === null) {
    return null;
  }

  const diff = Number((curr - prev).toFixed(2));
  return formatChangeValue(diff);
}

/**
 * Resolves the change info using all available sources in priority:
 * 1. Explicit backend change score (e.g. currentRates.gold_change)
 * 2. Explicit backend previous rate (e.g. currentRates.previous_gold_rate)
 * 3. Cached previous day rate from local storage
 * Returns null if no valid comparison baseline exists.
 */
export function resolveRateChange(
  currentRate: string | number | null | undefined,
  backendChange: string | number | null | undefined,
  backendPreviousRate: string | number | null | undefined,
  cachedPreviousRate?: string | number | null
): RateChangeInfo | null {
  if (backendChange !== undefined && backendChange !== null && backendChange !== "") {
    return formatChangeValue(backendChange);
  }

  if (backendPreviousRate !== undefined && backendPreviousRate !== null && backendPreviousRate !== "") {
    return calculateRateChange(currentRate, backendPreviousRate);
  }

  if (cachedPreviousRate !== undefined && cachedPreviousRate !== null && cachedPreviousRate !== "") {
    return calculateRateChange(currentRate, cachedPreviousRate);
  }

  return null;
}

/**
 * Saves rate snapshot and returns previous day's rates if available.
 */
export async function syncRateHistory(
  currentGoldRate: string | number,
  currentSilverRate: string | number,
  rateDateStr?: string
): Promise<{ previousGold: number | null; previousSilver: number | null }> {
  try {
    const rawCurrGold = parseRateNumber(currentGoldRate);
    const rawCurrSilver = parseRateNumber(currentSilverRate);

    if (rawCurrGold === null || rawCurrSilver === null) {
      return { previousGold: null, previousSilver: null };
    }

    const todayStr = rateDateStr
      ? new Date(rateDateStr).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const rawStored = await AsyncStorage.getItem(RATE_HISTORY_STORAGE_KEY);
    let previousGold: number | null = null;
    let previousSilver: number | null = null;

    if (rawStored) {
      try {
        const stored: StoredRateSnapshot = JSON.parse(rawStored);
        if (stored.date && stored.date !== todayStr) {
          // Stored data is from yesterday or earlier
          previousGold = stored.goldRate;
          previousSilver = stored.silverRate;
        } else if (stored.previousGoldRate != null) {
          previousGold = stored.previousGoldRate;
          previousSilver = stored.previousSilverRate ?? null;
        }
      } catch {}
    }

    const newSnapshot: StoredRateSnapshot = {
      date: todayStr,
      goldRate: rawCurrGold,
      silverRate: rawCurrSilver,
      previousGoldRate: previousGold,
      previousSilverRate: previousSilver,
    };

    await AsyncStorage.setItem(RATE_HISTORY_STORAGE_KEY, JSON.stringify(newSnapshot));
    return { previousGold, previousSilver };
  } catch {
    return { previousGold: null, previousSilver: null };
  }
}
