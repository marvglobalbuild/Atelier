import { describe, it, expect } from "vitest";
import { paymentSummary, isOverdue } from "./domain";

describe("paymentSummary", () => {
  it("is unpaid with no transactions", () => {
    expect(paymentSummary(50000, []).status).toBe("unpaid");
  });
  it("is part paid when transactions are below the price", () => {
    expect(paymentSummary(50000, [{ amount: 20000 }, { amount: 10000 }])).toEqual({
      paid: 30000,
      balance: 20000,
      status: "partial",
    });
  });
  it("is paid when transactions equal the price", () => {
    expect(paymentSummary(50000, [{ amount: 50000 }]).status).toBe("paid");
  });
  it("is overpaid with a negative balance", () => {
    expect(paymentSummary(50000, [{ amount: 60000 }])).toEqual({
      paid: 60000,
      balance: -10000,
      status: "overpaid",
    });
  });
});

describe("isOverdue", () => {
  const today = new Date(2026, 10, 9);
  it("flags past due dates on active orders", () => {
    expect(isOverdue("2026-11-08", "sewing", today)).toBe(true);
  });
  it("never flags delivered orders", () => {
    expect(isOverdue("2026-11-01", "delivered", today)).toBe(false);
  });
});
