import fs from "fs/promises";
import path from "path";

const MOCK_DIR = path.join(process.cwd(), "src/mock");

export function mockStore<T extends Record<string, unknown>>(filename: string) {
  const filePath = path.join(MOCK_DIR, filename);

  async function read(): Promise<T> {
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!fileExists) {
      throw new Error(`Không tìm thấy file mock: ${filePath}`);
    }
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  }

  async function write(data: T): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  async function update(updater: (current: T) => T): Promise<T> {
    const current = await read();
    const next = updater(current);
    await write(next);
    return next;
  }

  return { read, write, update };
}
