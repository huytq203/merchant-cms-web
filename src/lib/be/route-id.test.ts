import { describe, expect, it } from "vitest";

import { invalidIdResponse } from "./route-id";

describe("invalidIdResponse", () => {
  it("lets a UUID through", () => {
    expect(invalidIdResponse("11111111-1111-4111-8111-111111111111")).toBeNull();
  });

  it.each(["", "abc", "..%2f..%2fadmin", "../x", "11111111-1111-4111-8111-11111111111g"])(
    "answers 404 for %j without touching the BE",
    async (id) => {
      const response = invalidIdResponse(id);
      expect(response?.status).toBe(404);
    },
  );
});
