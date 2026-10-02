export enum UserStatus {
  ACTIVE = "active",
  LOCKED = "locked",
}
export const STATUS_LABEL: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: "Hoạt động",
  [UserStatus.LOCKED]: "Khóa",
};