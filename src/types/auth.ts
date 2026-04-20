export type UserRole = "ACCOUNTANT" | "OPERATOR" | "SUPER_ADMIN" | string;

export interface SessionUser {
  id: string;
  username: string;
  roles: UserRole[];
  permissions: string[];
}

/** Payload chuẩn của JWT access token từ Keycloak/BE */
export interface JwtPayload {
  sid: string;
  preferred_username: string;
  roles?: string[];
  permissions?: string[];
  exp: number;
  iat: number;
  jti: string;
}

/** Contract response từ BE khi login thành công */
export interface BeLoginResponse {
  data: {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    refreshExpiresIn: number;
  };
  message: string;
  detail: string;
  success: boolean;
  status: string;
}

/** Kept cho backward-compat nếu một số chỗ còn import */
export type LoginResponse = BeLoginResponse;
