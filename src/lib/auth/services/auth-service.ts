"server-only";

import { AUTH_COOKIES, COOKIE_OPTIONS } from "@/lib/auth/cookies";
import { cookies } from "next/headers";
import type { BeLoginResponse, SessionUser } from "@/types/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import loginData from "@/mock/data-login.json";
import userData from "@/mock/data-user.json";
import permissionData from "@/mock/data-permission.json";

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

interface ResponseToken {
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

function resolvePermissionName(permissionGroupId: string): string {
  const group = permissionData.permissionGroups.find(
    (g) => g.id === permissionGroupId,
  );
  return group?.name ?? "";
}

function signAccessToken(user: ResponseToken) {
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

export async function authenticateUser(
  username: string,
  password: string,
): Promise<AuthResponse | null> {
  const loginEntry = loginData.logins.find((item) => item.username === username);
  if (!loginEntry) return null;

  const isPasswordValid = await bcrypt.compare(password, loginEntry.password);
  if (!isPasswordValid) return null;

  const user = userData.users.find((item) => item.id === loginEntry.idUser);
  if (!user) return null;

  const permissionName = resolvePermissionName(user.permissionGroupId);
  const tokenPayload: ResponseToken = {
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    permissionGroupId: user.permissionGroupId,
    permissionName,
    subMerchantScope: user.subMerchantScope ?? "all",
    assignedSubMerchantsIds: user.assignedSubMerchantsIds ?? [],
    createdAt: user.createdAt,
    status: user.status,
  };

  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(user.id);

  return {
    data: {
      accessToken,
      expiresIn: ACCESS_EXPIRES_IN,
      refreshToken,
      refreshExpiresIn: REFRESH_EXPIRES_IN,
    },
    user: {
      idUser: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      permissionGroupId: user.permissionGroupId,
      permissionName,
      subMerchantScope: user.subMerchantScope ?? "all",
      assignedSubMerchantsIds: user.assignedSubMerchantsIds ?? [],
      createdAt: user.createdAt,
      status: user.status,
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
    const payload = jwt.verify(refreshToken, JWT_SECRET) as {
      sub: string;
      type: string;
    };
    if (payload.type !== "refresh" || !payload.sub) return null;

    const user = userData.users.find((u) => u.id === payload.sub);
    if (!user) return null;

    const permissionName = resolvePermissionName(user.permissionGroupId);
    const tokenPayload: ResponseToken = {
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      permissionGroupId: user.permissionGroupId,
      permissionName,
      subMerchantScope: user.subMerchantScope ?? "all",
      assignedSubMerchantsIds: user.assignedSubMerchantsIds ?? [],
      createdAt: user.createdAt,
      status: user.status,
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(user.id);

    await setAuthCookies(
      newAccessToken,
      newRefreshToken,
      ACCESS_EXPIRES_IN,
      REFRESH_EXPIRES_IN,
    );

    return {
      userId: user.id,
      username: user.name,
      email: user.email,
      phone: user.phone,
      permissionGroupId: user.permissionGroupId,
      permissionName,
      subMerchantScope: user.subMerchantScope ?? "all",
      assignedSubMerchantsIds: user.assignedSubMerchantsIds ?? [],
      createdAt: user.createdAt,
      status: user.status,

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
