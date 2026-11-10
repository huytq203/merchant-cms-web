// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KybOverview } from "../KybOverview";
import { DocumentUploadField } from "../DocumentUploadField";
import type { EnterpriseWallet } from "../../types";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(cleanup);

const file = (id: string, filename: string, contentType: string) => ({
  id,
  filename,
  contentType,
  url: `https://s3.example/${filename}?sig=x`,
  urlExpiresAt: "2099-01-01T00:00:00Z",
});

const wallet: EnterpriseWallet = {
  id: "22222222-2222-4222-8222-222222222222",
  registeredEmail: "owner@example.com",
  verificationStatus: "VERIFIED",
  businessType: "ENTERPRISE",
  legalName: "HALOTECH",
  businessLicense: file("aaaaaaaa-0000-4000-8000-000000000001", "dkkd.pdf", "application/pdf"),
  idCardFront: file("aaaaaaaa-0000-4000-8000-000000000002", "cccd-truoc.jpg", "image/jpeg"),
  idCardBack: file("aaaaaaaa-0000-4000-8000-000000000003", "cccd-sau.jpg", "image/jpeg"),
  authorizationLetter: file("aaaaaaaa-0000-4000-8000-000000000004", "uy-quyen.pdf", "application/pdf"),
};

describe("KybOverview legal documents", () => {
  it("shows a card with file name and a view link for each of the four documents", () => {
    render(<KybOverview wallet={wallet} />);
    for (const name of ["dkkd.pdf", "cccd-truoc.jpg", "cccd-sau.jpg", "uy-quyen.pdf"]) expect(screen.getByText(name)).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: /^Xem / });
    expect(links).toHaveLength(4);
    expect(links[0]).toHaveAttribute("href", "https://s3.example/dkkd.pdf?sig=x");
    expect(links[0]).toHaveAttribute("target", "_blank");
  });

  it("omits the optional authorization letter when none is on file", () => {
    render(<KybOverview wallet={{ ...wallet, authorizationLetter: null }} />);
    expect(screen.queryByText("Giấy ủy quyền")).not.toBeInTheDocument();
  });

  it("offers a reload instead of a dead link when the signed URL has expired", async () => {
    const expired = { ...wallet.businessLicense!, urlExpiresAt: "2020-01-01T00:00:00Z" };
    const refresh = vi.fn();
    render(<KybOverview wallet={{ ...wallet, businessLicense: expired }} onRefreshLinks={refresh} />);
    expect(screen.getAllByRole("link", { name: /^Xem / })).toHaveLength(3);
    await userEvent.click(screen.getByRole("button", { name: "Liên kết đã hết hạn, tải lại" }));
    expect(refresh).toHaveBeenCalled();
  });

  it("says to reload the page when no refetch is wired", () => {
    const expired = { ...wallet.businessLicense!, urlExpiresAt: "2020-01-01T00:00:00Z" };
    render(<KybOverview wallet={{ ...wallet, businessLicense: expired }} />);
    expect(screen.getByText("Liên kết đã hết hạn, vui lòng tải lại trang")).toBeInTheDocument();
  });
});

describe("DocumentUploadField with a saved file", () => {
  it("shows the file card instead of the empty upload box, and opens the box on 'Thay tệp'", async () => {
    render(<DocumentUploadField type="BUSINESS_LICENSE" required existing={[wallet.businessLicense!]} onChange={() => undefined} />);
    expect(screen.getByText("dkkd.pdf")).toBeInTheDocument();
    expect(screen.queryByText("Nhấn để tải lên")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Thay tệp dkkd.pdf" }));
    expect(screen.getByText("Nhấn để tải lên")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Giữ tệp hiện tại" }));
    expect(screen.getByText("dkkd.pdf")).toBeInTheDocument();
  });

  it("returns to the card when the saved file changes after a replace was opened", async () => {
    const { rerender } = render(<DocumentUploadField type="BUSINESS_LICENSE" existing={[wallet.businessLicense!]} onChange={() => undefined} />);
    await userEvent.click(screen.getByRole("button", { name: "Thay tệp dkkd.pdf" }));
    expect(screen.getByText("Nhấn để tải lên")).toBeInTheDocument();
    rerender(<DocumentUploadField type="BUSINESS_LICENSE" existing={[file("aaaaaaaa-0000-4000-8000-000000000009", "moi.pdf", "application/pdf")]} onChange={() => undefined} />);
    expect(screen.getByText("moi.pdf")).toBeInTheDocument();
    expect(screen.queryByText("Nhấn để tải lên")).not.toBeInTheDocument();
  });

  it("shows the empty upload box when nothing is saved", () => {
    render(<DocumentUploadField type="BUSINESS_LICENSE" required onChange={() => undefined} />);
    expect(screen.getByText("Nhấn để tải lên")).toBeInTheDocument();
  });
});
