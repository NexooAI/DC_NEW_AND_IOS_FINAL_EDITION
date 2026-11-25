export interface InstallmentInfo {
  frequencyType: "daily" | "weekly" | "monthly";
  total: number;
  paid: number;
  pending: number;
  unitLabel: string;
}

/**
 * Resolves installment totals, pending counts, and unit labels (Days / Weeks / Months)
 * consistently across My Schemes cards and Scheme Details speedometer gauges.
 */
export function resolveInstallmentInfo(
  rawFrequency?: string | null,
  rawTotal?: number | string | null,
  rawPaid?: number | string | null,
  monthlyLabel: string = "Months"
): InstallmentInfo {
  const freq = String(rawFrequency || "").toLowerCase();
  const paid = Math.max(0, Number(rawPaid) || 0);
  const parsedTotal = Number(rawTotal) || 0;

  if (freq.includes("daily") || freq.includes("தினசரி")) {
    const total = parsedTotal > 30 ? parsedTotal : parsedTotal > 0 && parsedTotal <= 24 ? parsedTotal * 30 : 330;
    return {
      frequencyType: "daily",
      total,
      paid,
      pending: Math.max(0, total - paid),
      unitLabel: "Days",
    };
  }

  if (freq.includes("week") || freq.includes("வார")) {
    const total = parsedTotal > 24 ? parsedTotal : 48;
    return {
      frequencyType: "weekly",
      total,
      paid,
      pending: Math.max(0, total - paid),
      unitLabel: "Weeks",
    };
  }

  const total = parsedTotal > 0 ? parsedTotal : 11;
  return {
    frequencyType: "monthly",
    total,
    paid,
    pending: Math.max(0, total - paid),
    unitLabel: monthlyLabel,
  };
}
