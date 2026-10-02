import { UseMutationOptions } from "@tanstack/react-query";
import { useCreateUser, useUpdateUser } from "./use-mutation";
import { FormUserValues } from "../schemas/form-user.schema";
import { User } from "../types/type";

export const useHandleUpdateUser = (id: string) => {
  const { mutate, isPending } = useUpdateUser(id);
  const handleUpdate = (
    data: FormUserValues,
    options?: UseMutationOptions<User, Error, FormUserValues>,
  ) => mutate(data, options);
  return {
    mutate: handleUpdate,
    isPending,
  };
};

export const useHandleAddUser = () => {
  const { mutate, isPending } = useCreateUser();
  const handleAdd = (
    data: FormUserValues,
    options?: UseMutationOptions<User, Error, FormUserValues>,
  ) => mutate(data, options);
  return {
    mutate: handleAdd,
    isPending,
  };
};