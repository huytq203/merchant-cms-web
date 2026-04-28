"server-only";

import mysql, { type RowDataPacket, type ResultSetHeader } from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getDb(): mysql.Pool {
  if (pool) return pool;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("[db] DATABASE_URL chưa được cấu hình");

  const parsed = new URL(url);

  pool = mysql.createPool({
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, "").split("?")[0],
    ssl: { rejectUnauthorized: true },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "+00:00",
  });

  return pool;
}

export type DbValue = string | number | boolean | null | Date;

export async function dbQuery<T extends RowDataPacket[] | ResultSetHeader>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any[] = [],
): Promise<T> {
  const p = getDb();
  const [result] = await p.execute<T>(sql, values);
  return result;
}
