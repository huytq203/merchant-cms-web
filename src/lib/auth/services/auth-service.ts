"server-only";

import { AUTH_COOKIES, COOKIE_OPTIONS } from "@/lib/auth/cookies";
import { cookies } from "next/headers";
import type { BeLoginResponse, SessionUser } from "@/types/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma";

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
  const rows = await prisma.userAssignedSubMerchant.findMany({
    where: { userId },
    select: { subMerchantId: true },
  });
  return rows.map((r) => r.subMerchantId);
}

export async function authenticateUser(
  username: string,
  password: string,
): Promise<AuthResponse | null> {
  const loginEntry = await prisma.login.findUnique({
    where: { username },
    select: { id: true, userId: true, password: true },
  });
  if (!loginEntry) return null;

  const isValid = await bcrypt.compare(password, loginEntry.password);
  if (!isValid) return null;

  const user = await prisma.user.findUnique({
    where: { id: loginEntry.userId },
    include: { permissionGroup: { select: { name: true } } },
  });
  if (!user) return null;

  const assignedSubMerchantsIds = await getAssignedSubMerchants(user.id);

  const payload: TokenPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    permissionGroupId: user.permissionGroupId ?? "",
    permissionName: user.permissionGroup?.name ?? user.permissionGroupName ?? "",
    subMerchantScope: user.subMerchantScope,
    assignedSubMerchantsIds,
    createdAt: user.createdAt.toISOString(),
    status: user.status,
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { permissionGroup: { select: { name: true } } },
    });
    if (!user) return null;

    const assignedSubMerchantsIds = await getAssignedSubMerchants(user.id);

    const payload: TokenPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      permissionGroupId: user.permissionGroupId ?? "",
      permissionName: user.permissionGroup?.name ?? user.permissionGroupName ?? "",
      subMerchantScope: user.subMerchantScope,
      assignedSubMerchantsIds,
      createdAt: user.createdAt.toISOString(),
      status: user.status,
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
