import { describe, it, expect } from "vitest";

// ── Commission calculation ──────────────────────────────────────────────────

function computeCommission(dealValue: number) {
  const rate = 0.15;
  return parseFloat((dealValue * rate).toFixed(2));
}

function computeReleaseDate(onboardedAt: Date): Date {
  return new Date(onboardedAt.getTime() + 25 * 24 * 60 * 60 * 1000);
}

describe("Commission rules", () => {
  it("computes 15% of deal value", () => {
    expect(computeCommission(1000)).toBe(150);
    expect(computeCommission(500)).toBe(75);
    expect(computeCommission(333.33)).toBe(50);
  });

  it("rounds commission to 2 decimal places", () => {
    expect(computeCommission(100 / 3)).toBe(5);
    expect(computeCommission(1)).toBe(0.15);
  });

  it("sets 25-day hold from onboardedAt", () => {
    const onboardedAt = new Date("2025-01-01T00:00:00Z");
    const release = computeReleaseDate(onboardedAt);
    const diffDays = (release.getTime() - onboardedAt.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(25);
  });

  it("release date is after onboarded date", () => {
    const now = new Date();
    const release = computeReleaseDate(now);
    expect(release.getTime()).toBeGreaterThan(now.getTime());
  });
});

// ── Payout minimum ──────────────────────────────────────────────────────────

const MINIMUM_PAYOUT = 15;

function validatePayoutAmount(amount: number, available: number): string | null {
  if (isNaN(amount) || amount <= 0) return "Invalid amount";
  if (amount < MINIMUM_PAYOUT) return `Minimum payout is $${MINIMUM_PAYOUT}`;
  if (amount > available) return "Insufficient available balance";
  return null;
}

describe("Payout minimum", () => {
  it("rejects amounts below $15", () => {
    expect(validatePayoutAmount(14.99, 100)).toMatch(/Minimum/);
    expect(validatePayoutAmount(1, 100)).toMatch(/Minimum/);
    expect(validatePayoutAmount(0, 100)).toMatch(/Invalid/);
  });

  it("accepts exactly $15", () => {
    expect(validatePayoutAmount(15, 100)).toBeNull();
  });

  it("accepts amounts above $15", () => {
    expect(validatePayoutAmount(50, 100)).toBeNull();
    expect(validatePayoutAmount(100, 100)).toBeNull();
  });

  it("rejects amounts exceeding available balance", () => {
    expect(validatePayoutAmount(101, 100)).toMatch(/Insufficient/);
    expect(validatePayoutAmount(15, 10)).toMatch(/Insufficient/);
  });
});

// ── Commission auto-release ─────────────────────────────────────────────────

function shouldRelease(status: string, releaseDate: Date, now: Date): boolean {
  return status === "PENDING" && releaseDate <= now;
}

describe("Commission auto-release", () => {
  it("releases PENDING commissions past releaseDate", () => {
    const pastDate = new Date(Date.now() - 1000);
    expect(shouldRelease("PENDING", pastDate, new Date())).toBe(true);
  });

  it("does not release PENDING commissions before releaseDate", () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
    expect(shouldRelease("PENDING", futureDate, new Date())).toBe(false);
  });

  it("does not release AVAILABLE commissions", () => {
    const pastDate = new Date(Date.now() - 1000);
    expect(shouldRelease("AVAILABLE", pastDate, new Date())).toBe(false);
  });

  it("does not release PAID commissions", () => {
    const pastDate = new Date(Date.now() - 1000);
    expect(shouldRelease("PAID", pastDate, new Date())).toBe(false);
  });
});

// ── Duplicate detection logic ───────────────────────────────────────────────

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isDuplicate(
  newEmail: string, newPhone: string,
  existingEmail: string, existingPhone: string,
): boolean {
  const emailMatch = newEmail.includes("@") && normalizeEmail(newEmail) === normalizeEmail(existingEmail);
  const newDigits = normalizePhone(newPhone);
  const existDigits = normalizePhone(existingPhone);
  const phoneMatch = newDigits.length >= 7 && newDigits === existDigits;
  return emailMatch || phoneMatch;
}

describe("Duplicate detection", () => {
  it("catches exact email match (case-insensitive)", () => {
    expect(isDuplicate("TEST@example.com", "99999", "test@example.com", "00000")).toBe(true);
  });

  it("catches phone match ignoring formatting", () => {
    expect(isDuplicate("a@x.com", "+01712345678", "b@y.com", "01712345678")).toBe(true);
    expect(isDuplicate("a@x.com", "(555) 867-5309", "b@y.com", "5558675309")).toBe(true);
  });

  it("no match if different email and phone", () => {
    expect(isDuplicate("a@x.com", "1111111", "b@y.com", "2222222")).toBe(false);
  });

  it("does not match on phone if digits < 7", () => {
    expect(isDuplicate("a@x.com", "123", "b@y.com", "123")).toBe(false);
  });

  it("does not use email check if email has no @", () => {
    expect(isDuplicate("notanemail", "1234567", "test@example.com", "9999999")).toBe(false);
  });
});

// ── Affiliate status gates ──────────────────────────────────────────────────

function canSubmitLead(affiliateStatus: string): boolean {
  return affiliateStatus === "ACTIVE";
}

describe("Affiliate status gates", () => {
  it("allows ACTIVE affiliates to submit leads", () => {
    expect(canSubmitLead("ACTIVE")).toBe(true);
  });

  it("blocks PENDING affiliates", () => {
    expect(canSubmitLead("PENDING")).toBe(false);
  });

  it("blocks SUSPENDED affiliates", () => {
    expect(canSubmitLead("SUSPENDED")).toBe(false);
  });

  it("blocks BANNED affiliates", () => {
    expect(canSubmitLead("BANNED")).toBe(false);
  });
});

// ── Affiliate code format ───────────────────────────────────────────────────

function isValidAffiliateCode(code: string): boolean {
  return /^NBL-[A-Z0-9]{6}$/.test(code);
}

describe("Affiliate code format", () => {
  it("accepts valid NBL-XXXXXX codes", () => {
    expect(isValidAffiliateCode("NBL-ABC123")).toBe(true);
    expect(isValidAffiliateCode("NBL-000000")).toBe(true);
    expect(isValidAffiliateCode("NBL-ZZZZZZ")).toBe(true);
  });

  it("rejects codes with wrong prefix", () => {
    expect(isValidAffiliateCode("NEX-ABC123")).toBe(false);
    expect(isValidAffiliateCode("abc123")).toBe(false);
  });

  it("rejects codes with wrong length", () => {
    expect(isValidAffiliateCode("NBL-ABC12")).toBe(false);
    expect(isValidAffiliateCode("NBL-ABCDEFG")).toBe(false);
  });

  it("rejects codes with lowercase suffix", () => {
    expect(isValidAffiliateCode("NBL-abc123")).toBe(false);
  });
});

// ── Meeting result auto-sync ────────────────────────────────────────────────

const RESULT_TO_LEAD_STATUS: Record<string, string> = {
  ONBOARDED: "ONBOARDED",
  QUOTATION_SENT: "QUOTATION_SENT",
  NOT_INTERESTED: "REJECTED",
  NEED_ANOTHER_MEETING: "",
};

function getLeadStatusFromResult(result: string): string | null {
  const mapped = RESULT_TO_LEAD_STATUS[result];
  return mapped || null;
}

describe("Meeting result auto-sync", () => {
  it("maps ONBOARDED result to ONBOARDED lead status", () => {
    expect(getLeadStatusFromResult("ONBOARDED")).toBe("ONBOARDED");
  });

  it("maps QUOTATION_SENT to QUOTATION_SENT", () => {
    expect(getLeadStatusFromResult("QUOTATION_SENT")).toBe("QUOTATION_SENT");
  });

  it("maps NOT_INTERESTED to REJECTED", () => {
    expect(getLeadStatusFromResult("NOT_INTERESTED")).toBe("REJECTED");
  });

  it("returns null for NEED_ANOTHER_MEETING (no lead status change)", () => {
    expect(getLeadStatusFromResult("NEED_ANOTHER_MEETING")).toBeNull();
  });

  it("returns null for unknown results", () => {
    expect(getLeadStatusFromResult("UNKNOWN")).toBeNull();
  });
});
