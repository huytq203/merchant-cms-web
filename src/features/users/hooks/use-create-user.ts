import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../api/User.api'
import type { FormUserValues } from '../schemas/form-user.schema'

export const useCreateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: FormUserValues) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}
