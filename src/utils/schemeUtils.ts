/**
 * Utility functions for Scheme Type Detection and Payment Validation.
 */

export interface SchemeDetectionParams {
  schemeName?: any;
  schemePlanTypeName?: any;
  scheme_plan_type_id?: any;
  schemeType?: any;
  paymentFrequency?: any;
  paymentFrequencyName?: any;
}

/**
 * Strictly determines whether a scheme is a Deposit / Sub-Deposit / One-Time Deposit scheme.
 * 
 * Rules:
 * 1. Plan Type ID 5 is the dedicated Deposit plan type in this database.
 * 2. Scheme Name explicitly contains deposit / sub-deposit / lumpsum keywords (English & Tamil).
 * 3. Scheme Plan Type Name explicitly contains deposit / lumpsum keywords.
 * 4. Payment Frequency explicitly indicates one-time/single/lumpsum AND is NOT recurring/flexi/hybrid.
 * 
 * CRITICAL GUARDS:
 * - NEVER match paymentFrequencyId === 4 (Frequency ID 4 is Monthly in this system!).
 * - NEVER match noOfIns === 1 as a standalone condition.
 * - Schemes with "flexi", "hybrid", "monthly", "daily", "weekly" in frequency or name are recurring schemes, NOT deposits.
 */
export const checkIsDepositScheme = (params: SchemeDetectionParams): boolean => {
  const normalize = (val: any): string => {
    if (!val) return "";
    if (typeof val === "string") return val.toLowerCase().trim();
    if (typeof val === "object") {
      try {
        const combined = `${val.en || ""} ${val.ta || ""} ${val.te || ""} ${val.hi || ""} ${val.mal || ""} ${Object.values(val).join(" ")}`;
        return combined.toLowerCase().trim();
      } catch {
        return "";
      }
    }
    return String(val).toLowerCase().trim();
  };

  const nameStr = normalize(params.schemeName);
  const planTypeNameStr = normalize(params.schemePlanTypeName);
  const planTypeIdStr = String(params.scheme_plan_type_id || params.schemeType || "").trim();
  const freqStr = `${normalize(params.paymentFrequency)} ${normalize(params.paymentFrequencyName)}`.trim();

  // 1. Explicit Deposit Plan Type ID (5 is Deposit in this database)
  if (planTypeIdStr === "5") {
    return true;
  }

  // 2. Scheme Name explicitly contains deposit / sub-deposit / lumpsum keywords (English & Tamil)
  // E.g. "Fixed Sub Deposit", "Sub Deposit", "Gold Deposit", "Term Deposit", "வைப்புத் திட்டம்", "டெபாசிட்", "லம்ப்சம்"
  const depositKeywords = ["deposit", "sub deposit", "sub-deposit", "lumpsum", "lump sum", "வைப்பு", "டெபாசிட்", "லம்ப்சம்"];
  for (const kw of depositKeywords) {
    if (nameStr.includes(kw)) {
      return true;
    }
  }

  // 3. Scheme Plan Type Name explicitly contains deposit keywords
  for (const kw of depositKeywords) {
    if (planTypeNameStr.includes(kw)) {
      return true;
    }
  }

  // 4. Frequency explicitly indicates single / one-time deposit, but NEVER recurring / flexi / hybrid
  const isRecurring =
    freqStr.includes("month") ||
    freqStr.includes("daily") ||
    freqStr.includes("week") ||
    freqStr.includes("flexi") ||
    freqStr.includes("hybrid") ||
    nameStr.includes("flexi") ||
    nameStr.includes("hybrid");

  if (!isRecurring) {
    if (
      freqStr.includes("one-time") ||
      freqStr.includes("onetime") ||
      freqStr.includes("single") ||
      freqStr.includes("lumpsum") ||
      freqStr.includes("வைப்பு") ||
      freqStr.includes("டெபாசிட்")
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Checks if the deposit payment for a deposit scheme has already been completed.
 */
export const checkIsDepositPaid = (
  isDepositScheme: boolean,
  totalPaid: number | string | undefined | null,
  monthsPaid: number | string | undefined | null
): boolean => {
  if (!isDepositScheme) return false;
  const paid = Number(totalPaid) || 0;
  const months = Number(monthsPaid) || 0;
  return paid > 0 || months >= 1;
};
