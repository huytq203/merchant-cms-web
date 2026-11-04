/**
 * BE `PortalFreeze` rows shared by this feature's tests: one freeze still active with a shortfall and two releases
 * (one done, one waiting for the ledger), and one fully released.
 */
export const subId = "11111111-1111-4111-8111-111111111111";

export const activeFreeze = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  freezeCode: "FZ2611030001",
  orderId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  orderCode: "ORD-0001",
  requested: 1_000_000,
  frozen: 800_000,
  released: 300_000,
  shortfall: 200_000,
  reason: "Khách hàng khiếu nại giao dịch",
  scheduledReleaseAt: "2026-11-10T03:00:00Z",
  status: "ACTIVE",
  createdAt: "2026-11-03T02:00:00Z",
  releases: [
    { amount: 100_000, status: "PROCESSING", createdAt: "2026-11-04T02:00:00Z", completedAt: null },
    { amount: 300_000, status: "SUCCEEDED", createdAt: "2026-11-03T05:00:00Z", completedAt: "2026-11-03T05:01:00Z" },
  ],
};

export const releasedFreeze = {
  ...activeFreeze,
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  freezeCode: "FZ2611020001",
  orderCode: "ORD-0002",
  requested: 500_000,
  frozen: 500_000,
  released: 500_000,
  shortfall: 0,
  reason: "Nghi ngờ gian lận",
  scheduledReleaseAt: null,
  status: "RELEASED",
  releases: [],
};
