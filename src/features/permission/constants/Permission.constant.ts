export enum PermissionStatus {
    ACTIVE="active",
    INACTIVE="inactive"
}
export const PERMISSION_LABEL = {
   [PermissionStatus.ACTIVE]:"Hoạt động",
   [PermissionStatus.INACTIVE]:"Không hoạt động"
}