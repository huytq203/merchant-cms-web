const MERCHANT = "/api/v1/merchant";
const GROUPS = `${MERCHANT}/permission-groups`;

export const permissionGroupPaths = {
  catalog: `${MERCHANT}/merchant-permissions`,
  list: GROUPS,
  create: GROUPS,
  detail: (id: string) => `${GROUPS}/${encodeURIComponent(id)}`,
  update: (id: string) => `${GROUPS}/${encodeURIComponent(id)}`,
  delete: (id: string) => `${GROUPS}/${encodeURIComponent(id)}`,
  users: (id: string) => `${GROUPS}/${encodeURIComponent(id)}/users`,
  assignUsers: (id: string) => `${GROUPS}/${encodeURIComponent(id)}/assign-users`,
} as const;
