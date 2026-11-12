// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { SubMerchantMultiSelect, type SubMerchantMultiSelectProps } from "../SubMerchantMultiSelect";

const options = [
  { id: "s1", code: "SUB01", name: "Cửa hàng Quận 1", isDefault: true, merchantId: "m1" },
  { id: "s2", code: "SUB02", name: "Cửa hàng Quận 2", isDefault: false, merchantId: "m1" },
  { id: "s3", code: "SUB03", name: "Kho Thủ Đức", isDefault: false, merchantId: "m1" },
  { id: "s4", code: "BRN01", name: "Chi nhánh Hà Nội", isDefault: false, merchantId: "m2" },
];
const merchants = [
  { id: "m1", label: "MST1 — Master Một" },
  { id: "m2", label: "MST2 — Master Hai" },
];

afterEach(cleanup);

/** Giữ state ngoài để kiểm giá trị mà cha nhận được sau "Áp dụng". */
function Harness({ initial = [], onChange, ...rest }: { initial?: string[]; onChange?: (ids: string[]) => void } & Partial<SubMerchantMultiSelectProps>) {
  const [value, setValue] = useState<string[]>(initial);
  return (
    <SubMerchantMultiSelect
      options={options}
      value={value}
      onChange={(ids) => {
        setValue(ids);
        onChange?.(ids);
      }}
      {...rest}
    />
  );
}

const open = (name: RegExp = /Sub-merchant/) => userEvent.click(screen.getByRole("button", { name }));
const apply = () => userEvent.click(screen.getByRole("button", { name: "Áp dụng" }));

describe("SubMerchantMultiSelect", () => {
  it("chưa chọn thì ô đóng hiện 'Tất cả Sub-merchant'", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: /Sub-merchant/ })).toHaveTextContent("Tất cả Sub-merchant");
  });

  it("tick vài Sub rồi Áp dụng thì cha nhận danh sách id", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await open();
    await userEvent.click(screen.getByRole("checkbox", { name: /Cửa hàng Quận 2/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: /Kho Thủ Đức/ }));
    expect(onChange).not.toHaveBeenCalled();
    await apply();
    expect(onChange).toHaveBeenCalledWith(["s2", "s3"]);
  });

  it("ô tìm lọc theo tên hoặc mã, không phân biệt hoa thường và dấu", async () => {
    render(<Harness />);
    await open();
    await userEvent.type(screen.getByRole("searchbox"), "thu duc");
    expect(screen.getByRole("checkbox", { name: /Kho Thủ Đức/ })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Quận 1/ })).not.toBeInTheDocument();
    await userEvent.clear(screen.getByRole("searchbox"));
    await userEvent.type(screen.getByRole("searchbox"), "brn01");
    expect(screen.getByRole("checkbox", { name: /Chi nhánh Hà Nội/ })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Kho Thủ Đức/ })).not.toBeInTheDocument();
  });

  it("'Tất cả' là indeterminate khi tick một phần; bấm vào thì tick đủ, bấm lại thì bỏ hết", async () => {
    render(<Harness />);
    await open();
    const all = screen.getByRole("checkbox", { name: /Tất cả Sub-merchant \(4\)/ });
    await userEvent.click(screen.getByRole("checkbox", { name: /Cửa hàng Quận 1/ }));
    expect(all).toHaveAttribute("aria-checked", "mixed");
    await userEvent.click(all);
    for (const name of [/Quận 1/, /Quận 2/, /Thủ Đức/, /Hà Nội/]) {
      expect(screen.getByRole("checkbox", { name })).toBeChecked();
    }
    await userEvent.click(all);
    expect(screen.getByRole("checkbox", { name: /Quận 1/ })).not.toBeChecked();
  });

  it("chọn đủ mọi Sub rồi Áp dụng thì coi như 'Tất cả' (không gửi danh sách)", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await open();
    await userEvent.click(screen.getByRole("checkbox", { name: /Tất cả Sub-merchant/ }));
    await apply();
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("Bỏ chọn xóa các tick đang nháp; Áp dụng khi trống = tất cả", async () => {
    const onChange = vi.fn();
    render(<Harness initial={["s1"]} onChange={onChange} />);
    await open();
    expect(screen.getByRole("checkbox", { name: /Quận 1/ })).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Bỏ chọn" }));
    expect(screen.getByRole("checkbox", { name: /Quận 1/ })).not.toBeChecked();
    await apply();
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("ô đóng hiện chip mã + tên, quá 2 chip gom thành +N", () => {
    const { rerender } = render(<SubMerchantMultiSelect options={options} value={["s1", "s2"]} onChange={() => {}} />);
    const trigger = screen.getByRole("button", { name: /Sub-merchant/ });
    expect(trigger).toHaveTextContent("SUB01");
    expect(trigger).toHaveTextContent("Cửa hàng Quận 2");
    expect(trigger).not.toHaveTextContent("+");
    rerender(<SubMerchantMultiSelect options={options} value={["s1", "s2", "s3", "s4"]} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /Sub-merchant/ })).toHaveTextContent("+2");
  });

  it("đóng popup không áp dụng thì bỏ tick nháp", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await open();
    await userEvent.click(screen.getByRole("checkbox", { name: /Quận 1/ }));
    await userEvent.keyboard("{Escape}");
    await open();
    expect(screen.getByRole("checkbox", { name: /Quận 1/ })).not.toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("danh sách rỗng thì báo không có Sub", async () => {
    render(<Harness options={[]} />);
    await open();
    expect(screen.getByText(/Không có Sub-merchant/)).toBeInTheDocument();
  });

  describe("người dùng thuộc nhiều Master", () => {
    const chooseMaster = async (name: RegExp) => {
      await userEvent.click(screen.getByRole("combobox", { name: "Merchant" }));
      await userEvent.click(await screen.findByRole("option", { name }));
    };

    it("ô đổi tên thành 'Merchant / Sub-merchant' và chỉ liệt kê Sub của Master đã chọn", async () => {
      const onChange = vi.fn();
      render(<Harness merchants={merchants} onChange={onChange} />);
      await open(/Merchant \/ Sub-merchant/);
      await chooseMaster(/Master Hai/);
      expect(screen.queryByRole("checkbox", { name: /Quận 1/ })).not.toBeInTheDocument();
      expect(screen.getByRole("checkbox", { name: /Tất cả Sub-merchant \(1\)/ })).toBeInTheDocument();
      await userEvent.click(screen.getByRole("checkbox", { name: /Hà Nội/ }));
      await apply();
      expect(onChange).toHaveBeenCalledWith(["s4"]);
    });

    it("chọn đủ Sub của một Master vẫn gửi danh sách đó, vì chưa phải toàn bộ Sub", async () => {
      const onChange = vi.fn();
      render(<Harness merchants={merchants} onChange={onChange} />);
      await open(/Merchant \/ Sub-merchant/);
      await chooseMaster(/Master Hai/);
      await userEvent.click(screen.getByRole("checkbox", { name: /Tất cả Sub-merchant \(1\)/ }));
      await apply();
      expect(onChange).toHaveBeenCalledWith(["s4"]);
    });

    it("đổi Master thì bỏ các tick của Master cũ", async () => {
      const onChange = vi.fn();
      render(<Harness merchants={merchants} initial={["s1"]} onChange={onChange} />);
      await open(/Merchant \/ Sub-merchant/);
      expect(screen.getByRole("checkbox", { name: /Quận 1/ })).toBeChecked();
      await chooseMaster(/Master Hai/);
      await apply();
      expect(onChange).toHaveBeenCalledWith([]);
    });

    it("một Master thì giữ ô 'Sub-merchant' và không có bước chọn Master", async () => {
      render(<Harness merchants={merchants.slice(0, 1)} />);
      await open(/^Sub-merchant/);
      expect(within(screen.getByRole("dialog")).queryByRole("combobox")).not.toBeInTheDocument();
    });
  });
});
