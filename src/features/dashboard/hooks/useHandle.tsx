import React from 'react'
import { useSessionQuery } from './use-dashboard-query'
import usePagination from '@/hooks/usePagination'

export const useHandle = () => {

  const {page,pageSize}=usePagination()
  const payload={
    page,
    pageSize,
   
  }
    const {data} = useSessionQuery(payload)
  return {
    data
  }
}
