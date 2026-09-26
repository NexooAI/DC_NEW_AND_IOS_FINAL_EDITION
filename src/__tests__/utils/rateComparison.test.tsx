import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  calculateRateChange,
  formatChangeValue,
  resolveRateChange,
  syncRateHistory,
  RATE_HISTORY_STORAGE_KEY,
} from "../../utils/rateComparison";

describe("rateComparison utility", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe("calculateRateChange", () => {
    it("calculates positive rate change accurately", () => {
      const result = calculateRateChange(7050, 7000);
      expect(result).not.toBeNull();
      expect(result?.difference).toBe(50);
      expect(result?.formattedChange).toBe("+50");
      expect(result?.direction).toBe("up");
      expect(result?.color).toBe("#16A34A");
      expect(result?.iconName).toBe("caret-up");
    });

    it("calculates negative rate change accurately", () => {
      const result = calculateRateChange(6950, 7000);
      expect(result).not.toBeNull();
      expect(result?.difference).toBe(-50);
      expect(result?.formattedChange).toBe("-50");
      expect(result?.direction).toBe("down");
      expect(result?.color).toBe("#DC2626");
      expect(result?.iconName).toBe("caret-down");
    });

    it("handles zero change as neutral", () => {
      const result = calculateRateChange(7000, 7000);
      expect(result).not.toBeNull();
      expect(result?.difference).toBe(0);
      expect(result?.formattedChange).toBe("0");
      expect(result?.direction).toBe("neutral");
      expect(result?.color).toBe("#64748B");
      expect(result?.iconName).toBe("remove-outline");
    });

    it("handles formatted string numbers with commas and decimals", () => {
      const result = calculateRateChange("7,050.50", "7,000.00");
      expect(result).not.toBeNull();
      expect(result?.difference).toBe(50.5);
      expect(result?.formattedChange).toBe("+50.50");
      expect(result?.direction).toBe("up");
    });

    it("returns null when current or previous rate is missing/null/undefined", () => {
      expect(calculateRateChange(null, 7000)).toBeNull();
      expect(calculateRateChange(7000, null)).toBeNull();
      expect(calculateRateChange(undefined, 7000)).toBeNull();
      expect(calculateRateChange(7000, undefined)).toBeNull();
      expect(calculateRateChange("invalid", 7000)).toBeNull();
    });
  });

  describe("formatChangeValue", () => {
    it("formats positive number", () => {
      const result = formatChangeValue(12);
      expect(result).toEqual({
        difference: 12,
        formattedChange: "+12",
        direction: "up",
        color: "#16A34A",
        bgColor: "rgba(22, 163, 74, 0.12)",
        iconName: "caret-up",
      });
    });

    it("formats negative number", () => {
      const result = formatChangeValue(-15);
      expect(result).toEqual({
        difference: -15,
        formattedChange: "-15",
        direction: "down",
        color: "#DC2626",
        bgColor: "rgba(220, 38, 38, 0.12)",
        iconName: "caret-down",
      });
    });

    it("returns null for empty/invalid values", () => {
      expect(formatChangeValue(null)).toBeNull();
      expect(formatChangeValue(undefined)).toBeNull();
      expect(formatChangeValue("")).toBeNull();
    });
  });

  describe("resolveRateChange", () => {
    it("prioritizes backend explicit change score", () => {
      const result = resolveRateChange(7050, "+12", 7000, 6900);
      expect(result?.formattedChange).toBe("+12");
      expect(result?.direction).toBe("up");
    });

    it("falls back to backend previous rate when change score is absent", () => {
      const result = resolveRateChange(7050, null, 7000, 6900);
      expect(result?.formattedChange).toBe("+50");
      expect(result?.direction).toBe("up");
    });

    it("falls back to cached previous rate when backend lacks history", () => {
      const result = resolveRateChange(7050, null, null, 7020);
      expect(result?.formattedChange).toBe("+30");
      expect(result?.direction).toBe("up");
    });

    it("returns null when no baseline comparison exists (no fake default)", () => {
      const result = resolveRateChange(7050, null, null, null);
      expect(result).toBeNull();
    });
  });

  describe("syncRateHistory", () => {
    it("saves snapshot and detects previous rate on date rollover", async () => {
      // Day 1
      await syncRateHistory(7000, 80, "2026-09-24T10:00:00Z");

      // Day 2
      const result = await syncRateHistory(7050, 81.5, "2026-09-25T10:00:00Z");
      expect(result.previousGold).toBe(7000);
      expect(result.previousSilver).toBe(80);

      // Same Day re-sync keeps previous day's baseline
      const resync = await syncRateHistory(7060, 82, "2026-09-25T14:00:00Z");
      expect(resync.previousGold).toBe(7000);
      expect(resync.previousSilver).toBe(80);
    });
  });
});
