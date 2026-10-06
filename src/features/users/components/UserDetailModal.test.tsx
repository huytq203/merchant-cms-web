// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import type { MerchantUser } from "../schemas/user.schema";
import { UserDetailModal } from "./UserDetailModal";

const merchantA = "11111111-1111-4111-8111-111111111111";
const merchantB = "22222222-2222-4222-8222-222222222222";
const groupId = "33333333-3333-4333-8333-333333333333";
const user: MerchantUser = {
  id: "44444444-4444-4444-8444-444444444444",
  keycloakUserId: "keycloak-user",
  email: "user@example.com",
  fullName: "Test User",
  phone: null,
  isActive: true,
  isLocked: false,
  groups: [groupId],
  status: "ACTIVE",
  groupIds: [groupId],
  merchantIds: [merchantA],
  subMerchantIds: [],
  rolesText: "Vận hành",
  createdAt: "",
};

function renderModal() {
  mswServer.use(
    http.get("/api/v1/merchant/permission-groups", () => HttpResponse.json({
      rows: [{ id: groupId, name: "Vận hành", merchantId: merchantA }],
      total: 1,
    })),
    http.get("/api/v1/admin/sub-merchants", () => HttpResponse.json({ rows: [], total: 0 })),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <UserDetailModal
        open
        onOpenChange={vi.fn()}
        user={user}
        proposal={null}
        isProposalLoading={false}
        proposalError={undefined}
        isPending={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

afterEach(cleanup);

describe("user detail modal", () => {
  it("shows the permission group name instead of its id", async () => {
    renderModal();
    expect(await screen.findByText("Vận hành")).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(groupId))).not.toBeInTheDocument();
  });

  it("shows an empty state instead of a form that creates scope proposals", async () => {
    renderModal();
    expect(screen.getByText("Chưa có đề xuất đổi phạm vi.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Gửi yêu cầu" })).not.toBeInTheDocument();
  });
});
