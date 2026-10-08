const USERS = "/api/v1/merchant/merchant-users";

export const userPaths = {
  list: USERS,
  create: USERS,
  detail: (id: string) => `${USERS}/${encodeURIComponent(id)}`,
  lock: (id: string) => `${USERS}/${encodeURIComponent(id)}/lock`,
  unlock: (id: string) => `${USERS}/${encodeURIComponent(id)}/unlock`,
  resetPassword: (id: string) => `${USERS}/${encodeURIComponent(id)}/reset-password`,
  assignGroups: (id: string) => `${USERS}/${encodeURIComponent(id)}/assign-groups`,
  resendActivation: (id: string) => `${USERS}/${encodeURIComponent(id)}/resend-activation`,
  createScopeProposal: (id: string) => `${USERS}/${encodeURIComponent(id)}/scope-proposals`,
  scopeProposal: (id: string) => `${USERS}/${encodeURIComponent(id)}/scope-proposal`,
  approveScopeProposal: (id: string) => `${USERS}/${encodeURIComponent(id)}/scope-proposal/approve`,
  rejectScopeProposal: (id: string) => `${USERS}/${encodeURIComponent(id)}/scope-proposal/reject`,
} as const;
