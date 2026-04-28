"server-only";

import { AUTH_COOKIES, COOKIE_OPTIONS } from "@/lib/auth/cookies";
import { cookies } from "next/headers";
import type { BeLoginResponse, SessionUser } from "@/types/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2/promise";
import { dbQuery } from "@/lib/db/db";

const JWT_SECRET =
  process.env.JWT_SECRET || "default-jwt-secret-change-in-production";

const ACCESS_EXPIRES_IN = 60 * 60 * 24;
const REFRESH_EXPIRES_IN = 60 * 60 * 24 * 7;

interface AuthResponse extends BeLoginResponse {
  user?: {
    idUser: string;
    name: string;
    email: string;
    phone: string;
    permissionGroupId: string;
    permissionName: string;
    subMerchantScope: string;
    assignedSubMerchantsIds: string[];
    createdAt: string;
    status: string;
  };
}

interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  phone: string;
  permissionGroupId: string;
  permissionName: string;
  subMerchantScope: string;
  assignedSubMerchantsIds: string[];
  createdAt: string;
  status: string;
}

function signAccessToken(user: TokenPayload) {
  return jwt.sign(
    {
      userId: user.userId,
      username: user.name,
      email: user.email,
      phone: user.phone,
      permissionGroupId: user.permissionGroupId,
      permissionName: user.permissionName,
      assignedSubMerchantsIds: user.assignedSubMerchantsIds,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN },
  );
}

function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "refresh" }, JWT_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

async function getAssignedSubMerchants(userId: string): Promise<string[]> {
  const rows = await dbQuery<RowDataPacket[]>(
    "SELECT sub_merchant_id FROM user_assigned_sub_merchants WHERE user_id = ?",
    [userId],
  );
  return rows.map((r) => r.sub_merchant_id as string);
}

export async function authenticateUser(
  username: string,
  password: string,
): Promise<AuthResponse | null> {
  const loginRows = await dbQuery<RowDataPacket[]>(
    "SELECT id, user_id, password FROM logins WHERE username = ?",
    [username],
  );
  if (loginRows.length === 0) return null;

  const loginEntry = loginRows[0]!;
  const isValid = await bcrypt.compare(password, loginEntry.password as string);
  if (!isValid) return null;

  const userRows = await dbQuery<RowDataPacket[]>(
    `SELECT u.id, u.name, u.email, u.phone,
            u.permission_group_id, u.sub_merchant_scope,
            u.created_at, u.status,
            pg.name AS permission_group_name
     FROM users u
     LEFT JOIN permission_groups pg ON pg.id = u.permission_group_id
     WHERE u.id = ?`,
    [loginEntry.user_id],
  );
  if (userRows.length === 0) return null;

  const user = userRows[0]!;
  const assignedSubMerchantsIds = await getAssignedSubMerchants(user.id as string);

  const payload: TokenPayload = {
    userId: user.id as string,
    name: user.name as string,
    email: user.email as string,
    phone: (user.phone ?? "") as string,
    permissionGroupId: (user.permission_group_id ?? "") as string,
    permissionName: (user.permission_group_name ?? "") as string,
    subMerchantScope: (user.sub_merchant_scope ?? "all") as string,
    assignedSubMerchantsIds,
    createdAt: String(user.created_at),
    status: user.status as string,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload.userId);

  return {
    data: {
      accessToken,
      expiresIn: ACCESS_EXPIRES_IN,
      refreshToken,
      refreshExpiresIn: REFRESH_EXPIRES_IN,
    },
    user: {
      idUser: payload.userId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      permissionGroupId: payload.permissionGroupId,
      permissionName: payload.permissionName,
      subMerchantScope: payload.subMerchantScope,
      assignedSubMerchantsIds: payload.assignedSubMerchantsIds,
      createdAt: payload.createdAt,
      status: payload.status,
    },
    message: "Đăng nhập thành công",
    detail: "",
    success: true,
    status: "OK",
  };
}

export async function refreshUserSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(AUTH_COOKIES.REFRESH_TOKEN)?.value;
  if (!refreshToken) return null;

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
      sub: string;
      type: string;
    };
    if (decoded.type !== "refresh" || !decoded.sub) return null;

    const userRows = await dbQuery<RowDataPacket[]>(
      `SELECT u.id, u.name, u.email, u.phone,
              u.permission_group_id, u.sub_merchant_scope,
              u.created_at, u.status,
              pg.name AS permission_group_name
       FROM users u
       LEFT JOIN permission_groups pg ON pg.id = u.permission_group_id
       WHERE u.id = ?`,
      [decoded.sub],
    );
    if (userRows.length === 0) return null;

    const user = userRows[0]!;
    const assignedSubMerchantsIds = await getAssignedSubMerchants(user.id as string);

    const payload: TokenPayload = {
      userId: user.id as string,
      name: user.name as string,
      email: user.email as string,
      phone: (user.phone ?? "") as string,
      permissionGroupId: (user.permission_group_id ?? "") as string,
      permissionName: (user.permission_group_name ?? "") as string,
      subMerchantScope: (user.sub_merchant_scope ?? "all") as string,
      assignedSubMerchantsIds,
      createdAt: String(user.created_at),
      status: user.status as string,
    };

    const newAccess = signAccessToken(payload);
    const newRefresh = signRefreshToken(payload.userId);

    await setAuthCookies(newAccess, newRefresh, ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN);

    return {
      userId: payload.userId,
      username: payload.name,
      email: payload.email,
      phone: payload.phone,
      permissionGroupId: payload.permissionGroupId,
      permissionName: payload.permissionName,
      subMerchantScope: payload.subMerchantScope,
      assignedSubMerchantsIds: payload.assignedSubMerchantsIds,
      createdAt: payload.createdAt,
      status: payload.status,
    };
  } catch {
    return null;
  }
}

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  refreshExpiresIn: number,
): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIES.ACCESS_TOKEN, accessToken, {
    ...COOKIE_OPTIONS,
    secure: isProduction,
    maxAge: expiresIn,
  });
  cookieStore.set(AUTH_COOKIES.REFRESH_TOKEN, refreshToken, {
    ...COOKIE_OPTIONS,
    secure: isProduction,
    maxAge: refreshExpiresIn,
  });
}
