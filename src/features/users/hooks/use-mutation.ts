import { userApi } from "@/lib/api/User.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormUserValues } from "../schemas/form-user.schema";

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: FormUserValues) => userApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useUpdateUser = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: FormUserValues) => userApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useChangeStatusUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { userId: string; status: string }) =>
      userApi.changeStatus(body.userId, body.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useLockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { userId: string; lockReason: string }) =>
      userApi.lockUser(body.userId, body.lockReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};
