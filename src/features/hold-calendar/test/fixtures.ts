/** A BE hold calendar shared by this feature's tests: 5.000.000 held, 3.300.000 released within 30 days. */
export const subId = "11111111-1111-4111-8111-111111111111";

export const calendarFixture = {
  scope: "SUB",
  range: "DAYS_30",
  totalHeld: 5_000_000,
  releasedInPeriod: 3_300_000,
  heldAfterPeriod: 1_700_000,
  peak: { date: "2026-10-15", amount: 2_000_000 },
  days: [
    { date: "2026-10-13", weekday: "TUESDAY", count: 1, amount: 300_000, cumulativeReleased: 300_000, remainingHeld: 4_700_000, bySub: [] },
    { date: "2026-10-15", weekday: "THURSDAY", count: 4, amount: 2_000_000, cumulativeReleased: 2_300_000, remainingHeld: 2_700_000, bySub: [] },
    { date: "2026-10-16", weekday: "FRIDAY", count: 2, amount: 600_000, cumulativeReleased: 2_900_000, remainingHeld: 2_100_000, bySub: [] },
    { date: "2026-10-18", weekday: "SUNDAY", count: 1, amount: 400_000, cumulativeReleased: 3_300_000, remainingHeld: 1_700_000, bySub: [] },
  ],
  reconciles: true,
  ledgerHeld: 5_000_000,
  notes: [
    "Dự báo chỉ tính các khoản đang giữ tại thời điểm xem.",
    "Dự báo không tính khoản mới phát sinh từ giao dịch tương lai.",
    "Khoản tạm giữ có thể bị hủy nếu giao dịch gốc bị hoàn tiền, hoặc được giải phóng sớm hơn dự kiến.",
    "Đây là ước tính, không phải cam kết chi trả.",
  ],
  asOf: "2026-10-13T03:00:00Z",
};
