"server-only";

import { AUTH_COOKIES, COOKIE_OPTIONS } from "@/lib/auth/cookies";
import { cookies } from "next/headers";
import type { BeLoginResponse } from "@/types/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import loginData from "@/mock/data-login.json";
import userData from "@/mock/data-user.json";

const JWT_SECRET =
  process.env.JWT_SECRET || "default-jwt-secret-change-in-production";

interface AuthResponse extends BeLoginResponse {
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    permissionGroupId: string;
    subMerchantScope: string;
    assignedSubMerchantsIds: string[];
    createdAt: string;
    status: string;
  };
}

export async function authenticateUser(
  username: string,
  password: string,
): Promise<AuthResponse | null> {
  const loginEntry = loginData.logins.find((l) => l.username === username);
  if (!loginEntry) return null;

  const isPasswordValid = await bcrypt.compare(password, loginEntry.password);
  if (!isPasswordValid) return null;

  const user = userData.users.find((u) => u.id === loginEntry.idUser);
  if (!user) return null;

  const expiresIn = 60 * 60 * 24;
  const refreshExpiresIn = 60 * 60 * 24 * 7;

  const accessToken = jwt.sign(
    {
      name: user.name,
      email: user.email,
      phone: user.phone,
      permissionGroupId: user.permissionGroupId,
      assignedSubMerchantsIds: user.assignedSubMerchantsIds ?? [],
      createdAt: user.createdAt,
      status: user.status,
    },
    JWT_SECRET,
    { expiresIn },
  );

  const refreshToken = jwt.sign(
    {
      sub: user.id,
      id: user.id,
      type: "refresh",
    },
    JWT_SECRET,
    { expiresIn: refreshExpiresIn },
  );

  return {
    data: {
      accessToken,
      expiresIn,
      refreshToken,
      refreshExpiresIn,
    },
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      permissionGroupId: user.permissionGroupId,
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
