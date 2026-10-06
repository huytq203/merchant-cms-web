// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

describe("TooltipTrigger", () => {
  it("keeps the children of an element passed through `render`", () => {
    render(
      <Tooltip>
        <TooltipTrigger render={<button type="button" aria-label="Xem chi tiết" />}>
          <svg role="img" aria-label="icon" />
        </TooltipTrigger>
        <TooltipContent>Xem chi tiết</TooltipContent>
      </Tooltip>,
    );

    const button = screen.getByRole("button", { name: "Xem chi tiết" });
    expect(within(button).getByRole("img", { name: "icon" })).toBeInTheDocument();
  });

  it("still treats a single element child as the trigger when there is no `render`", () => {
    render(
      <Tooltip>
        <TooltipTrigger>
          <button type="button">Mở</button>
        </TooltipTrigger>
        <TooltipContent>Gợi ý</TooltipContent>
      </Tooltip>,
    );

    expect(screen.getAllByRole("button", { name: "Mở" })).toHaveLength(1);
  });
});
