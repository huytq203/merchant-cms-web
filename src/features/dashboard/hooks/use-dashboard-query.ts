import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { ParamsGetAll } from '../types/Dashboard.type'
import { dashboardApi } from '../api/Dashboard.api'

export const useSessionQuery = (params: ParamsGetAll) => {
  return useQuery({
    queryKey: ["dashboard", params],
    queryFn: () => dashboardApi.getAll(params),
    staleTime: 1000 * 60 * 1,
  })
}
