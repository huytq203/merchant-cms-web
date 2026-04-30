import { useQuery } from "@tanstack/react-query";
import { User, UserListResponse } from "../types/type";
import { userApi } from "../../../lib/api/User.api";

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
  });
};

export const useUserByIdQuery = (id: string) => {
  return useQuery<User>({
    queryKey: ["user", id],
    queryFn: () => userApi.getById(id),
    staleTime: 1000 * 60 * 1,
  });
};
