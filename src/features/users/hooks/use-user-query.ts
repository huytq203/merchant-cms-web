import { useQuery } from "@tanstack/react-query";
import { UserListResponse } from "../types/type";
import { userApi } from "../api/User.api";

interface GetUserParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export const useUserQuery = (params: GetUserParams) => {
  return useQuery<UserListResponse>({
    queryKey: ["user", params],
    queryFn: () => userApi.getAll(params),
    staleTime: 1000 * 60 * 1,
  })
};
