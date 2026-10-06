import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const INPUT_TAG = /<(Input|Textarea|Select|MultiSelect|ComboBox|Autocomplete|DatePicker)\b/g;
const SOURCE_ROOTS = ["src/features", "src/app"];

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return collectSourceFiles(path);
    return path.endsWith(".tsx") && !path.includes(".test.") ? [path] : [];
  });
}

function readOpeningTag(source: string, start: number): string {
  let depth = 0;
  let quote: string | null = null;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'" || char === "`") {
      quote = char;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
    } else if (char === ">" && depth === 0) {
      return source.slice(start, index + 1);
    }
  }
  return source.slice(start);
}

function isPlaceholderExempt(tag: string): boolean {
  const isNativeDate = /type=["']date["']/.test(tag);
  const isAlwaysDisabled = /\sdisabled(\s|\/|>)/.test(tag);
  return isNativeDate || isAlwaysDisabled;
}

describe("ô nhập liệu của form và bộ lọc", () => {
  it("luôn khai báo placeholder để người dùng biết cần nhập gì", () => {
    const missing: string[] = [];
    for (const file of SOURCE_ROOTS.flatMap(collectSourceFiles)) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(INPUT_TAG)) {
        const tag = readOpeningTag(source, match.index);
        if (/placeholder/.test(tag) || isPlaceholderExempt(tag)) continue;
        const line = source.slice(0, match.index).split("\n").length;
        missing.push(`${file}:${line}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
